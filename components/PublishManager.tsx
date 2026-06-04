
import React, { useState } from 'react';
import { useApp } from '../App';

const PublishManager: React.FC = () => {
  const { campaigns } = useApp();
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    if (!webhookUrl || !selectedCampaign) return;
    setIsPublishing(true);
    
    // Simulate API call to publisher
    try {
      const camp = campaigns.find(c => c.id === selectedCampaign);
      const payload = {
        campaign: camp?.name,
        caption,
        assetsCount: camp?.assets.length,
        timestamp: new Date().toISOString()
      };
      
      console.log("Publishing to Webhook:", webhookUrl, payload);
      await new Promise(r => setTimeout(r, 1500));
      alert("Successfully published campaign data to webhook!");
    } catch (e) {
      alert("Failed to publish.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto font-sans h-full flex flex-col">
      <header className="mb-10 border-b border-[#ffffff05] pb-6">
        <h2 className="text-3xl font-serif italic text-[#c8a96e]">Publish Assets</h2>
        <p className="text-[10px] text-[#ede8df40] mt-2 font-condensed uppercase tracking-widest">Connect your channels and schedule your campaigns.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-[#111118] p-8 border border-[#ffffff0d] space-y-6">
          <h3 className="text-[10px] font-condensed uppercase tracking-widest text-[#ede8df40] mb-3">Social Connectors</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-[#ffffff08] bg-[#181820]">
              <div className="flex items-center gap-4">
                <span className="text-2xl opacity-50 grayscale">📸</span>
                <div>
                  <p className="text-sm text-[#ede8df]">Instagram</p>
                  <p className="text-[10px] text-[#ede8df40] font-condensed uppercase tracking-widest">Not Connected</p>
                </div>
              </div>
              <button className="text-[10px] bg-[#1f1f28] border border-[#ffffff08] text-[#ede8df80] px-4 py-2 font-condensed font-bold uppercase tracking-widest hover:border-[#c8a96e] transition-colors">Connect</button>
            </div>
            <div className="flex items-center justify-between p-4 border border-[#ffffff08] bg-[#181820]">
              <div className="flex items-center gap-4">
                <span className="text-2xl opacity-50 grayscale">🔗</span>
                <div>
                  <p className="text-sm text-[#ede8df]">LinkedIn</p>
                  <p className="text-[10px] text-[#ede8df40] font-condensed uppercase tracking-widest">Not Connected</p>
                </div>
              </div>
              <button className="text-[10px] bg-[#1f1f28] border border-[#ffffff08] text-[#ede8df80] px-4 py-2 font-condensed font-bold uppercase tracking-widest hover:border-[#c8a96e] transition-colors">Connect</button>
            </div>
            <div className="p-4 border border-[#c8a96e] bg-[#181820]">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-2xl opacity-80">🪝</span>
                <div>
                  <p className="text-sm text-[#ede8df]">Webhook Publisher</p>
                  <p className="text-[10px] text-[#c8a96e] font-condensed uppercase tracking-widest">Active Provider</p>
                </div>
              </div>
              <input 
                type="text" 
                placeholder="https://your-webhook.com/endpoint"
                className="w-full p-3 bg-[#0c0c12] border border-[#ffffff0d] text-[#ede8df] placeholder-[#ede8df20] outline-none focus:border-[#c8a96e] font-mono text-xs"
                value={webhookUrl}
                onChange={e => setWebhookUrl(e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="bg-[#111118] p-8 border border-[#ffffff0d] space-y-6 flex flex-col">
          <h3 className="text-[10px] font-condensed uppercase tracking-widest text-[#ede8df40] mb-3">Quick Publisher</h3>
          <div className="space-y-6 flex-1 flex flex-col">
            <div>
              <label className="block text-[10px] font-condensed uppercase tracking-widest text-[#ede8df40] mb-3">Select Campaign</label>
              <select 
                className="w-full p-3 bg-[#0c0c12] border border-[#ffffff0d] text-[#ede8df] outline-none focus:border-[#c8a96e] font-sans text-sm appearance-none"
                value={selectedCampaign}
                onChange={e => setSelectedCampaign(e.target.value)}
              >
                <option value="">Choose a campaign...</option>
                {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex-1 flex flex-col">
              <label className="block text-[10px] font-condensed uppercase tracking-widest text-[#ede8df40] mb-3">AI Caption Assistant</label>
              <textarea 
                className="w-full flex-1 min-h-[120px] p-4 bg-[#0c0c12] border border-[#ffffff0d] text-[#ede8df] placeholder-[#ede8df20] outline-none focus:border-[#c8a96e] font-sans text-sm resize-none"
                placeholder="Write your campaign caption..."
                value={caption}
                onChange={e => setCaption(e.target.value)}
              />
            </div>
            <button 
              onClick={handlePublish}
              disabled={isPublishing || !webhookUrl}
              className="w-full bg-[#c8a96e] text-[#080604] py-4 font-condensed uppercase tracking-widest font-bold hover:bg-[#d4af37] disabled:opacity-50 transition-colors"
            >
              {isPublishing ? 'PUBLISHING...' : 'PUBLISH TO CHANNELS'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PublishManager;
