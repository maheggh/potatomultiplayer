// frontend/src/components/ProtectedRoute.jsx
import React, { useContext, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  // Destructure everything we might need
  const { isLoggedIn, isAlive, loading, token, user, refreshUserData } = useContext(AuthContext);
  const location = useLocation();
  
  // Add debugging
  console.log(`ProtectedRoute: Path=${location.pathname}, Loading=${loading}, LoggedIn=${isLoggedIn}, Alive=${isAlive}, HasToken=${!!token}, HasUser=${!!user}`);
  
  // Try to refresh user data if we have a token but not logged in
  useEffect(() => {
    if (token && !isLoggedIn && !loading) {
      console.log("ProtectedRoute: We have a token but not logged in, refreshing user data...");
      refreshUserData();
    }
  }, [token, isLoggedIn, loading, refreshUserData]);
  
  // 1. Show loading state
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900 text-white">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p>Authenticating...</p>
        </div>
      </div>
    );
  }
  
  // 2. If not loading and NOT LOGGED IN, redirect to auth page
  if (!isLoggedIn) {
    console.log(`ProtectedRoute: Not logged in (loading=${loading}, isLoggedIn=${isLoggedIn}), redirecting to /auth`);
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  
  // 3. If logged in BUT not alive, redirect to dead page
  if (!isAlive) {
    console.log("ProtectedRoute: Logged in but not alive, redirecting to /dead");
    if (location.pathname !== '/dead') {
      return <Navigate to="/dead" replace />;
    }
    // Allow rendering /dead if already there and !isAlive
  }
  
  // 4. If logged in AND (is alive OR we are on the /dead page), render children
  if (isAlive || location.pathname === '/dead') {
    console.log(`ProtectedRoute: Access granted (isLoggedIn=${isLoggedIn}, isAlive=${isAlive}, path=${location.pathname})`);
    return children;
  }
  
  // Fallback case
  console.warn("ProtectedRoute: Unexpected state reached. Redirecting to /auth.");
  return <Navigate to="/auth" state={{ from: location }} replace />;
};

export default ProtectedRoute;