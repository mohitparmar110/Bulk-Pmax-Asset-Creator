import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, Download, Settings2, Sparkles, Loader2, Camera, MapPin, Home } from 'lucide-react';

const LifestyleCreator: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [sceneStyle, setSceneStyle] = useState('outdoor');
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [bgBlur, setBgBlur] = useState(false);
  const [shadow, setShadow] = useState(true);
  const [model, setModel] = useState('gemini-1.5-pro');

  const SCENES = [
    { id: 'outdoor', name: 'Outdoor Lifestyle', desc: 'Natural sunlight, blurred nature bg', icon: <MapPin className="w-4 h-4" /> },
    { id: 'studio', name: 'Studio White', desc: 'Clean, professional e-commerce', icon: <Camera className="w-4 h-4" /> },
    { id: 'urban', name: 'Urban Street', desc: 'Edgy, concrete, city lighting', icon: <MapPin className="w-4 h-4" /> },
    { id: 'luxury', name: 'Luxury Interior', desc: 'Warm lights, marble textures', icon: <Home className="w-4 h-4" /> },
  ];

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setImage(url);
    }
  };

  const generateScene = async () => {
    if (!image) return;
    setIsGenerating(true);
    // Simulate generation
    setTimeout(() => {
      setGeneratedImage(`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt || 'luxurious lifestyle photography of product')}?width=1024&height=1024&nologo=true&seed=${Math.random()}`);
      setIsGenerating(false);
    }, 2000);
  };

  const queue = [
    { name: 'product_front.png', style: 'Luxury Interior', status: 'QUEUED' },
    { name: 'product_side.png', style: 'Outdoor Lifestyle', status: 'DONE' },
  ];

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col font-sans">
      <header className="mb-8 border-b border-[#ffffff05] pb-6">
        <h2 className="text-3xl font-serif italic text-[#c8a96e]">Lifestyle Creator</h2>
        <p className="text-[10px] text-[#ede8df40] mt-2 font-condensed uppercase tracking-widest">AI SCENE COMPOSITOR</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 mb-8">
        {/* Left Panel */}
        <div className="flex-1 space-y-8">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-16 border-2 border-dashed border-[#ffffff0d] hover:border-[#c8a96e] bg-[#111118] cursor-pointer transition-colors flex flex-col items-center justify-center group"
          >
             <UploadCloud className="w-8 h-8 text-[#ede8df40] group-hover:text-[#c8a96e] transition-colors mb-4" />
             <span className="text-[10px] font-condensed font-bold uppercase tracking-widest text-[#ede8df40] group-hover:text-[#ede8dfbf] transition-colors">
               DROP PRODUCT IMAGES HERE
             </span>
             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUpload} />
          </div>

          <div>
            <h3 className="text-[10px] font-condensed uppercase tracking-widest text-[#ede8df40] mb-4">Select Scene Style</h3>
            <div className="grid grid-cols-2 gap-4">
              {SCENES.map(s => (
                <div 
                  key={s.id}
                  onClick={() => setSceneStyle(s.id)}
                  className={`p-4 cursor-pointer transition-all ${sceneStyle === s.id ? 'bg-[#181820] border border-[#c8a96e]' : 'bg-[#111118] border border-[#ffffff0d] hover:border-[#ffffff20]'}`}
                >
                  <div className={`mb-3 ${sceneStyle === s.id ? 'text-[#c8a96e]' : 'text-[#ede8df40]'}`}>{s.icon}</div>
                  <h4 className="font-serif italic text-[#ede8df] text-lg mb-1">{s.name}</h4>
                  <p className="text-[10px] text-[#ede8df40] font-sans">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-condensed uppercase tracking-widest text-[#ede8df40] mb-4">Scene Prompt (Optional)</h3>
            <textarea 
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Describe the scene or leave blank for auto..."
              className="w-full bg-[#0c0c12] border border-[#ffffff0d] text-[#ede8df] placeholder-[#ede8df20] p-4 font-sans outline-none focus:border-[#c8a96e] min-h-[100px] resize-none"
            />
          </div>

          <div className="flex flex-wrap gap-4 items-center">
             <button onClick={() => setBgBlur(!bgBlur)} className={`px-4 py-2 text-[10px] font-condensed uppercase tracking-widest transition-colors ${bgBlur ? 'bg-[#c8a96e] text-[#080604]' : 'bg-[#1f1f28] border border-[#ffffff08] text-[#ede8df80]'}`}>
               Background Blur
             </button>
             <button onClick={() => setShadow(!shadow)} className={`px-4 py-2 text-[10px] font-condensed uppercase tracking-widest transition-colors ${shadow ? 'bg-[#c8a96e] text-[#080604]' : 'bg-[#1f1f28] border border-[#ffffff08] text-[#ede8df80]'}`}>
               Drop Shadow Drop
             </button>
             <div className="h-6 w-[1px] bg-[#ffffff05]"></div>
             <button onClick={() => setModel('gemini-1.5-pro')} className={`px-4 py-2 text-[10px] font-condensed uppercase tracking-widest transition-colors ${model === 'gemini-1.5-pro' ? 'bg-[#c8a96e] text-[#080604]' : 'bg-[#1f1f28] border border-[#ffffff08] text-[#ede8df80]'}`}>
               Gemini 1.5 Pro
             </button>
             <button onClick={() => setModel('gemini-2.0-flash')} className={`px-4 py-2 text-[10px] font-condensed uppercase tracking-widest transition-colors ${model === 'gemini-2.0-flash' ? 'bg-[#c8a96e] text-[#080604]' : 'bg-[#1f1f28] border border-[#ffffff08] text-[#ede8df80]'}`}>
               Gemini 2.0 Flash
             </button>
          </div>

          <button 
            onClick={generateScene}
            disabled={!image || isGenerating}
            className="w-full py-4 bg-[#c8a96e] text-[#080604] font-condensed uppercase tracking-widest font-bold disabled:opacity-50 hover:bg-[#d4af37] transition-colors flex items-center justify-center gap-2"
          >
            {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" /> COMPOSITING SCENE...</> : 'GENERATE SCENE'}
          </button>
        </div>

        {/* Right Panel */}
        <div className="lg:w-[400px] xl:w-[500px] shrink-0 flex flex-col">
          <h3 className="text-[10px] font-condensed uppercase tracking-widest text-[#ede8df40] mb-4">PREVIEW</h3>
          
          <div className="flex-1 bg-[#111118] border border-[#ffffff0d] relative overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
            {!generatedImage ? (
              <span className="font-serif italic text-[#ede8df40] text-lg">No scene generated yet</span>
            ) : (
              <>
                <img src={generatedImage} alt="Generated scene" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                  <a href={generatedImage} target="_blank" rel="noreferrer" className="px-6 py-2 border border-[#c8a96e] bg-[#0c0c12]/80 text-[#c8a96e] font-condensed uppercase tracking-widest hover:bg-[#c8a96e] hover:text-[#080604] transition-colors">
                    DOWNLOAD
                  </a>
                </div>
              </>
            )}
          </div>
          
          {generatedImage && (
            <div className="grid grid-cols-3 gap-4 mt-4 border border-[#ffffff08] bg-[#181820] p-4">
              <div>
                <p className="text-[9px] font-condensed uppercase tracking-widest text-[#ede8df40]">STYLE</p>
                <p className="text-xs text-[#ede8df] mt-1 font-sans">{SCENES.find(s=>s.id===sceneStyle)?.name}</p>
              </div>
              <div>
                <p className="text-[9px] font-condensed uppercase tracking-widest text-[#ede8df40]">MODEL</p>
                <p className="text-xs text-[#ede8df] mt-1 font-sans">{model}</p>
              </div>
              <div>
                <p className="text-[9px] font-condensed uppercase tracking-widest text-[#ede8df40]">TIME</p>
                <p className="text-xs text-[#ede8df] mt-1 font-sans">2.4s</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 border-t border-[#ffffff05] pt-8 pb-12">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[10px] font-condensed uppercase tracking-widest text-[#ede8df40]">BATCH QUEUE</h3>
          <button className="px-6 py-2 bg-[#c8a96e] text-[#080604] font-condensed uppercase tracking-widest text-[10px] font-bold hover:bg-[#d4af37] transition-colors">
            GENERATE ALL
          </button>
        </div>
        
        <div className="bg-[#111118] border border-[#ffffff0d] overflow-hidden">
          <table className="w-full text-left font-sans text-sm">
            <thead>
              <tr className="border-b border-[#ffffff05]">
                <th className="px-6 py-4 text-[10px] font-condensed uppercase tracking-widest text-[#ede8df40]">File</th>
                <th className="px-6 py-4 text-[10px] font-condensed uppercase tracking-widest text-[#ede8df40]">Style</th>
                <th className="px-6 py-4 text-[10px] font-condensed uppercase tracking-widest text-[#ede8df40]">Status</th>
                <th className="px-6 py-4 text-[10px] font-condensed uppercase tracking-widest text-[#ede8df40] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ffffff05]">
              {queue.map((q, i) => (
                <tr key={i} className="hover:bg-[#ffffff03] transition-colors">
                  <td className="px-6 py-4 text-[#ede8df]">{q.name}</td>
                  <td className="px-6 py-4 text-[#ede8df80]">{q.style}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-[9px] font-condensed uppercase tracking-widest ${q.status === 'DONE' ? 'bg-[#4db89620] text-[#4db896]' : 'bg-[#c8a96e20] text-[#c8a96e]'}`}>
                      {q.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-[#ede8df40] hover:text-[#c8a96e] text-[10px] font-condensed uppercase tracking-widest transition-colors">
                      REMOVE
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LifestyleCreator;
