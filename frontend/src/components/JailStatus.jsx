import React, { useEffect, useState } from 'react';

const JailStatus = ({
  jailTimeEnd,
  onRelease,
  breakoutAttempted,
  onAttemptBreakout,
  breakoutResult,
  showBreakoutSuccessImage
}) => {
  const [jailTime, setJailTime] = useState(0);

  useEffect(() => {
    if (!jailTimeEnd) {
      setJailTime(0);
      return;
    }
    const endTime = new Date(jailTimeEnd).getTime();
    if (isNaN(endTime)) {
      setJailTime(0);
      return;
    }
    const calcRemaining = () => Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
    const initial = calcRemaining();
    setJailTime(initial);
    if (initial <= 0) {
      if (endTime > 0 && Date.now() >= endTime) {
        onRelease?.();
      }
      return;
    }
    const interval = setInterval(() => {
      const remain = calcRemaining();
      setJailTime(remain);
      if (remain <= 0) {
        clearInterval(interval);
        onRelease?.();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [jailTimeEnd, onRelease]);

  if (showBreakoutSuccessImage && breakoutResult === 'success') {
    return (
      <div className="my-6 p-4 md:p-6 bg-green-100 border-l-4 border-green-500 text-green-700 rounded-lg shadow-md flex flex-col items-center text-center w-full max-w-md mx-auto">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xl font-semibold">Breakout Successful!</p>
        <p className="text-lg mt-1">You have successfully broken out!</p>
        <img
          src="/assets/potatofree.jpg"
          alt="Potato Escaped"
          className="w-48 h-48 md:w-64 md:h-64 object-cover mt-4 rounded-md border-2 border-green-300"
          onError={(e) => { e.target.onerror = null; e.target.src='/assets/error.png'; }}
          loading="lazy"
        />
      </div>
    );
  }

  if (jailTime <= 0 || breakoutResult === 'success') {
    return null;
  }

  return (
    <div className="my-6 p-4 md:p-6 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded-lg shadow-md flex flex-col items-center text-center w-full max-w-md mx-auto">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-yellow-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="text-xl font-semibold">You are in jail!</p>
      <p className="text-lg mt-1">Time remaining: {jailTime} seconds</p>
      <img
        src="/assets/potatojail.JPG"
        alt="Potato in Jail"
        className="w-48 h-48 md:w-64 md:h-64 object-cover mt-4 rounded-md border-2 border-yellow-300"
        onError={(e) => { e.target.onerror = null; e.target.src='/assets/error.png'; }}
        loading="lazy"
      />
      {breakoutAttempted && breakoutResult === 'fail' && (
        <p className="mt-4 text-red-600 font-medium">Breakout attempt failed! You got put into maximum security!</p>
      )}
      {!breakoutAttempted && jailTime > 0 && (
        <button
          onClick={onAttemptBreakout}
          className="mt-4 px-6 py-2 bg-red-600 text-white font-semibold rounded-md shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition duration-150 ease-in-out"
        >
          Attempt Breakout (50% Chance)
        </button>
      )}
    </div>
  );
};

export default JailStatus;
