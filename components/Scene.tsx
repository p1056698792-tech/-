
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise, TiltShift } from '@react-three/postprocessing';
import { Tree } from './Tree';
import { TreeMode } from '../types';

interface SceneProps {
  mode: TreeMode;
  isExploded: boolean;
}

export const Scene: React.FC<SceneProps> = ({ mode, isExploded }) => {
  return (
    <div className="w-full h-full absolute inset-0 z-0 bg-[#020504]">
      <Canvas shadows dpr={[1, 1.5]} gl={{ antialias: false, toneMappingExposure: 1.2 }}>
        {/* Adjusted camera to look slightly higher at the star and further back for taller tree */}
        <PerspectiveCamera makeDefault position={[0, 4, 18]} fov={40} />
        
        {/* Cinematic Lighting Setup */}
        <ambientLight intensity={0.4} color="#00261C" />
        
        {/* Main Golden Key Light */}
        <spotLight 
          position={[10, 25, 10]} 
          angle={0.4} 
          penumbra={1} 
          intensity={5} 
          castShadow 
          shadow-mapSize={[2048, 2048]}
          color="#F4C430"
          shadow-bias={-0.0001}
        />
        
        {/* Rim Light for separation */}
        <spotLight position={[-15, 10, -5]} intensity={6} color="#00ffcc" angle={0.5} penumbra={1} />
        
        {/* Warm Fill from below */}
        <pointLight position={[0, -5, 5]} intensity={2} color="#D4AF37" distance={15} />

        <Suspense fallback={null}>
            <Tree mode={mode} isExploded={isExploded} />
            {/* Studio Environment for sharp metallic reflections on the gold */}
            <Environment preset="city" /> 
        </Suspense>

        <OrbitControls 
            minPolarAngle={Math.PI / 3.5} 
            maxPolarAngle={Math.PI / 1.8} 
            enableZoom={true}
            minDistance={8}
            maxDistance={35}
            autoRotate={!isExploded}
            autoRotateSpeed={0.5}
            rotateSpeed={0.5}
            dampingFactor={0.05}
        />

        {/* Post Processing for the "Cinematic Glow" */}
        <EffectComposer disableNormalPass>
            <Bloom 
                luminanceThreshold={0.9} 
                mipmapBlur 
                intensity={1.5} 
                radius={0.5}
            />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
            <Noise opacity={0.03} /> 
            <TiltShift blur={0.03} />
        </EffectComposer>
      </Canvas>
    </div>
  );
};
