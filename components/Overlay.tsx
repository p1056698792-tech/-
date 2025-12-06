
import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Gift, Send, Loader2, Music, Wind, Minimize2, Pause } from 'lucide-react';
import { generateLuxuryWish } from '../services/geminiService';
import { WishState } from '../types';

interface OverlayProps {
  isExploded: boolean;
  onToggleExplode: () => void;
}

export const Overlay: React.FC<OverlayProps> = ({ isExploded, onToggleExplode }) => {
  const [name, setName] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [wishState, setWishState] = useState<WishState>({
    recipient: '',
    message: '',
    loading: false,
    error: null,
  });

  useEffect(() => {
    // Initialize audio (Kevin MacLeod - Jingle Bells, CC license)
    // Using MP3 format from Internet Archive for maximum browser compatibility (Safari does not support OGG well)
    audioRef.current = new Audio('https://ia800501.us.archive.org/23/items/JingleBellsKevinMacLeod/Jingle%20Bells%20-%20Kevin%20MacLeod.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = 0.4;
    
    // Preload to ensure metadata is loaded for "supported sources" check
    audioRef.current.load();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch(error => {
            console.error("Playback failed:", error);
            setIsPlaying(false);
          });
      }
    }
  };

  const handleGenerateWish = async () => {
    if (!name.trim()) return;
    
    setWishState(prev => ({ ...prev, loading: true, error: null, recipient: name }));
    
    try {
      const message = await generateLuxuryWish(name);
      setWishState({
        recipient: name,
        message: message,
        loading: false,
        error: null,
      });
    } catch (e) {
      setWishState(prev => ({ 
        ...prev, 
        loading: false, 
        error: "Our scribes are currently busy. Please try again." 
      }));
    }
  };

  return (
    <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6 md:p-12 text-arix-gold selection:bg-arix-gold selection:text-black">
      
      {/* Header */}
      <header className="pointer-events-auto flex justify-between items-start animate-fade-in-down">
        <div>
          <h1 className="font-serif text-4xl md:text-7xl tracking-tighter drop-shadow-2xl bg-gradient-to-r from-arix-gold via-arix-gold-light to-arix-gold-dark bg-clip-text text-transparent">
            Merry Christmas
          </h1>
          <p className="font-sans text-xs md:text-sm tracking-[0.3em] uppercase opacity-80 mt-2 text-white/70">
            Arix Signature Holiday Experience
          </p>
        </div>
        
        <div className="flex gap-4">
            <button 
                onClick={onToggleExplode}
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-black/20 backdrop-blur-md text-xs uppercase tracking-widest hover:bg-white/10 hover:border-arix-gold/50 transition-all text-arix-gold"
            >
                {isExploded ? <Minimize2 size={14} /> : <Wind size={14} />}
                <span>{isExploded ? 'Assemble' : 'Deconstruct'}</span>
            </button>
            <button 
                onClick={toggleMusic}
                className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-md text-xs uppercase tracking-widest transition-all ${isPlaying ? 'bg-arix-gold/20 border-arix-gold text-white' : 'bg-black/20 border-white/10 text-arix-gold hover:bg-white/10'}`}
            >
                {isPlaying ? <Pause size={14} /> : <Music size={14} />}
                <span>{isPlaying ? 'Pause' : 'Ambience'}</span>
            </button>
        </div>
      </header>

      {/* Main Interactive Panel - Moved to Left Start */}
      <main className="flex-1 flex items-center justify-start pl-0 md:pl-8 pointer-events-none">
        {wishState.message && (
          <div className="pointer-events-auto w-full max-w-sm md:max-w-md bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-none shadow-2xl animate-in slide-in-from-left duration-700">
             <div className="flex items-center justify-center mb-6">
                <Sparkles className="text-arix-gold-light animate-pulse" size={32} />
             </div>
             <p className="font-serif text-xl md:text-2xl text-center leading-relaxed text-white drop-shadow-md italic mb-6">
                "{wishState.message}"
             </p>
             <div className="text-center font-sans text-[10px] uppercase tracking-[0.4em] text-arix-gold-dark">
                Specially curated for {wishState.recipient}
             </div>
          </div>
        )}
      </main>

      {/* Footer Controls */}
      <footer className="pointer-events-auto w-full max-w-lg mx-auto bg-gradient-to-t from-black/80 to-transparent p-6 rounded-t-3xl backdrop-blur-sm border-t border-white/5">
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Gift className="text-arix-emerald-light" size={16} />
                    <span className="text-xs uppercase tracking-widest text-white/60">Gift a Royal Wish</span>
                </div>
                 {/* Mobile toggle buttons */}
                <div className="flex gap-2 md:hidden">
                  <button 
                      onClick={toggleMusic}
                      className={`flex items-center justify-center w-8 h-8 rounded-full border ${isPlaying ? 'bg-arix-gold text-black border-arix-gold' : 'text-arix-gold border-white/20'}`}
                  >
                      {isPlaying ? <Pause size={14} /> : <Music size={14} />}
                  </button>
                  <button 
                      onClick={onToggleExplode}
                      className="flex items-center justify-center w-8 h-8 rounded-full border border-white/20 text-arix-gold hover:text-white"
                  >
                      {isExploded ? <Minimize2 size={14} /> : <Wind size={14} />}
                  </button>
                </div>
            </div>
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Recipient Name (e.g. Lady Whistledown)"
                    className="flex-1 bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-arix-gold transition-colors font-serif italic"
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerateWish()}
                />
                <button 
                    onClick={handleGenerateWish}
                    disabled={wishState.loading || !name}
                    className="bg-arix-gold hover:bg-white text-black px-6 py-3 rounded-sm font-sans text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {wishState.loading ? <Loader2 className="animate-spin" size={16}/> : <Send size={16} />}
                </button>
            </div>
        </div>
      </footer>
    </div>
  );
};
