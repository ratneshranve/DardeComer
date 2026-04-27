import React, { useEffect, useState } from 'react';
import './SplashScreen.css';

const SplashScreen = ({ children }) => {
  const [showSplash, setShowSplash] = useState(true);
  const [exit, setExit] = useState(false);

  useEffect(() => {
    // Strategy: use Performance Navigation API to detect page reload (skip splash).
    // For WebView camera returns, Android often fires a new 'navigate' entry,
    // so we also use a short-lived sessionStorage flag set AFTER splash finishes
    // to prevent re-showing on camera/gallery returns within the same session.
    const navigation = performance.getEntriesByType('navigation')[0];
    const isPageReload = navigation && navigation.type === 'reload';
    const alreadyShown = sessionStorage.getItem('_splashDone') === '1';

    if (isPageReload || alreadyShown) {
      setShowSplash(false);
      return;
    }

    // Lock scroll
    document.body.style.overflow = "hidden";

    // Sequence: Wait for text animation -> Trigger Exit -> Unmount
    const exitSequence = setTimeout(() => {
      setExit(true);

      const unmountTimer = setTimeout(() => {
        // Mark splash as done for this session so camera returns don't re-trigger
        sessionStorage.setItem('_splashDone', '1');
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
          <p className="tagline">
            Turning Fatty Liver Into Fatty Wallet
          </p>
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