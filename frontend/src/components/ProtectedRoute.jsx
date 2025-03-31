// frontend/src/components/ProtectedRoute.jsx
import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom'; // Import useLocation
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, isAlive, loading } = useContext(AuthContext);
  const location = useLocation(); // Get the current location object

  // 1. Show loading state while initial auth check is happening
  if (loading) {
    // Use a theme-consistent loading indicator
    return <div className="fixed inset-0 flex items-center justify-center bg-gray-900 text-white">Authenticating...</div>;
  }

  // 2. If not loading and not logged in, redirect to auth page
  //    Pass the original location so user can be redirected back after login
  if (!isLoggedIn) {
    console.log("ProtectedRoute: Not logged in, redirecting to /auth");
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // 3. If logged in BUT not alive, redirect to dead page
  //    Ensure this check happens *after* loading is false and isLoggedIn is true
  if (!isAlive) {
    console.log("ProtectedRoute: Logged in but not alive, redirecting to /dead");
    // Avoid redirecting if already on the dead page to prevent loops
    if (location.pathname !== '/dead') {
       return <Navigate to="/dead" replace />;
    }
    // If already on /dead and isAlive is false, allow rendering the DeadPage via children
    // This assumes /dead route itself uses ProtectedRoute but DeadPage doesn't require isAlive=true
  }

  // 4. If logged in AND alive, render the requested component
  //    Also explicitly allow access to /dead if isAlive is false (handled in check 3)
   if (isAlive || location.pathname === '/dead') {
      console.log("ProtectedRoute: Access granted to", location.pathname);
      return children;
  }


  // Fallback case (should ideally not be reached with the logic above)
  // This might happen in complex state transitions, redirect to auth as a safe default.
  console.warn("ProtectedRoute: Unexpected state (isLoggedIn true, but isAlive false and not on /dead). Redirecting to /auth.");
  return <Navigate to="/auth" state={{ from: location }} replace />;

};

export default ProtectedRoute;