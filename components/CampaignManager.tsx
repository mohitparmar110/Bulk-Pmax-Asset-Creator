
import React, { useState } from 'react';
import { useApp } from '../App';
import { Campaign, CampaignObjective, CampaignAsset } from '../types';
import { ASSET_SIZES } from '../constants';
import { geminiService } from '../services/geminiService';

const CampaignManager: React.FC<{ onEditAsset: (id: string) => void }> = ({ onEditAsset }) => {
  const { campaigns, products, activeBrandId, brands, addCampaign, updateCampaign } = useApp();
  const [showWizard, setShowWizard] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newCamp, setNewCamp] = useState<Partial<Campaign>>({
    name: '',
    offer: '',
    cta: 'Shop Now',
    objective: CampaignObjective.SALES,
    market: 'International',
    productIds: []
  });

  const activeBrand = brands.find(b => b.id === activeBrandId);

  const startGeneration = async (campaignId: string) => {
    const camp = campaigns.find(c => c.id === campaignId);
    if (!camp || !activeBrand) return;

    setIsGenerating(true);
    updateCampaign({ ...camp, status: 'Generating' });

    // 1. Generate Copy using Gemini
    const copy = await geminiService.generateCampaignCopy(activeBrand, camp);

    // 2. Map Assets based on platforms
    const generatedAssets: CampaignAsset[] = [];
    activeBrand.platforms.forEach(platform => {
      const sizes = ASSET_SIZES[platform] || [];
      sizes.forEach((size, idx) => {
        // Create 3 variations for each size
        for (let v = 1; v <= 3; v++) {
          generatedAssets.push({
            id: `asset-${campaignId}-${platform}-${idx}-${v}`,
            name: `${size.name} V${v}`,
            size: { width: size.width, height: size.height },
            category: size.category,
            variation: v,
            // Simulated render
            dataUrl: 'https://picsum.photos/seed/' + Math.random() + '/' + size.width + '/' + size.height
          });
        }
      });
    });

    updateCampaign({ 
      ...camp, 
      status: 'Ready', 
      assets: generatedAssets,
      pmaxText: {
        headlines: copy.shortHeadlines,
        longHeadlines: copy.longHeadlines,
        descriptions: copy.longDescriptions,
        shortDescriptions: copy.shortDescriptions
      }
    });

    setIsGenerating(false);
  };

  const handleCreate = () => {
    if (!activeBrandId) return;
    const c: Campaign = {
      id: `c-${Date.now()}`,
      brandId: activeBrandId,
      name: newCamp.name || 'Summer Collection',
      offer: newCamp.offer || '20% OFF',
      cta: newCamp.cta || 'Shop Now',
      objective: newCamp.objective || CampaignObjective.SALES,
      market: newCamp.market || 'UK',
      productIds: newCamp.productIds || [],
      status: 'Draft',
      assets: []
    };
    addCampaign(c);
    setShowWizard(false);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold">Campaigns</h2>
          <p className="text-slate-500 text-sm">Create and manage your bulk marketing assets</p>
        </div>
        <button 
          onClick={() => setShowWizard(true)}
          className="bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold"
        >
          New Campaign
        </button>
      </header>

      {showWizard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full">
            <h3 className="text-xl font-bold mb-6">Create Campaign</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Campaign Name</label>
                <input 
                  type="text" className="w-full p-2.5 border rounded-lg"
                  value={newCamp.name}
                  onChange={e => setNewCamp({...newCamp, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Core Offer</label>
                <input 
                  type="text" className="w-full p-2.5 border rounded-lg" placeholder="e.g. End of Season - 30% OFF"
                  value={newCamp.offer}
                  onChange={e => setNewCamp({...newCamp, offer: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Primary CTA</label>
                  <input 
                    type="text" className="w-full p-2.5 border rounded-lg"
                    value={newCamp.cta}
                    onChange={e => setNewCamp({...newCamp, cta: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Objective</label>
                  <select 
                    className="w-full p-2.5 border rounded-lg"
                    value={newCamp.objective}
                    onChange={e => setNewCamp({...newCamp, objective: e.target.value as CampaignObjective})}
                  >
                    {Object.values(CampaignObjective).map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Select Products</label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg">
                  {products.map(p => (
                    <label key={p.id} className="flex items-center gap-2 text-xs">
                      <input 
                        type="checkbox" 
                        checked={newCamp.productIds?.includes(p.id)}
                        onChange={(e) => {
                          const ids = newCamp.productIds || [];
                          setNewCamp({...newCamp, productIds: e.target.checked ? [...ids, p.id] : ids.filter(id => id !== p.id)});
                        }}
                      />
                      {p.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowWizard(false)} className="flex-1 px-4 py-2 border rounded-lg font-semibold">Cancel</button>
              <button onClick={handleCreate} className="flex-1 px-4 py-2 bg-black text-white rounded-lg font-semibold">Create Draft</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {campaigns.map(c => (
          <div key={c.id} className="bg-white border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-lg font-bold">{c.name}</h3>
                <p className="text-sm text-slate-500">{c.offer} • {c.objective}</p>
              </div>
              <div className="flex items-center gap-3">
                {c.status === 'Draft' && (
                  <button 
                    onClick={() => startGeneration(c.id)}
                    disabled={isGenerating}
                    className="bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:bg-slate-500"
                  >
                    {isGenerating ? 'Generating Assets...' : 'Generate Assets'}
                  </button>
                )}
                {c.status === 'Ready' && (
                  <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">
                    Download All (ZIP)
                  </button>
                )}
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  c.status === 'Ready' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {c.status}
                </span>
              </div>
            </div>

            <div className="p-6">
              {c.assets.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  {c.status === 'Generating' ? 'AI is creating your assets... please wait.' : 'Assets not yet generated.'}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {c.assets.slice(0, 12).map(a => (
                    <div key={a.id} className="group relative">
                      <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden border">
                        <img src={a.dataUrl} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                          <button 
                            onClick={() => onEditAsset(a.id)}
                            className="bg-white text-black text-[10px] font-bold px-3 py-1 rounded shadow"
                          >
                            EDIT
                          </button>
                          <span className="text-[10px] text-white text-center px-2">{a.name}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {c.assets.length > 12 && (
                    <div className="aspect-square bg-slate-50 border rounded-lg flex items-center justify-center text-slate-400 font-bold text-sm">
                      +{c.assets.length - 12} more
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {c.pmaxText && (
              <div className="p-6 border-t bg-slate-50">
                <h4 className="font-bold text-sm mb-4">Google PMAX Text Bundle</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 border rounded-xl text-xs">
                    <p className="font-bold mb-2">Headlines (Short)</p>
                    <ul className="space-y-1 list-disc pl-4 text-slate-600">
                      {c.pmaxText.headlines.slice(0, 5).map((h, i) => <li key={i}>{h}</li>)}
                    </ul>
                  </div>
                  <div className="bg-white p-4 border rounded-xl text-xs">
                    <p className="font-bold mb-2">Descriptions</p>
                    <ul className="space-y-1 list-disc pl-4 text-slate-600">
                      {c.pmaxText.descriptions.slice(0, 5).map((d, i) => <li key={i}>{d}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CampaignManager;
