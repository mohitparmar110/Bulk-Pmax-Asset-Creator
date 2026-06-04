
import React from 'react';
import { useApp } from '../App';

const Dashboard: React.FC<{ setView: (v: string) => void }> = ({ setView }) => {
  const { brands, products, campaigns } = useApp();

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col">
      <header className="mb-12">
        <h2 className="text-4xl font-serif italic text-gold">Good morning, Agent</h2>
        <p className="text-slate-400 mt-2 font-condensed uppercase tracking-widest text-sm">Campaign Overview & Intelligence</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-surface p-6 border border-lift">
          <p className="text-[10px] font-condensed font-bold uppercase tracking-widest text-slate-500 mb-2">Total Exports</p>
          <p className="text-4xl font-serif text-ink">1,402</p>
        </div>
        <div className="bg-surface p-6 border border-lift">
          <p className="text-[10px] font-condensed font-bold uppercase tracking-widest text-slate-500 mb-2">Active Brands</p>
          <p className="text-4xl font-serif text-ink">{brands.length}</p>
        </div>
        <div className="bg-surface p-6 border border-lift">
          <p className="text-[10px] font-condensed font-bold uppercase tracking-widest text-slate-500 mb-2">Credits Left</p>
          <p className="text-4xl font-serif text-ink">4,200</p>
        </div>
        <div className="bg-surface p-6 border border-lift">
          <p className="text-[10px] font-condensed font-bold uppercase tracking-widest text-slate-500 mb-2">Time Saved</p>
          <p className="text-4xl font-serif text-ink text-gold">184h</p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <h3 className="text-sm font-condensed font-bold uppercase tracking-widest text-slate-400">Integrated Weapons</h3>
        <div className="h-[1px] flex-1 bg-lift"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
         {/* OverlayForge */}
        <div className="bg-surface border border-gold p-6 relative group overflow-hidden cursor-pointer flex flex-col" onClick={()=>setView('overlayforge')}>
          <div className="absolute inset-0 bg-gold opacity-0 group-hover:opacity-5 transition-opacity"></div>
          <h4 className="text-2xl font-serif italic text-gold mb-2">OverlayForge</h4>
          <p className="text-sm text-slate-400 mb-6 flex-1">Instant compositing engine. Apply master plates and labels to hundreds of campaign assets.</p>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-condensed font-bold text-ok border border-ok/30 px-2 py-0.5 tracking-widest uppercase">Online</span>
            <span className="text-gold group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </div>

        {/* OmniPost */}
        <div className="bg-surface border border-lift hover:border-gold/50 p-6 relative group overflow-hidden cursor-pointer flex flex-col" onClick={()=>setView('omnipost')}>
          <div className="absolute inset-0 bg-gold opacity-0 group-hover:opacity-5 transition-opacity"></div>
          <h4 className="text-2xl font-serif italic text-ink mb-2">OmniPost</h4>
          <p className="text-sm text-slate-400 mb-6 flex-1">Surgical multi-channel scheduler. Deploy campaigns with AI-crafted copy across all networks.</p>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-condensed font-bold text-slate-500 border border-lift px-2 py-0.5 tracking-widest uppercase">Ready</span>
            <span className="text-slate-500 group-hover:text-gold transition-colors group-hover:translate-x-1">→</span>
          </div>
        </div>

        {/* Image Upscaler */}
        <div className="bg-surface border border-lift hover:border-gold/50 p-6 relative group overflow-hidden cursor-pointer flex flex-col" onClick={()=>setView('upscaler')}>
          <div className="absolute inset-0 bg-gold opacity-0 group-hover:opacity-5 transition-opacity"></div>
          <h4 className="text-2xl font-serif italic text-ink mb-2">Image Upscaler</h4>
          <p className="text-sm text-slate-400 mb-6 flex-1">Batch enhance, denoise and restore low-resolution assets via neural diffusion networks.</p>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-condensed font-bold text-slate-500 border border-lift px-2 py-0.5 tracking-widest uppercase">Ready</span>
            <span className="text-slate-500 group-hover:text-gold transition-colors group-hover:translate-x-1">→</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
