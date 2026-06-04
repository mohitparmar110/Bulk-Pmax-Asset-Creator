
import React, { useState, useEffect, createContext, useContext } from 'react';
import { Brand, Product, Campaign, CampaignObjective, BrandTone } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import BrandWizard from './components/BrandWizard';
import ProductManager from './components/ProductManager';
import CampaignManager from './components/CampaignManager';
import Editor from './components/Editor';
import FeedManager from './components/FeedManager';
import PublishManager from './components/PublishManager';
import Studio from './components/Studio';
import ChatBot from './components/ChatBot';
import OmniPost from './components/OmniPost';
import BulkImageUpscaler from './components/BulkImageUpscaler';
import OverlayForge from './components/OverlayForge';
import LifestyleCreator from './components/LifestyleCreator';
import BatchResizer from './components/BatchResizer';
import Login from './components/Login';
import { geminiService } from './services/geminiService';

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

// --- Context & Persistence ---
interface AppState {
  brands: Brand[];
  products: Product[];
  campaigns: Campaign[];
  activeBrandId?: string;
  addBrand: (brand: Brand) => void;
  addProduct: (product: Product) => void;
  addCampaign: (campaign: Campaign) => void;
  updateCampaign: (campaign: Campaign) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};

// --- Main App Component ---
const App: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeBrandId, setActiveBrandId] = useState<string>();
  const [view, setView] = useState('dashboard');
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const has = await window.aistudio.hasSelectedApiKey();
        setHasKey(has);
      } else {
        setHasKey(true); // Fallback if aistudio is not available
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
      await window.aistudio.openSelectKey();
      setHasKey(true);
    }
  };

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('designoir_state');
    if (saved && saved !== "undefined") {
      try {
        const parsed = JSON.parse(saved);
        setBrands(parsed.brands || []);
        setProducts(parsed.products || []);
        setCampaigns(parsed.campaigns || []);
        if (parsed.brands?.length > 0) setActiveBrandId(parsed.brands[0].id);
      } catch (e) {
        console.error("Failed to parse app state:", e);
        seedData();
      }
    } else {
      seedData();
    }
  }, []);

  const seedData = () => {
    // Seed Data
    const demoBrand: Brand = {
      id: 'b1',
      name: 'Noir Luxe',
      description: 'High-end sustainable fashion',
      industry: 'Fashion',
      targetAudience: 'Professionals 25-45',
      tone: BrandTone.LUXURY,
      platforms: ['Instagram', 'Shopify Website', 'Google PMAX'],
      kit: { primaryColor: '#000000', secondaryColor: '#d4af37', fontFamily: 'Inter' }
    };
    setBrands([demoBrand]);
    setActiveBrandId(demoBrand.id);
  };

  useEffect(() => {
    localStorage.setItem('designoir_state', JSON.stringify({ brands, products, campaigns }));
  }, [brands, products, campaigns]);

  const addBrand = (b: Brand) => { setBrands(prev => [...prev, b]); setActiveBrandId(b.id); };
  const addProduct = (p: Product) => setProducts(prev => [...prev, p]);
  const addCampaign = (c: Campaign) => setCampaigns(prev => [...prev, c]);
  const updateCampaign = (c: Campaign) => setCampaigns(prev => prev.map(item => item.id === c.id ? c : item));

  const state: AppState = { brands, products, campaigns, activeBrandId, addBrand, addProduct, addCampaign, updateCampaign };

  const renderView = () => {
    if (editingAssetId) {
      return <Editor assetId={editingAssetId} onClose={() => setEditingAssetId(null)} />;
    }

    switch (view) {
      case 'dashboard': return <Dashboard setView={setView} />;
      case 'brands': return <BrandWizard onComplete={() => setView('dashboard')} />;
      case 'products': return <ProductManager />;
      case 'campaigns': return <CampaignManager onEditAsset={(id) => setEditingAssetId(id)} />;
      case 'studio': return <Studio onEditAsset={(id) => setEditingAssetId(id)} />;
      case 'feeds': return <FeedManager />;
      case 'publish': return <PublishManager />;
      case 'omnipost': return <OmniPost />;
      case 'upscaler': return <BulkImageUpscaler />;
      case 'overlayforge': return <OverlayForge />;
      case 'lifestyle': return <LifestyleCreator />;
      case 'resizer': return <BatchResizer />;
      default: return <Dashboard setView={setView} />;
    }
  };

  return (
    <AppContext.Provider value={state}>
      {!isLoggedIn ? (
        <Login onLogin={() => setIsLoggedIn(true)} />
      ) : !hasKey ? (
        <div className="min-h-screen bg-void flex flex-col items-center justify-center p-4 text-center">
          <div className="w-16 h-16 bg-deep border border-lift flex items-center justify-center text-gold text-4xl font-serif italic mb-6">D</div>
          <h1 className="text-3xl font-serif italic text-gold mb-2">Designoir Space<br/><span className="text-xl text-ink">Your Creative OS</span></h1>
          <p className="text-slate-400 mb-8 max-w-md font-condensed uppercase tracking-widest text-sm">To use the advanced AI generative features, please select your Google Cloud API key.</p>
          <button 
            onClick={handleSelectKey}
            className="bg-gold text-void px-8 py-3 font-condensed uppercase font-bold tracking-widest hover:bg-gold2 transition-colors"
          >
            Select API Key
          </button>
          <p className="mt-8 text-[10px] uppercase font-condensed tracking-widest text-slate-500">
            Need a key? <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-gold hover:text-gold2">Learn about billing</a>
          </p>
        </div>
      ) : (
        <div className="flex h-screen overflow-hidden bg-void">
          <Sidebar activeView={view} setView={setView} />
          <main className={`flex-1 overflow-y-auto ${view === 'overlayforge' ? 'p-0' : 'p-8'}`}>
            {renderView()}
          </main>
          <ChatBot />
        </div>
      )}
    </AppContext.Provider>
  );
};

export default App;
