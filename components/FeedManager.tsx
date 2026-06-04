
import React, { useState } from 'react';
import { useApp } from '../App';

const FeedManager: React.FC = () => {
  const { products, activeBrandId, brands } = useApp();
  const [feedType, setFeedType] = useState('Awin');
  
  const brand = brands.find(b => b.id === activeBrandId);

  const generateCSV = () => {
    if (!brand || products.length === 0) return;

    let headers: string[] = [];
    if (feedType === 'Awin') {
      headers = ['product_id', 'product_name', 'description', 'price', 'currency', 'brand', 'category', 'product_url', 'image_url', 'availability'];
    } else if (feedType === 'Webgains') {
      headers = ['ProductID', 'ProductName', 'ProductDescription', 'Price', 'Currency', 'Brand', 'CategoryName', 'ProductURL', 'ImageURL', 'StockStatus'];
    } else {
      headers = ['id', 'name', 'desc', 'price', 'brand', 'url'];
    }

    const rows = products.filter(p => p.brandId === activeBrandId).map(p => {
      if (feedType === 'Awin') {
        return [p.id, p.name, p.description, p.price, 'GBP', brand.name, brand.industry, 'https://example.com/p/' + p.id, p.processedImageUrl, 'in_stock'];
      }
      return [p.id, p.name, p.description, p.price, brand.name, 'https://example.com/p/' + p.id];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${brand.name.replace(/\s+/g, '_')}_${feedType}_Feed.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-10 border-b border-[#ffffff05] pb-6">
        <h2 className="text-3xl font-serif italic text-[#c8a96e]">Partner Feeds</h2>
        <p className="text-[10px] text-[#ede8df40] mt-2 font-condensed uppercase tracking-widest">Export your product catalog to affiliate networks.</p>
      </header>

      <div className="bg-[#111118] p-8 border border-[#ffffff0d]">
        <div className="max-w-md space-y-8">
          <div>
            <h3 className="block text-[10px] font-condensed uppercase tracking-widest text-[#ede8df40] mb-3">Network Protocol</h3>
            <div className="grid grid-cols-3 gap-2">
              {['Awin', 'Webgains', 'Generic'].map(f => (
                <button 
                  key={f}
                  onClick={() => setFeedType(f)}
                  className={`py-3 text-[10px] font-condensed font-bold uppercase tracking-widest transition-colors ${
                    feedType === f ? 'bg-[#c8a96e] text-[#080604]' : 'bg-[#1f1f28] border border-[#ffffff08] text-[#ede8df80]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#181820] border border-[#ffffff08] p-6 space-y-4 font-sans text-sm">
            <p className="font-condensed uppercase tracking-widest text-[#c8a96e] text-[10px]">Mapping Configuration</p>
            <div className="flex justify-between text-[#ede8df40] text-[10px] uppercase font-condensed tracking-widest border-b border-[#ffffff05] pb-2">
              <span>Internal Field</span>
              <span>Network Target</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#ede8df80]">id</span>
              <span className="text-[#ede8df]">{feedType === 'Webgains' ? 'ProductID' : 'product_id'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#ede8df80]">name</span>
              <span className="text-[#ede8df]">{feedType === 'Webgains' ? 'ProductName' : 'product_name'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#ede8df80]">processedImageUrl</span>
              <span className="text-[#ede8df]">{feedType === 'Webgains' ? 'ImageURL' : 'image_url'}</span>
            </div>
          </div>

          <button 
            onClick={generateCSV}
            className="w-full bg-[#181820] text-[#ede8dfbf] border border-[#ffffff13] py-4 font-condensed uppercase tracking-widest hover:border-[#c8a96e] transition-colors"
          >
            Generate & Download CSV
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedManager;
