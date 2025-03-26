// AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import jwt_decode from 'jwt-decode';
import { getRankForXp } from '../utils/rankCalculator';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [money, setMoney] = useState(0);
  const [isAlive, setIsAlive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [xp, setXp] = useState(0);
  const [rankInfo, setRankInfo] = useState(getRankForXp(0)); // Initial rank info

  const fetchUserData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      logout();
      return;
    }

    try {
      const res = await fetch('/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        logout();
        return;
      }

      const data = await res.json();
      if (data.success) {
        setUser(data.userData);
        setMoney(data.userData.money || 0);
        setXp(data.userData.xp || 0);
        setIsAlive(data.userData.isAlive !== false);
        setIsLoggedIn(true);

        const calculatedRank = getRankForXp(data.userData.xp || 0);
        setRankInfo(calculatedRank);
      } else {
        logout();
      }
    } catch (error) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const decoded = jwt_decode(token);
          if (decoded.exp * 1000 < Date.now()) {
            logout();
          } else {
            await fetchUserData();
          }
        } catch {
          logout();
        }
      } else {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (token) => {
    localStorage.setItem('token', token);
    await fetchUserData();
  };

  const logout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setUser(null);
    setMoney(0);
    setXp(0);
    setRankInfo(getRankForXp(0));
    setIsAlive(true);
    setLoading(false);
  };

  const updateUserData = async (updatedData) => {
    const token = localStorage.getItem('token');
    if (!user || !user.userId) return;

    try {
      const response = await fetch('/api/users/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });

      if (response.ok) {
        await fetchUserData();
      }
    } catch (error) {
      console.error('Error updating user data:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        user,
        money,
        xp,
        rank: rankInfo.currentRank,
        rankInfo,
        setMoney,
        isAlive,
        login,
        logout,
        updateUserData,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
