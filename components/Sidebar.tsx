
import React from 'react';

interface SidebarProps {
  activeView: string;
  setView: (v: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setView }) => {
  const wsItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'all-tools', label: 'All Tools' },
  ];

  const toolItems = [
    { id: 'overlayforge', label: 'OverlayForge' },
    { id: 'omnipost', label: 'OmniPost' },
    { id: 'upscaler', label: 'Image Upscaler' },
    { id: 'lifestyle', label: 'Lifestyle Creator' },
    { id: 'resizer', label: 'Batch Resizer' },
    { id: 'campaigns', label: 'Campaigns' },
    { id: 'studio', label: 'Studio' },
    { id: 'feeds', label: 'Feeds' },
    { id: 'publish', label: 'Publish' },
  ];

  const brandItems = [
    { id: 'products', label: 'Products' },
    { id: 'brands', label: 'Brands' },
  ];

  const renderNavButton = (item: {id: string, label: string}) => {
    const isActive = activeView === item.id;
    return (
      <button
        key={item.id}
        onClick={() => setView(item.id)}
        className={`w-full flex items-center px-4 py-2 text-sm transition-all border-l-2 ${
          isActive 
            ? 'border-gold text-gold bg-lift' 
            : 'border-transparent text-slate-400 hover:text-ink hover:bg-hover'
        }`}
      >
        <span className="font-medium tracking-wide">{item.label}</span>
      </button>
    );
  };

  return (
    <aside className="w-64 bg-surface border-r border-lift flex flex-col shrink-0">
      <div className="p-6">
        <h1 className="text-2xl flex items-center gap-2">
          <span className="w-8 h-8 rounded flex items-center justify-center bg-deep border border-lift">
            <span className="font-serif italic text-gold text-xl leading-none">D</span>
          </span>
          <span className="font-condensed font-bold tracking-widest uppercase text-ink">
            esignoir <span className="text-slate-500">Space</span>
          </span>
        </h1>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 space-y-6">
        <div>
          <p className="px-6 text-[10px] font-condensed font-bold text-gold/60 uppercase tracking-widest mb-2">Workspace</p>
          {wsItems.map(renderNavButton)}
        </div>

        <div>
          <p className="px-6 text-[10px] font-condensed font-bold text-gold/60 uppercase tracking-widest mb-2">Tools</p>
          {toolItems.map(renderNavButton)}
        </div>

        <div>
          <p className="px-6 text-[10px] font-condensed font-bold text-gold/60 uppercase tracking-widest mb-2">Brand Assets</p>
          {brandItems.map(renderNavButton)}
        </div>
      </nav>

      <div className="p-6 border-t border-lift bg-deep mt-auto">
        <div className="flex justify-between items-center mb-2">
          <span className="font-condensed font-bold uppercase tracking-widest text-[10px] text-gold text-opacity-80">Pro Plan</span>
          <span className="text-xs text-slate-400">4,200 / 5k</span>
        </div>
        <div className="w-full h-1 bg-lift rounded-full overflow-hidden mb-4">
          <div className="h-full bg-gold w-[84%]"></div>
        </div>
        <button className="w-full py-2 bg-lift hover:bg-hover text-ink border border-lift hover:border-gold transition-colors rounded text-xs font-condensed font-bold uppercase tracking-widest">
          Upgrade
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
