import { useEffect } from 'react';

export function useDragScrollLock(isDragging: boolean) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isDragging) {
      // Save current scroll position
      const scrollY = window.scrollY;
      
      // Prevent scrolling by setting body styles
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      
      // Prevent touch events on the entire page
      const preventTouch = (e: TouchEvent) => {
        e.preventDefault();
      };
      
      document.addEventListener('touchmove', preventTouch, { passive: false });
      document.addEventListener('touchstart', preventTouch, { passive: false });
      
      return () => {
        // Restore scroll position and styles
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        document.body.style.touchAction = '';
        
        window.scrollTo(0, scrollY);
        
        // Remove event listeners
        document.removeEventListener('touchmove', preventTouch);
        document.removeEventListener('touchstart', preventTouch);
      };
    }
  }, [isDragging]);
}
