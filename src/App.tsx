import React, { useEffect, useState, Suspense, useRef, MutableRefObject } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { PerspectiveCamera, Stats } from '@react-three/drei'
import './App.css'
import Scene from './components/Scene'
import LoadingScreen from './components/LoadingScreen'
import Controls from './components/Controls'
import { Object3D, Vector3 } from 'three'
import * as THREE from 'three'

// Increase this value to update animation more frequently
const ANIMATION_FRAME_RATE = 1 / 120; 

const PHYSICS_STEP_FREQ = 1 / 120; // More frequent physics updates

interface CameraControllerProps {
  target: MutableRefObject<Object3D | null>;
}

// Camera controller that follows the car
const CameraController = ({ target }: CameraControllerProps) => {
  const { camera } = useThree();
  const cameraPositionRef = useRef(new Vector3(0, 10, 15));
  const targetPositionRef = useRef(new Vector3(0, 0, 0));

  // Use useFrame for smoother camera following
  useFrame(() => {
    if (!target.current) return;
    
    const targetPosition = target.current.position.clone();
    targetPositionRef.current.lerp(targetPosition, 0.3);
    
    const targetRotation = target.current.rotation;

    // Position camera behind and higher above car
    const distanceBehind = 5;
    const heightAbove = 3;

    // Calculate position behind car based on car's rotation
    const angle = targetRotation.y;
    const x = targetPositionRef.current.x - Math.sin(angle) * distanceBehind;
    const z = targetPositionRef.current.z - Math.cos(angle) * distanceBehind;
    
    // Smoothly lerp to new camera position
    cameraPositionRef.current.set(x, targetPositionRef.current.y + heightAbove, z);
    camera.position.lerp(cameraPositionRef.current, 0.4);
    
    // Look at the target - use direct position for immediate look response
    camera.lookAt(
      target.current.position.x, 
      target.current.position.y + 1, 
      target.current.position.z
    );
  });

  useEffect(() => {
    console.log('CameraController mounted');
    
    if (!target.current) {
      console.warn('Target ref is not yet available');
      return;
    }

    console.log('Target ref available:', target.current);
    
    // Initial camera position
    if (target.current) {
      targetPositionRef.current.copy(target.current.position);
      console.log('Initial camera position set');
    }
  }, [camera, target]);

  return null;
};

// Check if WebGL is supported
const isWebGLSupported = (): boolean => {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
};

// Fallback component when WebGL is not supported
const WebGLNotSupported = () => (
  <div className="webgl-error">
    <h2>WebGL Not Supported</h2>
    <p>Your browser or device doesn't seem to support WebGL, which is required for this 3D experience.</p>
    <p>Try using a modern browser like Chrome, Firefox, or Edge.</p>
  </div>
);

// Simple error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean, errorMessage: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error in 3D rendering:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h2>Something went wrong with the 3D rendering</h2>
          <p>Error details: {this.state.errorMessage}</p>
          <button onClick={() => window.location.reload()}>Try Again</button>
          <p>If this issue persists, try using a different browser or device.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// Safely load Three.js dependencies
const ThreeJSCanvas = ({ children }: { children: React.ReactNode }) => {
  const [isThreeJSLoaded, setIsThreeJSLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    console.log('ThreeJSCanvas: Loading Three.js');
    
    // Force dynamic import of Three.js to ensure it's properly loaded
    const loadThreeJS = async () => {
      try {
        await import('three');
        console.log('Three.js loaded successfully');
        setIsThreeJSLoaded(true);
      } catch (error) {
        console.error("Failed to load Three.js:", error);
        setLoadFailed(true);
      }
    };

    loadThreeJS();
  }, []);

  if (loadFailed) {
    return <div className="error-container">Failed to load 3D engine. Please refresh or try a different browser.</div>;
  }

  if (!isThreeJSLoaded) {
    return <div className="loading">Loading 3D engine...</div>;
  }

  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
};

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [webGLSupported, setWebGLSupported] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const carRef = useRef<Object3D | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [carLoaded, setCarLoaded] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    console.log('App component mounted');
    
    // Set viewport meta tag for mobile devices
    const setViewportMeta = () => {
      let viewport = document.querySelector('meta[name="viewport"]');
      if (!viewport) {
        viewport = document.createElement('meta');
        viewport.setAttribute('name', 'viewport');
        document.head.appendChild(viewport);
      }
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    };
    
    // Detect mobile devices
    const checkMobile = () => {
      const isMobileDevice = 
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
        (window.innerWidth <= 768) ||
        ('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0);
      
      setIsMobile(isMobileDevice);
      
      // Adjust pixel ratio for better performance on mobile
      if (isMobileDevice) {
        // Lower pixel ratio for better performance on mobile
        const lowerPixelRatio = Math.min(1.5, window.devicePixelRatio);
        // Will be used when we create the canvas
        (window as any).__pixelRatio = lowerPixelRatio;
      }
    };
    
    setViewportMeta();
    checkMobile();
    
    // Check for WebGL support
    const supported = isWebGLSupported();
    console.log('WebGL supported:', supported);
    setWebGLSupported(supported);

    // Enable debug stats with 'stats' in URL
    if (window.location.href.includes('stats')) {
      setShowStats(true);
    }

    // Simulate loading time
    const timeout = setTimeout(() => {
      console.log('Loading screen timeout completed');
      setIsLoading(false)
    }, 2000) // Reduced loading time for testing

    return () => clearTimeout(timeout)
  }, [])

  // Monitor car loading status
  useEffect(() => {
    if (carRef.current) {
      console.log('Car ref is now available', carRef.current);
      setCarLoaded(true);
    }
  }, [carRef.current]);

  // Initialize Three.js
  useEffect(() => {
    if (!isLoading && !initialized) {
      console.log('Initializing Three.js scene');
      // Set a small delay to ensure everything is ready
      const initTimeout = setTimeout(() => {
        setInitialized(true)
        console.log('Scene initialized');
      }, 100)
      
      return () => clearTimeout(initTimeout)
    }
  }, [isLoading, initialized])

  // Error handling through error boundary approach
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error);
      if (event.error?.toString().includes('WebGL')) {
        console.error('WebGL Error:', event.error);
        setError('WebGL rendering error. Try refreshing or use a different browser.');
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // Enable keyboard debugging
  useEffect(() => {
    const keyDebug = (e: KeyboardEvent) => {
      if (e.key === 'D' && e.shiftKey && e.ctrlKey) {
        setShowStats(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', keyDebug);
    return () => window.removeEventListener('keydown', keyDebug);
  }, []);

  // Give focus to the canvas to ensure keyboard controls work
  useEffect(() => {
    if (!isLoading) {
      const focusCanvas = () => {
        const canvas = document.querySelector('canvas');
        if (canvas) {
          canvas.focus();
          console.log('Canvas focused for keyboard input');
        }
      };
      
      // Focus after a short delay to ensure the canvas is rendered
      setTimeout(focusCanvas, 500);
      
      // Also focus when clicking anywhere in the document
      document.addEventListener('click', focusCanvas);
      
      return () => {
        document.removeEventListener('click', focusCanvas);
      };
    }
  }, [isLoading]);

  if (!webGLSupported) {
    return <WebGLNotSupported />;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  if (isLoading) {
    return <LoadingScreen progress={0.5} />;
  }

  return (
    <ThreeJSCanvas>
      <div className="canvas-container">
        <Canvas 
          shadows
          dpr={isMobile ? Math.min(1.5, window.devicePixelRatio) : window.devicePixelRatio}
          gl={{ 
            antialias: !isMobile, // Disable antialiasing on mobile for better performance
            alpha: false, 
            stencil: false,
            powerPreference: 'high-performance',
            shadowMapType: THREE.PCFSoftShadowMap
          }}
        >
          <Suspense fallback={null}>
            <Scene carRef={carRef} />
            <CameraController target={carRef} />
            <fog attach="fog" args={['#0a1030', 40, 250]} />
            <directionalLight
              position={[10, 20, 10]}
              intensity={1.5}
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
              shadow-camera-far={100}
              shadow-camera-left={-50}
              shadow-camera-right={50}
              shadow-camera-top={50}
              shadow-camera-bottom={-50}
              shadow-bias={-0.0001}
            />
            <ambientLight intensity={0.6} />
            <hemisphereLight 
              color="#8eb2ff" 
              groundColor="#aa8855" 
              intensity={0.5} 
            />
            <PerspectiveCamera makeDefault fov={75} position={[0, 10, 15]} />
          </Suspense>
          {showStats && <Stats />}
        </Canvas>
        <Controls />
      </div>
    </ThreeJSCanvas>
  );
}

export default App;
