
import React, { useRef, useMemo } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import { shaderMaterial, useTexture, Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { TreeMode } from '../types';

interface TreeProps {
  mode: TreeMode;
  isExploded: boolean;
}

// --- 1. Custom Shader Material for Luxury Foliage ---
const FoliageMaterial = shaderMaterial(
  {
    uTime: 0,
    uExplode: 0,
    uColorCore: new THREE.Color("#004033"), // Lighter Emerald for visibility
    uColorTip: new THREE.Color("#F4C430"),  // Bright Gold
    uPixelRatio: 1,
  },
  // Vertex Shader
  `
    uniform float uTime;
    uniform float uExplode;
    uniform float uPixelRatio;
    
    attribute vec3 aScatterPos;
    attribute float aRandom;
    attribute float aSize;

    varying float vRandom;
    varying float vAlpha;
    varying vec3 vPos;

    void main() {
      vRandom = aRandom;
      
      float t = uExplode;
      
      // Interpolate Position
      vec3 currentPos = mix(position, aScatterPos, t);

      // Physics & Noise
      float breath = sin(uTime * 2.0 + position.y * 3.0) * 0.05 * (1.0 - t);
      
      // Drifting when scattered
      float driftX = sin(uTime * 0.5 + aRandom * 10.0) * 0.5 * t;
      float driftY = cos(uTime * 0.3 + aRandom * 20.0) * 0.5 * t;
      float driftZ = sin(uTime * 0.4 + aRandom * 30.0) * 0.5 * t;

      vec3 finalPos = currentPos + vec3(driftX, driftY + breath, driftZ);
      vPos = finalPos;

      vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
      
      // Increased size multiplier for better visibility
      gl_PointSize = (aSize * uPixelRatio * 90.0) * (1.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  // Fragment Shader
  `
    uniform vec3 uColorCore;
    uniform vec3 uColorTip;
    varying float vRandom;
    varying vec3 vPos;

    void main() {
      vec2 xy = gl_PointCoord.xy - vec2(0.5);
      float r = length(xy);
      if (r > 0.5) discard;

      // Glow Gradient
      float glow = 1.0 - (r * 2.0);
      glow = pow(glow, 1.5);

      // Color mix based on height and radius
      vec3 color = mix(uColorTip, uColorCore, r * 1.5);
      
      // Sparkle
      float sparkle = step(0.92, fract(vRandom * 123.45 + vPos.y));
      color += vec3(sparkle);

      gl_FragColor = vec4(color, 1.0);
    }
  `
);

extend({ FoliageMaterial });

// --- Geometry Helpers ---

const getConePoint = (height: number, radiusBase: number, yOffset: number) => {
  const h = Math.random() * height;
  const rAtH = radiusBase * (1 - h / height);
  const angle = Math.random() * Math.PI * 2;
  // Use sqrt for uniform disk distribution, but pow 0.8 to cluster slightly more on outside
  const r = Math.pow(Math.random(), 0.5) * rAtH;
  
  const x = Math.cos(angle) * r;
  const z = Math.sin(angle) * r;
  const y = h + yOffset;
  return new THREE.Vector3(x, y, z);
};

const getConeSurfacePoint = (height: number, radiusBase: number, yOffset: number) => {
  const h = Math.random() * height;
  const rAtH = radiusBase * (1 - h / height);
  const angle = Math.random() * Math.PI * 2;
  
  const x = Math.cos(angle) * rAtH;
  const z = Math.sin(angle) * rAtH;
  const y = h + yOffset;
  return new THREE.Vector3(x, y, z);
};

const getSpherePoint = (radius: number) => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius;
  const sinPhi = Math.sin(phi);
  return new THREE.Vector3(
    r * sinPhi * Math.cos(theta),
    r * sinPhi * Math.sin(theta),
    r * Math.cos(phi)
  );
};

// --- Procedural Geometry Construction ---

function createMiffyGeometry() {
  // Simple approximation: Head sphere + 2 Ear capsules
  const geom = new THREE.BufferGeometry();
  return geom; 
}

// --- Components ---

const Foliage: React.FC<{ isExploded: boolean }> = ({ isExploded }) => {
  const materialRef = useRef<any>(null);
  const count = 16000; // Increased count for taller tree
  
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const treePositions = [];
    const scatterPositions = [];
    const randoms = [];
    const sizes = [];

    for (let i = 0; i < count; i++) {
      // Tree: Taller -> Height 13, Radius 5.0, Start Y -5
      const tp = getConePoint(13.0, 5.0, -5.0);
      treePositions.push(tp.x, tp.y, tp.z);

      const sp = getSpherePoint(22); // Larger scatter radius
      scatterPositions.push(sp.x, sp.y, sp.z);

      randoms.push(Math.random());
      sizes.push(Math.random() * 0.8 + 0.4);
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(treePositions, 3));
    geo.setAttribute('aScatterPos', new THREE.Float32BufferAttribute(scatterPositions, 3));
    geo.setAttribute('aRandom', new THREE.Float32BufferAttribute(randoms, 1));
    geo.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1));
    return geo;
  }, []);

  useFrame((state, delta) => {
    if (materialRef.current) {
      const target = isExploded ? 1 : 0;
      materialRef.current.uExplode = THREE.MathUtils.damp(materialRef.current.uExplode, target, 2, delta);
      materialRef.current.uTime = state.clock.elapsedTime;
      materialRef.current.uPixelRatio = state.viewport.dpr;
    }
  });

  return (
    <points geometry={geometry}>
      {/* @ts-ignore */}
      <foliageMaterial ref={materialRef} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
};

// Generic Instance Manager for Decorations
const DecorationInstances: React.FC<{ 
  isExploded: boolean, 
  count: number, 
  scaleBase: number,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  type: 'box' | 'sphere' | 'bunny' | 'stocking'
}> = ({ isExploded, count, scaleBase, geometry, material, type }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const dummy = new THREE.Object3D();

    const data = useMemo(() => {
        return new Array(count).fill(0).map(() => {
            // Taller distribution
            const treePos = getConeSurfacePoint(12.0, 4.5, -4.5);
            // Push out slightly
            treePos.x *= 1.05; treePos.z *= 1.05;

            const scatterPos = getSpherePoint(15);
            const scale = Math.random() * 0.3 + scaleBase;
            const rot = new THREE.Euler(Math.random()*6, Math.random()*6, Math.random()*6);
            
            return { treePos, scatterPos, scale, rot };
        });
    }, [count, scaleBase]);

    useFrame((state, delta) => {
        if (!meshRef.current) return;
        const target = isExploded ? 1 : 0;
        
        meshRef.current.userData.val = THREE.MathUtils.damp(
            meshRef.current.userData.val || 0,
            target,
            2,
            delta
        );
        const val = meshRef.current.userData.val;

        data.forEach((d, i) => {
            const pos = new THREE.Vector3().lerpVectors(d.treePos, d.scatterPos, val);
            
            if (val > 0.01) {
                pos.y += Math.sin(state.clock.elapsedTime + i * 10) * 0.1 * val;
            }

            dummy.position.copy(pos);
            dummy.scale.setScalar(d.scale);
            
            // Orient towards camera/outwards when on tree, tumble when exploded
            if (val < 0.5) {
               dummy.lookAt(0, pos.y, 0); 
               dummy.rotateY(Math.PI); // Face out
            } else {
               dummy.rotation.set(
                   d.rot.x + state.clock.elapsedTime, 
                   d.rot.y + state.clock.elapsedTime, 
                   d.rot.z
               );
            }

            dummy.updateMatrix();
            meshRef.current!.setMatrixAt(i, dummy.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[geometry, undefined, count]} castShadow receiveShadow>
            <primitive object={material} />
        </instancedMesh>
    );
}

// Special Component for "Miffy" style bunnies (Head + Ears)
const MiffyDecorations: React.FC<{ isExploded: boolean }> = ({ isExploded }) => {
    const headGeo = useMemo(() => new THREE.SphereGeometry(0.5, 16, 16), []);
    const earGeo = useMemo(() => new THREE.CapsuleGeometry(0.15, 0.8, 4, 8), []);
    const mat = useMemo(() => new THREE.MeshStandardMaterial({ 
        color: "#ffffff", roughness: 0.3, metalness: 0.1, emissive: "#333333", emissiveIntensity: 0.2 
    }), []);

    const count = 30; // More miffies for bigger tree
    
    // We need shared data to sync positions
    const data = useMemo(() => {
        return new Array(count).fill(0).map(() => {
            const treePos = getConeSurfacePoint(11.0, 4.0, -4.0);
            treePos.x *= 1.1; treePos.z *= 1.1; // Perch on edge
            const scatterPos = getSpherePoint(12);
            return { treePos, scatterPos, scale: 0.4 + Math.random() * 0.2 };
        });
    }, []);

    const headRef = useRef<THREE.InstancedMesh>(null);
    const earLRef = useRef<THREE.InstancedMesh>(null);
    const earRRef = useRef<THREE.InstancedMesh>(null);
    const dummy = new THREE.Object3D();

    useFrame((state, delta) => {
        if (!headRef.current) return;
        const target = isExploded ? 1 : 0;
        headRef.current.userData.val = THREE.MathUtils.damp(headRef.current.userData.val || 0, target, 2, delta);
        const val = headRef.current.userData.val;

        data.forEach((d, i) => {
            // Calculate base position
            const pos = new THREE.Vector3().lerpVectors(d.treePos, d.scatterPos, val);
            if(val > 0) pos.y += Math.sin(state.clock.elapsedTime + i)*0.1*val;

            // HEAD
            dummy.position.copy(pos);
            dummy.scale.setScalar(d.scale);
            dummy.lookAt(0, pos.y, 0); dummy.rotateY(Math.PI);
            if(val > 0.5) dummy.rotation.set(val, val, val); // Tumble
            dummy.updateMatrix();
            headRef.current!.setMatrixAt(i, dummy.matrix);

            // EAR L (Relative to head)
            const earOffsetL = new THREE.Vector3(-0.2 * d.scale, 0.6 * d.scale, 0);
            earOffsetL.applyEuler(dummy.rotation);
            dummy.position.copy(pos).add(earOffsetL);
            // dummy.rotation is already set, maybe tweak ear rotation slightly?
            // Simplified: just match head rotation
            dummy.updateMatrix();
            earLRef.current!.setMatrixAt(i, dummy.matrix);

            // EAR R
            const earOffsetR = new THREE.Vector3(0.2 * d.scale, 0.6 * d.scale, 0);
            earOffsetR.applyEuler(dummy.rotation);
            dummy.position.copy(pos).add(earOffsetR);
            dummy.updateMatrix();
            earRRef.current!.setMatrixAt(i, dummy.matrix);
        });
        headRef.current.instanceMatrix.needsUpdate = true;
        earLRef.current!.instanceMatrix.needsUpdate = true;
        earRRef.current!.instanceMatrix.needsUpdate = true;
    });

    return (
        <group>
            <instancedMesh ref={headRef} args={[headGeo, undefined, count]} material={mat} castShadow />
            <instancedMesh ref={earLRef} args={[earGeo, undefined, count]} material={mat} castShadow />
            <instancedMesh ref={earRRef} args={[earGeo, undefined, count]} material={mat} castShadow />
        </group>
    )
}

const TopStar: React.FC<{ isExploded: boolean }> = ({ isExploded }) => {
    const ref = useRef<THREE.Group>(null);
    
    // Create 5-point Star Geometry
    const starGeo = useMemo(() => {
        const shape = new THREE.Shape();
        const outerRadius = 1.0;
        const innerRadius = 0.4;
        const points = 5;

        for (let i = 0; i < points * 2; i++) {
            const r = (i % 2 === 0) ? outerRadius : innerRadius;
            const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2; // -PI/2 to align point up
            const x = Math.cos(a) * r;
            const y = Math.sin(a) * r;
            if (i === 0) shape.moveTo(x, y);
            else shape.lineTo(x, y);
        }
        shape.closePath();

        const extrudeSettings = {
            depth: 0.3,
            bevelEnabled: true,
            bevelThickness: 0.1,
            bevelSize: 0.05,
            bevelSegments: 2
        };

        const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geo.center(); // Center geometry for rotation
        return geo;
    }, []);

    useFrame((state) => {
        if (ref.current) {
            ref.current.rotation.y = state.clock.elapsedTime * 0.8;
            // ref.current.rotation.z = Math.sin(state.clock.elapsedTime) * 0.1;
            
            // Float up when exploded. Tree height ends around 8.0 (13 - 5)
            const targetY = isExploded ? 10 : 8.2; 
            ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, targetY, 0.05);
        }
    });

    return (
        <group ref={ref} position={[0, 8.2, 0]}>
            <mesh geometry={starGeo} castShadow>
                <meshStandardMaterial 
                    color="#F4C430" 
                    emissive="#F4C430" 
                    emissiveIntensity={1.5} 
                    roughness={0.1}
                    metalness={1.0}
                    toneMapped={false} 
                />
            </mesh>
            <pointLight intensity={8} color="#F4C430" distance={15} decay={2} />
            <Sparkles count={30} scale={4} size={5} speed={0.4} opacity={1} color="#FFF" />
        </group>
    )
}

// --- Main Tree Component ---
export const Tree: React.FC<TreeProps> = ({ mode, isExploded }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Geometries
  const boxGeo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const sphereGeo = useMemo(() => new THREE.SphereGeometry(1, 16, 16), []);
  // Stocking: A simplified Cylinder (Boot leg) - We'll just use red cylinders for abstract stockings
  const stockingGeo = useMemo(() => new THREE.CylinderGeometry(0.3, 0.4, 1.2, 16), []);

  // Materials
  const giftMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#8B0000", roughness: 0.2, metalness: 0.4 }), []); // Deep Red
  const ornMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#D4AF37", roughness: 0.1, metalness: 1.0, envMapIntensity: 2 }), []); // Gold
  const stockingMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#aa2222", roughness: 0.8 }), []);

  useFrame((state, delta) => {
    if (groupRef.current) {
        groupRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Central Trunk for Solidity - Taller */}
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.7, 3.5, 12, 16]} />
        <meshStandardMaterial color="#001a14" roughness={0.9} />
      </mesh>

      <Foliage isExploded={isExploded} />
      
      {/* Decorations - Increased counts for taller tree */}
      <DecorationInstances 
        isExploded={isExploded} 
        count={120} 
        scaleBase={0.3} 
        geometry={sphereGeo} 
        material={ornMat} 
        type="sphere" 
      />
      
      <DecorationInstances 
        isExploded={isExploded} 
        count={30} 
        scaleBase={0.4} 
        geometry={boxGeo} 
        material={giftMat} 
        type="box" 
      />

      <DecorationInstances 
        isExploded={isExploded} 
        count={25} 
        scaleBase={0.4} 
        geometry={stockingGeo} 
        material={stockingMat} 
        type="stocking" 
      />

      <MiffyDecorations isExploded={isExploded} />

      <TopStar isExploded={isExploded} />
      
      {/* Floor Mirror - Lowered to -5 to match new base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial 
            color="#000504"
            metalness={0.9}
            roughness={0.1}
            envMapIntensity={0.5}
        />
      </mesh>
    </group>
  );
};
