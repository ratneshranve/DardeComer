import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Delicious food placeholders for variety
const imgBg = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80&fit=crop"; // Food spread background
const imgLeft = "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&h=300&fit=crop"; // Pizza
const imgCenter = "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=400&fit=crop"; // Gourmet/Grill
const imgRight = "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=300&h=300&fit=crop"; // Pasta

const actionWords = ["Cravings", "Hunger", "Taste Buds", "Soul"];

export default function FestBanner({ heroVideo, onOrderClick }) {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % actionWords.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`relative px-4 pt-2 pb-2 overflow-hidden shadow-inner ${heroVideo ? 'bg-transparent' : 'bg-gradient-to-r from-[#001A94] via-[#1034A6] to-[#000C45]'}`}
      style={{
        backgroundSize: '200% 200%',
        animation: heroVideo ? 'none' : 'bannerGradientMove 8s ease infinite'
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
      {!heroVideo && (
        <>
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
        </>
      )}

      <div className="relative z-10 flex flex-col items-center text-center space-y-4 mt-12 sm:mt-16 pb-12">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", damping: 12, stiffness: 100 }}
          className="flex flex-col items-center gap-1"
        >
          {/* Funky Extra Text Badge */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
            animate={{ scale: 1, opacity: 1, rotate: -3 }}
            transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.3 }}
            className="mb-1"
          >
            <span className="inline-block px-4 py-1 bg-amber-400 text-[#001A94] text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-[0_4px_20px_rgba(251,191,36,0.5)] transform -rotate-2">
              Fuel Your Hunger
            </span>
          </motion.div>

          <div className="flex items-center gap-2">
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-[0.15em] drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
              Dar De <span className="text-amber-400">Comer</span>
            </h2>
          </div>

          {/* Order Now Button with Animated Arrow */}
          <motion.button
            onClick={onOrderClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 bg-white hover:bg-gray-100 text-[#001A94] px-6 py-2 rounded-full font-black text-sm uppercase tracking-wider shadow-lg shadow-white/20 transition-colors mt-2"
          >
            Order Now
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </motion.div>
          </motion.button>

          <div className="h-6 flex items-center justify-center overflow-hidden mt-3">
            <span className="text-white font-bold text-sm mr-1.5 tracking-wide uppercase opacity-100">Satisfy your</span>
            <div className="relative inline-flex items-center">
              <AnimatePresence mode="wait">
                <motion.span
                  key={wordIndex}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-amber-600 font-bold text-sm tracking-wide uppercase drop-shadow-md"
                >
                  {actionWords[wordIndex]}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Food Images Row - Removed as requested */}
      </div>
    </div>
  );
}
