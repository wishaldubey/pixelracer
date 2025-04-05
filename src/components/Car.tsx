import React, { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Vector3 } from 'three'
import { getKeyState } from '../hooks/useKeyboardControls'

// Constants for car physics
const FORWARD_FORCE = 200000 // Increased for better forward movement
const BACKWARD_FORCE = -120000 // Increased for better backward movement
const TURN_STRENGTH = 2.2
const MAX_STEER_ANGLE = Math.PI / 4 // 45 degrees
const BRAKE_STRENGTH = 0.9
const MAX_WHEEL_ROTATION = Math.PI / 3

// Movement smoothing values
const ACCELERATION_SMOOTHING = 0.25 // How quickly the car accelerates to full speed
const STEERING_SMOOTHING = 0.15 // How quickly the steering responds
const SLOWDOWN_FACTOR = 0.98 // Car slowdown when no input

// Nitro boost multiplier
const NITRO_MULTIPLIER = 2.0
const NITRO_PARTICLES_DURATION = 0.3

// Colors for the car
const BODY_COLOR = '#ff3333'
const WINDOW_COLOR = '#9ecfff'
const WHEEL_COLOR = '#323436'
const NITRO_COLOR = '#f28d00'
const HEADLIGHT_COLOR = '#ffffff'
const TAILLIGHT_COLOR = '#ff2200'
const GRILL_COLOR = '#111111'
const BUMPER_COLOR = '#222222'
const INTERIOR_COLOR = '#222222'
const SEAT_COLOR = '#111111'
const EXHAUST_COLOR = '#444444'
const UNDERBODY_COLOR = '#111111'

interface CarProps {
  carRef?: React.MutableRefObject<THREE.Object3D | null>;
}

export default function Car({ carRef }: CarProps = {}) {
  const chassisRef = useRef<THREE.Group>(null)
  const wheelRefs = useRef<Array<THREE.Group | null>>([null, null, null, null])
  
  // Wheel rotation for visuals
  const wheelRotation = useRef(0)
  const steeringAngle = useRef(0)
  const currentSpeed = useRef(0)
  const nitroActive = useRef(false)
  const nitroParticlesTime = useRef(0)
  
  // Pass the chassis ref to the carRef from App.tsx
  useEffect(() => {
    if (chassisRef.current && carRef) {
      carRef.current = chassisRef.current
      console.log('Car chassis ref passed to App')
    }
  }, [chassisRef.current, carRef])
  
  useFrame((state, delta) => {
    if (!chassisRef.current) return
    
    // Get input state from keyboard controls
    const keys = getKeyState()
    const forward = keys.forward
    const backward = keys.backward
    const left = keys.left
    const right = keys.right
    const shiftKey = keys.nitro

    // Update nitro state
    nitroActive.current = forward && shiftKey
    
    // Calculate nitro multiplier
    const speedMultiplier = nitroActive.current ? NITRO_MULTIPLIER : 1.0
    
    // Update nitro particles timer
    if (nitroActive.current) {
      nitroParticlesTime.current = NITRO_PARTICLES_DURATION
    } else {
      nitroParticlesTime.current = Math.max(0, nitroParticlesTime.current - delta)
    }
    
    // Get car's current rotation
    const carRotation = chassisRef.current.rotation.clone()
    
    // Convert to a unit vector pointing in car's forward direction
    const forwardDir = new Vector3(0, 0, 1).applyEuler(carRotation)
    
    // Calculate next position for collision detection
    const currentPos = chassisRef.current.position.clone();
    let nextPos = currentPos.clone();
    
    // Move car forward/backward
    if (forward) {
      const moveVector = forwardDir.clone().multiplyScalar(FORWARD_FORCE * delta * 0.0001 * speedMultiplier);
      nextPos.add(moveVector);
    }
    
    if (backward) {
      const moveVector = forwardDir.clone().multiplyScalar(BACKWARD_FORCE * delta * 0.0001);
      nextPos.add(moveVector);
    }
    
    // Ensure car's Y position is always at the right height
    chassisRef.current.position.y = 0.5; // Keep car at correct height
    
    // Perform collision detection using raycasting
    // We'll use multiple raycasts for better collision detection
    const scene = chassisRef.current.parent;
    if (scene) {
      const collisionDistance = 1.8; // Distance to check for collisions
      const rayDirection = nextPos.clone().sub(currentPos).normalize();
      
      // Create multiple raycasters for better coverage
      const raycasters = [
        // Front center raycast
        new THREE.Raycaster(
          currentPos.clone().add(new Vector3(0, 0.5, 0).add(forwardDir.clone().multiplyScalar(1.0))),
          rayDirection,
          0,
          collisionDistance
        ),
        // Front left raycast
        new THREE.Raycaster(
          currentPos.clone().add(new Vector3(0.6, 0.5, 0).add(forwardDir.clone().multiplyScalar(1.0))),
          rayDirection,
          0,
          collisionDistance
        ),
        // Front right raycast
        new THREE.Raycaster(
          currentPos.clone().add(new Vector3(-0.6, 0.5, 0).add(forwardDir.clone().multiplyScalar(1.0))),
          rayDirection,
          0,
          collisionDistance
        )
      ];
      
      // Get all objects in the scene that are marked as collidable
      const collidableObjects: THREE.Object3D[] = [];
      scene.traverse((child) => {
        if (child !== chassisRef.current && 
            child.userData?.type === 'collidable' &&
            // Ignore anything below y=-0.3 (roads and ground)
            child.position.y > -0.3) {
          collidableObjects.push(child);
        }
      });
      
      // Check for collisions from all raycasters
      let collisionDetected = false;
      let collisionPoint: THREE.Vector3 | null = null;
      
      for (const raycaster of raycasters) {
        const intersects = raycaster.intersectObjects(collidableObjects, true);
        if (intersects.length > 0) {
          // Make sure it's not a road or ground plane (roads are at y=-0.35, ground at y=-0.45)
          if (intersects[0].point.y > -0.3) {
            collisionDetected = true;
            collisionPoint = intersects[0].point;
            console.log("Collision detected with:", intersects[0].object.parent?.userData?.type || intersects[0].object.userData?.type || "unknown");
            break;
          }
        }
      }
      
      // If no collision, update position
      if (!collisionDetected) {
        if (forward) {
          // Direct position update for forward movement
          chassisRef.current.position.x += forwardDir.x * FORWARD_FORCE * delta * 0.0001 * speedMultiplier;
          chassisRef.current.position.z += forwardDir.z * FORWARD_FORCE * delta * 0.0001 * speedMultiplier;
          currentSpeed.current = 8 * speedMultiplier;
        }
        
        if (backward) {
          // Direct position update for backward movement
          chassisRef.current.position.x += forwardDir.x * BACKWARD_FORCE * delta * 0.0001;
          chassisRef.current.position.z += forwardDir.z * BACKWARD_FORCE * delta * 0.0001;
          currentSpeed.current = -5;
        }
        
        // Apply speed decay when no input
        if (!forward && !backward) {
          currentSpeed.current *= SLOWDOWN_FACTOR;
        }
      } else {
        // Collision detected - slow down and bounce back
        currentSpeed.current *= 0.3;
        
        // Add significant bounce-back effect
        if (collisionPoint) {
          const bounceDirection = currentPos.clone().sub(collisionPoint).normalize();
          // Only apply bounce in XZ plane, not Y
          bounceDirection.y = 0;
          bounceDirection.normalize();
          chassisRef.current.position.add(bounceDirection.multiplyScalar(0.3));
        }
      }
      
      // Force car Y position to remain constant
      chassisRef.current.position.y = 0.5;
    }
    
    // Only turn if we have some speed
    if (Math.abs(currentSpeed.current) > 0.1) {
      // Calculate steering angle
      let targetSteerAngle = 0
      
      if (left) targetSteerAngle = MAX_STEER_ANGLE
      if (right) targetSteerAngle = -MAX_STEER_ANGLE
      
      // Smoothly interpolate steering angle
      steeringAngle.current += (targetSteerAngle - steeringAngle.current) * STEERING_SMOOTHING
      
      // Apply more torque at lower speeds for better handling
      const turnMultiplier = Math.max(1.0, 3.0 - Math.abs(currentSpeed.current) / 5)
      
      // Apply steering to the car rotation
      if (Math.abs(steeringAngle.current) > 0.01) {
        chassisRef.current.rotation.y += steeringAngle.current * TURN_STRENGTH * turnMultiplier * delta * (currentSpeed.current > 0 ? 1 : -1)
      }
        } else {
      // Reset steering angle when stopped
      steeringAngle.current *= 0.9
    }
    
    // Update wheel visuals
    if (wheelRefs.current[0]) {
      // Update wheel rotation for rolling motion
      wheelRotation.current -= currentSpeed.current * delta * 3;
      
      // Front wheels - steering (index 0 and 1)
      for (let i = 0; i < 2; i++) {
        const wheel = wheelRefs.current[i];
        if (wheel) {
          // Reset rotation first
          wheel.rotation.set(0, steeringAngle.current, 0);
          
          // Apply rolling on the correct axis
          const wheelMesh = wheel.children[0] as THREE.Mesh;
          if (wheelMesh) {
            // Orient for side-mounted wheels and apply rolling
            wheelMesh.rotation.set(wheelRotation.current, 0, Math.PI / 2);
          }
        }
      }
      
      // Back wheels - no steering (index 2 and 3)
      for (let i = 2; i < 4; i++) {
        const wheel = wheelRefs.current[i];
        if (wheel) {
          // Back wheels don't steer
          wheel.rotation.set(0, 0, 0);
          
          // Apply rolling on the correct axis
          const wheelMesh = wheel.children[0] as THREE.Mesh;
          if (wheelMesh) {
            // Orient for side-mounted wheels and apply rolling
            wheelMesh.rotation.set(wheelRotation.current, 0, Math.PI / 2);
          }
        }
      }
    }
  })

  return (
    <group position={[0, 0.5, 0]} ref={chassisRef}>
      {/* Car body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.8, 0.6, 4]} />
        <meshStandardMaterial color={BODY_COLOR} metalness={0.6} roughness={0.4} />
      </mesh>
      
      {/* Car roof/cabin */}
      <mesh castShadow receiveShadow position={[0, 0.7, 0.2]}>
        <boxGeometry args={[1.7, 0.6, 2.2]} />
        <meshStandardMaterial color={BODY_COLOR} metalness={0.6} roughness={0.4} />
      </mesh>
      
      {/* Front windshield */}
      <mesh castShadow receiveShadow position={[0, 0.7, 1.4]} rotation={[Math.PI / 6, 0, 0]}>
        <planeGeometry args={[1.5, 0.8]} />
        <meshStandardMaterial color={WINDOW_COLOR} metalness={0.9} roughness={0.1} transparent opacity={0.7} />
      </mesh>
      
      {/* Rear windshield */}
      <mesh castShadow receiveShadow position={[0, 0.7, -1.0]} rotation={[-Math.PI / 6, 0, 0]}>
        <planeGeometry args={[1.5, 0.8]} />
        <meshStandardMaterial color={WINDOW_COLOR} metalness={0.9} roughness={0.1} transparent opacity={0.7} />
      </mesh>
      
      {/* Left window */}
      <mesh castShadow receiveShadow position={[0.9, 0.7, 0.2]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[2.0, 0.5]} />
        <meshStandardMaterial color={WINDOW_COLOR} metalness={0.9} roughness={0.1} transparent opacity={0.7} />
      </mesh>
      
      {/* Right window */}
      <mesh castShadow receiveShadow position={[-0.9, 0.7, 0.2]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[2.0, 0.5]} />
        <meshStandardMaterial color={WINDOW_COLOR} metalness={0.9} roughness={0.1} transparent opacity={0.7} />
      </mesh>
      
      {/* Front grill */}
      <mesh castShadow receiveShadow position={[0, 0.1, 2.0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[1.6, 0.3, 0.1]} />
        <meshStandardMaterial color={GRILL_COLOR} metalness={0.5} roughness={0.5} />
      </mesh>
      
      {/* Front bumper */}
      <mesh castShadow receiveShadow position={[0, -0.1, 2.0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[1.8, 0.2, 0.2]} />
        <meshStandardMaterial color={BUMPER_COLOR} metalness={0.6} roughness={0.4} />
      </mesh>
      
      {/* Rear bumper */}
      <mesh castShadow receiveShadow position={[0, -0.1, -1.9]} rotation={[0, 0, 0]}>
        <boxGeometry args={[1.8, 0.2, 0.2]} />
        <meshStandardMaterial color={BUMPER_COLOR} metalness={0.6} roughness={0.4} />
      </mesh>
      
      {/* Hood detail */}
      <mesh castShadow receiveShadow position={[0, 0.3, 1.2]} rotation={[0, 0, 0]}>
        <boxGeometry args={[1.6, 0.01, 1.0]} />
        <meshStandardMaterial color="#000000" metalness={0.4} roughness={0.6} transparent opacity={0.2} />
      </mesh>
      
      {/* Left headlight */}
      <mesh castShadow receiveShadow position={[0.6, 0.2, 2.0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.05, 16]} />
        <meshStandardMaterial color={HEADLIGHT_COLOR} emissive={HEADLIGHT_COLOR} emissiveIntensity={0.8} />
      </mesh>
      
      {/* Right headlight */}
      <mesh castShadow receiveShadow position={[-0.6, 0.2, 2.0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.05, 16]} />
        <meshStandardMaterial color={HEADLIGHT_COLOR} emissive={HEADLIGHT_COLOR} emissiveIntensity={0.8} />
      </mesh>
      
      {/* Left taillight */}
      <mesh castShadow receiveShadow position={[0.6, 0.2, -2.0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.3, 0.15, 0.05]} />
        <meshStandardMaterial color={TAILLIGHT_COLOR} emissive={TAILLIGHT_COLOR} emissiveIntensity={0.6} />
      </mesh>
      
      {/* Right taillight */}
      <mesh castShadow receiveShadow position={[-0.6, 0.2, -2.0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.3, 0.15, 0.05]} />
        <meshStandardMaterial color={TAILLIGHT_COLOR} emissive={TAILLIGHT_COLOR} emissiveIntensity={0.6} />
      </mesh>
      
      {/* Car interior - dashboard */}
      <mesh castShadow receiveShadow position={[0, 0.4, 0.7]}>
        <boxGeometry args={[1.5, 0.1, 0.5]} />
        <meshStandardMaterial color={INTERIOR_COLOR} roughness={0.9} />
      </mesh>
      
      {/* Steering wheel */}
      <mesh castShadow receiveShadow position={[0.5, 0.5, 0.7]} rotation={[Math.PI/2, 0, 0]}>
        <torusGeometry args={[0.15, 0.03, 8, 16]} />
        <meshStandardMaterial color="#111111" roughness={0.8} />
      </mesh>
      
      {/* Driver's seat */}
      <mesh castShadow receiveShadow position={[0.5, 0.3, 0.3]}>
        <boxGeometry args={[0.6, 0.5, 0.6]} />
        <meshStandardMaterial color={SEAT_COLOR} roughness={0.9} />
      </mesh>

      {/* Passenger seat */}
      <mesh castShadow receiveShadow position={[-0.5, 0.3, 0.3]}>
        <boxGeometry args={[0.6, 0.5, 0.6]} />
        <meshStandardMaterial color={SEAT_COLOR} roughness={0.9} />
      </mesh>

      {/* Exhaust pipe */}
      <group position={[0.6, -0.15, -2.0]} rotation={[0, Math.PI/2, 0]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.3, 8]} />
          <meshStandardMaterial color={EXHAUST_COLOR} metalness={0.7} roughness={0.3} />
        </mesh>
      </group>

      {/* Underbody detail */}
      <mesh castShadow receiveShadow position={[0, -0.25, 0]}>
        <boxGeometry args={[1.4, 0.1, 3.6]} />
        <meshStandardMaterial color={UNDERBODY_COLOR} roughness={0.8} />
      </mesh>

      {/* Nitro particles effect - only shown when active */}
      {nitroParticlesTime.current > 0 && (
        <group position={[0, 0, -2.2]} rotation={[Math.PI, 0, 0]}>
          <mesh>
            <coneGeometry args={[0.2, 1, 8]} />
            <meshBasicMaterial color={NITRO_COLOR} transparent opacity={0.7} />
          </mesh>
        </group>
      )}
      
      {/* Wheels */}
      <group ref={(el) => (wheelRefs.current[0] = el)} position={[0.8, -0.2, 1.2]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.35, 0.35, 0.3, 16]} />
          <meshStandardMaterial color={WHEEL_COLOR} roughness={0.7} />
        </mesh>
        {/* Wheel hub caps */}
        <mesh position={[0, 0, 0.16]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.01, 8]} />
          <meshStandardMaterial color="#777777" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Wheel spokes */}
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[0, 0, 0.15]} rotation={[0, 0, (i / 5) * Math.PI * 2]}>
            <boxGeometry args={[0.3, 0.05, 0.01]} />
            <meshStandardMaterial color="#777777" metalness={0.8} roughness={0.2} />
          </mesh>
        ))}
      </group>

      <group ref={(el) => (wheelRefs.current[1] = el)} position={[-0.8, -0.2, 1.2]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.35, 0.35, 0.3, 16]} />
          <meshStandardMaterial color={WHEEL_COLOR} roughness={0.7} />
        </mesh>
        {/* Wheel hub caps */}
        <mesh position={[0, 0, -0.16]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.01, 8]} />
          <meshStandardMaterial color="#777777" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Wheel spokes */}
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[0, 0, -0.15]} rotation={[0, 0, (i / 5) * Math.PI * 2]}>
            <boxGeometry args={[0.3, 0.05, 0.01]} />
            <meshStandardMaterial color="#777777" metalness={0.8} roughness={0.2} />
          </mesh>
        ))}
      </group>

      <group ref={(el) => (wheelRefs.current[2] = el)} position={[0.8, -0.2, -1.2]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.35, 0.35, 0.3, 16]} />
          <meshStandardMaterial color={WHEEL_COLOR} roughness={0.7} />
        </mesh>
        {/* Wheel hub caps */}
        <mesh position={[0, 0, 0.16]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.01, 8]} />
          <meshStandardMaterial color="#777777" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Wheel spokes */}
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[0, 0, 0.15]} rotation={[0, 0, (i / 5) * Math.PI * 2]}>
            <boxGeometry args={[0.3, 0.05, 0.01]} />
            <meshStandardMaterial color="#777777" metalness={0.8} roughness={0.2} />
          </mesh>
        ))}
      </group>

      <group ref={(el) => (wheelRefs.current[3] = el)} position={[-0.8, -0.2, -1.2]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.35, 0.35, 0.3, 16]} />
          <meshStandardMaterial color={WHEEL_COLOR} roughness={0.7} />
      </mesh>
        {/* Wheel hub caps */}
        <mesh position={[0, 0, -0.16]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.01, 8]} />
          <meshStandardMaterial color="#777777" metalness={0.8} roughness={0.2} />
      </mesh>
        {/* Wheel spokes */}
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[0, 0, -0.15]} rotation={[0, 0, (i / 5) * Math.PI * 2]}>
            <boxGeometry args={[0.3, 0.05, 0.01]} />
            <meshStandardMaterial color="#777777" metalness={0.8} roughness={0.2} />
      </mesh>
        ))}
      </group>
    </group>
  )
}
