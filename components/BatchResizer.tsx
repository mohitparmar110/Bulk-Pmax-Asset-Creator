import React, { useState, useRef } from 'react';
import { UploadCloud, Download, Image as ImageIcon, CheckCircle2, Loader2, Crop } from 'lucide-react';

const PRESETS = [
  { id: 'ig-sq', name: 'Instagram Square', width: 1080, height: 1080 },
  { id: 'ig-st', name: 'Instagram Story', width: 1080, height: 1920 },
  { id: 'fb-cov', name: 'Facebook Cover', width: 820, height: 312 },
  { id: 'li-ban', name: 'LinkedIn Banner', width: 1584, height: 396 },
  { id: 'tw-hdr', name: 'Twitter Header', width: 1500, height: 500 },
  { id: 'pmax-sq', name: 'Google PMax Square', width: 1200, height: 1200 },
  { id: 'pmax-ls', name: 'Google PMax Landscape', width: 1200, height: 628 },
  { id: 'meta-ls', name: 'Meta Landscape', width: 1920, height: 1080 },
  { id: 'custom', name: 'Custom', width: 0, height: 0 },
];

const BatchResizer: React.FC = () => {
  const [images, setImages] = useState<{ id: string; url: string; name: string; w: number; h: number; status: 'PENDING'|'RESIZING'|'DONE' }[]>([]);
  const [activePreset, setActivePreset] = useState('ig-sq');
  const [cropMode, setCropMode] = useState('smart');
  const [outFormat, setOutFormat] = useState('png');
  const [quality, setQuality] = useState(90);
  const [customW, setCustomW] = useState(1024);
  const [customH, setCustomH] = useState(1024);
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImgs = Array.from(e.target.files as FileList).map(f => {
        const url = URL.createObjectURL(f);
        return {
          id: Math.random().toString(36).substring(7),
          url,
          name: f.name,
          w: 2400, // mock original w
          h: 1600, // mock original h
          status: 'PENDING' as const
        };
      });
      setImages(prev => [...prev, ...newImgs]);
    }
  };

  const processAll = () => {
    setIsProcessing(true);
    setImages(prev => prev.map(img => ({ ...img, status: 'RESIZING' })));
    
    setTimeout(() => {
      setImages(prev => prev.map(img => ({ ...img, status: 'DONE' })));
      setIsProcessing(false);
    }, 2500);
  };

  const currentPreset = PRESETS.find(p => p.id === activePreset);
  const targetW = currentPreset?.id === 'custom' ? customW : currentPreset?.width || 0;
  const targetH = currentPreset?.id === 'custom' ? customH : currentPreset?.height || 0;

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col font-sans">
      <header className="mb-8 border-b border-[#ffffff05] pb-6">
        <h2 className="text-3xl font-serif italic text-[#c8a96e]">Batch Resizer</h2>
        <p className="text-[10px] text-[#ede8df40] mt-2 font-condensed uppercase tracking-widest">INTELLIGENT CROP ENGINE</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 pb-12">
        {/* Left Settings Panel */}
        <div className="lg:w-[400px] shrink-0 space-y-8 sticky top-0">
          
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-10 border-2 border-dashed border-[#ffffff0d] hover:border-[#c8a96e] bg-[#111118] cursor-pointer transition-colors flex flex-col items-center justify-center group"
          >
             <Crop className="w-6 h-6 text-[#ede8df40] group-hover:text-[#c8a96e] transition-colors mb-3" />
             <span className="text-[10px] font-condensed font-bold uppercase tracking-widest text-[#ede8df40] group-hover:text-[#ede8dfbf] transition-colors">
               DROP IMAGES TO RESIZE
             </span>
             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleUpload} />
          </div>

          <div>
            <h3 className="text-[10px] font-condensed uppercase tracking-widest text-[#ede8df40] mb-3">Platform Presets</h3>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setActivePreset(p.id)}
                  className={`p-3 text-left transition-colors border ${activePreset === p.id ? 'bg-[#181820] border-[#c8a96e]' : 'bg-[#111118] border-[#ffffff0d] hover:border-[#ffffff20]'}`}
                >
                  <div className={`text-xs mb-1 ${activePreset === p.id ? 'text-[#c8a96e]' : 'text-[#ede8df]'}`}>{p.name}</div>
                  {p.id !== 'custom' && <div className="text-[10px] text-[#ede8df40] font-mono">{p.width} × {p.height}</div>}
                </button>
              ))}
            </div>
            
            {activePreset === 'custom' && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="text-[10px] font-condensed uppercase tracking-widest text-[#ede8df40] mb-2 block">Width (px)</label>
                  <input type="number" value={customW} onChange={e=>setCustomW(parseInt(e.target.value))} className="w-full bg-[#0c0c12] border border-[#ffffff0d] p-2 text-[#ede8df] outline-none focus:border-[#c8a96e]" />
                </div>
                <div>
                  <label className="text-[10px] font-condensed uppercase tracking-widest text-[#ede8df40] mb-2 block">Height (px)</label>
                  <input type="number" value={customH} onChange={e=>setCustomH(parseInt(e.target.value))} className="w-full bg-[#0c0c12] border border-[#ffffff0d] p-2 text-[#ede8df] outline-none focus:border-[#c8a96e]" />
                </div>
              </div>
            )}
          </div>

          <div>
             <h3 className="text-[10px] font-condensed uppercase tracking-widest text-[#ede8df40] mb-3">Crop Mode</h3>
             <div className="grid grid-cols-2 gap-2">
               {['smart', 'center', 'top', 'face'].map(m => (
                 <button key={m} onClick={()=>setCropMode(m)} className={`py-2 text-[10px] font-condensed uppercase tracking-widest transition-colors ${cropMode === m ? 'bg-[#c8a96e] text-[#080604]' : 'bg-[#1f1f28] border border-[#ffffff08] text-[#ede8df80]'}`}>
                   {m === 'face' ? 'Face Detect' : m === 'smart' ? 'Smart Crop (AI)' : m}
                 </button>
               ))}
             </div>
          </div>

          <div>
             <h3 className="text-[10px] font-condensed uppercase tracking-widest text-[#ede8df40] mb-3">Output Format</h3>
             <div className="grid grid-cols-3 gap-2">
               {['png', 'jpg', 'webp'].map(m => (
                 <button key={m} onClick={()=>setOutFormat(m)} className={`py-2 text-[10px] font-condensed uppercase tracking-widest transition-colors ${outFormat === m ? 'bg-[#c8a96e] text-[#080604]' : 'bg-[#1f1f28] border border-[#ffffff08] text-[#ede8df80]'}`}>
                   {m}
                 </button>
               ))}
             </div>
          </div>
          
          {outFormat !== 'png' && (
            <div>
              <div className="flex justify-between text-[10px] font-condensed uppercase tracking-widest mb-2">
                <span className="text-[#ede8df40]">Quality</span>
                <span className="text-[#c8a96e]">{quality}%</span>
              </div>
              <input type="range" min="60" max="100" value={quality} onChange={e=>setQuality(parseInt(e.target.value))} className="w-full h-1 bg-[#111118] rounded-full appearance-none accent-[#c8a96e]" />
            </div>
          )}

          <div className="space-y-3 pt-4 border-t border-[#ffffff05]">
            <button 
              onClick={processAll}
              disabled={images.length === 0 || isProcessing}
              className="w-full py-4 bg-[#c8a96e] text-[#080604] font-condensed uppercase tracking-widest font-bold hover:bg-[#d4af37] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> RESIZING...</> : 'RESIZE ALL'}
            </button>
            {images.some(img => img.status === 'DONE') && (
               <button className="w-full py-3 bg-[#181820] text-[#ede8dfbf] border border-[#ffffff13] font-condensed uppercase tracking-widest hover:border-[#c8a96e] transition-colors flex items-center justify-center gap-2">
                 <Download className="w-4 h-4" /> DOWNLOAD ZIP
               </button>
            )}
          </div>
        </div>

        {/* Right Output Grid */}
        <div className="flex-1">
          {images.length === 0 ? (
            <div className="h-full min-h-[400px] border border-[#ffffff05] flex items-center justify-center">
               <span className="font-serif italic text-[#ede8df40] text-lg">Upload images to begin batch resize</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {images.map(img => (
                <div key={img.id} className="bg-[#111118] border border-[#ffffff0d] overflow-hidden flex flex-col">
                  <div className="aspect-square relative bg-[#0c0c12]">
                    <img src={img.url} className={`w-full h-full object-cover transition-opacity ${img.status === 'RESIZING' ? 'opacity-30' : ''}`} />
                    
                    {img.status === 'RESIZING' && (
                      <div className="absolute inset-0 flex items-center justify-center p-6">
                         <Loader2 className="w-8 h-8 text-[#c8a96e] animate-spin" />
                      </div>
                    )}

                    <div className="absolute top-2 right-2">
                       <span className={`px-2 py-1 text-[9px] font-condensed uppercase tracking-widest backdrop-blur-md border ${
                         img.status === 'DONE' ? 'bg-[#4db89620] text-[#4db896] border-[#4db896]' :
                         img.status === 'RESIZING' ? 'bg-[#c8a96e20] text-[#c8a96e] border-[#c8a96e]' :
                         'bg-[#ede8df10] text-[#ede8dfbf] border-[#ffffff13]'
                       }`}>
                         {img.status}
                       </span>
                    </div>

                    {img.status === 'DONE' && (
                      <button className="absolute bottom-2 right-2 p-2 bg-[#181820] border border-[#ffffff13] text-[#ede8dfbf] hover:text-[#c8a96e] hover:border-[#c8a96e] transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="p-4 bg-[#181820] border-t border-[#ffffff05]">
                    <p className="text-sm text-[#ede8df] truncate mb-2">{img.name}</p>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-[#ede8df40]">
                       <span>{img.w}×{img.h}</span>
                       <span className="text-[#c8a96e]">→</span>
                       <span className="text-[#c8a96e]">{targetW}×{targetH}</span>
                    </div>
                  </div>
                  {img.status === 'RESIZING' && (
                    <div className="h-1 w-full bg-[#111118]">
                       <div className="h-full bg-[#c8a96e] w-1/2 animate-pulse"></div>
                    </div>
                  )}
                  {img.status === 'DONE' && (
                    <div className="h-1 w-full bg-[#4db896]"></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BatchResizer;
