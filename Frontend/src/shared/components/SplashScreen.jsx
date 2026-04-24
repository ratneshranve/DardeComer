import React, { useEffect, useState } from 'react';
import './SplashScreen.css';

const SplashScreen = ({ children }) => {
  const [showSplash, setShowSplash] = useState(true);
  const [exit, setExit] = useState(false);

  useEffect(() => {
    // Check if this is a page reload using Performance Navigation API
    // type 'reload' means user refreshed, 'navigate' means fresh open
    const navigation = performance.getEntriesByType('navigation')[0];
    const isReload = navigation && navigation.type === 'reload';

    if (isReload) {
      setShowSplash(false);
      return;
    }

    // Lock scroll
    document.body.style.overflow = "hidden";

    // Sequence: Wait for text animation -> Trigger Exit -> Unmount
    const exitSequence = setTimeout(() => {
      setExit(true);

      const unmountTimer = setTimeout(() => {
        setShowSplash(false);
        document.body.style.overflow = "auto";
      }, 600); // Sync with CSS transition duration

      return () => clearTimeout(unmountTimer);
    }, 2600); // Total show time

    return () => {
      clearTimeout(exitSequence);
      document.body.style.overflow = "auto";
    };
  }, []);

  if (!showSplash) return <>{children}</>;

  return (
    <>
      <div className={`splash ${exit ? 'exit' : ''}`}>
        <div className="center-box">
          <h1 className="brand" data-text="DarDeComer">
            DarDeComer
          </h1>
        </div>
      </div>
      {/* Pre-render children in background for seamless transition */}
      <div style={{ display: exit ? 'block' : 'none' }}>
        {children}
      </div>
    </>
  );
};

export default SplashScreen;