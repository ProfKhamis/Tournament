import * as React from "react"

// Define the breakpoint for clarity and easy maintenance
const MOBILE_BREAKPOINT = 768

/**
 * Custom React hook to determine if the current viewport width 
 * is less than the defined mobile breakpoint (768px).
 * * It handles the initial server/client mismatch by returning 
 * 'undefined' initially and then updating on mount.
 * * @returns {boolean} True if the screen is mobile size, false otherwise.
 */
export function useIsMobile(): boolean {
  // ⭐ IMPROVEMENT 1: Initialize state to false or undefined to prevent hydration mismatch.
  // We use false here to default to the desktop layout until the client mounts.
  const [isMobile, setIsMobile] = React.useState(false); 

  React.useEffect(() => {
    // We only execute client-side code here
    
    // ⭐ IMPROVEMENT 2: Use window.matchMedia for performance and standardized checking.
    // The query checks for screens *less than* the breakpoint.
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    // Handler function to update state based on the query result
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
    };

    // Set initial value
    handleChange(mediaQuery);

    // Attach listener for changes
    // Add compatibility check for older browsers (though less common now)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      // Fallback for Safari, older browsers
      mediaQuery.addListener(handleChange);
    }
    
    // Cleanup function
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []); // Empty dependency array ensures it only runs on mount and unmount

  // Return the current state
  return isMobile;
}