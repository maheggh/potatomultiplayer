import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios'; // Import axios
import { FaSort, FaSortUp, FaSortDown, FaUser, FaSkullCrossbones, FaCrown, FaDollarSign, FaHeartbeat, FaExclamationTriangle } from 'react-icons/fa'; // Icons

// Ensure this points to your backend API
const API_URL = import.meta.env.VITE_API_URL || '/api';

const ScorePage = () => {
  // Get user info and login status from context
  const { user, isLoggedIn, loading: authLoading } = useContext(AuthContext);

  // Component-specific state
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Loading state for player data fetch
  const [sortField, setSortField] = useState('kills'); // Default sorting
  const [sortOrder, setSortOrder] = useState('desc'); // Default order
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch player data function
  const fetchPlayerData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
        // Use axios to fetch players
        const response = await axios.get(`${API_URL}/players`);
        if (response.data.success) {
            setPlayers(response.data.players || []); // Ensure players is always an array
        } else {
            setErrorMessage(response.data.message || 'Failed to fetch player data.');
        }
    } catch (error) {
        console.error('Error fetching player data:', error);
        setErrorMessage(error.response?.data?.message || 'Server error occurred fetching players.');
    } finally {
        setIsLoading(false);
    }
  }, []); // No dependencies needed for this specific fetch

  // Fetch data when component mounts or user logs in
  useEffect(() => {
    if (isLoggedIn) { // Only fetch if logged in
      fetchPlayerData();
    } else {
        // If user logs out, clear data and stop loading
        setPlayers([]);
        setIsLoading(false);
    }
  }, [isLoggedIn, fetchPlayerData]); // Rerun if login status changes

  // Handle column header clicks for sorting
  const handleSort = (field) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  // Sort players based on state
  const sortedPlayers = [...players].sort((a, b) => {
    let comparison = 0;
    const fieldA = a[sortField];
    const fieldB = b[sortField];

    // Handle different data types for comparison
    if (typeof fieldA === 'string' && typeof fieldB === 'string') {
      comparison = fieldA.localeCompare(fieldB); // Use localeCompare for strings (handles case better)
    } else if (typeof fieldA === 'number' && typeof fieldB === 'number') {
      comparison = fieldA - fieldB; // Direct subtraction for numbers
    } else {
      // Fallback for mixed types or other types (treat as equal or put one first consistently)
      comparison = String(fieldA).localeCompare(String(fieldB));
    }

    return sortOrder === 'asc' ? comparison : comparison * -1; // Reverse if descending
  });

  // Helper to render sort icons
  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <FaSort className="inline ml-1 text-gray-500" />;
    }
    return sortOrder === 'asc' ? (
      <FaSortUp className="inline ml-1 text-yellow-400" />
    ) : (
      <FaSortDown className="inline ml-1 text-yellow-400" />
    );
  };

  // --- Render Logic ---

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading Authentication...</div>;
  }

  if (!isLoggedIn) {
      return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Please log in to view the leaderboard.</div>;
  }

  if (isLoading) {
      return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading Leaderboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white py-12 px-4 md:px-8 lg:px-16">
      <div className="container my-20 mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-10 text-center text-yellow-400 tracking-wider">Potato Underworld Rankings</h1>

        {errorMessage && (
            <div className="mb-6 p-3 bg-red-500/80 text-white rounded-lg shadow-md flex items-center justify-center">
                 <FaExclamationTriangle className="mr-2" /> {errorMessage}
            </div>
        )}

        {/* Use a container div for better overflow handling on small screens */}
        <div className="overflow-x-auto bg-gray-700/50 backdrop-blur-sm rounded-lg shadow-xl">
          <table className="min-w-full table-auto border-collapse">
            <thead className="bg-gray-800/70 text-gray-300 uppercase text-sm leading-normal">
              <tr>
                {/* Add icons and improve padding/text alignment */}
                <th className="py-3 px-4 xl:px-6 text-left cursor-pointer hover:bg-gray-700 transition duration-150" onClick={() => handleSort('username')}>
                  <FaUser className="inline mr-2" /> Username {renderSortIcon('username')}
                </th>
                <th className="py-3 px-4 xl:px-6 text-right cursor-pointer hover:bg-gray-700 transition duration-150" onClick={() => handleSort('kills')}>
                  <FaSkullCrossbones className="inline mr-2" /> Kills {renderSortIcon('kills')}
                </th>
                <th className="py-3 px-4 xl:px-6 text-left cursor-pointer hover:bg-gray-700 transition duration-150" onClick={() => handleSort('rank')}>
                  <FaCrown className="inline mr-2" /> Rank {renderSortIcon('rank')}
                </th>
                <th className="py-3 px-4 xl:px-6 text-right cursor-pointer hover:bg-gray-700 transition duration-150" onClick={() => handleSort('money')}>
                  <FaDollarSign className="inline mr-2" /> Money {renderSortIcon('money')}
                </th>
                <th className="py-3 px-4 xl:px-6 text-center cursor-pointer hover:bg-gray-700 transition duration-150" onClick={() => handleSort('isAlive')}> {/* Changed field to isAlive */}
                  <FaHeartbeat className="inline mr-2" /> Status {renderSortIcon('isAlive')}
                </th>
              </tr>
            </thead>
            <tbody className="text-gray-200 text-sm font-light">
              {sortedPlayers.length > 0 ? (
                sortedPlayers.map((player, index) => (
                  <tr
                    key={player._id || index} // Use player._id if available, fallback to index
                    // Highlight current user and add alternating row colors
                    className={`border-b border-gray-600 transition duration-300 ease-in-out ${
                        player.username === user?.username
                        ? 'bg-purple-800/80 font-semibold text-yellow-300' // Highlight current user
                        : (index % 2 === 0 ? 'bg-gray-700/70 hover:bg-gray-600/80' : 'bg-gray-700/50 hover:bg-gray-600/70') // Alternating rows
                    }`}
                  >
                    <td className="py-3 px-4 xl:px-6 text-left whitespace-nowrap">{player.username}</td>
                    <td className="py-3 px-4 xl:px-6 text-right">{player.kills?.toLocaleString()}</td>
                    <td className="py-3 px-4 xl:px-6 text-left">{player.rank}</td>
                    <td className="py-3 px-4 xl:px-6 text-right">${player.money?.toLocaleString()}</td>
                    <td className={`py-3 px-4 xl:px-6 text-center font-medium ${player.isAlive ? 'text-green-400' : 'text-red-500'}`}>
                      {player.isAlive ? 'Alive' : 'Mashed'} {/* Changed Dead to Mashed for theme */}
                    </td>
                  </tr>
                ))
              ) : (
                  // Display if no players are found
                  <tr>
                      <td colSpan="5" className="text-center py-6 text-gray-400 italic">No players found on the leaderboard.</td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ScorePage;