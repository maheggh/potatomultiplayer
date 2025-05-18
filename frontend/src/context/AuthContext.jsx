import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';

const BACKEND_URL = import.meta.env.PROD 
  ? '/api'  // In production, use relative URL
  : (import.meta.env.VITE_API_URL || 'http://localhost:5000/api');

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [money, setMoney] = useState(0);
  const [xp, setXP] = useState(0);
  const [rank, setRank] = useState('');
  const [level, setLevel] = useState(1);
  const [isAlive, setIsAlive] = useState(true);
  const [inventory, setInventory] = useState([]);
  const [bossItems, setBossItems] = useState([]);
  const [kills, setKills] = useState(0);
  const [isInJail, setIsInJail] = useState(false);
  const [jailEndTime, setJailEndTime] = useState(null);
  const [jailRecord, setJailRecord] = useState(null);
  const [isCheckingJailStatus, setIsCheckingJailStatus] = useState(false);

  const getAuthHeader = useCallback(() => {
    const currentToken = localStorage.getItem('token');
    return currentToken ? { headers: { Authorization: `Bearer ${currentToken}` } } : null;
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsLoggedIn(false);
    setMoney(0);
    setXP(0);
    setRank('');
    setLevel(1);
    setIsAlive(true);
    setInventory([]);
    setBossItems([]);
    setKills(0);
    setIsInJail(false);
    setJailEndTime(null);
    setJailRecord(null);
    setLoading(false);
  }, []);

  const setUserState = useCallback((userData) => {
    if (!userData) {
      handleLogout();
      return;
    }
    
    setUser(userData);
    setMoney(userData.money || 0);
    setXP(userData.xp || 0);
    setRank(userData.rank || 'Homeless Potato');
    setLevel(userData.level || 1);
    setIsAlive(userData.isAlive !== undefined ? userData.isAlive : true);
    setInventory(userData.inventory || []);
    setBossItems(userData.bossItems || []);
    setKills(userData.kills || 0);
    setIsLoggedIn(true);
    
    if (userData.isInJail) {
      setIsInJail(true);
      if (userData.jailTimeEnd) {
        setJailEndTime(new Date(userData.jailTimeEnd));
      }
    } else {
      setIsInJail(false);
      setJailEndTime(null);
      setJailRecord(null);
    }
  }, [handleLogout]);

  const checkAndUpdateJailStatus = useCallback(async () => {
    if (isCheckingJailStatus) return null;
    
    const authHeader = getAuthHeader();
    if (!authHeader) return null;
    
    setIsCheckingJailStatus(true);
    
    try {
      const response = await axios.get(`${BACKEND_URL}/jail/status`, authHeader);
      
      if (response.data.success) {
        const jailStatus = response.data;
        
        setIsInJail(jailStatus.inJail);
        setJailRecord(jailStatus.jailRecord || null);
        
        if (jailStatus.inJail && jailStatus.jailRecord?.endTime) {
          setJailEndTime(new Date(jailStatus.jailRecord.endTime));
        } else if (jailStatus.inJail && jailStatus.timeRemaining > 0) {
          const endTime = new Date(Date.now() + jailStatus.timeRemaining * 1000);
          setJailEndTime(endTime);
        } else {
          setJailEndTime(null);
        }
        
        return jailStatus;
      }
    } catch (error) {
      if (error.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setTimeout(() => {
        setIsCheckingJailStatus(false);
      }, 3000);
    }
    
    return null;
  }, [getAuthHeader, handleLogout]);

  useEffect(() => {
    let isMounted = true;
    
    const fetchInitialData = async () => {
      const currentToken = localStorage.getItem('token');
      if (!currentToken) {
        if (isMounted) handleLogout();
        return;
      }

      if (isMounted) setLoading(true);
      const authHeader = { headers: { Authorization: `Bearer ${currentToken}` } };

      try {
        const response = await axios.get(`${BACKEND_URL}/users/me`, authHeader);
        
        if (!isMounted) return;
        
        if (response.data.success && response.data.userData) {
          setUserState(response.data.userData);
          if (response.data.userData.isInJail && !isCheckingJailStatus) {
            setTimeout(() => {
              if (isMounted) checkAndUpdateJailStatus();
            }, 500);
          }
        } else {
          if (isMounted) handleLogout();
        }
      } catch (error) {
        if (isMounted) handleLogout();
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchInitialData();
    
    return () => {
      isMounted = false;
    };
  }, [token, handleLogout, setUserState]);

  const register = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/users/register`, {});
      if (response.data.success && response.data.token) {
        localStorage.setItem('token', response.data.token);
        setToken(response.data.token);
        return {
          success: true,
          generatedPassword: response.data.userData?.generatedPassword,
          username: response.data.userData?.username
        };
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      handleLogout();
      throw error.response?.data?.message || error.message || 'Registration failed';
    } finally {
      setLoading(false);
    }
  }, [handleLogout]);

  const login = useCallback(async (providedToken, generatedPassword) => {
    setLoading(true);
    if (providedToken) {
      localStorage.setItem('token', providedToken);
      if (generatedPassword && localStorage.getItem('saved_username')) {
        localStorage.setItem('saved_password', generatedPassword);
      }
      setToken(providedToken);
      return { success: true };
    } else {
      const username = localStorage.getItem('saved_username');
      const password = localStorage.getItem('saved_password');
      
      if (username && password) {
        try {
          const response = await axios.post(`${BACKEND_URL}/users/login`, { username, password });
          if (response.data.success && response.data.token) {
            localStorage.setItem('token', response.data.token);
            setToken(response.data.token);
            return { success: true };
          }
        } catch (error) {
          console.error('Error logging in with saved credentials:', error.message);
        }
      }
      
      setLoading(false);
      return { success: false, message: "No login credentials available" };
    }
  }, []);

  const updateUserData = useCallback((updatedData) => {
    setUser(prev => prev ? { ...prev, ...updatedData } : null);
    if (updatedData.money !== undefined) setMoney(updatedData.money);
    if (updatedData.xp !== undefined) setXP(updatedData.xp);
    if (updatedData.rank !== undefined) setRank(updatedData.rank);
    if (updatedData.level !== undefined) setLevel(updatedData.level);
    if (updatedData.isAlive !== undefined) setIsAlive(updatedData.isAlive);
    if (updatedData.inventory !== undefined) setInventory(updatedData.inventory);
    if (updatedData.bossItems !== undefined) setBossItems(updatedData.bossItems);
    if (updatedData.kills !== undefined) setKills(updatedData.kills);
    
    if (updatedData.inJail !== undefined) {
      setIsInJail(updatedData.inJail);
      if (updatedData.jailTimeEnd) {
        setJailEndTime(new Date(updatedData.jailTimeEnd));
      } else if (!updatedData.inJail) {
        setJailEndTime(null);
        setJailRecord(null);
      }
    }
  }, []);

  const refreshUserData = useCallback(async () => {
    const authHeader = getAuthHeader();
    if (!authHeader || !isLoggedIn) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/users/me`, authHeader);
      if (response.data.success && response.data.userData) {
        setUserState(response.data.userData);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, isLoggedIn, setUserState, handleLogout]);

  const contextValue = useMemo(() => ({
    user, token, loading, isLoggedIn,
    money, xp, rank, level, isAlive, inventory, bossItems, kills,
    isInJail, jailEndTime, jailRecord,
    register, login, logout: handleLogout,
    updateUserData, refreshUserData, checkAndUpdateJailStatus
  }), [
    user, token, loading, isLoggedIn,
    money, xp, rank, level, isAlive, inventory, bossItems, kills,
    isInJail, jailEndTime, jailRecord,
    register, login, handleLogout,
    updateUserData, refreshUserData, checkAndUpdateJailStatus
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};