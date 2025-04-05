import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  progress?: number;
}

const LoadingScreen = ({ progress: initialProgress }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(initialProgress || 0);
  
  useEffect(() => {
    console.log('LoadingScreen mounted');
    
    // If progress prop is provided, use it directly
    if (initialProgress !== undefined) {
      setProgress(initialProgress);
      return;
    }
    
    // Otherwise, animate progress automatically
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        const newProgress = prevProgress + Math.random() * 10;
        const finalProgress = newProgress > 100 ? 100 : newProgress;
        console.log('Loading progress:', finalProgress.toFixed(0) + '%');
        return finalProgress;
      });
    }, 200);

    return () => {
      console.log('LoadingScreen unmounting');
      clearInterval(interval);
    }
  }, [initialProgress]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#070b1a', // Updated to match horror theme
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        pointerEvents: 'none',
        opacity: progress < 100 ? 1 : 0,
        transition: 'opacity 0.5s ease-out',
      }}
    >
      <div
        style={{
          width: '300px',
          height: '50px',
          border: '2px solid rgba(255, 0, 0, 0.5)', // Updated to horror theme
          borderRadius: '25px',
          overflow: 'hidden',
          position: 'relative',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            backgroundColor: 'rgba(255, 0, 0, 0.3)', // Updated to horror theme
            transition: 'width 0.2s ease-in-out',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#ff8866', // Updated to horror theme
            fontWeight: 'bold',
            textShadow: '0 0 5px #ff0000', // Added for horror effect
          }}
        >
          LOADING... {Math.floor(progress)}%
        </div>
      </div>
      
      <div style={{ 
        marginTop: '20px',
        color: '#ff8866', // Updated to horror theme 
        fontSize: '16px',
        fontWeight: 'bold',
        textAlign: 'center',
        textShadow: '0 0 8px #ff0000' // Added for horror effect
      }}>
PIXEL RACER 
        <div style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          color: 'rgb(250, 250, 250)', // Faded horror theme color
          fontSize: '15px',
          fontStyle: 'italic'
        }}>
          created by vishal dubey
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
