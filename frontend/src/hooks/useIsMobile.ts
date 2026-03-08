// ============================================
// IS MOBILE HOOK - Detect mobile devices
// Used for conditional rendering and routing
// ============================================

import { useState, useEffect } from 'react';

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      // Check screen width
      const isMobileWidth = window.innerWidth < 768;
      
      // Check user agent
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      
      // Check if running as PWA
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      
      setIsMobile(isMobileWidth || isMobileUA);
      setIsStandalone(isStandaloneMode);
    };

    checkMobile();
    
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return { isMobile, isStandalone };
}

export default useIsMobile;
