import React, { useState } from 'react';
import { Scene } from './components/Scene';
import { Overlay } from './components/Overlay';
import { TreeMode } from './types';

function App() {
  const [treeMode, setTreeMode] = useState<TreeMode>(TreeMode.ROYAL);
  const [isExploded, setIsExploded] = useState(false);

  return (
    <div className="relative w-full h-full bg-stone-950 overflow-hidden">
        {/* 3D Scene Background */}
        <Scene mode={treeMode} isExploded={isExploded} />
        
        {/* UI Overlay */}
        <Overlay isExploded={isExploded} onToggleExplode={() => setIsExploded(prev => !prev)} />
        
        {/* Cinematic Vignette Overlay (Static CSS based) */}
        <div className="absolute inset-0 pointer-events-none z-20 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]" />
    </div>
  );
}

export default App;