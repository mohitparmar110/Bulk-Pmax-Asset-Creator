
import React, { useState } from 'react';
import { useApp } from '../App';
import { CampaignAsset, CampaignObjective, Campaign } from '../types';
import { Plus, Layout, Instagram, Monitor, Smartphone, X } from 'lucide-react';

interface StudioProps {
  onEditAsset: (id: string) => void;
}

const PRESETS = [
  { name: 'Instagram Post', width: 1080, height: 1080, icon: <Instagram className="w-4 h-4" />, category: 'Social' },
  { name: 'Instagram Story', width: 1080, height: 1920, icon: <Smartphone className="w-4 h-4" />, category: 'Social' },
  { name: 'Facebook Ad', width: 1200, height: 628, icon: <Layout className="w-4 h-4" />, category: 'Social' },
  { name: 'E-commerce Hero Banner', width: 1920, height: 620, icon: <Monitor className="w-4 h-4" />, category: 'Web' },
  { name: 'Leaderboard Banner', width: 728, height: 90, icon: <Layout className="w-4 h-4" />, category: 'Web' },
  { name: 'Medium Rectangle', width: 300, height: 250, icon: <Layout className="w-4 h-4" />, category: 'Display' },
];

const Studio: React.FC<StudioProps> = ({ onEditAsset }) => {
  const { campaigns, addCampaign, updateCampaign, activeBrandId } = useApp();
  const [showNewModal, setShowNewModal] = useState(false);
  const [customWidth, setCustomWidth] = useState(1920);
  const [customHeight, setCustomHeight] = useState(620);

  const allAssets = campaigns.flatMap(c => c.assets.map(a => ({ ...a, campaignName: c.name })));

  const handleCreateBlank = (preset: typeof PRESETS[0]) => {
    let scratchpad = campaigns.find(c => c.id === 'scratchpad');
    
    const newAsset: CampaignAsset = {
      id: `blank-${Date.now()}`,
      name: `New ${preset.name}`,
      size: { width: preset.width, height: preset.height },
      category: preset.category,
      variation: 1,
      dataUrl: `https://picsum.photos/seed/${Math.random()}/${preset.width}/${preset.height}?blur=10`
    };

    if (!scratchpad) {
      const newScratchpad: Campaign = {
        id: 'scratchpad',
        brandId: activeBrandId || 'default',
        name: 'Scratchpad',
        offer: 'Personal Designs',
        cta: '',
        objective: CampaignObjective.AWARENESS,
        market: 'Global',
        productIds: [],
        status: 'Ready',
        assets: [newAsset]
      };
      addCampaign(newScratchpad);
    } else {
      updateCampaign({
        ...scratchpad,
        assets: [newAsset, ...scratchpad.assets]
      });
    }

    setShowNewModal(false);
    onEditAsset(newAsset.id);
  };

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col font-sans">
      <header className="mb-8 border-b border-[#ffffff05] pb-6 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-serif italic text-[#c8a96e]">Creative Studio</h2>
          <p className="text-[10px] text-[#ede8df40] mt-2 font-condensed uppercase tracking-widest">Select an asset to edit or start a new design from scratch.</p>
        </div>
        <button 
          onClick={() => setShowNewModal(true)}
          className="bg-[#c8a96e] text-[#080604] font-condensed uppercase tracking-widest px-6 py-2 font-bold flex items-center gap-2 hover:bg-[#d4af37] transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Design
        </button>
      </header>

      {showNewModal && (
        <div className="fixed inset-0 bg-[#080604]/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-[#111118] border border-[#ffffff0d] w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-[#ffffff08] flex justify-between items-center bg-[#181820]">
              <h3 className="font-serif italic text-[#c8a96e] text-xl">Choose Canvas Size</h3>
              <button onClick={() => setShowNewModal(false)} className="text-[#ede8df40] hover:text-[#ede8df]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handleCreateBlank(preset)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-[#181820] transition-colors border border-transparent hover:border-[#ffffff0d] group text-left"
                >
                  <div className="w-10 h-10 bg-[#181820] border border-[#ffffff08] flex items-center justify-center text-[#ede8df40] group-hover:bg-[#c8a96e] group-hover:text-[#080604] transition-colors rounded-sm">
                    {preset.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-sans text-sm text-[#ede8df] mb-1">{preset.name}</p>
                    <p className="text-[10px] text-[#ede8df40] font-mono">{preset.width} × {preset.height} px</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="p-6 bg-[#181820] border-t border-[#ffffff08] space-y-4">
              <p className="text-[10px] font-condensed uppercase tracking-widest text-[#ede8df40]">Custom Size</p>
              <div className="flex items-center gap-4">
                <input 
                  type="number" 
                  value={customWidth} 
                  onChange={(e) => setCustomWidth(parseInt(e.target.value) || 100)}
                  className="w-full px-3 py-2 bg-[#0c0c12] border border-[#ffffff0d] text-[#ede8df] placeholder-[#ede8df20] outline-none focus:border-[#c8a96e]"
                  placeholder="Width"
                />
                <span className="text-[#ede8df40]">×</span>
                <input 
                  type="number" 
                  value={customHeight} 
                  onChange={(e) => setCustomHeight(parseInt(e.target.value) || 100)}
                  className="w-full px-3 py-2 bg-[#0c0c12] border border-[#ffffff0d] text-[#ede8df] placeholder-[#ede8df20] outline-none focus:border-[#c8a96e]"
                  placeholder="Height"
                />
                <button 
                  onClick={() => handleCreateBlank({ name: 'Custom Banner', width: customWidth, height: customHeight, icon: <Monitor className="w-4 h-4" />, category: 'Custom' })}
                  className="px-6 py-2 bg-[#181820] border border-[#ffffff13] text-[#ede8dfbf] font-condensed uppercase tracking-widest hover:border-[#c8a96e] transition-colors whitespace-nowrap"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {allAssets.length === 0 ? (
        <div className="bg-[#111118] border border-[#ffffff0d] p-20 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-[#181820] border border-[#ffffff08] flex items-center justify-center mx-auto mb-6 text-[#c8a96e]">
            <Monitor className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-serif italic text-[#c8a96e] mb-2">No assets generated yet</h3>
          <p className="text-[10px] text-[#ede8df40] font-condensed uppercase tracking-widest mb-8">
            Start by creating a new design from scratch or generate assets in a campaign.
          </p>
          <button 
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-2 bg-[#c8a96e] text-[#080604] font-condensed uppercase tracking-widest font-bold px-8 py-3 hover:bg-[#d4af37] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create First Design
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {allAssets.map((asset) => (
            <div 
              key={asset.id} 
              className="group bg-[#111118] border border-[#ffffff0d] overflow-hidden hover:border-[#c8a96e] transition-colors cursor-pointer flex flex-col"
              onClick={() => onEditAsset(asset.id)}
            >
              <div className="aspect-square bg-[#0c0c12] relative overflow-hidden border-b border-[#ffffff05]">
                <img 
                  src={asset.dataUrl} 
                  alt={asset.name} 
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="bg-[#0c0c12]/80 border border-[#c8a96e] text-[#c8a96e] px-4 py-2 text-[10px] font-condensed font-bold uppercase tracking-widest shadow-lg">Open Editor</span>
                </div>
              </div>
              <div className="p-4 bg-[#181820]">
                <p className="text-[9px] font-condensed font-bold text-[#c8a96e] uppercase tracking-widest mb-2 truncate">{asset.campaignName}</p>
                <h4 className="text-sm font-sans text-[#ede8df] truncate mb-1">{asset.name}</h4>
                <p className="text-[10px] font-mono text-[#ede8df40]">{asset.size.width} × {asset.size.height}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Studio;

