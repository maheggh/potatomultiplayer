// frontend/src/pages/Home.jsx
import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import UserStatus from '../components/UserStatus';
import JailStatus from '../components/JailStatus';
import RankInfo from '../components/RankInfo';
import {
  FaCar,
  /* FaGun removed */
  FaSkull,
  FaFlag,
  FaDice,
  FaFire,
  FaInfoCircle,
  FaChartLine,
  FaMedal,
  FaEye,
  FaEyeSlash,
  FaUser,
  FaLock,
  FaTrash
} from 'react-icons/fa';
import { FaGun } from 'react-icons/fa6'; // Import FaGun from fa6

const Home = () => {
  const { isLoggedIn, user } = useContext(AuthContext);

  const [hasSavedCredentials, setHasSavedCredentials] = useState(false);
  const [savedUsername, setSavedUsername] = useState('');
  const [savedPassword, setSavedPassword] = useState('');
  const [showSavedPassword, setShowSavedPassword] = useState(false);
  const [showRankInfo, setShowRankInfo] = useState(false);

  useEffect(() => {
    if (isLoggedIn && user?.username) {
      const localSavedUser = localStorage.getItem('saved_username');
      const localSavedPass = localStorage.getItem('saved_password');

      if (localSavedUser && localSavedPass && localSavedUser === user.username) {
        setSavedUsername(localSavedUser);
        setSavedPassword(localSavedPass);
        setHasSavedCredentials(true);
      } else {
        setSavedUsername('');
        setSavedPassword('');
        setHasSavedCredentials(false);
      }
    } else {
      setSavedUsername('');
      setSavedPassword('');
      setHasSavedCredentials(false);
    }
  }, [user, isLoggedIn]);

  const forgetSavedCredentials = () => {
    localStorage.removeItem('saved_username');
    localStorage.removeItem('saved_password');
    setSavedUsername('');
    setSavedPassword('');
    setHasSavedCredentials(false);
    setShowSavedPassword(false);
  };

  const gameSections = [
    {
      title: 'Theft',
      description: 'Steal money and items from various targets',
      icon: <FaFire className="text-orange-400 text-2xl" />,
      to: '/theft',
      color: 'from-orange-900/50 to-gray-900',
      borderColor: 'border-orange-700/40'
    },
    {
      title: 'Car Theft',
      description: 'Steal cars to race or sell',
      icon: <FaCar className="text-blue-400 text-2xl" />,
      to: '/car-theft',
      color: 'from-blue-900/50 to-gray-900',
      borderColor: 'border-blue-700/40'
    },
    {
      title: 'Car Races',
      description: 'Race your stolen cars to win money and XP',
      icon: <FaFlag className="text-green-400 text-2xl" />,
      to: '/car-races',
      color: 'from-green-900/50 to-gray-900',
      borderColor: 'border-green-700/40'
    },
    {
      title: 'Assassinations',
      description: 'Take out rival players for big rewards',
      icon: <FaSkull className="text-red-400 text-2xl" />,
      to: '/assassination',
      color: 'from-red-900/50 to-gray-900',
      borderColor: 'border-red-700/40'
    },
    {
      title: 'Boss Battles',
      description: 'Challenge bosses to get special items',
      icon: <FaFire className="text-purple-400 text-2xl" />,
      to: '/bosses',
      color: 'from-purple-900/50 to-gray-900',
      borderColor: 'border-purple-700/40'
    },
    {
      title: 'Weapon Store',
      description: 'Buy weapons to improve success rates',
      icon: <FaGun className="text-yellow-400 text-2xl" />, // FaGun is now imported correctly
      to: '/weapon-store',
      color: 'from-yellow-900/50 to-gray-900',
      borderColor: 'border-yellow-700/40'
    },
    {
      title: 'Gambling',
      description: 'Try your luck to win quick cash',
      icon: <FaDice className="text-cyan-400 text-2xl" />,
      to: '/gambling',
      color: 'from-cyan-900/50 to-gray-900',
      borderColor: 'border-cyan-700/40'
    },
    {
      title: 'Leaderboards',
      description: 'See who\'s the top potato gangster',
      icon: <FaChartLine className="text-emerald-400 text-2xl" />,
      to: '/score',
      color: 'from-emerald-900/50 to-gray-900',
      borderColor: 'border-emerald-700/40'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black text-white py-10 md:py-16 pb-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="mb-10">
          <img
            src="/assets/potatoqueen_banner.png"
            className="w-full max-h-64 object-cover rounded-xl shadow-xl"
            alt="Potato Queen Banner"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          <div className="md:col-span-2 bg-gray-800 rounded-xl shadow-xl p-8 space-y-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-purple-300">Welcome to the Potato Underworld!</h1>

            {isLoggedIn && hasSavedCredentials && (
              <div className="mt-6 mb-4 p-4 bg-gray-700/60 border border-gray-600 rounded-lg shadow">
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

            <p className="text-gray-300 text-lg">
              Step into a ruthless world of spud crime, betrayal, and power struggles. As a potato gangster, you'll climb the ranks from a humble Homeless Potato to the mighty Potato Queen. Build your criminal empire through thefts, car races, assassinations, and boss battles.
            </p>
            <p className="text-gray-400">
              Strategize carefully—your choices decide if you rise to power or end up as mashed potatoes!
            </p>

            {isLoggedIn && showRankInfo && (
              <div className="mt-4">
                <RankInfo />
              </div>
            )}

            <div className="pt-4">
              <img
                src="/assets/potatopleb.png"
                className="w-64 h-64 object-contain rounded-xl shadow-lg mx-auto mt-4 float-left"
                alt="Potato Pleb"
              />
            </div>
          </div>

          <div className="md:col-span-1">
            {isLoggedIn ? (
              <>
                <UserStatus />
                <div className="mt-6">
                  <JailStatus />
                </div>
              </>
            ) : (
              <div className="bg-gradient-to-br from-purple-900/30 to-gray-900 border border-purple-700/30 rounded-lg p-6 shadow-xl text-center">
                <h2 className="text-xl font-bold text-purple-300 mb-3">Join the Potato Mafia</h2>
                <p className="text-gray-300 mb-4">
                  Join the underground world of potato gangsters. Steal, race, fight, and rise through the ranks!
                </p>
                <div className="flex flex-col gap-3">
                  <Link
                    to="/auth/login"
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors flex items-center justify-center gap-2"
                  >
                    <FaUser /> Login
                  </Link>
                  <Link
                    to="/auth/register"
                    className="px-5 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors flex items-center justify-center gap-2"
                  >
                    <FaMedal /> Instant Account
                  </Link>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-700">
                  <div className="flex items-center justify-center">
                    <FaMedal className="text-yellow-400 mr-2" />
                    <span className="text-yellow-300 font-medium">Rise through 20 unique ranks!</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {isLoggedIn && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <FaInfoCircle className="mr-2 text-purple-400" />
              Criminal Activities
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {gameSections.map((section, index) => (
                <Link
                  key={index}
                  to={section.to}
                  className={`p-4 rounded-lg border bg-gradient-to-br ${section.color} ${section.borderColor} hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}
                >
                  <div className="flex items-start">
                    <div className="mr-4 pt-1">
                      {section.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg mb-1">{section.title}</h3>
                      <p className="text-gray-300 text-sm">{section.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {!isLoggedIn && (
          <div className="mt-12 bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-xl p-6 text-center">
            <h2 className="text-3xl font-semibold mb-6 text-purple-300">Game Features</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-gray-700/60 p-4 rounded-lg shadow border border-purple-700/30">
                <h3 className="font-bold text-xl mb-2 text-orange-300">💰 Theft & Gambling</h3>
                <p className="text-gray-300 text-sm">Risk it all in high-stakes heists and gamble your fortunes.</p>
              </div>
              <div className="bg-gray-700/60 p-4 rounded-lg shadow border border-purple-700/30">
                <h3 className="font-bold text-xl mb-2 text-red-300">🔫 Assassinations</h3>
                <p className="text-gray-300 text-sm">Take down rivals and claim their riches to rise to the top.</p>
              </div>
              <div className="bg-gray-700/60 p-4 rounded-lg shadow border border-purple-700/30">
                <h3 className="font-bold text-xl mb-2 text-purple-300">👑 Boss Battles</h3>
                <p className="text-gray-300 text-sm">Fight legendary potato bosses and collect rare treasures.</p>
              </div>
              <div className="bg-gray-700/60 p-4 rounded-lg shadow border border-purple-700/30">
                <h3 className="font-bold text-xl mb-2 text-blue-300">🏎️ Car Races & Thefts</h3>
                <p className="text-gray-300 text-sm">Race, steal, and collect cars to showcase your wealth.</p>
              </div>
            </div>
          </div>
        )}

        <footer className="mt-12 text-center text-gray-500 text-sm">
          Potato Underworld © {new Date().getFullYear()}. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default Home;