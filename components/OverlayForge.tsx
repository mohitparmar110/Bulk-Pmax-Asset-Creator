import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, Plus, Settings, Download, Trash2, ArrowLeft, ArrowRight, Eye, Check } from 'lucide-react';

interface Brand { id: string; name: string; color: string; }
interface BrandImage { id: string; brandId: string; name: string; dataUrl: string; width: number; height: number; }
interface OverlayData { [sizeKey: string]: string; } 
interface LabelConfig { text: string; size: number; pos: 'bottom-left'|'bottom-center'|'bottom-right'|'top-left'|'top-center'|'top-right'|'center'; weight: string; color: string; pad: number; shadow: 'none'|'soft'|'strong'; }

const SIZES = [
  { key: '1200x1200', w: 1200, h: 1200, type: 'PMAX', label: 'Square' },
  { key: '1200x628', w: 1200, h: 628, type: 'PMAX', label: 'Landscape' },
  { key: '960x1200', w: 960, h: 1200, type: 'PMAX', label: 'Portrait' },
  { key: '1920x1080', w: 1920, h: 1080, type: 'META', label: 'Landscape' },
  { key: '1080x1920', w: 1080, h: 1920, type: 'META', label: 'Story/Reel' },
  { key: '1080x1080', w: 1080, h: 1080, type: 'META', label: 'Square' },
];

const DEFAULT_LABEL: LabelConfig = {
  text: 'EXCLUSIVE OFFER',
  size: 52,
  pos: 'bottom-center',
  weight: '700',
  color: '#ffffff',
  pad: 48,
  shadow: 'soft'
};

const COLORS = ['#c8a96e', '#d95f5f', '#4db896', '#c98a3a', '#5f8bd9', '#9b5fd9'];

const OverlayForge: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [images, setImages] = useState<BrandImage[]>([]);
  const [overlays, setOverlays] = useState<Record<string, OverlayData>>({}); // brandId -> sizeKey -> dataUrl
  const [labels, setLabels] = useState<Record<string, LabelConfig>>({}); // brandId -> LabelConfig

  const [activeBrandId, setActiveBrandId] = useState<string | null>(null);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const overlayInputRefs = useRef<Record<string, HTMLInputElement>>({});
  
  const [exportFormat, setExportFormat] = useState<'png'|'jpeg'>('png');
  const [exportProgress, setExportProgress] = useState(0);
  const [exportLogs, setExportLogs] = useState<string[]>([]);
  const [exportStats, setExportStats] = useState({ done: 0, skipped: 0 });
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const b = localStorage.getItem('of_brands');
    if(b) setBrands(JSON.parse(b));
    const i = localStorage.getItem('of_images');
    if(i) setImages(JSON.parse(i));
    const o = localStorage.getItem('of_overlays');
    if(o) setOverlays(JSON.parse(o));
    const l = localStorage.getItem('of_labels');
    if(l) setLabels(JSON.parse(l));
  }, []);

  useEffect(() => {
    localStorage.setItem('of_brands', JSON.stringify(brands));
    localStorage.setItem('of_images', JSON.stringify(images));
    localStorage.setItem('of_overlays', JSON.stringify(overlays));
    localStorage.setItem('of_labels', JSON.stringify(labels));
  }, [brands, images, overlays, labels]);

  const activeBrand = brands.find(b => b.id === activeBrandId);
  const brandImages = images.filter(i => i.brandId === activeBrandId);
  const brandOverlays = activeBrandId ? (overlays[activeBrandId] || {}) : {};
  const brandLabel = activeBrandId ? (labels[activeBrandId] || DEFAULT_LABEL) : DEFAULT_LABEL;

  const handleCreateBrand = () => {
    const id = Math.random().toString(36).substr(2, 9);
    const newBrand: Brand = {
      id,
      name: `Brand ${brands.length + 1}`,
      color: COLORS[brands.length % COLORS.length]
    };
    setBrands([...brands, newBrand]);
  };

  const handleDeleteBrand = () => {
    if(!activeBrandId) return;
    if(!confirm("Delete this brand and all its images/overlays?")) return;
    setBrands(brands.filter(b => b.id !== activeBrandId));
    setImages(images.filter(i => i.brandId !== activeBrandId));
    const newO = {...overlays}; delete newO[activeBrandId]; setOverlays(newO);
    const newL = {...labels}; delete newL[activeBrandId]; setLabels(newL);
    setActiveBrandId(null);
  };

  const handleUploadImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    if(!activeBrandId || !e.target.files) return;
    const files = Array.from(e.target.files) as File[];
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const newImg: BrandImage = {
            id: Math.random().toString(36).substr(2, 9),
            brandId: activeBrandId,
            name: file.name,
            dataUrl,
            width: img.width,
            height: img.height
          };
          setImages(prev => [...prev, newImg]);
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleUploadOverlay = (sizeKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if(!activeBrandId || !e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    if(file.type !== 'image/png') { alert("Overlays must be PNG files with transparency."); return; }
    
    const targetSize = SIZES.find(s => s.key === sizeKey);
    if (!targetSize) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        if(img.width !== targetSize.w || img.height !== targetSize.h) {
          alert(`Warning: Uploaded overlay is ${img.width}x${img.height}. Expected ${targetSize.w}x${targetSize.h}. It will be stretched.`);
        }
        setOverlays(prev => ({
          ...prev,
          [activeBrandId]: {
            ...(prev[activeBrandId] || {}),
            [sizeKey]: dataUrl
          }
        }));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteImage = (id: string) => {
    setImages(images.filter(i => i.id !== id));
  };

  const drawLabel = (ctx: CanvasRenderingContext2D, canvasW: number, canvasH: number, conf: LabelConfig) => {
    if(!conf.text) return;
    ctx.font = `${conf.weight} ${conf.size}px "Barlow Condensed"`;
    ctx.fillStyle = conf.color;
    ctx.textBaseline = 'top';
    
    if(conf.shadow === 'strong') {
      ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 10; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 4;
    } else if(conf.shadow === 'soft') {
      ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 4; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 2;
    } else {
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
    }

    const m = ctx.measureText(conf.text);
    const tw = m.width;
    const th = conf.size; // rough
    
    let x = 0; let y = 0;
    const pad = conf.pad;

    if(conf.pos.includes('left')) x = pad;
    else if(conf.pos.includes('right')) x = canvasW - tw - pad;
    else x = (canvasW - tw) / 2;

    if(conf.pos.includes('top')) y = pad;
    else if(conf.pos.includes('bottom')) y = canvasH - th - pad;
    else y = (canvasH - th) / 2;

    ctx.fillText(conf.text, x, y);
    ctx.shadowColor = 'transparent'; // reset
  };

  const handleExport = async () => {
    if(!activeBrandId || !activeBrand) return;
    setIsExporting(true);
    setExportProgress(0);
    setExportLogs([]);
    setExportStats({ done: 0, skipped: 0 });

    try {
      // @ts-ignore
      const jszip = new window.JSZip();
      
      let done = 0; let skipped = 0;
      const total = brandImages.length;
      
      const log = (msg: string) => setExportLogs(prev => [...prev, msg]);
      
      for(let i = 0; i < brandImages.length; i++) {
        const img = brandImages[i];
        const sizeKey = `${img.width}x${img.height}`;
        const overlayData = brandOverlays[sizeKey];
        
        if(!SIZES.find(s => s.key === sizeKey)) {
          log(`Skipped ${img.name}: Unsupported dimension ${sizeKey}`);
          skipped++;
          setExportProgress(((i+1)/total)*100);
          continue;
        }

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if(!ctx) continue;

        // Draw base image
        const baseImg = new Image();
        await new Promise(resolve => { baseImg.onload = resolve; baseImg.src = img.dataUrl; });
        ctx.drawImage(baseImg, 0, 0);

        // Draw overlay if exists
        if(overlayData) {
          const overImg = new Image();
          await new Promise(resolve => { overImg.onload = resolve; overImg.src = overlayData; });
          ctx.drawImage(overImg, 0, 0, img.width, img.height);
        }

        // Draw Label
        drawLabel(ctx, img.width, img.height, brandLabel);

        // To blob
        const formatStr = exportFormat === 'jpeg' ? 'image/jpeg' : 'image/png';
        const ext = exportFormat === 'jpeg' ? 'jpg' : 'png';
        
        const blob = await new Promise<Blob|null>(resolve => canvas.toBlob(resolve, formatStr, 0.95));
        
        if(blob) {
          jszip.folder(sizeKey)?.file(img.name.replace(/\.[^/.]+$/, "") + `_forged.${ext}`, blob);
          log(`Processed ${img.name} -> ${sizeKey}`);
          done++;
        }

        setExportProgress(((i+1)/total)*100);
      }
      
      setExportStats({ done, skipped });
      log('Zipping files...');
      const content = await jszip.generateAsync({type:"blob"});
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeBrand.name.replace(/\s+/g, '_')}_Forged.zip`;
      a.click();
      log('Download complete.');
    } catch(err: any) {
       setExportLogs(prev => [...prev, `ERROR: ${err.message}`]);
    }
    setIsExporting(false);
  };

  const renderLabelModal = () => {
    if(!isLabelModalOpen || !activeBrandId) return null;
    const l = labels[activeBrandId] || DEFAULT_LABEL;
    const update = (changes: Partial<LabelConfig>) => setLabels({...labels, [activeBrandId]: {...l, ...changes}});
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/90 backdrop-blur-sm p-4">
        <div className="bg-surface border border-lift p-8 w-full max-w-4xl relative shadow-2xl flex flex-col md:flex-row gap-8">
          <button onClick={()=>setIsLabelModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-ink">✕</button>
          
          <div className="flex-1 space-y-6">
            <div>
              <h2 className="text-2xl font-serif italic text-gold mb-1">Global Label Engine</h2>
              <p className="text-slate-400 text-xs font-condensed uppercase tracking-widest">Apply semantic overlays instantly</p>
            </div>
            
            <div>
              <label className="block text-[10px] font-condensed font-bold text-gold uppercase tracking-widest mb-1.5">Label Text</label>
              <input type="text" value={l.text} onChange={e => update({text: e.target.value})} className="w-full bg-deep border border-lift p-2 text-ink outline-none focus:border-gold" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-condensed font-bold text-gold uppercase tracking-widest mb-1.5">Font Size (px)</label>
                <input type="number" value={l.size} onChange={e => update({size: parseInt(e.target.value)})} className="w-full bg-deep border border-lift p-2 text-ink outline-none focus:border-gold" />
              </div>
              <div>
                <label className="block text-[10px] font-condensed font-bold text-gold uppercase tracking-widest mb-1.5">Padding (px)</label>
                <input type="number" value={l.pad} onChange={e => update({pad: parseInt(e.target.value)})} className="w-full bg-deep border border-lift p-2 text-ink outline-none focus:border-gold" />
              </div>
              <div>
                <label className="block text-[10px] font-condensed font-bold text-gold uppercase tracking-widest mb-1.5">Weight</label>
                <select value={l.weight} onChange={e => update({weight: e.target.value})} className="w-full bg-deep border border-lift p-2 text-ink outline-none focus:border-gold">
                  <option value="400">Regular 400</option><option value="600">Semibold 600</option>
                  <option value="700">Bold 700</option><option value="900">Black 900</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-condensed font-bold text-gold uppercase tracking-widest mb-1.5">Drop Shadow</label>
                <select value={l.shadow} onChange={e => update({shadow: e.target.value as any})} className="w-full bg-deep border border-lift p-2 text-ink outline-none focus:border-gold">
                  <option value="none">None</option><option value="soft">Soft</option><option value="strong">Strong</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-condensed font-bold text-gold uppercase tracking-widest mb-1.5">Position</label>
                <select value={l.pos} onChange={e => update({pos: e.target.value as any})} className="w-full bg-deep border border-lift p-2 text-ink outline-none focus:border-gold">
                  <option value="top-left">Top Left</option><option value="top-center">Top Center</option><option value="top-right">Top Right</option>
                  <option value="center">Center</option>
                  <option value="bottom-left">Bottom Left</option><option value="bottom-center">Bottom Center</option><option value="bottom-right">Bottom Right</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-[10px] font-condensed font-bold text-gold uppercase tracking-widest mb-1.5">Color</label>
              <div className="flex gap-2">
                <input type="color" value={l.color} onChange={e => update({color: e.target.value})} className="h-8 w-16 bg-deep border border-lift" />
                <input type="text" value={l.color} onChange={e => update({color: e.target.value})} className="flex-1 bg-deep border border-lift p-1.5 text-ink outline-none focus:border-gold" />
              </div>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col">
            <label className="block text-[10px] font-condensed font-bold text-gold uppercase tracking-widest mb-1.5">Live Preview</label>
            <div className="flex-1 bg-deep border border-lift relative overflow-hidden flex items-center justify-center min-h-[300px]">
               <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
               {/* Simulate the text drawing based on position */}
               <div className="absolute inset-0 flex" style={{
                  padding: `${l.pad}px`,
                  justifyContent: l.pos.includes('left') ? 'flex-start' : l.pos.includes('right') ? 'flex-end' : 'center',
                  alignItems: l.pos.includes('top') ? 'flex-start' : l.pos.includes('bottom') ? 'flex-end' : 'center'
               }}>
                  <div style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: l.weight,
                    fontSize: `${Math.min(l.size, 100)}px`, // cap for preview
                    color: l.color,
                    textShadow: l.shadow === 'strong' ? '0 4px 10px rgba(0,0,0,0.8)' : l.shadow === 'soft' ? '0 2px 4px rgba(0,0,0,0.4)' : 'none',
                    lineHeight: 1
                  }}>{l.text || 'Preview'}</div>
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderExportModal = () => {
    if(!isExportModalOpen || !activeBrandId) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/90 backdrop-blur-sm p-4">
        <div className="bg-surface border border-lift p-8 w-full max-w-lg shadow-2xl">
          <h2 className="text-2xl font-serif italic text-gold mb-2">Export Batch</h2>
          <p className="text-slate-400 text-sm mb-6">Process all matched images with overlays and labels.</p>
          
          <div className="flex gap-4 mb-6">
             <button onClick={()=>setExportFormat('png')} className={`flex-1 py-3 text-xs font-condensed font-bold uppercase tracking-widest border transition-all ${exportFormat === 'png' ? 'border-gold text-gold bg-deep' : 'border-lift text-slate-500 hover:text-ink hover:border-surface'}`}>PNG Output</button>
             <button onClick={()=>setExportFormat('jpeg')} className={`flex-1 py-3 text-xs font-condensed font-bold uppercase tracking-widest border transition-all ${exportFormat === 'jpeg' ? 'border-gold text-gold bg-deep' : 'border-lift text-slate-500 hover:text-ink hover:border-surface'}`}>JPG Output</button>
          </div>

          <div className="mb-4">
             <div className="h-2 w-full bg-deep rounded-full overflow-hidden">
                <div className="h-full bg-gold transition-all duration-300" style={{width:`${exportProgress}%`}}></div>
             </div>
             <div className="flex justify-between mt-2 text-xs text-slate-400 font-condensed tracking-wider">
               <span>{Math.round(exportProgress)}%</span>
               <span>{exportStats.done} Processed / {exportStats.skipped} Skipped</span>
             </div>
          </div>

          <div className="bg-deep border border-lift p-3 h-32 overflow-y-auto text-xs text-slate-500 font-mono mb-6">
            {exportLogs.map((log, i) => <div key={i}>{log}</div>)}
            {!exportLogs.length && "Awaiting export..."}
          </div>

          <div className="flex justify-end gap-4">
            <button onClick={()=>setIsExportModalOpen(false)} disabled={isExporting} className="px-6 py-2 text-xs font-condensed font-bold uppercase tracking-widest text-slate-400 hover:text-ink">Close</button>
            <button onClick={handleExport} disabled={isExporting || brandImages.length === 0} className="px-6 py-2 text-xs font-condensed font-bold uppercase tracking-widest bg-gold text-void disabled:opacity-50 hover:bg-gold2 transition-colors">
              {isExporting ? 'Processing...' : 'Run Export'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if(!activeBrandId) {
    return (
      <div className="h-full flex flex-col">
        <header className="p-8 border-b border-lift bg-surface flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-serif italic text-gold">OverlayForge</h1>
            <p className="text-slate-400 mt-1">Select a brand folder to manage compositing flows.</p>
          </div>
          <button onClick={handleCreateBrand} className="px-6 py-2 border border-gold text-gold text-xs font-condensed font-bold uppercase tracking-widest hover:bg-gold hover:text-void transition-colors">
            + New Brand
          </button>
        </header>

        <div className="p-8 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 content-start">
          {brands.map(b => (
            <div key={b.id} className="bg-surface border border-lift hover:border-gold transition-colors group cursor-pointer" onClick={() => setActiveBrandId(b.id)}>
              <div className="h-1 w-full" style={{backgroundColor: b.color}}></div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-4 h-4 rounded-full" style={{backgroundColor: b.color}}></div>
                  <h3 className="text-lg font-medium">{b.name}</h3>
                </div>
                <div className="text-xs font-condensed text-gold uppercase tracking-widest mb-6">
                  {images.filter(i => i.brandId === b.id).length} Source Images
                </div>
                <div className="grid grid-cols-2 gap-2 h-20 overflow-hidden opacity-50 group-hover:opacity-100 transition-opacity">
                  {images.filter(i => i.brandId === b.id).slice(0,4).map(i => (
                    <img key={i.id} src={i.dataUrl} className="w-full h-full object-cover bg-deep" />
                  ))}
                </div>
              </div>
            </div>
          ))}
          {brands.length === 0 && (
            <div className="col-span-full py-20 text-center text-slate-500">
               No brand folders yet. Click 'New Brand' to start.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col font-sans">
      <header className="flex items-center justify-between p-4 px-8 border-b border-lift bg-surface">
        <div className="flex items-center gap-4">
          <button onClick={() => setActiveBrandId(null)} className="p-2 border border-lift text-slate-400 hover:text-gold hover:border-gold transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-3 h-3 rounded-full" style={{backgroundColor: activeBrand?.color}}></div>
          <h2 className="text-xl font-medium">{activeBrand?.name}</h2>
          <span className="text-xs font-condensed uppercase tracking-widest text-slate-500 bg-deep px-2 py-0.5 ml-2">
            {brandImages.length} Images
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsLabelModalOpen(true)} className="px-4 py-2 border border-lift text-xs font-condensed font-bold uppercase tracking-widest text-slate-400 hover:text-gold hover:border-surface transition-colors flex items-center gap-2">
            <Settings className="w-3 h-3" /> Label Config
          </button>
          <button onClick={handleDeleteBrand} className="px-4 py-2 border border-lift text-xs font-condensed font-bold uppercase tracking-widest text-err hover:bg-err/10 transition-colors">
            Delete Form
          </button>
          <button onClick={() => setIsExportModalOpen(true)} className="px-6 py-2 bg-gold text-void text-xs font-condensed font-bold uppercase tracking-widest hover:bg-gold2 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" /> Export Assets
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 space-y-12">
        {/* Images Upload Section */}
        <section>
          <div className="flex justify-between items-end border-b border-lift pb-2 mb-6">
            <h3 className="font-serif italic text-gold text-2xl">Source Canvas</h3>
          </div>
          
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-lift hover:border-gold bg-surface hover:bg-hover transition-all py-16 flex flex-col items-center justify-center mb-6 cursor-pointer group"
          >
            <UploadCloud className="w-8 h-8 text-slate-500 group-hover:text-gold mb-4 transition-colors" />
            <p className="font-condensed text-sm text-slate-400 uppercase tracking-widest group-hover:text-ink">Drop product / lifestyle images here or click to browse</p>
            <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleUploadImages} />
          </div>

          {brandImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {brandImages.map(img => (
                <div key={img.id} className="relative group aspect-square bg-deep border border-lift">
                  <img src={img.dataUrl} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-void/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center">
                     <p className="text-[10px] font-condensed uppercase text-gold tracking-widest truncate w-full">{img.width}x{img.height}</p>
                     <button onClick={()=>handleDeleteImage(img.id)} className="w-8 h-8 rounded-full bg-err text-white flex items-center justify-center mt-2 hover:scale-110 transition-transform"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* PMAX Overlays */}
        <section>
           <div className="flex items-center gap-4 border-b border-lift pb-2 mb-6 cursor-default">
             <h3 className="font-serif italic text-gold text-2xl">PMax Master Plates</h3>
             <span className="h-[1px] flex-1 bg-lift"></span>
           </div>
           
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             {SIZES.filter(s => s.type === 'PMAX').map(size => {
                const overlayData = brandOverlays[size.key];
                return (
                  <div key={size.key} className="bg-surface border border-lift flex flex-col">
                    <div className="p-4 border-b border-lift flex justify-between items-center bg-deep">
                      <div>
                        <div className="text-xs font-condensed font-bold uppercase tracking-widest text-ink">{size.label}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{size.w} × {size.h}</div>
                      </div>
                      <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 border ${overlayData ? 'text-ok border-ok/30 bg-ok/10' : 'text-slate-500 border-lift'}`}>
                        {overlayData ? 'Ready' : 'Pending'}
                      </span>
                    </div>
                    <div className="p-6 flex-1 flex flex-col items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-20 relative">
                       {overlayData ? (
                         <img src={overlayData} className="max-w-full max-h-48 object-contain drop-shadow-2xl" />
                       ) : (
                         <div className="text-slate-600 text-[10px] font-condensed font-bold uppercase tracking-widest border border-dashed border-lift p-4 flex flex-col items-center">
                            <span>Requires Transparent PNG</span>
                            <span>{size.w}x{size.h}</span>
                         </div>
                       )}
                    </div>
                    <div className="p-4 border-t border-lift">
                      <button 
                        onClick={() => {
                          const el = document.getElementById(`overlay-upload-${size.key}`);
                          if(el) el.click();
                        }}
                        className="w-full py-2 border border-gold text-gold text-xs font-condensed font-bold uppercase tracking-widest hover:bg-gold hover:text-void transition-colors"
                      >
                        {overlayData ? 'Replace Plate' : 'Upload Plate'}
                      </button>
                      <input id={`overlay-upload-${size.key}`} type="file" className="hidden" accept="image/png" onChange={(e) => handleUploadOverlay(size.key, e)} />
                    </div>
                  </div>
                );
             })}
           </div>
        </section>

        {/* META Overlays */}
        <section>
           <div className="flex items-center gap-4 border-b border-lift pb-2 mb-6 cursor-default">
             <h3 className="font-serif italic text-gold text-2xl">Meta Master Plates</h3>
             <span className="h-[1px] flex-1 bg-lift"></span>
           </div>
           
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             {SIZES.filter(s => s.type === 'META').map(size => {
                const overlayData = brandOverlays[size.key];
                return (
                  <div key={size.key} className="bg-surface border border-lift flex flex-col">
                    <div className="p-4 border-b border-lift flex justify-between items-center bg-deep">
                      <div>
                        <div className="text-xs font-condensed font-bold uppercase tracking-widest text-ink">{size.label}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{size.w} × {size.h}</div>
                      </div>
                      <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 border ${overlayData ? 'text-ok border-ok/30 bg-ok/10' : 'text-slate-500 border-lift'}`}>
                        {overlayData ? 'Ready' : 'Pending'}
                      </span>
                    </div>
                    <div className="p-6 flex-1 flex flex-col items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-20 relative">
                       {overlayData ? (
                         <img src={overlayData} className="max-w-full max-h-48 object-contain drop-shadow-2xl" />
                       ) : (
                         <div className="text-slate-600 text-[10px] font-condensed font-bold uppercase tracking-widest border border-dashed border-lift p-4 flex flex-col items-center">
                            <span>Requires Transparent PNG</span>
                            <span>{size.w}x{size.h}</span>
                         </div>
                       )}
                    </div>
                    <div className="p-4 border-t border-lift">
                      <button 
                        onClick={() => {
                          const el = document.getElementById(`overlay-upload-${size.key}`);
                          if(el) el.click();
                        }}
                        className="w-full py-2 border border-gold text-gold text-xs font-condensed font-bold uppercase tracking-widest hover:bg-gold hover:text-void transition-colors"
                      >
                        {overlayData ? 'Replace Plate' : 'Upload Plate'}
                      </button>
                      <input id={`overlay-upload-${size.key}`} type="file" className="hidden" accept="image/png" onChange={(e) => handleUploadOverlay(size.key, e)} />
                    </div>
                  </div>
                );
             })}
           </div>
        </section>

      </div>

      {renderLabelModal()}
      {renderExportModal()}
    </div>
  );
};

export default OverlayForge;
