import React, { useState, useRef, useEffect, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { Object3D, Mesh } from 'three';
import Car from './Car';
import Environment from './Environment';

interface SceneProps {
  carRef: MutableRefObject<Object3D | null>;
  isDay?: boolean; // Optional prop to control day/night
}

const Scene: React.FC<SceneProps> = ({ carRef, isDay }) => {
  const [textureLoaded, setTextureLoaded] = useState(false);
  const [textureError, setTextureError] = useState(false);
  const groundRef = useRef<Mesh>(null);

  // Debug console message
  useEffect(() => {
    console.log('Scene component mounted');
  }, []);

  return (
    <>
      {/* Remove transparent ground plane that was causing shadow issues */}
      
      {/* Car */}
      <Car carRef={carRef} />

      {/* Environment */}
      <Environment isDay={isDay} />

      {/* Additional directional light for better shadows */}
      <directionalLight
        position={[-5, 10, -5]}
        intensity={0.5}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={50}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
      />



      {/* Instruction Text */}
      <Text
        position={[0, 3, -10]}
        color="white"
        fontSize={0.5}
        anchorX="center"
        anchorY="middle"
      >
        Use WASD or arrow keys to drive
      </Text>
    </>
  );
};

export default Scene;
