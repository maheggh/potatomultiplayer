// Fixed JailStatus without localStorage persistence

import React, { useEffect, useContext, useRef, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const JailStatus = ({ onRelease, onUpdateJailStatus, token = null }) => {
  const authContext = useContext(AuthContext);
  
  // Use either props or context values
  const contextToken = token || authContext.token;
  const { isInJail, jailEndTime: contextJailEndTime, jailRecord } = authContext;
  
  // State for breakout (won't persist on refresh)
  const [breakoutState, setBreakoutState] = useState({
    attempting: false,
    message: '',
    success: false
  });
  
  // Container ref to inject our timer into
  const timeDisplayRef = useRef(null);
  const progressBarRef = useRef(null);
  const timerInitialized = useRef(false);
  const breakoutAttemptMade = useRef(false);
  
  // Initialize once
  useEffect(() => {
    if (!isInJail || !progressBarRef.current || !timeDisplayRef.current || timerInitialized.current) return;
    
    timerInitialized.current = true;
    let endTime = null;
    let initialJailTime = 300; // Default 5 minutes
    let isMounted = true;
    
    // Try to use context end time
    if (contextJailEndTime) {
      try {
        const parsedEndTime = new Date(contextJailEndTime);
        if (!isNaN(parsedEndTime.getTime())) {
          endTime = parsedEndTime;
          console.log("Successfully parsed context end time:", endTime);
        }
      } catch (error) {
        console.error("Failed to parse context end time:", error);
      }
    }
    
    // Format time function
    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    
    // Initial API call
    const fetchJailStatus = async () => {
      if (!contextToken) return;
      
      try {
        console.log("Fetching jail status");
        
        const response = await axios.get(
          `${API_URL}/jail/status`,
          { headers: { Authorization: `Bearer ${contextToken}` } }
        );
        
        if (!isMounted) return;
        
        if (response.data && response.data.inJail) {
          // Check if breakout was already attempted from API
          if (response.data.breakoutAttempted) {
            breakoutAttemptMade.current = true;
            setBreakoutState(prev => ({
              ...prev,
              attempting: true,
              message: response.data.breakoutSuccessful 
                ? 'Breakout successful! You are free!'
                : 'Breakout attempt failed! Security increased!'
            }));
          }
          
          // Get jail times from record
          if (response.data.jailRecord?.startTime && response.data.jailRecord?.endTime) {
            const startTime = new Date(response.data.jailRecord.startTime);
            const receivedEndTime = new Date(response.data.jailRecord.endTime);
            
            if (!isNaN(startTime.getTime()) && !isNaN(receivedEndTime.getTime())) {
              endTime = receivedEndTime;
              
              // Calculate total duration (always use the full sentence duration)
              initialJailTime = Math.floor((receivedEndTime - startTime) / 1000);
              console.log("Using jail record times:", initialJailTime);
              
              // First update - set progress bar immediately
              const now = new Date();
              const elapsed = Math.floor((now - startTime) / 1000);
              const progress = Math.min(100, Math.max(0, 
                (elapsed / initialJailTime) * 100
              ));
              
              progressBarRef.current.style.transition = 'none'; // Disable transition for initial set
              progressBarRef.current.style.width = `${progress}%`;
              // Force reflow to make the transition removal take effect
              void progressBarRef.current.offsetWidth;
              progressBarRef.current.style.transition = 'width 1s linear'; // Re-enable transition
            }
          } else if (response.data.timeRemaining > 0) {
            const remainingTime = response.data.timeRemaining;
            endTime = new Date(Date.now() + remainingTime * 1000);
            initialJailTime = Math.max(300, remainingTime * 1.5);
            console.log("Using timeRemaining:", remainingTime);
          }
          
          // Update parent if needed
          if (onUpdateJailStatus) {
            onUpdateJailStatus(response.data);
          }
          
          // Start timer once we have end time
          if (endTime) {
            startTimer();
          }
        }
      } catch (error) {
        console.error("Error fetching jail status:", error);
      }
    };
    
    // Timer function
    const startTimer = () => {
      if (!endTime) {
        console.error("Cannot start timer - no end time set");
        return;
      }
      
      console.log("Starting timer with end time:", endTime);
      
      let timerInterval = null;
      let lastProgressUpdate = 0;
      
      const updateTimer = () => {
        if (!isMounted) return;
        
        const now = new Date();
        const elapsed = Math.max(0, initialJailTime - Math.floor((endTime - now) / 1000));
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
        
        // Update time display
        if (timeDisplayRef.current) {
          timeDisplayRef.current.textContent = formatTime(remaining);
        }
        
        // Update progress bar - only if enough time has passed to avoid jumpiness
        // or if we're at the end
        if (progressBarRef.current && initialJailTime && 
            (Math.abs(elapsed - lastProgressUpdate) >= 1 || remaining <= 0)) {
          const progress = Math.min(100, Math.max(0, (elapsed / initialJailTime) * 100));
          progressBarRef.current.style.width = `${progress}%`;
          lastProgressUpdate = elapsed;
        }
        
        // Check if time is up
        if (remaining <= 0) {
          clearInterval(timerInterval);
          
          // Call release if available
          if (onRelease) {
            setTimeout(() => {
              if (isMounted) onRelease();
            }, 1000);
          }
        }
      };
      
      // Initial update
      updateTimer();
      
      // Start interval
      timerInterval = setInterval(updateTimer, 1000);
      
      // Return cleanup function
      return () => {
        clearInterval(timerInterval);
      };
    };
    
    // Start the process
    fetchJailStatus();
    
    // If we already have end time, start timer directly
    if (endTime) {
      startTimer();
    }
    
    // Clean up
    return () => {
      isMounted = false;
      timerInitialized.current = false;
    };
  }, [isInJail, contextJailEndTime, contextToken, onUpdateJailStatus, onRelease]);
  
  // Reset jailStatus when the component is unmounted
  useEffect(() => {
    return () => {
      timerInitialized.current = false;
      breakoutAttemptMade.current = false;
    };
  }, []);
  
  // Reset state when user is not in jail
  useEffect(() => {
    if (!isInJail) {
      breakoutAttemptMade.current = false;
      setBreakoutState({
        attempting: false,
        message: '',
        success: false
      });
    }
  }, [isInJail]);
  
  // Breakout button handler
  const attemptBreakout = async () => {
    if (breakoutState.attempting || !contextToken || breakoutAttemptMade.current) return;
    
    setBreakoutState({ ...breakoutState, attempting: true });
    breakoutAttemptMade.current = true;
    
    try {
      const response = await axios.post(
        `${API_URL}/jail/breakout`, 
        {}, 
        { headers: { Authorization: `Bearer ${contextToken}` } }
      );
      
      if (response.data.success) {
        const isSuccessful = response.data.breakoutSuccessful;
        
        setBreakoutState({
          attempting: true,
          message: isSuccessful
            ? 'Breakout successful! You are free!'
            : 'Breakout attempt failed! Security increased!',
          success: isSuccessful
        });
        
        // Release if successful
        if (isSuccessful && onRelease) {
          setTimeout(onRelease, 1500);
        }
      }
    } catch (error) {
      console.error('Breakout error:', error);
      setBreakoutState({
        ...breakoutState,
        attempting: true,
        message: 'Error attempting breakout'
      });
    }
  };
  
  // If not in jail, render nothing
  if (!isInJail) return null;
  
  return (
    <div className="bg-gray-900/80 rounded-lg border border-yellow-900/50 shadow-lg text-white p-4 mb-6 overflow-hidden">
      <div className="flex items-center justify-center mb-2">
        <span role="img" aria-label="jail" className="text-2xl mr-2">🔒</span>
        <h2 className="text-xl font-bold text-yellow-400">Potato Jail</h2>
      </div>
      
      <p className="text-lg font-medium mb-3 text-center">You are in jail!</p>
      
      {/* Progress bar */}
      <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden">
        <div 
          ref={progressBarRef}
          className="h-full bg-gradient-to-r from-red-500 to-yellow-500"
          style={{ 
            width: "0%", 
            transition: "width 1s linear"
          }}
        ></div>
      </div>
      
      {/* Time display */}
      <p className="text-center mt-1 mb-3">
        Time remaining: <span ref={timeDisplayRef} className="font-medium">0:00</span>
      </p>
      
      <div className="flex justify-center mb-3">
        <img
          src="/assets/potatojail.png"
          alt="Potato in Jail"
          className="w-32 h-32 object-contain rounded-md border border-yellow-900/30"
          onError={(e) => { e.target.onerror = null; e.target.src='/assets/error.png'; }}
          loading="lazy"
        />
      </div>
      
      {breakoutState.message ? (
        <div className={`text-center p-3 rounded mb-3 font-medium ${
          breakoutState.success ? 'bg-green-800/60 text-green-100' : 'bg-red-800/60 text-red-100'
        }`}>
          {breakoutState.message}
        </div>
      ) : (
        <div className="flex flex-col items-center mb-3">
          <button
            onClick={attemptBreakout}
            disabled={breakoutState.attempting}
            className="px-5 py-2 bg-red-600 text-white font-semibold rounded shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {breakoutState.attempting ? 'Attempting...' : 'Attempt Breakout'}
          </button>
          <p className="text-xs mt-2 text-yellow-300/80">
            Attempting a breakout has a good chance of success!
          </p>
        </div>
      )}
      
      <p className="text-xs text-gray-400 text-center">
        If you fail your breakout attempt, you'll still have to serve your full sentence.
      </p>
    </div>
  );
};

export default JailStatus;