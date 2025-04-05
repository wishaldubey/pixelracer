import { useEffect } from 'react';
import { MeshStandardMaterial } from 'three';

const Environment = () => {
  // Debug console
  useEffect(() => {
    console.log('Environment component mounted');
  }, []);

  // Create enhanced materials with better visual properties
  const materialColors = {
    buildingGlass: "#9ecfff",
    treeTrunk: "#3b2913",
    treeLeaves: "#008000",
    fountainStone: "#555555",
    fountainWater: "#60B5FF",
    lampMetal: "#222222",
    lampLight: "#ffaa55"
  };

  // Create fallback materials
  const fallbackMaterials = {
    black: new MeshStandardMaterial({ color: '#333333' }),
    green: new MeshStandardMaterial({ color: '#00aa00' }),
    blue: new MeshStandardMaterial({ color: '#0055aa' }),
    orange: new MeshStandardMaterial({ color: '#ff8800' }),
  };

  // Existing coordinates of placed objects to ensure proper spacing
  const placedObjects: { x: number, z: number, radius: number }[] = [];

  // Function to check if a position is too close to the car spawn point
  const isTooCloseToSpawn = (x: number, z: number, minDistance: number = 10) => {
    // Car spawns at (0,0,0), so check distance from origin
    return Math.sqrt(x * x + z * z) < minDistance;
  };

  // Function to check if a position is too close to existing objects
  const isTooCloseToExistingObjects = (x: number, z: number, objectRadius: number, minDistance: number = 5) => {
    return placedObjects.some(obj => {
      const dx = obj.x - x;
      const dz = obj.z - z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      return distance < (obj.radius + objectRadius + minDistance);
    });
  };

  // Helper function to register a placed object
  const registerObject = (x: number, z: number, radius: number) => {
    placedObjects.push({ x, z, radius });
  };

  // Create buildings with more detailed architecture
  const createBuilding = (position: [number, number, number], size: [number, number, number], color: string) => {
    const [x, y, z] = position;
    
    // Skip if too close to spawn
    if (isTooCloseToSpawn(x, z)) {
      return null;
    }

    // Skip if too close to existing objects
    const buildingRadius = Math.max(size[0], size[2]) / 2;
    if (isTooCloseToExistingObjects(x, z, buildingRadius)) {
      return null;
    }

    // Register this building
    registerObject(x, z, buildingRadius);

    // Create a nicer building with windows and details
    return (
      <group key={`building-${x}-${z}`} position={[x, 0, z]} userData={{ type: 'collidable' }}>
        {/* Main building structure */}
        <mesh castShadow receiveShadow position={[0, y, 0]} userData={{ type: 'collidable' }}>
        <boxGeometry args={size} />
          <meshStandardMaterial color={color} />
        </mesh>
        
        {/* Windows - front side */}
        <mesh position={[0, y, size[2]/2 + 0.01]} userData={{ type: 'decorative' }}>
          <planeGeometry args={[size[0] * 0.8, size[1] * 0.8]} />
          <meshStandardMaterial 
            color={materialColors.buildingGlass}
            metalness={0.9} 
            roughness={0.1}
            transparent={true}
            opacity={0.7}
          />
        </mesh>
        
        {/* Windows - back side */}
        <mesh position={[0, y, -size[2]/2 - 0.01]} rotation={[0, Math.PI, 0]} userData={{ type: 'decorative' }}>
          <planeGeometry args={[size[0] * 0.8, size[1] * 0.8]} />
          <meshStandardMaterial 
            color={materialColors.buildingGlass}
            metalness={0.9} 
            roughness={0.1}
            transparent={true}
            opacity={0.7}
          />
        </mesh>
        
        {/* Windows - left side */}
        <mesh position={[-size[0]/2 - 0.01, y, 0]} rotation={[0, -Math.PI/2, 0]} userData={{ type: 'decorative' }}>
          <planeGeometry args={[size[2] * 0.8, size[1] * 0.8]} />
          <meshStandardMaterial 
            color={materialColors.buildingGlass}
            metalness={0.9} 
            roughness={0.1}
            transparent={true}
            opacity={0.7}
          />
        </mesh>
        
        {/* Windows - right side */}
        <mesh position={[size[0]/2 + 0.01, y, 0]} rotation={[0, Math.PI/2, 0]} userData={{ type: 'decorative' }}>
          <planeGeometry args={[size[2] * 0.8, size[1] * 0.8]} />
          <meshStandardMaterial 
            color={materialColors.buildingGlass}
            metalness={0.9} 
            roughness={0.1}
            transparent={true}
            opacity={0.7}
          />
        </mesh>
        
        {/* Roof */}
        <mesh castShadow position={[0, y + size[1]/2 + 0.05, 0]} userData={{ type: 'collidable' }}>
          <boxGeometry args={[size[0] * 1.05, 0.1, size[2] * 1.05]} />
          <meshStandardMaterial color={'#222222'} />
      </mesh>
      </group>
    );
  };

  // Create a large ground plane with better texture
  const ground = (
    <>
      {/* Main ground with sand texture and subtle height variation */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI/2, 0, 0]} receiveShadow userData={{ type: 'collidable' }}>
        <planeGeometry args={[300, 300, 100, 100]} />
        <meshStandardMaterial 
          color="#aa8855"
          roughness={0.8}
          metalness={0.1}
          displacementScale={0.2}
          displacementBias={-0.1}
          onBeforeCompile={(shader) => {
            // Add subtle noise to vertex positions for natural terrain effect
            shader.vertexShader = shader.vertexShader.replace(
              '#include <begin_vertex>',
              `
              #include <begin_vertex>
              float noise = sin(position.x * 0.03) * cos(position.y * 0.03) * 0.3;
              noise += sin(position.x * 0.08) * cos(position.y * 0.08) * 0.15;
              transformed.z += noise * 0.2;
              `
            );
          }}
        />
      </mesh>
      
      {/* Terrain texture overlay - subtle variations of sand color for depth */}
      {Array.from({ length: 180 }).map((_, i) => {
        const size = 5 + Math.random() * 15;
        const x = (Math.random() - 0.5) * 280;
        const z = (Math.random() - 0.5) * 280;
        
        // Skip areas near roads
        if (Math.abs(x) < 30 && Math.abs(z) < 30) return null;
        if (Math.sqrt(x*x + z*z) < 30) return null;
        
        // Choose subtle variations of the main sand color
        const colorChoice = Math.random();
        // Slightly darker and slightly lighter variations of the sand color
        const color = colorChoice < 0.5 
          ? "#a07e50"  // Slightly darker variation
          : "#c4a070"; // Slightly lighter variation
        
        return (
          <mesh 
            key={`terrain-detail-${i}`}
            position={[x, -0.03, z]}
            rotation={[-Math.PI/2, 0, Math.random() * Math.PI * 2]}
            receiveShadow
          >
            <planeGeometry args={[size, size]} />
            <meshStandardMaterial 
              color={color} 
              transparent={true}
              opacity={0.15 + Math.random() * 0.15} // Reduced opacity from 0.3-0.6 to 0.15-0.3
              roughness={0.9}
            />
          </mesh>
        );
      })}
      
      {/* Shadow patches for depth */}
      {Array.from({ length: 120 }).map((_, i) => {
        const size = 3 + Math.random() * 10;
        const x = (Math.random() - 0.5) * 280;
        const z = (Math.random() - 0.5) * 280;
        
        // Skip areas near roads
        if (Math.abs(x) < 30 && Math.abs(z) < 30) return null;
        if (Math.sqrt(x*x + z*z) < 30) return null;
        
        return (
          <mesh 
            key={`terrain-shadow-${i}`}
            position={[x, -0.02, z]}
            rotation={[-Math.PI/2, 0, Math.random() * Math.PI * 2]}
            receiveShadow
          >
            <planeGeometry args={[size, size]} />
            <meshStandardMaterial 
              color="#000000" 
              transparent={true}
              opacity={0.02 + Math.random() * 0.04} // Reduced opacity from 0.05-0.13 to 0.02-0.06
              roughness={1.0}
            />
          </mesh>
        );
      })}
      
      {/* Scattered small rocks and pebbles */}
      {Array.from({ length: 250 }).map((_, i) => {
        const size = 0.2 + Math.random() * 0.5;
        const x = (Math.random() - 0.5) * 280;
        const z = (Math.random() - 0.5) * 280;
        
        // Skip areas near roads
        if (Math.abs(x) < 32 && Math.abs(z) < 32) return null;
        if (Math.sqrt(x*x + z*z) < 32) return null;
        
        // Rock colors that blend with the sand
        const rockColors = [
          "#8a7854", // Dark sand
          "#b59b6f", // Light sand
          "#9a8560", // Medium sand
          "#ae9468"  // Tan
        ];
        
        return (
          <mesh 
            key={`terrain-rock-${i}`}
            position={[x, size/6, z]}
            rotation={[Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[size, size/3, size]} />
            <meshStandardMaterial 
              color={rockColors[Math.floor(Math.random() * rockColors.length)]} 
              roughness={0.9}
            />
          </mesh>
        );
      })}
      
      {/* Larger dunes/mounds for additional terrain variation */}
      {/* Completely removing the dunes that were causing issues in the sky */}
      
      {/* Large ground plane as backup */}
      <mesh position={[0, -0.5, 0]} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshBasicMaterial color="#aa8855" />
      </mesh>
    </>
  );

  // Create paths to connect different areas - virtual roads
  const paths: JSX.Element[] = [];
  
  // Main circle path around central area
  const circlePoints = 36;
  for (let i = 0; i < circlePoints; i++) {
    const angle = (i / circlePoints) * Math.PI * 2;
    const nextAngle = ((i + 1) / circlePoints) * Math.PI * 2;
    const radius = 25;
    
    const x1 = Math.sin(angle) * radius;
    const z1 = Math.cos(angle) * radius;
    const x2 = Math.sin(nextAngle) * radius;
    const z2 = Math.cos(nextAngle) * radius;
    
    const centerX = (x1 + x2) / 2;
    const centerZ = (z1 + z2) / 2;
    const segmentAngle = Math.atan2(x2 - x1, z2 - z1);
    const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(z2 - z1, 2));
    
    // Main path segment - much lighter, sand-like color with transparency
    paths.push(
      <mesh 
        key={`path-circle-${i}`} 
        position={[centerX, -0.03, centerZ]} 
        rotation={[0, segmentAngle, 0]}
      >
        <boxGeometry args={[length, 0.05, 3]} />
        <meshStandardMaterial 
          color="#997755" 
          transparent={true}
          opacity={0.5}
          roughness={0.9}
        />
      </mesh>
    );
    
    // Add path border/trim for visual interest - slightly darker than main path
    paths.push(
      <mesh 
        key={`path-circle-border-1-${i}`} 
        position={[centerX, -0.02, centerZ - 1.6]} 
        rotation={[0, segmentAngle, 0]}
      >
        <boxGeometry args={[length, 0.02, 0.2]} />
        <meshStandardMaterial 
          color="#aa8866" 
          transparent={true}
          opacity={0.6}
          roughness={0.8}
        />
      </mesh>
    );
    
    // Every 4th segment, add a decorative element - close to sand color
    if (i % 4 === 0) {
      paths.push(
        <mesh 
          key={`path-circle-decor-${i}`} 
          position={[centerX, 0, centerZ]} 
          rotation={[0, segmentAngle, 0]}
        >
          <boxGeometry args={[0.4, 0.2, 3]} />
          <meshStandardMaterial 
            color="#bb9977" 
            transparent={true}
            opacity={0.7}
            roughness={0.7}
          />
        </mesh>
      );
    }
  }
  
  // Create 8 radial paths
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const x = Math.sin(angle);
    const z = Math.cos(angle);
    
    // Inner section (spawn area to circle)
    paths.push(
      <mesh 
        key={`path-radial-inner-${i}`} 
        position={[x * 12, -0.03, z * 12]} 
        rotation={[0, angle, 0]}
      >
        <boxGeometry args={[15, 0.05, 3]} />
        <meshStandardMaterial 
          color="#997755" 
          transparent={true}
          opacity={0.5}
          roughness={0.9}
        />
      </mesh>
    );
    
    // Inner section borders
    paths.push(
      <mesh 
        key={`path-radial-inner-border-1-${i}`} 
        position={[x * 12, -0.02, z * 12 - 1.6]} 
        rotation={[0, angle, 0]}
      >
        <boxGeometry args={[15, 0.02, 0.2]} />
        <meshStandardMaterial 
          color="#aa8866" 
          transparent={true}
          opacity={0.6}
          roughness={0.8}
        />
      </mesh>
    );
    
    paths.push(
      <mesh 
        key={`path-radial-inner-border-2-${i}`} 
        position={[x * 12, -0.02, z * 12 + 1.6]} 
        rotation={[0, angle, 0]}
      >
        <boxGeometry args={[15, 0.02, 0.2]} />
        <meshStandardMaterial 
          color="#aa8866" 
          transparent={true}
          opacity={0.6}
          roughness={0.8}
        />
      </mesh>
    );
    
    // Add decorative elements along path
    for (let j = 1; j <= 2; j++) {
      paths.push(
        <mesh 
          key={`path-radial-inner-decor-${i}-${j}`} 
          position={[x * (5 * j), 0, z * (5 * j)]} 
          rotation={[0, angle, 0]}
        >
          <boxGeometry args={[0.4, 0.2, 3]} />
          <meshStandardMaterial 
            color="#bb9977" 
            transparent={true}
            opacity={0.9}
            roughness={0.7}
          />
        </mesh>
      );
    }
    
    // Outer section (circle to districts)
    paths.push(
      <mesh 
        key={`path-radial-outer-${i}`} 
        position={[x * 50, -0.03, z * 50]} 
        rotation={[0, angle, 0]}
      >
        <boxGeometry args={[40, 0.05, 3]} />
        <meshStandardMaterial 
          color="#997755" 
          transparent={true}
          opacity={0.8}
          roughness={0.9}
        />
      </mesh>
    );
    
    // Outer section borders
    paths.push(
      <mesh 
        key={`path-radial-outer-border-1-${i}`} 
        position={[x * 50, -0.02, z * 50 - 1.6]} 
        rotation={[0, angle, 0]}
      >
        <boxGeometry args={[40, 0.02, 0.2]} />
        <meshStandardMaterial 
          color="#aa8866" 
          transparent={true}
          opacity={0.9}
          roughness={0.8}
        />
      </mesh>
    );
    
    paths.push(
      <mesh 
        key={`path-radial-outer-border-2-${i}`} 
        position={[x * 50, -0.02, z * 50 + 1.6]} 
        rotation={[0, angle, 0]}
      >
        <boxGeometry args={[40, 0.02, 0.2]} />
        <meshStandardMaterial 
          color="#aa8866" 
          transparent={true}
          opacity={0.6}
          roughness={0.8}
        />
      </mesh>
    );
    
    // Add decorative elements along path
    for (let j = 1; j <= 3; j++) {
      paths.push(
        <mesh 
          key={`path-radial-outer-decor-${i}-${j}`} 
          position={[x * (30 + 10 * j), 0, z * (30 + 10 * j)]} 
          rotation={[0, angle, 0]}
        >
          <boxGeometry args={[0.4, 0.2, 3]} />
          <meshStandardMaterial 
            color="#bb9977" 
            transparent={true}
            opacity={0.9}
            roughness={0.7}
          />
        </mesh>
      );
    }
  }

  // Create organized districts - building clusters in specific areas
  const cityBuildings: JSX.Element[] = [];
  
  // Create 8 districts with their own character
  const districts = [
    { name: "Downtown", distance: 50, direction: 0, buildings: 6, minHeight: 8, maxHeight: 20, color: "#6080a0" },
    { name: "Financial", distance: 50, direction: Math.PI/4, buildings: 4, minHeight: 10, maxHeight: 25, color: "#4060a0" },
    { name: "Residential", distance: 50, direction: Math.PI/2, buildings: 7, minHeight: 3, maxHeight: 6, color: "#c08060" },
    { name: "Shopping", distance: 50, direction: 3*Math.PI/4, buildings: 5, minHeight: 4, maxHeight: 8, color: "#90a0c0" },
    { name: "University", distance: 50, direction: Math.PI, buildings: 3, minHeight: 5, maxHeight: 12, color: "#805030" },
    { name: "Industrial", distance: 50, direction: 5*Math.PI/4, buildings: 5, minHeight: 4, maxHeight: 10, color: "#708090" },
    { name: "Entertainment", distance: 50, direction: 3*Math.PI/2, buildings: 6, minHeight: 3, maxHeight: 12, color: "#9060a0" },
    { name: "Government", distance: 50, direction: 7*Math.PI/4, buildings: 4, minHeight: 6, maxHeight: 15, color: "#a07060" },
  ];
  
  districts.forEach(district => {
    const centerX = Math.sin(district.direction) * district.distance;
    const centerZ = Math.cos(district.direction) * district.distance;
    
    for (let i = 0; i < district.buildings; i++) {
      // Create a grid-like arrangement in each district
      const row = Math.floor(i / 3);
      const col = i % 3;
      const spacing = 8;
      
      // Add some randomness within the grid cell
      const offsetX = (Math.random() - 0.5) * 3;
      const offsetZ = (Math.random() - 0.5) * 3;
      
      const x = centerX + (col - 1) * spacing + offsetX;
      const z = centerZ + (row - 1) * spacing + offsetZ;
      
      // Skip if too close to spawn or paths
      if (isTooCloseToSpawn(x, z, 15)) {
        continue;
      }
      
      const height = district.minHeight + Math.random() * (district.maxHeight - district.minHeight);
      const width = 3 + Math.random() * 4;
      const depth = 3 + Math.random() * 4;
      
      // Color variation within district theme
      const baseColor = district.color;
      const variation = 20;
      
      // Parse the hex color and add variation
      const r = parseInt(baseColor.slice(1, 3), 16) + Math.floor(Math.random() * variation - variation/2);
      const g = parseInt(baseColor.slice(3, 5), 16) + Math.floor(Math.random() * variation - variation/2);
      const b = parseInt(baseColor.slice(5, 7), 16) + Math.floor(Math.random() * variation - variation/2);
      
      // Ensure values are in valid range 0-255
      const rClamped = Math.min(255, Math.max(0, r));
      const gClamped = Math.min(255, Math.max(0, g));
      const bClamped = Math.min(255, Math.max(0, b));
      
      const color = `rgb(${rClamped}, ${gClamped}, ${bClamped})`;
      
      const building = createBuilding(
        [x, height/2, z], 
        [width, height, depth], 
        color
      );
      
      if (building) {
        cityBuildings.push(building);
      }
    }
  });

  // Create organized parks with trees in specific locations
  const parks: JSX.Element[] = [];
  
  // Create 4 park areas
  const parkLocations = [
    { x: 40, z: 40, radius: 15, trees: 8 },
    { x: -40, z: 40, radius: 15, trees: 8 },
    { x: -40, z: -40, radius: 15, trees: 8 },
    { x: 40, z: -40, radius: 15, trees: 8 },
  ];
  
  parkLocations.forEach((park, parkIndex) => {
    // Register the park fountain first
    registerObject(park.x, park.z, 4);

    // Create trees in a natural-looking pattern
    for (let i = 0; i < park.trees; i++) {
      // Try multiple positions to find a valid one
      let validPosition = false;
      let attempt = 0;
      let x = 0, z = 0, radius = 0;
      
      while (!validPosition && attempt < 10) {
        attempt++;
        const angle = Math.random() * Math.PI * 2;
        radius = Math.random() * park.radius;
        x = park.x + Math.sin(angle) * radius;
        z = park.z + Math.cos(angle) * radius;
        
        // Skip if too close to other objects or spawn
        if (isTooCloseToSpawn(x, z) || isTooCloseToExistingObjects(x, z, 1.5)) {
          continue;
        }
        
        validPosition = true;
      }
      
      if (!validPosition) {
        continue; // Skip this tree if we couldn't find a valid position
      }
      
      // Register this tree
      registerObject(x, z, 1.5);
      
      const height = 2 + Math.random() * 3;
      const treeId = `park-tree-${parkIndex}-${i}`;
      
      parks.push(
        <group key={treeId} position={[x, 0, z]} userData={{ type: 'collidable' }}>
          {/* Tree trunk */}
          <mesh castShadow position={[0, height / 2, 0]} userData={{ type: 'collidable' }}>
            <cylinderGeometry args={[0.2, 0.2, height, 8]} />
            <meshBasicMaterial color={materialColors.treeTrunk} />
          </mesh>
          {/* Tree leaves */}
          <mesh castShadow position={[0, height + 0.7, 0]} userData={{ type: 'collidable' }}>
            <coneGeometry args={[1, 2, 8]} />
            <meshBasicMaterial color={materialColors.treeLeaves} />
          </mesh>
        </group>
      );
      
      // Add park bench near some trees if there's room
      if (i % 4 === 0) {
        // Try to place the bench at different positions around the tree
        let benchPlaced = false;
        for (let benchAngle = 0; benchAngle < Math.PI * 2 && !benchPlaced; benchAngle += Math.PI / 4) {
          const benchX = x + Math.sin(benchAngle) * 3;
          const benchZ = z + Math.cos(benchAngle) * 3;
          
          if (!isTooCloseToExistingObjects(benchX, benchZ, 1.5)) {
            registerObject(benchX, benchZ, 1.5);
            parks.push(
              <group key={`park-bench-${parkIndex}-${i}`} position={[benchX, 0, benchZ]} rotation={[0, benchAngle + Math.PI, 0]} userData={{ type: 'collidable' }}>
                {/* Bench seat */}
                <mesh castShadow receiveShadow position={[0, 0.5, 0]} userData={{ type: 'collidable' }}>
                  <boxGeometry args={[1.5, 0.1, 0.6]} />
                  <meshBasicMaterial color={materialColors.treeTrunk} />
                </mesh>
                
                {/* Bench back */}
                <mesh castShadow receiveShadow position={[0, 1, -0.25]} userData={{ type: 'collidable' }}>
                  <boxGeometry args={[1.5, 0.8, 0.1]} />
                  <meshBasicMaterial color={materialColors.treeTrunk} />
                </mesh>
                
                {/* Bench legs */}
                <mesh castShadow receiveShadow position={[-0.6, 0.25, 0]} userData={{ type: 'collidable' }}>
                  <boxGeometry args={[0.1, 0.5, 0.5]} />
                  <meshBasicMaterial color="#4D2910" />
                </mesh>
                <mesh castShadow receiveShadow position={[0.6, 0.25, 0]} userData={{ type: 'collidable' }}>
                  <boxGeometry args={[0.1, 0.5, 0.5]} />
                  <meshBasicMaterial color="#4D2910" />
                </mesh>
              </group>
            );
            benchPlaced = true;
          }
        }
      }
    }
  });

  // Create fountains at specific locations
  const fountains = [
    // Central fountain - moved behind the car's starting position
    (() => {
      const fountainX = 0;
      const fountainZ = -20;
      // Register the central fountain
      registerObject(fountainX, fountainZ, 5.5);
      
      return (
        <group key="central-fountain" position={[fountainX, 0, fountainZ]} userData={{ type: 'collidable' }}>
          {/* Fountain base */}
          <mesh castShadow receiveShadow position={[0, 0.5, 0]} userData={{ type: 'collidable' }}>
            <cylinderGeometry args={[5, 5.5, 1, 32]} />
            <meshBasicMaterial color={materialColors.fountainStone} />
          </mesh>
          
          {/* Fountain outer rim */}
          <mesh castShadow receiveShadow position={[0, 1.05, 0]} userData={{ type: 'collidable' }}>
            <torusGeometry args={[5, 0.3, 16, 100]} />
            <meshBasicMaterial color="#999999" />
          </mesh>
          
          {/* Fountain inner bowl */}
          <mesh castShadow receiveShadow position={[0, 1.5, 0]} userData={{ type: 'collidable' }}>
            <cylinderGeometry args={[2.5, 3, 1, 32]} />
            <meshBasicMaterial color="#999999" />
          </mesh>
          
          {/* Decorative pillars around fountain */}
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            const x = Math.sin(angle) * 5.2;
            const z = Math.cos(angle) * 5.2;
            
            return (
              <group key={`fountain-pillar-${i}`} position={[x, 0, z]}>
                <mesh castShadow position={[0, 0.8, 0]}>
                  <cylinderGeometry args={[0.2, 0.2, 1.6, 8]} />
                  <meshBasicMaterial color="#aaaaaa" />
                </mesh>
                <mesh castShadow position={[0, 1.8, 0]}>
                  <boxGeometry args={[0.4, 0.4, 0.4]} />
                  <meshBasicMaterial color="#888888" />
                </mesh>
              </group>
            );
          })}
          
          {/* Fountain center piece - multilevel */}
          <mesh castShadow receiveShadow position={[0, 1.3, 0]} userData={{ type: 'collidable' }}>
            <cylinderGeometry args={[1, 1.2, 0.6, 16]} />
            <meshBasicMaterial color="#777777" />
          </mesh>
          
          <mesh castShadow receiveShadow position={[0, 1.8, 0]} userData={{ type: 'collidable' }}>
            <cylinderGeometry args={[0.7, 0.9, 0.6, 16]} />
            <meshBasicMaterial color="#777777" />
          </mesh>
          
          <mesh castShadow receiveShadow position={[0, 2.5, 0]} userData={{ type: 'collidable' }}>
            <cylinderGeometry args={[0.3, 0.5, 1, 16]} />
            <meshBasicMaterial color="#666666" />
          </mesh>
          
          {/* Water (using a flat blue disk) */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 1.05, 0]}>
            <circleGeometry args={[4.8, 32]} />
            <meshBasicMaterial 
              color={materialColors.fountainWater} 
              transparent={true}
              opacity={0.8} 
            />
          </mesh>
          
          {/* Water ripples */}
          {Array.from({ length: 4 }).map((_, i) => {
            const radius = 1 + i * 1.1;
            return (
              <mesh key={`water-ripple-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 1.06, 0]}>
                <ringGeometry args={[radius, radius + 0.1, 32]} />
                <meshBasicMaterial 
                  color="#ffffff"
                  transparent={true}
                  opacity={0.3} 
                />
              </mesh>
            );
          })}
          
          {/* Water jet/spray effect */}
          <mesh position={[0, 3, 0]} rotation={[0, 0, 0]}>
            <coneGeometry args={[0.1, 0.5, 8, 1, true]} />
            <meshBasicMaterial 
              color={materialColors.fountainWater} 
              transparent={true}
              opacity={0.6} 
            />
          </mesh>
        </group>
      );
    })(),
    
    // District fountains - one in each park
    ...parkLocations.map((park, i) => (
      <group key={`district-fountain-${i}`} position={[park.x, 0, park.z]} userData={{ type: 'collidable' }}>
        {/* Fountain base */}
        <mesh castShadow receiveShadow position={[0, 0.5, 0]} userData={{ type: 'collidable' }}>
          <cylinderGeometry args={[3, 3.5, 1, 16]} />
          <meshBasicMaterial color={materialColors.fountainStone} />
        </mesh>
        
        {/* Fountain inner bowl */}
        <mesh castShadow receiveShadow position={[0, 1.5, 0]} userData={{ type: 'collidable' }}>
          <cylinderGeometry args={[1.5, 2, 1, 16]} />
          <meshBasicMaterial color={materialColors.fountainWater} />
        </mesh>
        
        {/* Fountain center piece */}
        <mesh castShadow receiveShadow position={[0, 2, 0]} userData={{ type: 'collidable' }}>
          <cylinderGeometry args={[0.3, 0.3, 1, 8]} />
          <meshBasicMaterial color="#555555" />
        </mesh>
        
        {/* Water (using a flat blue disk) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 1.05, 0]}>
          <circleGeometry args={[2.9, 32]} />
          <meshBasicMaterial color="#3399ff" opacity={0.7} transparent />
        </mesh>
      </group>
    ))
  ];

  // Create lamp posts along paths
  const lampPosts: JSX.Element[] = [];
  
  // Place lamps along the inner circle
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const radius = 26; // Just outside the path
    const x = Math.sin(angle) * radius;
    const z = Math.cos(angle) * radius;
    
    // Skip if too close to existing objects
    if (isTooCloseToExistingObjects(x, z, 1)) {
      continue;
    }
    
    // Register this lamp post
    registerObject(x, z, 1);
    
    lampPosts.push(
      <group key={`lamp-circle-${i}`} position={[x, 0, z]} userData={{ type: 'collidable' }}>
        {/* Lamp post base */}
        <mesh castShadow receiveShadow position={[0, 0.15, 0]} userData={{ type: 'collidable' }}>
          <cylinderGeometry args={[0.3, 0.4, 0.3, 8]} />
          <meshBasicMaterial color={materialColors.lampMetal} />
        </mesh>
        
        {/* Lamp post pole */}
        <mesh castShadow position={[0, 3, 0]} userData={{ type: 'collidable' }}>
          <cylinderGeometry args={[0.1, 0.15, 6, 8]} />
          <meshBasicMaterial color="#444444" />
        </mesh>
        
        {/* Lamp head */}
        <group position={[0, 6, 0]} userData={{ type: 'collidable' }}>
          {/* Lamp fixture */}
          <mesh castShadow userData={{ type: 'collidable' }}>
            <cylinderGeometry args={[0.3, 0.3, 0.2, 8]} />
            <meshBasicMaterial color={materialColors.lampMetal} />
          </mesh>
          
          {/* Light */}
          <mesh position={[0, -0.15, 0]} userData={{ type: 'collidable' }}>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshBasicMaterial color="#ffaa55" />
          </mesh>
        </group>
      </group>
    );
  }
  
  // Place lamps along radial paths
  for (let rad = 0; rad < 8; rad++) {
    const angle = (rad / 8) * Math.PI * 2;
    
    // Add lamps along the radial paths (3 per path)
    for (let i = 1; i <= 3; i++) {
      const distance = 15 * i;
      const x = Math.sin(angle) * distance;
      const z = Math.cos(angle) * distance;
      
      if (isTooCloseToSpawn(x, z, 15) || isTooCloseToExistingObjects(x, z, 1)) {
        continue;
      }
      
      // Register this lamp post
      registerObject(x, z, 1);
      
      lampPosts.push(
        <group key={`lamp-radial-${rad}-${i}`} position={[x, 0, z]} userData={{ type: 'collidable' }}>
          {/* Lamp post base */}
          <mesh castShadow receiveShadow position={[0, 0.15, 0]} userData={{ type: 'collidable' }}>
            <cylinderGeometry args={[0.3, 0.4, 0.3, 8]} />
            <meshBasicMaterial color={materialColors.lampMetal} />
          </mesh>
          
          {/* Lamp post pole */}
          <mesh castShadow position={[0, 3, 0]} userData={{ type: 'collidable' }}>
            <cylinderGeometry args={[0.1, 0.15, 6, 8]} />
            <meshBasicMaterial color="#444444" />
          </mesh>
          
          {/* Lamp head */}
          <group position={[0, 6, 0]} userData={{ type: 'collidable' }}>
            {/* Lamp fixture */}
            <mesh castShadow userData={{ type: 'collidable' }}>
              <cylinderGeometry args={[0.3, 0.3, 0.2, 8]} />
              <meshBasicMaterial color={materialColors.lampLight} />
            </mesh>
            
            {/* Light */}
            <mesh position={[0, -0.15, 0]} userData={{ type: 'collidable' }}>
              <sphereGeometry args={[0.2, 16, 16]} />
              <meshBasicMaterial color="#ffff99" />
            </mesh>
          </group>
        </group>
      );
    }
  }

  // Create horror elements
  const horrorElements: JSX.Element[] = [];
  
  // Creepy trees with twisted shapes
  for (let i = 0; i < 12; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = 60 + Math.random() * 70;
    const x = Math.sin(angle) * distance;
    const z = Math.cos(angle) * distance;
    
    // Skip if too close to other objects
    if (isTooCloseToExistingObjects(x, z, 2)) {
      continue;
    }
    
    // Register this horror tree
    registerObject(x, z, 2);
    
    const height = 6 + Math.random() * 4;
    
    horrorElements.push(
      <group key={`horror-tree-${i}`} position={[x, 0, z]} rotation={[0, Math.random() * Math.PI, 0]}>
        {/* Twisted trunk */}
        <mesh castShadow position={[0, height/2, 0]}>
          <cylinderGeometry args={[0.2, 0.5, height, 8]} />
          <meshBasicMaterial color="#111111" />
        </mesh>
        
        {/* Sparse branches */}
        {Array.from({ length: 4 }).map((_, j) => {
          const branchAngle = (j / 4) * Math.PI * 2;
          const branchHeight = 2 + Math.random() * (height - 3);
          const branchX = Math.sin(branchAngle) * 0.8;
          const branchZ = Math.cos(branchAngle) * 0.8;
          
          return (
            <mesh key={`branch-${i}-${j}`} castShadow position={[branchX, branchHeight, branchZ]} rotation={[Math.PI/4, 0, branchAngle]}>
              <cylinderGeometry args={[0.05, 0.1, 2 + Math.random(), 6]} />
              <meshBasicMaterial color="#111111" />
            </mesh>
          );
        })}
      </group>
    );
  }
  
  // Add gravestones to some parks
  parkLocations.forEach((park, parkIndex) => {
    // Add gravestones to each park
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * (park.radius - 3);
      const x = park.x + Math.sin(angle) * distance;
      const z = park.z + Math.cos(angle) * distance;
      
      // Skip if too close to other objects
      if (isTooCloseToExistingObjects(x, z, 1)) {
        continue;
      }
      
      // Register this gravestone
      registerObject(x, z, 1);
      
      // Random rotation
      const rotation = Math.random() * 0.3 - 0.15;
      
      horrorElements.push(
        <group key={`gravestone-${parkIndex}-${i}`} position={[x, 0, z]} rotation={[rotation, Math.random() * Math.PI * 2, rotation]}>
          {/* Stone */}
          <mesh castShadow receiveShadow position={[0, 0.7, 0]}>
            <boxGeometry args={[0.8, 1.4, 0.2]} />
            <meshBasicMaterial color="#777777" />
          </mesh>
          
          {/* Top part */}
          <mesh castShadow receiveShadow position={[0, 1.5, 0]}>
            <cylinderGeometry args={[0.5, 0.5, 0.2, 8, 1, false, 0, Math.PI]} />
            <meshBasicMaterial color="#777777" />
          </mesh>
        </group>
      );
    }
  });

  // Add a dark, horror-themed sky
  const sky = (
    <group>
      {/* Dark sky dome - larger and more visible */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[500, 32, 32]} />
        <meshBasicMaterial 
          color="#0a1030" 
          side={2} // BackSide to render from inside
          fog={false}
        />
      </mesh>

      {/* Eerie moon - larger and brighter */}
      <mesh position={[120, 80, -120]}>
        <sphereGeometry args={[30, 32, 32]} />
        <meshBasicMaterial 
          color="#ffcc99" 
          fog={false}
        />
      </mesh>
      
      {/* Add more stars for better visibility */}
      {Array.from({ length: 500 }).map((_, i) => {
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.random() * Math.PI;
        const radius = 480;
        const x = radius * Math.sin(theta) * Math.cos(phi);
        const y = radius * Math.sin(theta) * Math.sin(phi);
        const z = radius * Math.cos(theta);
        
        // Vary star sizes for better depth perception
        const size = Math.random() < 0.8 
          ? Math.random() * 1 + 0.5  // Regular stars
          : Math.random() * 3 + 2;   // Occasional larger stars
        
        // Vary star brightness
        const brightness = Math.random() < 0.7
          ? "#ffffff"  // Regular stars
          : "#ffeecc"; // Warmer/yellower stars
        
        return (
          <mesh key={`star-${i}`} position={[x, y, z]}>
            <sphereGeometry args={[size, 8, 8]} />
            <meshBasicMaterial color={brightness} fog={false} />
          </mesh>
        );
      })}
    </group>
  );

  // Create boundary walls to prevent car from going too far - fixing the wall issues
  const boundaryWalls = [
    // North wall - pushed further back
    <mesh key="north-wall" position={[0, 3, -149]} castShadow receiveShadow userData={{ type: 'collidable' }}>
      <boxGeometry args={[300, 6, 1]} />
      <meshStandardMaterial color="#aa7755" />
    </mesh>,
    // South wall - pushed further back
    <mesh key="south-wall" position={[0, 3, 149]} castShadow receiveShadow userData={{ type: 'collidable' }}>
      <boxGeometry args={[300, 6, 1]} />
      <meshStandardMaterial color="#aa7755" />
    </mesh>,
    // East wall - pushed further back
    <mesh key="east-wall" position={[149, 3, 0]} castShadow receiveShadow userData={{ type: 'collidable' }}>
      <boxGeometry args={[1, 6, 300]} />
      <meshStandardMaterial color="#aa7755" />
    </mesh>,
    // West wall - pushed further back
    <mesh key="west-wall" position={[-149, 3, 0]} castShadow receiveShadow userData={{ type: 'collidable' }}>
      <boxGeometry args={[1, 6, 300]} />
      <meshStandardMaterial color="#aa7755" />
    </mesh>
  ];

  // Replace the dunes with flat sand patches
  const sandPatches: JSX.Element[] = [];
  for (let i = 0; i < 25; i++) {
    const size = 15 + Math.random() * 20;
    const x = (Math.random() - 0.5) * 250;
    const z = (Math.random() - 0.5) * 250;
    
    // Skip areas near roads and center
    if (Math.abs(x) < 40 && Math.abs(z) < 40) continue;
    if (Math.sqrt(x*x + z*z) < 40) continue;
    
    sandPatches.push(
      <mesh
        key={`sand-patch-${i}`}
        position={[x, -0.01, z]}
        rotation={[-Math.PI/2, 0, Math.random() * Math.PI * 2]}
        receiveShadow
      >
        <circleGeometry args={[size, 24]} />
        <meshStandardMaterial 
          color={Math.random() > 0.5 ? "#bb9966" : "#c4a070"}
          transparent={true}
          opacity={0.3 + Math.random() * 0.15} // Reduced opacity from 0.6-0.8 to 0.3-0.45
          roughness={0.9}
        />
      </mesh>
    );
  }

  return (
    <>
      {sky}
      {ground}
      {paths}
      {cityBuildings}
      {parks}
      {sandPatches}
      {lampPosts}
      {fountains}
      {boundaryWalls}
      {horrorElements}
    </>
  );
};

export default Environment;
