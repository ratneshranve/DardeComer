import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Delicious food placeholders for variety
const imgBg = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80&fit=crop"; // Food spread background
const imgLeft = "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&h=300&fit=crop"; // Pizza
const imgCenter = "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=400&fit=crop"; // Gourmet/Grill
const imgRight = "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=300&h=300&fit=crop"; // Pasta

const actionWords = ["Cravings", "Hunger", "Taste buds", "Soul"];

export default function FestBanner() {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % actionWords.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className="relative px-4 pt-2 pb-12 overflow-hidden shadow-inner bg-gradient-to-r from-[#001A94] via-[#1034A6] to-[#000C45]"
      style={{
        backgroundSize: '200% 200%',
        animation: 'bannerGradientMove 8s ease infinite'
      }}
    >
      <style>{`
        @keyframes bannerGradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          <circle cx="15%" cy="20%" r="2" fill="white" className="animate-pulse" />
          <circle cx="85%" cy="15%" r="1" fill="white" className="animate-ping" />
          <circle cx="70%" cy="80%" r="1.5" fill="white" className="animate-pulse" />
          <path d="M -10 30 Q 20 10 50 30 T 110 30" stroke="url(#grad1)" strokeWidth="0.5" fill="none" opacity="0.5" />
          <path d="M -10 50 Q 20 60 50 40 T 110 50" stroke="url(#grad1)" strokeWidth="0.3" fill="none" opacity="0.3" />
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ff7b00" stopOpacity="0" />
              <stop offset="50%" stopColor="#ff7b00" stopOpacity="1" />
              <stop offset="100%" stopColor="#ff7b00" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Mesh Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-cyan-400/30 blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-purple-500/30 blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute top-[40%] left-[50%] w-48 h-48 bg-blue-300/20 blur-[60px] rounded-full pointer-events-none -translate-x-1/2" />

      <div className="relative z-10 flex flex-col items-center text-center space-y-3 mt-2">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", damping: 12, stiffness: 100 }}
          className="flex flex-col items-center gap-1"
        >
          <div className="flex items-center gap-2">
            <h2 className="text-4xl font-black text-white tracking-tight drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)]">
              DardeComer
            </h2>
          </div>
          
          <div className="h-6 flex items-center justify-center overflow-hidden mt-1">
            <span className="text-amber-100/90 text-sm font-medium mr-1.5 tracking-wide uppercase">Satisfy your</span>
            <div className="relative inline-flex items-center">
              <AnimatePresence mode="wait">
                <motion.span
                  key={wordIndex}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-amber-400 font-bold text-sm tracking-wide uppercase drop-shadow-md"
                >
                  {actionWords[wordIndex]}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Food Images Row - Dynamic Layout */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 pt-4 relative w-full max-w-sm mx-auto">
          {/* Subtle glow behind center image */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white/10 blur-[30px] rounded-full pointer-events-none" />
          
          {/* Left Pizza Image */}
          <motion.div 
            animate={{ 
              y: [0, -8, 0],
              rotate: [-15, -12, -15],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            whileHover={{ scale: 1.05 }}
            className="w-24 h-24 sm:w-28 sm:h-28 z-10 transition-all duration-300"
          >
            <img src={imgLeft} alt="Pizza" className="w-full h-full object-cover rounded-2xl border-2 border-white/50 shadow-xl" />
          </motion.div>

          {/* Center Gourmet Image */}
          <motion.div 
            animate={{ 
              y: [0, -12, 0],
              scale: [1, 1.03, 1]
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
            whileHover={{ scale: 1.1, rotate: 2 }}
            className="w-36 h-36 sm:w-40 sm:h-40 z-20 transition-all duration-500"
            style={{ margin: "0 -10px" }} // Overlap effect
          >
            <div className="relative h-full w-full">
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-400 to-orange-500 blur-md rounded-full opacity-40 animate-pulse" />
              <img src={imgCenter} alt="Gourmet" className="relative w-full h-full object-cover rounded-full border-[4px] border-white shadow-[0_20px_40px_rgba(0,0,0,0.4)]" />
            </div>
          </motion.div>

          {/* Right Pasta Image */}
          <motion.div 
            animate={{ 
              y: [0, -10, 0],
              rotate: [15, 18, 15]
            }}
            transition={{
              duration: 4.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.2
            }}
            whileHover={{ scale: 1.05 }}
            className="w-24 h-24 sm:w-28 sm:h-28 z-10 transition-all duration-300"
          >
            <img src={imgRight} alt="Pasta" className="w-full h-full object-cover rounded-2xl border-2 border-white/50 shadow-xl" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
