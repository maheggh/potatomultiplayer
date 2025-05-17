// VanillaJS JailTimer with Better Styling

import React, { useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const JailStatus = ({ onRelease, onUpdateJailStatus, token = null }) => {
  const authContext = useContext(AuthContext);
  
  // Use either props or context values
  const contextToken = token || authContext.token;
  const { isInJail, jailEndTime: contextJailEndTime } = authContext;
  
  // Container ref to inject our timer into
  const containerRef = useRef(null);
  const timerInitialized = useRef(false);
  
  // Initialize once
  useEffect(() => {
    if (!isInJail || !containerRef.current || timerInitialized.current) return;
    
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
    
    // Create timer element
    const timerElement = document.createElement('div');
    timerElement.className = 'jail-timer-standalone';
    timerElement.innerHTML = `
      <div class="progress-container">
        <div class="progress-bar"></div>
      </div>
      <div class="time-display">00:00</div>
    `;
    
    // Add styles (matched to your original design)
    const styles = document.createElement('style');
    styles.textContent = `
      .jail-timer-standalone {
        width: 100%;
        margin-bottom: 10px;
      }
      .time-display {
        font-size: 18px;
        font-weight: 500;
        text-align: center;
        color: white;
        margin-top: 4px;
      }
      .progress-container {
        width: 100%;
        height: 16px;
        background-color: rgb(55, 65, 81);
        border-radius: 9999px;
        overflow: hidden;
        margin-top: 12px;
        margin-bottom: 4px;
      }
      .progress-bar {
        height: 100%;
        background: linear-gradient(to right, #ef4444, #f59e0b);
        width: 0%;
        transition: width 1000ms linear;
      }
    `;
    
    // Add to container
    containerRef.current.appendChild(styles);
    containerRef.current.appendChild(timerElement);
    
    // Get references to elements
    const timeDisplay = timerElement.querySelector('.time-display');
    const progressBar = timerElement.querySelector('.progress-bar');
    
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
        console.log("Standalone timer fetching jail status");
        
        const response = await axios.get(
          `${API_URL}/jail/status`,
          { headers: { Authorization: `Bearer ${contextToken}` } }
        );
        
        if (!isMounted) return;
        
        if (response.data && response.data.inJail) {
          if (response.data.jailRecord?.startTime && response.data.jailRecord?.endTime) {
            const startTime = new Date(response.data.jailRecord.startTime);
            const receivedEndTime = new Date(response.data.jailRecord.endTime);
            
            if (!isNaN(startTime.getTime()) && !isNaN(receivedEndTime.getTime())) {
              endTime = receivedEndTime;
              initialJailTime = Math.floor((receivedEndTime - startTime) / 1000);
              console.log("Using jail record times:", initialJailTime);
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
      
      console.log("Starting standalone timer with end time:", endTime);
      
      let timerInterval = null;
      
      const updateTimer = () => {
        if (!isMounted) return;
        
        const now = new Date();
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
        
        // Update time display
        if (timeDisplay) {
          timeDisplay.textContent = `Time remaining: ${formatTime(remaining)}`;
        }
        
        // Update progress bar
        if (progressBar && initialJailTime) {
          const progress = 100 - (remaining / initialJailTime * 100);
          const clampedProgress = Math.min(100, Math.max(0, progress));
          progressBar.style.width = `${clampedProgress}%`;
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
      
      // Remove elements
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [isInJail, contextJailEndTime, contextToken, onUpdateJailStatus, onRelease]);
  
  // Breakout button handling
  const [breakoutState, setBreakoutState] = React.useState({
    attempting: false,
    message: '',
    success: false
  });
  
  const attemptBreakout = async () => {
    if (breakoutState.attempting || !contextToken) return;
    
    setBreakoutState({ ...breakoutState, attempting: true });
    
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
        attempting: false,
        message: 'Error attempting breakout'
      });
    }
  };
  
  // If not in jail, render nothing
  if (!isInJail) return null;
  
  return (
    <div className="p-4 bg-yellow-800 border-l-4 border-yellow-500 text-white rounded-lg shadow-lg flex flex-col items-center text-center w-full max-w-md mx-auto">
      <div className="mb-2 text-yellow-300 text-xl">
        <span role="img" aria-label="jail">🔒</span> Potato Jail
      </div>
      
      <p className="text-xl font-semibold">You are in jail!</p>
      
      {/* Injected timer container */}
      <div ref={containerRef} className="w-full"></div>
      
      <img
        src="/assets/potatojail.png"
        alt="Potato in Jail"
        className="w-60 h-60 object-cover mt-4 rounded-md border-2 border-yellow-600"
        onError={(e) => { e.target.onerror = null; e.target.src='/assets/error.png'; }}
        loading="lazy"
      />
      
      {breakoutState.message ? (
        <div className={`mt-4 font-medium px-4 py-2 rounded-lg ${
          breakoutState.success ? 'bg-green-700/60 text-green-100' : 'bg-red-700/60 text-red-100'
        }`}>
          {breakoutState.message}
        </div>
      ) : (
        <div className="mt-4 flex flex-col items-center">
          <button
            onClick={attemptBreakout}
            disabled={breakoutState.attempting}
            className="px-6 py-2 bg-red-600 text-white font-semibold rounded-md shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {breakoutState.attempting ? 'Attempting...' : 'Attempt Breakout'}
          </button>
          <p className="text-sm mt-2 text-yellow-200/80">
            Attempting a breakout has a good chance of success!
          </p>
        </div>
      )}
      
      <div className="text-xs mt-4 text-gray-300 px-4 text-center">
        If you fail your breakout attempt, you'll still have to serve your full sentence.
        <br/>
        Sometimes it's better to just wait it out!
      </div>
    </div>
  );
};

export default JailStatus;