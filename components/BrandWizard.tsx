
import React, { useState } from 'react';
import { useApp } from '../App';
import { Brand, BrandTone, BrandKit } from '../types';
import { PLATFORMS } from '../constants';

const BrandWizard: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { addBrand } = useApp();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Brand>>({
    name: '',
    description: '',
    industry: '',
    targetAudience: '',
    tone: BrandTone.MINIMAL,
    platforms: [],
    kit: {
      primaryColor: '#000000',
      secondaryColor: '#ffffff',
      fontFamily: 'Inter'
    }
  });

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleFinish = () => {
    const newBrand: Brand = {
      ...formData,
      id: `br-${Date.now()}`,
    } as Brand;
    addBrand(newBrand);
    onComplete();
  };

  const updateKit = (updates: Partial<BrandKit>) => {
    setFormData(prev => ({ ...prev, kit: { ...prev.kit!, ...updates } }));
  };

  const togglePlatform = (p: string) => {
    setFormData(prev => {
      const current = prev.platforms || [];
      return {
        ...prev,
        platforms: current.includes(p) ? current.filter(x => x !== p) : [...current, p]
      };
    });
  };

  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="flex items-center gap-4 mb-12">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
              step >= i ? 'bg-black text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              {i}
            </div>
            {i < 3 && <div className={`w-12 h-0.5 ${step > i ? 'bg-black' : 'bg-slate-200'}`}></div>}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="animate-in fade-in duration-500">
          <h2 className="text-2xl font-bold mb-6">Tell us about your brand</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Brand Name</label>
              <input 
                type="text" 
                className="w-full p-2.5 border rounded-lg" 
                placeholder="e.g. Noir Luxe"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea 
                className="w-full p-2.5 border rounded-lg h-24" 
                placeholder="What do you do?"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Industry</label>
                <input 
                  type="text" 
                  className="w-full p-2.5 border rounded-lg" 
                  value={formData.industry}
                  onChange={e => setFormData({ ...formData, industry: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tone of Voice</label>
                <select 
                  className="w-full p-2.5 border rounded-lg"
                  value={formData.tone}
                  onChange={e => setFormData({ ...formData, tone: e.target.value as BrandTone })}
                >
                  {Object.values(BrandTone).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>
          <button onClick={nextStep} className="mt-8 bg-black text-white px-6 py-2.5 rounded-lg font-semibold w-full">Next</button>
        </div>
      )}

      {step === 2 && (
        <div className="animate-in slide-in-from-right duration-500">
          <h2 className="text-2xl font-bold mb-6">Visual Identity</h2>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Primary Color</label>
                <input 
                  type="color" 
                  className="w-full h-12 p-1 border rounded-lg"
                  value={formData.kit?.primaryColor}
                  onChange={e => updateKit({ primaryColor: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Secondary Color</label>
                <input 
                  type="color" 
                  className="w-full h-12 p-1 border rounded-lg"
                  value={formData.kit?.secondaryColor}
                  onChange={e => updateKit({ secondaryColor: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Logo URL (Demo)</label>
              <input 
                type="text" 
                className="w-full p-2.5 border rounded-lg"
                placeholder="https://example.com/logo.png"
                value={formData.kit?.logoUrl}
                onChange={e => updateKit({ logoUrl: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-4 mt-8">
            <button onClick={prevStep} className="flex-1 border p-2.5 rounded-lg font-semibold">Back</button>
            <button onClick={nextStep} className="flex-2 bg-black text-white px-6 py-2.5 rounded-lg font-semibold w-full">Next</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="animate-in slide-in-from-right duration-500">
          <h2 className="text-2xl font-bold mb-6">Platform Selection</h2>
          <p className="text-sm text-slate-500 mb-6">Select where you plan to run your campaigns. We'll generate assets for these platforms.</p>
          <div className="grid grid-cols-2 gap-3">
            {PLATFORMS.map(p => (
              <label key={p} className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${
                formData.platforms?.includes(p) ? 'border-black bg-slate-50' : 'border-slate-200'
              }`}>
                <input 
                  type="checkbox" 
                  className="w-4 h-4"
                  checked={formData.platforms?.includes(p)}
                  onChange={() => togglePlatform(p)}
                />
                <span className="text-sm">{p}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-4 mt-8">
            <button onClick={prevStep} className="flex-1 border p-2.5 rounded-lg font-semibold">Back</button>
            <button onClick={handleFinish} className="flex-2 bg-black text-white px-6 py-2.5 rounded-lg font-semibold w-full">Finish Onboarding</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandWizard;
