// frontend/src/pages/Home.jsx
import React, { useContext } from 'react'; // Removed useEffect, useState if not needed
import { AuthContext } from '../context/AuthContext';
// Removed Register and Login imports
import UserStatus from '../components/UserStatus'; // Keep UserStatus

const Home = () => {
  // Only need isLoggedIn check here to decide what main content to show
  // If not logged in, ProtectedRoute handles redirect before this renders
  const { isLoggedIn } = useContext(AuthContext);

  // Removed password state and related useEffect

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black text-white py-10 md:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">

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
                <p className="text-gray-300 text-lg">
                Step into a ruthless world of spud crime, betrayal, and power struggles. Ascend from being just another lowly potato to becoming the feared and revered Potato Queen. Engage in theft, boss battles, assassinations, and gambling to amass wealth and respect.
                </p>
                <p className="text-gray-400">
                Strategize carefully—your choices decide if you rise to power or end up as mashed potatoes!
                </p>
                 <img
                    src="/assets/potatopleb.png" // Maybe a different image here?
                    className="w-64 h-64 object-contain rounded-xl shadow-lg mx-auto mt-4 float-left"
                    alt="Potato Pleb"
                />
            </div>

             {/* Right Column: User Status */}
            <div className="md:col-span-1">
                {isLoggedIn ? (
                    // Render UserStatus directly if logged in
                    <UserStatus />
                 ) : (
                     // This part should ideally not be reached if ProtectedRoute works correctly
                     // Could show a generic "Loading..." or redirect message as fallback
                     <div className="bg-gray-800 rounded-xl shadow-xl p-8 text-center">
                         <p>Loading user status...</p>
                     </div>
                 )}
            </div>

        </div>


        {/* Game Features (keep this section) */}
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
          Potato Underworld © 2024. All rights reserved.
        </footer>

      </div>
    </div>
  );
};

export default Home;