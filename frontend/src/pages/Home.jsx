// frontend/src/pages/Home.jsx
import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import UserStatus from '../components/UserStatus';
// Import necessary icons
import { FaEye, FaEyeSlash, FaUser, FaLock, FaTrash } from 'react-icons/fa';

const Home = () => {
  const { isLoggedIn, user } = useContext(AuthContext); // Get user object

  // State for managing saved credentials display
  const [hasSavedCredentials, setHasSavedCredentials] = useState(false);
  const [savedUsername, setSavedUsername] = useState('');
  const [savedPassword, setSavedPassword] = useState('');
  const [showSavedPassword, setShowSavedPassword] = useState(false); // For show/hide toggle

  // Check for saved credentials on component mount or when user changes
  useEffect(() => {
    if (isLoggedIn && user?.username) {
      const localSavedUser = localStorage.getItem('saved_username');
      const localSavedPass = localStorage.getItem('saved_password');
  
      // Add these logs to see the raw values
      console.log("Home useEffect: Checking storage...");
      console.log("Home useEffect: localSavedUser from storage:", localSavedUser);
      console.log("Home useEffect: localSavedPass from storage:", localSavedPass);
      console.log("Home useEffect: Current user.username:", user.username);
  
      // Check if password exists specifically
      if (!localSavedPass) {
          console.warn("Home useEffect: saved_password NOT FOUND in localStorage!");
      }
  
  
      if (localSavedUser && localSavedPass && localSavedUser === user.username) {
        console.log("Home: Found saved credentials matching current user.");
        setSavedUsername(localSavedUser);
        setSavedPassword(localSavedPass); // Make sure this value isn't empty/null
        setHasSavedCredentials(true);
      } else {
        console.log("Home: No saved credentials found or they don't match current user.");
        setSavedUsername('');
        setSavedPassword('');
        setHasSavedCredentials(false);
      }
    } else {
       console.log("Home useEffect: Skipping check (not logged in or no user object)");
       setSavedUsername('');
       setSavedPassword('');
       setHasSavedCredentials(false);
    }
  }, [user, isLoggedIn]);

  // Function to forget saved credentials
  const forgetSavedCredentials = () => {
    localStorage.removeItem('saved_username');
    localStorage.removeItem('saved_password');
    setSavedUsername('');
    setSavedPassword('');
    setHasSavedCredentials(false);
    setShowSavedPassword(false); // Hide password field if forgotten
    console.log("Home: Forgotten saved credentials.");
    // Optionally add a temporary feedback message state
  };


  // --- REMOVED all state and useEffect logic related to temp_password ---
  // REMOVED: showPasswordInfo, registeredPassword, credentialsSaved state
  // REMOVED: useEffect checking temp_password
  // REMOVED: handleSaveCredentials function (Saving is now assumed to happen elsewhere or previously)


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black text-white py-10 md:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">

        {/* --- REMOVED: Post-Registration Password Info (Yellow Box) --- */}

        <div className="mb-10">
          <img
            src="/assets/potatoqueen_banner.png"
            className="w-full max-h-64 object-cover rounded-xl shadow-xl"
            alt="Potato Queen Banner"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Left Column: Game Description / Welcome */}
          <div className="md:col-span-2 bg-gray-800 rounded-xl shadow-xl p-8 space-y-4">
            <h1 className="text-3xl sm:text-4xl font-bold text-purple-300">Welcome to the Potato Underworld!</h1>

             {/* --- START: Saved Credentials Display --- */}
             {isLoggedIn && hasSavedCredentials && (
                 <div className="mt-6 mb-2 p-4 bg-gray-700/60 border border-gray-600 rounded-lg shadow">
                    <h4 className="text-lg font-semibold text-gray-300 mb-3">Saved Login Info (Browser)</h4>
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                            <FaUser className="text-gray-400"/>
                            <span className="font-medium text-gray-400">Name:</span>
                            <span className="text-purple-300 font-mono">{savedUsername}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <FaLock className="text-gray-400"/>
                            <span className="font-medium text-gray-400">Code:</span>
                            <span className="flex-1 font-mono text-purple-300 break-all">
                                {showSavedPassword ? savedPassword : '••••••••'}
                            </span>
                            <button
                                onClick={() => setShowSavedPassword(!showSavedPassword)}
                                className="text-gray-400 hover:text-gray-200 p-1"
                                title={showSavedPassword ? "Hide Code" : "Show Code"}
                            >
                                {showSavedPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                        <button
                            onClick={forgetSavedCredentials}
                            className="mt-2 text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                            title="Forget saved login info from this browser"
                            >
                            <FaTrash /> Forget Login
                        </button>
                    </div>
                 </div>
             )}
             {/* --- END: Saved Credentials Display --- */}


            <p className="text-gray-300 text-lg pt-4"> {/* Added padding top */}
              Step into a ruthless world of spud crime, betrayal, and power struggles... {/* Rest of description */}
            </p>
            <p className="text-gray-400">
              Strategize carefully—your choices decide if you rise to power or end up as mashed potatoes!
            </p>
            <img
              src="/assets/potatopleb.png"
              className="w-64 h-64 object-contain rounded-xl shadow-lg mx-auto mt-4 float-left"
              alt="Potato Pleb"
            />
          </div>

          {/* Right Column: User Status */}
          <div className="md:col-span-1">
            {isLoggedIn ? (
              <UserStatus />
            ) : (
              <div className="bg-gray-800 rounded-xl shadow-xl p-8 text-center">
                <p>Loading user status...</p>
              </div>
            )}
          </div>
        </div>

        {/* Game Features */}
        <div className="mt-12 bg-gray-800 rounded-xl shadow-xl p-6 text-center">
           <h2 className="text-3xl font-semibold mb-4">Game Features</h2>
           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
               {/* Feature items */}
               <div className="bg-gray-700 p-4 rounded-lg shadow"> <h3 className="font-bold text-xl mb-2">💰 Theft & Gambling</h3> <p className="text-gray-300 text-sm">Risk it all in high-stakes heists and gamble your fortunes.</p> </div>
               <div className="bg-gray-700 p-4 rounded-lg shadow"> <h3 className="font-bold text-xl mb-2">🔫 Assassinations</h3> <p className="text-gray-300 text-sm">Take down rivals and claim their riches to rise to the top.</p> </div>
               <div className="bg-gray-700 p-4 rounded-lg shadow"> <h3 className="font-bold text-xl mb-2">👑 Boss Battles</h3> <p className="text-gray-300 text-sm">Fight legendary potato bosses and collect rare treasures.</p> </div>
               <div className="bg-gray-700 p-4 rounded-lg shadow"> <h3 className="font-bold text-xl mb-2">🏎️ Car Races & Thefts</h3> <p className="text-gray-300 text-sm">Race, steal, and collect cars to showcase your wealth.</p> </div>
           </div>
        </div>

        <footer className="mt-12 text-center text-gray-500 text-sm">
          Potato Underworld © {new Date().getFullYear()}. All rights reserved.
        </footer>

      </div>
    </div>
  );
};

export default Home;