import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { FaDollarSign, FaTicketAlt, FaRedo, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const sectors = [
  { color: '#6a0dad', label: '300', prize: 300 },
  { color: '#ff69b4', label: '50', prize: 50 },
  { color: '#ff1493', label: '100', prize: 100 },
  { color: '#8a2be2', label: '400', prize: 400 },
  { color: '#da70d6', label: '200', prize: 200 },
  { color: '#4b0082', label: '500', prize: 500 },
  { color: '#ffb6c1', label: '10', prize: 10 },
  { color: '#c71585', label: '0', prize: 0 },
];

const spinCost = 250;
const friction = 0.991;
const TAU = 2 * Math.PI;
const baseAngVelMax = 0.35;
const baseAngVelMin = 0.25;
const angVelStopThreshold = 0.0015;
const canvasSize = 450;

const GamblingPage = () => {
  const { money, updateUserData, isLoggedIn, loading: authLoading } = useContext(AuthContext);
  const canvasRef = useRef(null);
  const wheelRef = useRef(null);
  const animationFrameRef = useRef(null);

  const [currentMoney, setCurrentMoney] = useState(money);
  const [angle, setAngle] = useState(0);
  const [angularVelocity, setAngularVelocity] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [resultMessage, setResultMessage] = useState({ type: '', text: '' });
  const [winningSector, setWinningSector] = useState(null);

  // Calculate arc size (memoize if sectors could change, but they are constant here)
  const arc = TAU / sectors.length;

  useEffect(() => {
    setCurrentMoney(money);
  }, [money]);

  // --- Drawing Function (remains the same) ---
  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 10;
    const currentArc = TAU / sectors.length;

    ctx.clearRect(0, 0, width, height);
    ctx.font = `bold ${radius * 0.12}px 'Poppins', sans-serif`;
    ctx.textBaseline = 'middle';

    sectors.forEach((sector, i) => {
      const startAngle = currentArc * i;
      const endAngle = startAngle + currentArc;
      ctx.beginPath();
      ctx.fillStyle = sector.color;
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#00000060';
      ctx.stroke();
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + currentArc / 2);
      ctx.textAlign = 'center';
      ctx.fillText(sector.label, radius * 0.75, 0);
      ctx.restore();
    });

    // Draw Center Hub
    ctx.beginPath();
    ctx.fillStyle = '#4a0e60';
    ctx.arc(centerX, centerY, radius * 0.15, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#ffeb3b80';
    ctx.lineWidth = 4;
    ctx.stroke();
  }, []); // Depends only on constants

  useEffect(() => {
    drawWheel();
  }, [drawWheel]);

  // --- Result Handling (remains the same) ---
  const handleResult = useCallback((sector) => {
    const winningAmount = sector.prize;
    if (winningAmount > 0) {
        setCurrentMoney(prevMoney => {
            const updatedMoney = prevMoney + winningAmount;
            updateUserData({ money: updatedMoney });
            return updatedMoney;
        });
        setResultMessage({ type: 'success', text: `🎉 Woot! You won $${winningAmount}! 🎉` });
    } else {
        setResultMessage({ type: 'error', text: `Ouch! Landed on ${sector.label}. Better luck next time!` });
    }
  }, [updateUserData]);

  // --- Animation Loop (CORRECTED INDEX CALCULATION) ---
  const runAnimation = useCallback(() => {
    if (!wheelRef.current) return;

    // Apply visual rotation
    wheelRef.current.style.transform = `rotate(${angle}rad)`;

    // Calculate next state
    let newAngle = (angle + angularVelocity) % TAU;
    let newVelocity = angularVelocity * friction;

    // Check stop condition
    if (newVelocity < angVelStopThreshold) {
      newVelocity = 0; // Stop completely
      if (isSpinning) {
        setIsSpinning(false); // Mark as stopped spinning

        // --- CORRECTED INDEX CALCULATION ---
        // 1. Normalize the final angle to be within [0, TAU)
        const normalizedAngle = (newAngle % TAU + TAU) % TAU;

        // 2. Calculate how many sectors the *pointer's position* (top = 1.5*PI or -0.5*PI)
        //    has effectively rotated through from the start (sector 0 at 3 o'clock)
        //    A rotation of `normalizedAngle` means the top pointer corresponds to what was
        //    originally at angle `(1.5 * Math.PI - normalizedAngle)` relative to sector 0 start.
        const effectiveAngleForPointer = (1.5 * Math.PI - normalizedAngle + TAU) % TAU;

        // 3. Calculate the index by dividing the effective angle by the arc size
        const finalIndex = Math.floor(effectiveAngleForPointer / arc);
        // --- END CORRECTION ---


        // Debugging log (keep during testing)
        console.log(`Stopped Angle: ${newAngle.toFixed(4)}, Normalized: ${normalizedAngle.toFixed(4)}, Effective Pointer Angle: ${effectiveAngleForPointer.toFixed(4)}, Calculated Index: ${finalIndex}`);


        // Process the result using the calculated index
        if (sectors && sectors.length > 0 && finalIndex >= 0 && finalIndex < sectors.length) {
            const winner = sectors[finalIndex];
            setWinningSector(winner);
            handleResult(winner);
            console.log(`Winner Sector: ${winner.label} (Index: ${finalIndex})`); // Log winner
        } else {
            console.error("Error calculating final index or accessing sectors.", { finalIndex, sectorsLength: sectors?.length });
            setResultMessage({type: 'error', text: 'Calculation error.'});
        }
      }
    }

    // Update state for next frame (only if velocity > 0)
    setAngle(newAngle);
    setAngularVelocity(newVelocity);

    if (newVelocity > 0) {
      animationFrameRef.current = requestAnimationFrame(runAnimation);
    } else {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  // Dependencies updated slightly
  }, [angle, angularVelocity, isSpinning, handleResult, arc]); // Added arc dependency

  // --- Start/Stop Animation Effect (remains the same) ---
  useEffect(() => {
    if (angularVelocity > 0 && !animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(runAnimation);
    } else if (angularVelocity === 0 && animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [angularVelocity, runAnimation]);

  // --- Spin Initiation (remains the same) ---
  const startSpin = () => {
    if (isSpinning || !isLoggedIn) return;
    if (currentMoney < spinCost) {
      setResultMessage({ type: 'error', text: 'Not enough cash for a ticket!' });
      return;
    }
    const updatedMoney = currentMoney - spinCost;
    setCurrentMoney(updatedMoney);
    updateUserData({ money: updatedMoney });
    setResultMessage({ type: '', text: '' });
    setWinningSector(null);
    setIsSpinning(true);
    const initialVelocity = Math.random() * (baseAngVelMax - baseAngVelMin) + baseAngVelMin;
    setAngularVelocity(initialVelocity);
  };

  // --- Message Timer Effect (remains the same) ---
  useEffect(() => {
    let timer;
    if (resultMessage.text) {
        timer = setTimeout(() => {
            setResultMessage({ type: '', text: '' });
        }, 6000);
    }
    return () => clearTimeout(timer);
  }, [resultMessage]);


  // --- Render Logic (remains the same) ---
  if (authLoading) { /* ... loading auth ... */ }
  if (!isLoggedIn) { /* ... not logged in ... */ }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white flex flex-col items-center justify-center pt-24 pb-12 px-4 overflow-hidden">
      {/* Title */}
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-4 text-center shadow-text-glow">
        Wheel of Misfortune!
      </h1>
      <p className="text-lg text-gray-400 mb-8 text-center">Spin the wheel, test your luck!</p>

      {/* Info Display */}
       <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-center mb-8 bg-black/30 backdrop-blur-sm p-4 rounded-lg border border-purple-500/30 shadow-lg">
           {/* ... balance and cost display ... */}
           <div className="text-center sm:text-left">
              <p className="text-sm uppercase text-gray-400 tracking-wider">Your Balance</p>
              <p className="text-2xl font-bold text-green-400 flex items-center justify-center sm:justify-start"><FaDollarSign className="mr-1" /> {currentMoney.toLocaleString()}</p>
           </div>
           <div className="w-px h-10 bg-purple-500/50 hidden sm:block"></div>
           <div className="text-center sm:text-left">
             <p className="text-sm uppercase text-gray-400 tracking-wider">Spin Cost</p>
             <p className="text-2xl font-bold text-red-400 flex items-center justify-center sm:justify-start"><FaTicketAlt className="mr-1"/> {spinCost.toLocaleString()}</p>
           </div>
       </div>


      {/* Wheel Area */}
       <div className="relative flex flex-col items-center justify-center w-full max-w-md sm:max-w-lg md:max-w-xl">
           {/* Pointer */}
           <div className="absolute top-[-10px] left-1/2 transform -translate-x-1/2 z-20">
                <div className="w-0 h-0 border-l-[18px] border-l-transparent border-r-[18px] border-r-transparent border-t-[30px] border-t-yellow-400 drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]"></div>
           </div>
            {/* Wheel Container and Canvas */}
           <div ref={wheelRef} className="relative w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] lg:w-[450px] lg:h-[450px] rounded-full shadow-2xl border-4 border-purple-800/50">
              {/* ... canvas and inner shadow ... */}
              <canvas ref={canvasRef} width={canvasSize} height={canvasSize} className="w-full h-full rounded-full"></canvas>
              <div className="absolute inset-0 rounded-full shadow-[inset_0_0_20px_rgba(0,0,0,0.4)] pointer-events-none"></div>
           </div>
       </div>


      {/* Spin Button */}
       <button className={`mt-10 py-3 px-8 rounded-full text-lg font-semibold text-white transition duration-300 ease-in-out flex items-center justify-center gap-2 shadow-lg transform hover:scale-105 ${ isSpinning || currentMoney < spinCost ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600' }`} onClick={startSpin} disabled={isSpinning || currentMoney < spinCost}>
           {/* ... button text/spinner ... */}
           {isSpinning ? ( <> <FaSpinner className="animate-spin" /> Spinning... </> ) : ( <> <FaRedo /> Spin the Wheel! </> )}
       </button>


      {/* Result Text Area */}
       <div className="h-16 mt-6 text-center">
           {/* ... result message display ... */}
            {resultMessage.text && (<div className={`p-3 rounded-lg inline-flex items-center gap-2 text-lg font-semibold shadow-md animate-fade-in ${ resultMessage.type === 'success' ? 'bg-green-500/80 text-white' : 'bg-red-500/80 text-white' }`}> {resultMessage.type === 'success' ? <FaCheckCircle /> : <FaTimesCircle />} {resultMessage.text} </div> )}
            {!isSpinning && currentMoney < spinCost && !resultMessage.text && ( <p className="text-yellow-400 text-sm font-medium flex items-center justify-center gap-1"><FaExclamationTriangle/> Not enough cash to spin.</p> )}
       </div>


    </div>
  );
};

export default GamblingPage;