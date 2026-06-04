import React, { useState, useRef } from 'react';
import { UploadCloud, Sparkles, Send, Calendar, Clock, Smile, Hash, Facebook, Twitter, Instagram, Linkedin, Youtube, AlertCircle, Copy, Check, Table, Download, Image as ImageIcon } from 'lucide-react';
import { geminiService } from '../services/geminiService'; // Assume we use this for the caption generation
import { useApp } from '../App';

type Platform = 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'tiktok' | 'youtube' | 'pinterest';

const OmniPost: React.FC = () => {
  const { activeBrandId, brands } = useApp();
  const currentBrand = brands.find(b => b.id === activeBrandId);

  const [textContent, setTextContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<Platform>>(new Set(['instagram', 'twitter']));
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [showPreview, setShowPreview] = useState<Platform | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const platforms: { id: Platform, name: string, icon: React.ReactNode, maxChars: number }[] = [
    { id: 'instagram', name: 'Instagram', icon: <Instagram className="w-4 h-4" />, maxChars: 2200 },
    { id: 'twitter', name: 'Twitter/X', icon: <Twitter className="w-4 h-4" />, maxChars: 280 },
    { id: 'facebook', name: 'Facebook', icon: <Facebook className="w-4 h-4" />, maxChars: 63206 },
    { id: 'linkedin', name: 'LinkedIn', icon: <Linkedin className="w-4 h-4" />, maxChars: 3000 },
    { id: 'tiktok', name: 'TikTok', icon: <span className="font-bold">♪</span>, maxChars: 2200 },
    { id: 'youtube', name: 'YouTube', icon: <Youtube className="w-4 h-4" />, maxChars: 5000 },
    { id: 'pinterest', name: 'Pinterest', icon: <span className="font-bold">P</span>, maxChars: 500 },
  ];

  const handleTogglePlatform = (platform: Platform) => {
    const next = new Set(selectedPlatforms);
    if (next.has(platform)) {
      next.delete(platform);
    } else {
      next.add(platform);
    }
    setSelectedPlatforms(next);
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setMediaUrl(url);
    }
  };

  const generateCaptions = async () => {
    setIsGenerating(true);
    try {
      // Very simple mock generation, ideally using gemini.
      // E.g.: await geminiService.generateCampaignCopy(...)
      await new Promise(r => setTimeout(r, 1500));
      const platformNames = Array.from(selectedPlatforms).map(p => platforms.find(pl => pl.id === p)?.name).join(', ');
      
      let generated = `Discover the latest from ${currentBrand?.name || 'our brand'}! ✨ We are thrilled to share this with you.\n\n#${currentBrand?.name?.replace(/\s/g,'')} #${currentBrand?.industry?.replace(/\s/g,'')} #NewRelease #Trending\n\nLink in bio for more! 🚀`;
      
      if (selectedPlatforms.has('twitter')) {
        generated = `Just dropped something huge for ${currentBrand?.name || 'our brand'} ✨🔥 \n\nCheck it out now: [Link] #${currentBrand?.industry?.replace(/\s/g,'')}`;
      }
      
      setTextContent(generated);
    } catch (e) {
      console.error(e);
    }
    setIsGenerating(false);
  };

  const handleSchedule = async () => {
    if (!textContent && !mediaUrl) return;
    setIsScheduling(true);
    await new Promise(r => setTimeout(r, 1000));
    alert(`Post scheduled for ${selectedPlatforms.size} platforms on ${scheduleDate || 'now'}!`);
    setIsScheduling(false);
    setTextContent('');
    setMediaUrl(null);
  };

  // Select the lowest char limit among selected to show warning
  const selectedMaxChars = Math.min(...Array.from(selectedPlatforms).map(p => platforms.find(pl => pl.id === p)?.maxChars || 99999));
  const charsUsed = textContent.length;
  const isOverLimit = charsUsed > selectedMaxChars;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <header className="flex justify-between items-center mb-8 border-b border-lift pb-6">
        <div>
          <h2 className="text-3xl font-serif italic text-gold flex items-center gap-3">
            <Send className="w-6 h-6" /> OmniPost
          </h2>
          <p className="text-slate-400 text-sm mt-2 font-condensed uppercase tracking-widest">Surgical multi-channel deployment</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-surface border border-lift px-6 py-3 text-center">
            <p className="text-[10px] font-condensed font-bold text-slate-500 uppercase tracking-widest">Total Reach</p>
            <p className="text-2xl font-serif text-ink">1.2M</p>
          </div>
          <div className="bg-surface border border-gold px-6 py-3 text-center">
            <p className="text-[10px] font-condensed font-bold text-gold uppercase tracking-widest">Scheduled</p>
            <p className="text-2xl font-serif text-gold">14</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6">
        {/* Composer Column */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="bg-surface border border-lift overflow-hidden">
            
            {/* Platforms */}
            <div className="p-6 border-b border-lift bg-deep">
               <p className="text-[#c8a96e] text-[10px] font-condensed font-bold uppercase tracking-widest mb-3">Select Platforms</p>
               <div className="flex flex-wrap gap-2">
                 {platforms.map(platform => (
                   <button
                     key={platform.id}
                     onClick={() => handleTogglePlatform(platform.id)}
                     className={`flex items-center gap-2 px-4 py-2 text-xs font-condensed font-bold uppercase tracking-widest transition-all border ${
                       selectedPlatforms.has(platform.id) 
                         ? 'bg-gold text-void border-gold' 
                         : 'bg-surface border-lift text-slate-400 hover:border-gold hover:text-ink'
                     }`}
                   >
                     {platform.icon}
                     <span className="hidden sm:inline">{platform.name}</span>
                   </button>
                 ))}
               </div>
            </div>

            {/* Media Upload */}
            <div className="p-8 border-b border-lift bg-surface">
              {mediaUrl ? (
                <div className="relative border border-lift inline-block group">
                  <img src={mediaUrl} alt="Post media" className="h-48 object-cover" />
                  <button 
                    onClick={() => setMediaUrl(null)}
                    className="absolute inset-0 bg-void/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <span className="text-xs font-condensed font-bold uppercase tracking-widest px-4 py-2 border border-white">Remove</span>
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-12 border-2 border-dashed border-lift hover:border-gold bg-deep transition-colors flex flex-col items-center justify-center gap-4 text-slate-500 group"
                >
                  <ImageIcon className="w-8 h-8 group-hover:text-gold transition-colors" />
                  <span className="text-[10px] font-condensed font-bold uppercase tracking-widest group-hover:text-ink">Click to upload photo or video</span>
                </button>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleMediaUpload} />
            </div>

            {/* Text Area */}
            <div className="p-8 relative bg-surface">
              <textarea 
                value={textContent}
                onChange={e => setTextContent(e.target.value)}
                placeholder="What do you want to share with your audience?"
                className="w-full outline-none resize-none bg-transparent text-ink text-lg placeholder:text-slate-600 min-h-[150px] font-sans"
              />
              
              <div className="flex justify-between items-end mt-4">
                <div className="flex gap-4">
                  <button className="text-slate-500 hover:text-gold transition-colors">
                    <Smile className="w-5 h-5" />
                  </button>
                  <button className="text-slate-500 hover:text-gold transition-colors">
                    <Hash className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={generateCaptions}
                    disabled={isGenerating || selectedPlatforms.size === 0}
                    className="flex items-center gap-2 px-4 py-2 border border-gold text-gold text-[10px] font-condensed font-bold uppercase tracking-widest hover:bg-gold hover:text-void transition-colors disabled:opacity-50"
                  >
                    <Sparkles className="w-3 h-3" />
                    {isGenerating ? 'Writing...' : 'AI Magic Write'}
                  </button>
                </div>
                
                <div className={`text-[10px] font-condensed font-bold tracking-widest ${isOverLimit ? 'text-err' : 'text-slate-500'}`}>
                  {charsUsed} / {selectedMaxChars !== 99999 ? selectedMaxChars : '∞'}
                </div>
              </div>
            </div>

            {/* Footer / Scheduling */}
            <div className="p-6 bg-deep border-t border-lift flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input 
                    type="date" 
                    value={scheduleDate}
                    onChange={e => setScheduleDate(e.target.value)}
                    className="pl-10 pr-3 py-2 text-xs font-condensed tracking-wider bg-surface border border-lift text-ink outline-none focus:border-gold"
                  />
                </div>
                <div className="relative">
                  <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input 
                    type="time" 
                    value={scheduleTime}
                    onChange={e => setScheduleTime(e.target.value)}
                    className="pl-10 pr-3 py-2 text-xs font-condensed tracking-wider bg-surface border border-lift text-ink outline-none focus:border-gold"
                  />
                </div>
              </div>
              
              <button 
                onClick={handleSchedule}
                disabled={isScheduling || selectedPlatforms.size === 0 || (!textContent && !mediaUrl) || isOverLimit}
                className="bg-gold text-void px-8 py-3 text-xs font-condensed font-bold uppercase tracking-widest hover:bg-gold2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isScheduling ? 'Scheduling...' : scheduleDate ? 'Schedule Post' : 'Post Now'}
              </button>
            </div>
            
          </div>
        </div>

        {/* Sidebar / Preview Column */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-deep border border-lift p-8 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5 text-gold">
               <Sparkles className="w-32 h-32" />
             </div>
             <h3 className="text-xl font-serif italic text-gold mb-4 flex items-center gap-2">
               Content Coach
             </h3>
             <ul className="space-y-4 mt-6 text-sm text-slate-400 relative z-10 font-sans">
               <li className="flex gap-3 items-start"><Check className="w-4 h-4 text-ok shrink-0 mt-0.5" /> Avoid linking away directly on LinkedIn; add links in comments.</li>
               <li className="flex gap-3 items-start"><Check className="w-4 h-4 text-ok shrink-0 mt-0.5" /> Instagram Reels perform 300% better than static images right now.</li>
               <li className="flex gap-3 items-start"><Check className="w-4 h-4 text-ok shrink-0 mt-0.5" /> Keep TikTok captions extremely short with 3-5 high-volume hashtags.</li>
             </ul>
          </div>

          <div className="bg-surface border border-lift overflow-hidden">
            <div className="p-4 border-b border-lift bg-deep">
              <h3 className="text-[10px] font-condensed font-bold uppercase tracking-widest text-gold">Platform Preview</h3>
            </div>
            <div className="p-8 flex flex-col items-center justify-center min-h-[300px] text-center space-y-4">
               {mediaUrl ? (
                 <div className="w-full max-w-[280px] bg-deep border border-lift shadow-2xl overflow-hidden text-left">
                   <div className="p-4 flex items-center gap-3 border-b border-lift">
                     <div className="w-8 h-8 bg-surface border border-lift rounded-full"></div>
                     <div className="flex-1">
                       <div className="w-20 h-2 bg-lift mb-1.5"></div>
                       <div className="w-12 h-2 bg-surface"></div>
                     </div>
                   </div>
                   <img src={mediaUrl} className="w-full aspect-square object-cover" alt="Preview"/>
                   <div className="p-4 text-sm text-ink whitespace-pre-wrap break-words font-sans">
                     {textContent || "Your caption here..."}
                   </div>
                 </div>
               ) : (
                 <div className="text-slate-500 font-condensed uppercase tracking-widest text-sm">
                   <p>Add media or text to see preview</p>
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Post Queue Table */}
      <div className="bg-surface border border-lift overflow-hidden mt-8">
        <div className="p-6 border-b border-lift bg-deep flex justify-between items-center">
          <h3 className="font-serif italic text-gold text-2xl">Upcoming Queue</h3>
          <button className="text-[10px] font-condensed font-bold uppercase tracking-widest text-slate-400 hover:text-gold flex items-center gap-2">
            <Table className="w-3 h-3" /> Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans">
            <thead className="bg-deep text-[#c8a96e] text-[10px] uppercase tracking-widest font-condensed border-b border-lift">
              <tr>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Content</th>
                <th className="px-6 py-4">Platforms</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-lift">
              <tr className="hover:bg-hover transition-colors">
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 text-[10px] font-condensed font-bold uppercase tracking-widest border border-warn text-warn">Scheduled</span>
                </td>
                <td className="px-6 py-4 max-w-xs truncate text-sm text-slate-300">Ready for our huge winter sale?! ❄️🧥...</td>
                <td className="px-6 py-4 flex gap-3 text-slate-400">
                  <Instagram className="w-4 h-4" />
                  <Facebook className="w-4 h-4" />
                </td>
                <td className="px-6 py-4 text-sm text-slate-300">Tomorrow, 10:00 AM</td>
              </tr>
              <tr className="hover:bg-hover transition-colors">
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 text-[10px] font-condensed font-bold uppercase tracking-widest border border-ok text-ok">Published</span>
                </td>
                <td className="px-6 py-4 max-w-xs truncate text-sm text-slate-300">Behind the scenes with the team 👋...</td>
                <td className="px-6 py-4 flex gap-3 text-slate-400">
                  <Linkedin className="w-4 h-4" />
                  <Twitter className="w-4 h-4" />
                </td>
                <td className="px-6 py-4 text-sm text-slate-300">Today, 9:00 AM</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default OmniPost;
