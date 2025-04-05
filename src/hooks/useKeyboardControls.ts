import { useState, useEffect } from 'react';

interface KeyControls {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  nitro: boolean;
}

// Initial state for keyboard controls
const initialState: KeyControls = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  nitro: false,
};

// Global key state that can be accessed from anywhere
let keyState = { ...initialState };

// Update key state
export const updateKeyState = (update: Partial<KeyControls>) => {
  keyState = { ...keyState, ...update };
  
  // Add to window global for debugging
  if (typeof window !== 'undefined') {
    window.__KEYS__ = keyState;
  }
};

// Get current key state
export const getKeyState = (): KeyControls => keyState;

// Hook to use keyboard controls
export const useKeyboardControls = () => {
  const [keys, setKeys] = useState<KeyControls>(initialState);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          updateKeyState({ forward: true });
          break;
        case 'KeyS':
        case 'ArrowDown':
          updateKeyState({ backward: true });
          break;
        case 'KeyA':
        case 'ArrowLeft':
          updateKeyState({ left: true });
          break;
        case 'KeyD':
        case 'ArrowRight':
          updateKeyState({ right: true });
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          updateKeyState({ nitro: true });
          break;
      }

      setKeys(getKeyState());
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          updateKeyState({ forward: false });
          break;
        case 'KeyS':
        case 'ArrowDown':
          updateKeyState({ backward: false });
          break;
        case 'KeyA':
        case 'ArrowLeft':
          updateKeyState({ left: false });
          break;
        case 'KeyD':
        case 'ArrowRight':
          updateKeyState({ right: false });
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          updateKeyState({ nitro: false });
          break;
      }

      setKeys(getKeyState());
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return keys;
};
