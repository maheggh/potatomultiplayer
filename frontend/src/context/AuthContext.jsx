import React, { createContext, useState, useEffect, useCallback } from 'react';
import jwt_decode from 'jwt-decode';
import { getRankForXp } from '../utils/rankCalculator';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [money, setMoney] = useState(0);
  const [xp, setXp] = useState(0);
  const [rankInfo, setRankInfo] = useState(getRankForXp(0));
  const [isAlive, setIsAlive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isInJail, setIsInJail] = useState(false);
  const [jailEndTime, setJailEndTime] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [bossItems, setBossItems] = useState([]);
  const [kills, setKills] = useState(0);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('temp_password');
    localStorage.removeItem('saved_username');
    localStorage.removeItem('saved_password');
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
    setLoading(false);
  }, []);

  const checkAndUpdateJailStatus = useCallback(async () => {
    const currentToken = localStorage.getItem('token');
    if (!isLoggedIn || !currentToken) {
      if (isInJail) setIsInJail(false);
      if (jailEndTime) setJailEndTime(null);
      return;
    }
    try {
      const res = await axios.get(`${API_URL}/jail/status`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (res.data.success) {
        const { inJail, jailTimeEnd, released } = res.data;
        const newEnd = inJail && jailTimeEnd ? new Date(jailTimeEnd) : null;
        if (inJail !== isInJail) setIsInJail(inJail);
        if (newEnd?.getTime() !== jailEndTime?.getTime()) setJailEndTime(newEnd);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        logout();
      }
    }
  }, [isLoggedIn, isInJail, jailEndTime, logout]);

  const fetchUserData = useCallback(async (token) => {
    if (!token) {
      return null;
    }
    try {
      const headersConfig = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_URL}/users/profile`, { headers: headersConfig });
      if (res.data.success) {
        const d = res.data.userData;
        setUser({ userId: d.userId, username: d.username });
        setMoney(d.money || 0);
        setXp(d.xp || 0);
        setIsAlive(d.isAlive === true);
        setRankInfo(getRankForXp(d.xp || 0));
        setInventory(d.inventory || []);
        setBossItems(d.bossItems || []);
        setKills(d.kills || 0);
        setIsLoggedIn(true);
        return d;
      } else {
        setIsLoggedIn(false);
        setUser(null);
        return null;
      }
    } catch (error) {
      if (error.response?.status === 401) {
        logout();
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
      return null;
    }
  }, [logout]);

  useEffect(() => {
    let mounted = true;
    const initAuth = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      let fetchedUser = null;
      if (token) {
        try {
          const decoded = jwt_decode(token);
          if (decoded.exp * 1000 < Date.now()) {
            logout();
          } else {
            fetchedUser = await fetchUserData(token);
            if (fetchedUser && mounted) {
              await checkAndUpdateJailStatus();
            } else if (!fetchedUser) {
              if (isLoggedIn) logout();
            }
          }
        } catch {
          logout();
        }
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
      if (mounted) setLoading(false);
    };
    initAuth();
    return () => { mounted = false; };
  }, [fetchUserData, checkAndUpdateJailStatus, logout, isLoggedIn]);

  const login = useCallback(async (token, generatedPassword = null) => {
    localStorage.setItem('token', token);
    localStorage.removeItem('temp_password');
    if (generatedPassword) {
      localStorage.setItem('temp_password', generatedPassword);
    }
    setLoading(true);
    setIsLoggedIn(false);
    setUser(null);
    let userData = null;
    try {
      userData = await fetchUserData(token);
      if (userData) {
        await checkAndUpdateJailStatus();
        if (generatedPassword && userData.username) {
          localStorage.setItem('saved_username', userData.username);
          localStorage.setItem('saved_password', generatedPassword);
        }
      }
    } catch {
      userData = null;
    } finally {
      if (!userData) {
        if (isLoggedIn || user != null) {
          logout();
        }
      }
      setLoading(false);
    }
  }, [fetchUserData, checkAndUpdateJailStatus, logout, isLoggedIn, user]);

  const updateUserData = useCallback(async (updated) => {
    const token = localStorage.getItem('token');
    if (!isLoggedIn || !token || !user) {
      return;
    }
    if (updated.hasOwnProperty('money')) setMoney(updated.money);
    if (updated.hasOwnProperty('xp')) {
      setXp(updated.xp);
      setRankInfo(getRankForXp(updated.xp));
    }
    if (updated.hasOwnProperty('isAlive')) setIsAlive(updated.isAlive === true);
    if (updated.hasOwnProperty('inventory')) setInventory(updated.inventory);
    if (updated.hasOwnProperty('bossItems')) setBossItems(updated.bossItems);
    if (updated.hasOwnProperty('kills')) setKills(updated.kills);
    try {
      const res = await axios.post(`${API_URL}/users/update`, updated, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.data.success) {
        await fetchUserData(token);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        logout();
      } else {
        await fetchUserData(token);
      }
    }
  }, [isLoggedIn, user, logout, fetchUserData]);

  useEffect(() => {
    let intervalId = null;
    let visListener = null;
    let focusListener = null;
    if (isLoggedIn) {
      checkAndUpdateJailStatus();
      intervalId = setInterval(checkAndUpdateJailStatus, 30000);
      visListener = () => {
        if (document.visibilityState === 'visible') {
          checkAndUpdateJailStatus();
        }
      };
      document.addEventListener('visibilitychange', visListener);
      focusListener = () => {
        checkAndUpdateJailStatus();
      };
      window.addEventListener('focus', focusListener);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
      if (visListener) document.removeEventListener('visibilitychange', visListener);
      if (focusListener) window.removeEventListener('focus', focusListener);
    };
  }, [isLoggedIn, checkAndUpdateJailStatus]);

  const contextValue = {
    isLoggedIn,
    user,
    money,
    xp,
    rank: rankInfo.currentRank,
    rankInfo,
    isAlive,
    loading,
    isInJail,
    jailEndTime,
    inventory,
    bossItems,
    kills,
    login,
    logout,
    updateUserData,
    checkAndUpdateJailStatus,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};
