// frontend/src/components/ProtectedRoute.jsx
import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  // Use isLoggedIn again for the primary check
  const { isLoggedIn, isAlive, loading } = useContext(AuthContext);
  const location = useLocation();

  // 1. Show loading state (unchanged)
  if (loading) {
    // console.log("ProtectedRoute: Rendering Loading State (loading=true)"); // Optional log
    return <div className="fixed inset-0 flex items-center justify-center bg-gray-900 text-white">Authenticating...</div>;
  }

  // 2. If not loading and NOT LOGGED IN, redirect to auth page (Reverted Check)
  if (!isLoggedIn) { // <<< REVERTED: Check !isLoggedIn
    console.log(`ProtectedRoute: Not logged in (loading=${loading}, isLoggedIn=${isLoggedIn}), redirecting to /auth`);
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // 3. If logged in BUT not alive, redirect to dead page (Unchanged logic)
  if (!isAlive) {
    // console.log("ProtectedRoute: Logged in but not alive, redirecting to /dead"); // Optional log
    if (location.pathname !== '/dead') {
       return <Navigate to="/dead" replace />;
    }
    // Allow rendering /dead if already there and !isAlive
  }

  // 4. If logged in AND (is alive OR we are on the /dead page), render children (Unchanged logic)
  // (We know isLoggedIn is true if we reach here)
  if (isAlive || location.pathname === '/dead') {
     // console.log(`ProtectedRoute: Access granted (isLoggedIn=${isLoggedIn}, isAlive=${isAlive}, path=${location.pathname})`); // Optional log
     return children;
  }

  // Fallback case: Logged in, Alive, but somehow didn't match condition 4
  console.warn("ProtectedRoute: Unexpected state reached (LoggedIn, Alive, but not granted access?). Redirecting to /auth.");
  return <Navigate to="/auth" state={{ from: location }} replace />;

};

export default ProtectedRoute;