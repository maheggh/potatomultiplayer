import React, { useEffect, useState } from 'react';

const JailStatus = ({ jailTimeEnd, onRelease }) => {
  const [jailTime, setJailTime] = useState(0); // Remaining seconds

  useEffect(() => {
    if (!jailTimeEnd) {
        setJailTime(0);
        return;
    }

    const endTime = new Date(jailTimeEnd).getTime();

    if (isNaN(endTime)) {
        console.error("Invalid jailTimeEnd prop received:", jailTimeEnd);
        setJailTime(0);
        return;
    }

    const calculateRemaining = () => {
        return Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
    };

    const initialRemaining = calculateRemaining();
    setJailTime(initialRemaining);

    if (initialRemaining <= 0) {
        if (endTime > 0) { // Only call release if endTime was valid and in the past
             onRelease?.();
        }
        return;
    }

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setJailTime(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onRelease?.();
      }
    }, 1000);

    return () => clearInterval(interval);

  }, [jailTimeEnd, onRelease]);

  if (jailTime <= 0) {
    return null;
  }

  return (
    <div className="my-6 p-4 md:p-6 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded-lg shadow-md flex flex-col items-center text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-yellow-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> {/* Clock Icon */}
        </svg>
      <p className="text-xl font-semibold">You are in jail!</p>
      <p className="text-lg mt-1">Time remaining: {jailTime} seconds.</p>
      <img
        src="/assets/potatojail.JPG"
        alt="Potato in Jail"
        className="w-48 h-48 md:w-64 md:h-64 object-cover mt-4 rounded-md border-2 border-yellow-300"
        onError={(e) => { e.target.onerror = null; e.target.src='/assets/error.png'; }}
      />
    </div>
  );
};

export default JailStatus;