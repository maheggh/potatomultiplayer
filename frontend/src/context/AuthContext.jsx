import React, { createContext, useState, useEffect, useCallback } from 'react';
import jwt_decode from 'jwt-decode';
import { getRankForXp } from '../utils/rankCalculator';
import axios from 'axios';

// Ensure this points to your backend API (adjust if needed)
const API_URL = import.meta.env.VITE_API_URL || '/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // State variables for user authentication and data
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null); // { userId, username }
  const [money, setMoney] = useState(0);
  const [xp, setXp] = useState(0);
  const [rankInfo, setRankInfo] = useState(getRankForXp(0)); // Contains currentRank, nextRank, thresholds etc.
  const [isAlive, setIsAlive] = useState(true); // Player status
  const [loading, setLoading] = useState(true); // Crucial: indicates if auth state is being determined initially
  const [isInJail, setIsInJail] = useState(false);
  const [jailEndTime, setJailEndTime] = useState(null); // Stores Date object or null
  const [inventory, setInventory] = useState([]); // Player's general items
  const [bossItems, setBossItems] = useState([]); // Special items from bosses
  const [kills, setKills] = useState(0); // Player kill count

  // --- Logout Function ---
  // Clears authentication state, token, temp password, and resets user data
  const logout = useCallback(() => {
    console.log("AuthContext: Logging out...");
    localStorage.removeItem('token');
    localStorage.removeItem('temp_password'); // <<< Remove temp password on logout
    setIsLoggedIn(false);
    setUser(null);
    setMoney(0);
    setXp(0);
    setRankInfo(getRankForXp(0));
    setIsAlive(true);
    setIsInJail(false);
    setJailEndTime(null);
    setInventory([]);
    setBossItems([]);
    setKills(0);
    setLoading(false); // Ensure loading is false after logout completes
    console.log("AuthContext: User logged out, temp password cleared.");
  }, []); // No dependencies needed as it only uses setters and localStorage


  // --- Check and Update Jail Status ---
  // Fetches the current jail status from the backend if the user is logged in
  const checkAndUpdateJailStatus = useCallback(async () => {
    const currentToken = localStorage.getItem('token');
    // Check component state 'isLoggedIn' first, then token existence
    if (!isLoggedIn || !currentToken) {
      // If not logged in, ensure jail state is reset
      if (isInJail) setIsInJail(false);
      if (jailEndTime) setJailEndTime(null);
      return; // Exit if not logged in or no token
    }

    // console.log("AuthContext: Checking jail status..."); // Optional: can be noisy
    try {
      const response = await axios.get(`${API_URL}/jail/status`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });

      if (response.data.success) {
        const { inJail, jailTimeEnd, released } = response.data;
        const newEndTime = inJail && jailTimeEnd ? new Date(jailTimeEnd) : null;

        // Update state only if there's a change to prevent unnecessary re-renders
        if (inJail !== isInJail) {
            // console.log(`AuthContext: Jail status changed. In Jail: ${inJail}`);
            setIsInJail(inJail);
        }
        // Compare time values to avoid issues with Date object references
        if (newEndTime?.getTime() !== jailEndTime?.getTime()) {
            // console.log(`AuthContext: Jail end time changed. End Time: ${newEndTime}`);
            setJailEndTime(newEndTime);
        }
        if (released) {
            console.log("AuthContext: User detected as released from jail by backend!");
            // Potentially trigger a full user data refresh if needed upon release
            // fetchUserData(currentToken); // Example: uncomment if needed
        }
      } else {
         console.error("AuthContext: Failed to get jail status from backend:", response.data.message);
      }
    } catch (error) {
      console.error('AuthContext: Error fetching jail status:', error);
      // If unauthorized (e.g., token expired), log the user out
       if (error.response?.status === 401) {
             console.log("AuthContext: Unauthorized fetching jail status. Logging out.");
             logout();
       }
    }
  }, [isLoggedIn, isInJail, jailEndTime, logout]); // Dependencies: state needed for checks and logout


  // --- Fetch User Data ---
  // Fetches the complete user profile from the backend using the token
  const fetchUserData = useCallback(async (currentToken) => {
    console.log("AuthContext: Fetching user data...");
    if (!currentToken) {
        console.log("AuthContext: No token provided to fetchUserData.");
        return false; // Cannot fetch without a token
    }
    try {
      const res = await axios.get(`${API_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });

      if (res.data.success) {
        const userData = res.data.userData;
        console.log("AuthContext: Fetched userData:", userData); // Log fetched data
        // Set user state object
        setUser({ userId: userData.userId, username: userData.username });
        // Set individual stats, providing defaults if fields are missing
        setMoney(userData.money || 0);
        setXp(userData.xp || 0);
        setIsAlive(userData.isAlive === true); // Ensure boolean comparison
        console.log("AuthContext: Setting isAlive state to:", userData.isAlive === true);
        setRankInfo(getRankForXp(userData.xp || 0)); // Calculate rank based on XP
        setInventory(userData.inventory || []);
        setBossItems(userData.bossItems || []);
        setKills(userData.kills || 0);
        setIsLoggedIn(true); // <<< Mark as logged in AFTER successfully setting data
        console.log("AuthContext: User data fetched and state updated. Logged in.");
        return true; // Indicate success
      } else {
        // Handle case where backend returns success: false for profile fetch
        console.error("AuthContext: Backend reported failure fetching profile:", res.data.message);
        return false; // Indicate failure
      }
    } catch (error) {
      console.error("AuthContext: Network/server error fetching profile:", error);
       // If unauthorized (e.g., token expired), log the user out
       if (error.response?.status === 401) {
            console.log("AuthContext: Unauthorized fetching profile. Logging out.");
            logout();
       }
      return false; // Indicate failure
    }
  }, [logout]); // Dependency: logout function needed for error handling


   // --- Initialize Authentication on Load ---
   // Runs once when the AuthProvider mounts to check for an existing token
   useEffect(() => {
    let isMounted = true; // Flag to prevent state updates if component unmounts during async ops
    console.log("AuthContext: Initializing authentication...");

    const initAuth = async () => {
      setLoading(true); // <<< Start loading
      console.log("AuthContext: Initial load - loading set to true");
      const token = localStorage.getItem('token');
      let profileSuccess = false; // Track if user data was successfully fetched

      if (token) {
        console.log("AuthContext: Found token in localStorage.");
        try {
          const decoded = jwt_decode(token);
          // Check if token is expired
          if (decoded.exp * 1000 < Date.now()) {
             console.log("AuthContext: Token expired during init. Logging out.");
             logout(); // Clear expired token and reset state
          } else {
             // Token exists and is valid, attempt to fetch user data
             console.log("AuthContext: Token valid, attempting to fetch user data...");
             profileSuccess = await fetchUserData(token);
             if (profileSuccess && isMounted) { // Check if component is still mounted
                 console.log("AuthContext: Profile fetch successful, checking jail status...");
                 await checkAndUpdateJailStatus(); // Check jail status only if profile fetch succeeded
             } else if (!profileSuccess) {
                 console.log("AuthContext: Profile fetch failed during init. Logging out.");
                 logout(); // Log out if profile fetch failed even with a valid token structure
             }
          }
        } catch (error) {
          // Handle errors during token decoding or initial fetch
          console.error("AuthContext: Error during init auth:", error);
          logout(); // Log out on decoding errors or other unexpected issues
        }
      } else {
          console.log("AuthContext: No token found in localStorage.");
          // No token means not logged in, ensure loading is false eventually
      }

       // Set loading false only when all initialization steps are complete (or failed)
       if (isMounted) {
           setLoading(false);
           console.log("AuthContext: Initial load - loading set to false");
       }
    };

    initAuth();

    // Cleanup function: set isMounted to false when the component unmounts
    return () => {
        console.log("AuthContext: AuthProvider unmounting.");
        isMounted = false;
    };
    // Dependencies ensure this effect runs correctly if functions change identity
   }, [fetchUserData, checkAndUpdateJailStatus, logout]);


  // --- Login Function ---
  // Handles the login process, stores token/temp password, fetches user data
  const login = useCallback(async (token, generatedPassword = null) => {
    console.log("AuthContext: Login function started"); // <<< ADD LOG
    localStorage.setItem('token', token);

    // --- Store password temporarily if provided (from registration) ---
    if (generatedPassword) {
      localStorage.setItem('temp_password', generatedPassword);
      console.log("AuthContext: Temp password stored in localStorage.");
    } else {
        // If logging in normally (not via registration), ensure any old temp password is removed
        localStorage.removeItem('temp_password');
        console.log("AuthContext: No generated password provided, ensuring temp_password is removed.");
    }

    // --- Set loading TRUE before starting async operations ---
    setLoading(true);
    console.log("AuthContext: Login - loading set to true"); // <<< ADD LOG
    setIsLoggedIn(false); // Assume not logged in until data is verified
    let profileSuccess = false;

    try {
        console.log("AuthContext: Calling fetchUserData from login...");
        profileSuccess = await fetchUserData(token);
        if (profileSuccess) {
          console.log("AuthContext: Profile fetch successful after login, checking jail status...");
          await checkAndUpdateJailStatus();
          // setIsLoggedIn(true) is now handled within fetchUserData upon success
        } else {
            console.log("AuthContext: Profile fetch failed after login attempt.");
        }
        console.log("AuthContext: Profile fetch/jail check complete (from login). Success:", profileSuccess); // <<< ADD LOG
    } catch (error) {
        // Catch any unexpected errors during the login's async calls
        console.error("AuthContext: Error during login process's try block:", error);
    } finally {
        // This block runs whether the try block succeeded or failed
        if (!profileSuccess) {
            console.log("AuthContext: Login process failed (profile fetch unsuccessful). Logging out.");
            logout(); // This will also clear the token and temp_password if fetch failed
        }
        // --- Set loading FALSE only AFTER all async operations complete ---
        setLoading(false);
        console.log("AuthContext: Login - loading set to false in finally block"); // <<< ADD LOG
    }
  }, [fetchUserData, checkAndUpdateJailStatus, logout]); // Dependencies ensure function has access to latest versions


  // --- Update User Data ---
  // Provides a way for components to request updates to user stats (optimistic + backend call)
  const updateUserData = useCallback(async (updatedData) => {
    const token = localStorage.getItem('token');
    // Only proceed if logged in and token exists
    if (!isLoggedIn || !token) {
        console.log("AuthContext: updateUserData called but user not logged in or no token.");
        return;
    }

    console.log("AuthContext: Updating user data (optimistic). Updates:", updatedData);

    // Optimistic Updates: Update local state immediately for better UX
    // Use hasOwnProperty to ensure the key exists in the update object
    if (updatedData.hasOwnProperty('money')) setMoney(updatedData.money);
    if (updatedData.hasOwnProperty('xp')) {
        setXp(updatedData.xp);
        setRankInfo(getRankForXp(updatedData.xp)); // Update rank immediately based on new XP
    }
    if (updatedData.hasOwnProperty('isAlive') && typeof updatedData.isAlive === 'boolean') {
        console.log("AuthContext: Optimistically setting isAlive to:", updatedData.isAlive);
        setIsAlive(updatedData.isAlive);
    }
    if (updatedData.hasOwnProperty('inventory')) setInventory(updatedData.inventory);
    if (updatedData.hasOwnProperty('bossItems')) setBossItems(updatedData.bossItems);
    if (updatedData.hasOwnProperty('kills')) setKills(updatedData.kills);
    // Add other fields as needed (e.g., level)

    // Backend Update: Send the changes to the server to persist them
    try {
      console.log("AuthContext: Sending update request to backend...");
      const response = await axios.post(`${API_URL}/users/update`, updatedData, {
         headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
          console.log("AuthContext: User data update confirmed by backend.");
          // Optional: Minimal resync if backend data differs significantly from optimistic update
           const backendUserData = response.data.userData;
           if (backendUserData.money !== money) { // Compare backend value with current state
                // console.log("AuthContext: Resyncing money from backend.");
                setMoney(backendUserData.money);
           }
           if (backendUserData.isAlive !== isAlive) {
                // console.log("AuthContext: Resyncing isAlive from backend.");
                setIsAlive(backendUserData.isAlive === true);
           }
           // ... add checks for other critical fields if necessary ...
      } else {
          // Handle backend update failure
          console.error("AuthContext: Backend failed to update user data:", response.data.message);
          // Consider reverting optimistic updates by fetching fresh data fully
          console.log("AuthContext: Reverting optimistic updates by fetching fresh data...");
          await fetchUserData(token); // Fetch all data again to ensure consistency
      }
    } catch (error) {
      console.error('AuthContext: Error calling backend update endpoint:', error);
       if (error.response?.status === 401) {
             console.log("AuthContext: Unauthorized during update. Logging out.");
             logout();
       } else {
           // For other errors, revert optimistic updates
           console.log("AuthContext: Reverting optimistic updates due to network/server error...");
           await fetchUserData(token);
       }
    }
  // Dependencies include state values used in optimistic updates/resync and functions
  }, [isLoggedIn, logout, fetchUserData, money, isAlive, xp, inventory, bossItems, kills]);


  // --- Periodic Jail Check ---
  // Sets up an interval to check jail status periodically and on window focus/visibility change
  useEffect(() => {
      let intervalId = null;
      let visibilityChangeListener = null;
      let focusListener = null;

      // Only set up checks if the user is currently logged in
      if (isLoggedIn) {
          console.log("AuthContext: Setting up periodic jail status checks.");
          // Initial check right after login or if already logged in when effect runs
          checkAndUpdateJailStatus();

          // Check every 30 seconds
          intervalId = setInterval(checkAndUpdateJailStatus, 30000); // 30 seconds

          // Check when the browser tab becomes visible again
           visibilityChangeListener = () => {
                if (document.visibilityState === 'visible') {
                    console.log("AuthContext: Tab became visible, checking jail status.");
                    checkAndUpdateJailStatus();
                }
           };
           document.addEventListener('visibilitychange', visibilityChangeListener);

           // Check when the window gains focus
           focusListener = () => {
               console.log("AuthContext: Window gained focus, checking jail status.");
               checkAndUpdateJailStatus();
           };
           window.addEventListener('focus', focusListener);
      }

      // Cleanup function: clear interval and remove listeners when component unmounts or user logs out
      return () => {
          if (intervalId) {
              // console.log("AuthContext: Clearing jail check interval.");
              clearInterval(intervalId);
          }
           if (visibilityChangeListener) {
               // console.log("AuthContext: Removing visibility change listener.");
               document.removeEventListener('visibilitychange', visibilityChangeListener);
           }
           if (focusListener) {
               // console.log("AuthContext: Removing focus listener.");
               window.removeEventListener('focus', focusListener);
           }
      };
  }, [isLoggedIn, checkAndUpdateJailStatus]); // Dependency: run when login status changes or checker updates


  // --- Context Value ---
  // Assemble the values to be provided by the context
  const contextValue = {
    isLoggedIn,
    user, // { userId, username }
    money,
    xp,
    rank: rankInfo.currentRank, // Provide the current rank string directly
    rankInfo, // Provide the full rank info object if needed elsewhere
    isAlive,
    loading, // Provide loading state for UI feedback
    isInJail,
    jailEndTime,
    inventory,
    bossItems,
    kills,
    login, // Provide login function
    logout, // Provide logout function
    updateUserData, // Provide function to update data
    checkAndUpdateJailStatus, // Provide function to manually check jail status if needed
  };

  // --- Provider Component ---
  // Wrap children components with the context provider
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};