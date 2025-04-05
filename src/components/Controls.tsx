import React, { useEffect, useState } from 'react';
import { updateKeyState, getKeyState } from '../hooks/useKeyboardControls';

// Create a custom event system that works across different browsers
const KEYS = {
  forward: { keyboard: ['w', 'ArrowUp'] },
  backward: { keyboard: ['s', 'ArrowDown'] },
  left: { keyboard: ['a', 'ArrowLeft'] },
  right: { keyboard: ['d', 'ArrowRight'] },
  nitro: { keyboard: ['Shift'] },
};

// Setup a global store for key states
type KeyState = {
  [key: string]: boolean;
};

// We'll use a global variable to store key states
// This will be read by the car control hook
declare global {
  interface Window {
    __KEYS__: KeyState;
  }
}

if (typeof window !== 'undefined') {
  window.__KEYS__ = window.__KEYS__ || {};
}

const Controls = () => {
  const [showHelp, setShowHelp] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeKeys, setActiveKeys] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    nitro: false
  });

  useEffect(() => {
    console.log('Controls component mounted');
    
    // Set up direct keyboard events for the document
    const handleKeyDownDirect = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'w' || e.key === 'ArrowUp') {
        updateKeyState({ forward: true });
      }
      if (e.key.toLowerCase() === 's' || e.key === 'ArrowDown') {
        updateKeyState({ backward: true });
      }
      if (e.key.toLowerCase() === 'a' || e.key === 'ArrowLeft') {
        updateKeyState({ left: true });
      }
      if (e.key.toLowerCase() === 'd' || e.key === 'ArrowRight') {
        updateKeyState({ right: true });
      }
      if (e.key === 'Shift') {
        updateKeyState({ nitro: true });
      }
    };
    
    const handleKeyUpDirect = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'w' || e.key === 'ArrowUp') {
        updateKeyState({ forward: false });
      }
      if (e.key.toLowerCase() === 's' || e.key === 'ArrowDown') {
        updateKeyState({ backward: false });
      }
      if (e.key.toLowerCase() === 'a' || e.key === 'ArrowLeft') {
        updateKeyState({ left: false });
      }
      if (e.key.toLowerCase() === 'd' || e.key === 'ArrowRight') {
        updateKeyState({ right: false });
      }
      if (e.key === 'Shift') {
        updateKeyState({ nitro: false });
      }
    };
    
    document.addEventListener('keydown', handleKeyDownDirect);
    document.addEventListener('keyup', handleKeyUpDirect);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDownDirect);
      document.removeEventListener('keyup', handleKeyUpDirect);
    };
  }, []);

  // Monitor keyboard state
  useEffect(() => {
    const intervalId = setInterval(() => {
      const keyState = getKeyState();
      setActiveKeys({
        forward: keyState.forward,
        backward: keyState.backward,
        left: keyState.left,
        right: keyState.right,
        nitro: keyState.nitro
      });
    }, 16); // Faster updates for more responsive UI
    
    return () => clearInterval(intervalId);
  }, []);

  // Detect if we're on a mobile device
  useEffect(() => {
    const checkMobile = () => {
      // More comprehensive mobile detection
      const isMobileDevice = 
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
        (window.innerWidth <= 768) ||
        ('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0);
      
      console.log('Is mobile device:', isMobileDevice);
      setIsMobile(isMobileDevice);
      
      // Force enable mobile controls if on a small screen
      if (window.innerWidth <= 1024) {
        setIsMobile(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Show mobile controls immediately on page load for touch devices
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      setIsMobile(true);
    }
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mobile touch controls - update the global key state
  const handleTouchStart = (direction: keyof typeof KEYS) => {
    console.log('Touch start:', direction);
    
    // Update local state for visual feedback
    setActiveKeys(prev => ({ ...prev, [direction]: true }));
    
    // Update the global key state
    if (direction === 'forward') updateKeyState({ forward: true });
    if (direction === 'backward') updateKeyState({ backward: true });
    if (direction === 'left') updateKeyState({ left: true });
    if (direction === 'right') updateKeyState({ right: true });
    if (direction === 'nitro') updateKeyState({ nitro: true });
  };

  const handleTouchEnd = (direction: keyof typeof KEYS) => {
    console.log('Touch end:', direction);
    
    // Update local state for visual feedback
    setActiveKeys(prev => ({ ...prev, [direction]: false }));
    
    // Update the global key state
    if (direction === 'forward') updateKeyState({ forward: false });
    if (direction === 'backward') updateKeyState({ backward: false });
    if (direction === 'left') updateKeyState({ left: false });
    if (direction === 'right') updateKeyState({ right: false });
    if (direction === 'nitro') updateKeyState({ nitro: false });
  };

  const getButtonStyle = (direction: keyof typeof KEYS) => {
    const isActive = activeKeys[direction];
    return {
      backgroundColor: isActive ? 'rgba(255, 0, 0, 0.6)' : 'rgba(40, 0, 0, 0.8)',
      color: '#ff8866',
      width: window.innerWidth <= 480 ? '65px' : '70px',
      height: window.innerWidth <= 480 ? '65px' : '70px',
      border: isActive ? '3px solid #ff3300' : '2px solid #aa3300',
      borderRadius: '8px',
      fontSize: window.innerWidth <= 480 ? '24px' : '28px',
      fontWeight: 'bold',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      cursor: 'pointer',
      transition: 'all 0.1s ease',
      transform: isActive ? 'scale(1.1)' : 'scale(1)',
      boxShadow: isActive ? '0 0 15px rgba(255, 0, 0, 0.8)' : '0 0 10px rgba(255, 0, 0, 0.3)',
      userSelect: 'none',
      WebkitTouchCallout: 'none',
      touchAction: 'manipulation',
      textShadow: '0 0 5px #ff0000',
      pointerEvents: 'auto',
    } as React.CSSProperties;
  };

  return (
    <div className="controls-container">
      {showHelp && (
        <div className="controls-help" onClick={() => setShowHelp(false)}>
          <h3>Controls</h3>
          <p>Keyboard controls:</p>
          <ul>
            <li>W / Up Arrow: Move forward</li>
            <li>S / Down Arrow: Move backward</li>
            <li>A / Left Arrow: Turn left</li>
            <li>D / Right Arrow: Turn right</li>
            <li>Shift: Nitro boost (hold while driving)</li>
          </ul>
          {isMobile && (
            <>
              <p>Touch controls:</p>
              <p>Use the buttons at the bottom of the screen to drive.</p>
              <p>Tap the "NITRO" button for speed boost.</p>
            </>
          )}
          <p className="small">(Click anywhere to close this)</p>
        </div>
      )}

      <button className="help-button" onClick={() => setShowHelp(true)}>
        ?
      </button>

      {/* Touch controls - only shown on mobile devices */}
      {isMobile && (
        <div style={{
          position: 'absolute',
          bottom: window.innerWidth <= 480 ? '40px' : '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pointerEvents: 'auto',
          gap: '10px',
          opacity: 1,
          visibility: 'visible',
          zIndex: 30,
        }}>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              style={getButtonStyle('forward')}
              onTouchStart={() => handleTouchStart('forward')}
              onTouchEnd={() => handleTouchEnd('forward')}
              onMouseDown={() => handleTouchStart('forward')}
              onMouseUp={() => handleTouchEnd('forward')}
              onTouchCancel={() => handleTouchEnd('forward')}
              onMouseLeave={() => handleTouchEnd('forward')}
            >
              ↑
            </button>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              style={getButtonStyle('left')}
              onTouchStart={() => handleTouchStart('left')}
              onTouchEnd={() => handleTouchEnd('left')}
              onMouseDown={() => handleTouchStart('left')}
              onMouseUp={() => handleTouchEnd('left')}
              onTouchCancel={() => handleTouchEnd('left')}
              onMouseLeave={() => handleTouchEnd('left')}
            >
              ←
            </button>
            <button
              style={getButtonStyle('backward')}
              onTouchStart={() => handleTouchStart('backward')}
              onTouchEnd={() => handleTouchEnd('backward')}
              onMouseDown={() => handleTouchStart('backward')}
              onMouseUp={() => handleTouchEnd('backward')}
              onTouchCancel={() => handleTouchEnd('backward')}
              onMouseLeave={() => handleTouchEnd('backward')}
            >
              ↓
            </button>
            <button
              style={getButtonStyle('right')}
              onTouchStart={() => handleTouchStart('right')}
              onTouchEnd={() => handleTouchEnd('right')}
              onMouseDown={() => handleTouchStart('right')}
              onMouseUp={() => handleTouchEnd('right')}
              onTouchCancel={() => handleTouchEnd('right')}
              onMouseLeave={() => handleTouchEnd('right')}
            >
              →
            </button>
          </div>
          <div style={{ 
            marginTop: window.innerWidth <= 480 ? '-5px' : '0px', 
            display: 'flex', 
            justifyContent: 'center' 
          }}>
            <button
              style={{
                ...getButtonStyle('nitro'),
                width: window.innerWidth <= 480 ? '100px' : '120px',
                backgroundColor: activeKeys.nitro ? 'rgba(255, 0, 0, 0.7)' : 'rgba(40, 0, 0, 0.8)',
              }}
              onTouchStart={() => handleTouchStart('nitro')}
              onTouchEnd={() => handleTouchEnd('nitro')}
              onMouseDown={() => handleTouchStart('nitro')}
              onMouseUp={() => handleTouchEnd('nitro')}
              onTouchCancel={() => handleTouchEnd('nitro')}
              onMouseLeave={() => handleTouchEnd('nitro')}
            >
              NITRO
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Controls;
