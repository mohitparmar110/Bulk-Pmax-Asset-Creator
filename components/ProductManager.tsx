
import React, { useState, useRef } from 'react';
import { useApp } from '../App';
import { Product } from '../types';
import { UploadCloud, Image as ImageIcon, ShoppingBag, CheckCircle2 } from 'lucide-react';

const ProductManager: React.FC = () => {
  const { products, activeBrandId, addProduct } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [newProd, setNewProd] = useState({ name: '', price: 0, description: '', imageUrl: '' });
  const [dragActive, setDragActive] = useState(false);
  const [isConnectingShopify, setIsConnectingShopify] = useState(false);
  const [shopifyConnected, setShopifyConnected] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAdd = async () => {
    if (!activeBrandId) return;
    setIsProcessing(true);
    
    // Simulate background removal / upscale processing
    await new Promise(r => setTimeout(r, 2000));

    const p: Product = {
      id: `p-${Date.now()}`,
      brandId: activeBrandId,
      name: newProd.name || 'Untitled Product',
      price: newProd.price,
      description: newProd.description,
      originalImageUrl: newProd.imageUrl || 'https://picsum.photos/400/400',
      processedImageUrl: newProd.imageUrl || 'https://picsum.photos/400/400'
    };

    addProduct(p);
    setNewProd({ name: '', price: 0, description: '', imageUrl: '' });
    setShowAdd(false);
    setIsProcessing(false);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setNewProd({ ...newProd, imageUrl: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConnectShopify = async () => {
    setIsConnectingShopify(true);
    // Simulate Shopify connection and fetching products
    await new Promise(r => setTimeout(r, 1500));
    
    // Auto-fill some mocked products
    const mockedProducts = [
      { name: 'Premium Leather Bag', price: 129, imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=600&auto=format&fit=crop' },
      { name: 'Minimalist Watch', price: 199, imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600&auto=format&fit=crop' }
    ];

    if (activeBrandId) {
      mockedProducts.forEach((mp, i) => {
        addProduct({
          id: `p-shopify-${Date.now()}-${i}`,
          brandId: activeBrandId,
          name: mp.name,
          price: mp.price,
          description: 'Imported from Shopify',
          originalImageUrl: mp.imageUrl,
          processedImageUrl: mp.imageUrl
        });
      });
    }

    setIsConnectingShopify(false);
    setShopifyConnected(true);
    
    setTimeout(() => {
      setShopifyConnected(false);
    }, 3000);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold">Products</h2>
          <p className="text-slate-500 text-sm">Manage items for your campaigns</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleConnectShopify}
            disabled={isConnectingShopify || shopifyConnected}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              shopifyConnected 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            {shopifyConnected ? (
              <><CheckCircle2 className="w-4 h-4" /> Connected</>
            ) : isConnectingShopify ? (
              <><ShoppingBag className="w-4 h-4 animate-bounce" /> Connecting...</>
            ) : (
              <><ShoppingBag className="w-4 h-4" /> Connect Shopify</>
            )}
          </button>
          <button 
            onClick={() => setShowAdd(true)}
            className="bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold"
          >
            Add Product
          </button>
        </div>
      </header>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-xl font-bold mb-6">New Product</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Product Name</label>
                <input 
                  type="text" className="w-full p-2.5 border rounded-lg" 
                  value={newProd.name}
                  onChange={e => setNewProd({...newProd, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price</label>
                <input 
                  type="number" className="w-full p-2.5 border rounded-lg" 
                  value={newProd.price}
                  onChange={e => setNewProd({...newProd, price: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Product Image</label>
                <div 
                  className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl overflow-hidden transition-colors ${
                    dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleChange} 
                  />
                  
                  {newProd.imageUrl ? (
                    <div className="absolute inset-0">
                      <img src={newProd.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <span className="text-white text-sm font-semibold">Click to replace</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                      <p className="text-sm font-medium text-slate-600">Click or drag & drop</p>
                      <p className="text-xs text-slate-400 mt-1">SVG, PNG, JPG (max. 5MB)</p>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-[1px] flex-1 bg-slate-200"></div>
                <span className="text-xs text-slate-400 font-medium">OR URL</span>
                <div className="h-[1px] flex-1 bg-slate-200"></div>
              </div>
              <div>
                <input 
                  type="text" className="w-full p-2.5 border rounded-lg text-sm" placeholder="https://..."
                  value={newProd.imageUrl}
                  onChange={e => setNewProd({...newProd, imageUrl: e.target.value})}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setShowAdd(false)}
                className="flex-1 px-4 py-2 border rounded-lg text-sm font-semibold"
              >
                Cancel
              </button>
              <button 
                onClick={handleAdd}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-black text-white rounded-lg text-sm font-semibold disabled:bg-slate-400"
              >
                {isProcessing ? 'Processing...' : 'Save Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map(p => (
          <div key={p.id} className="bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <img src={p.processedImageUrl || p.originalImageUrl} alt={p.name} className="w-full h-48 object-cover bg-slate-100" />
            <div className="p-4">
              <h4 className="font-semibold text-slate-900">{p.name}</h4>
              <p className="text-slate-500 text-sm mt-1">${p.price}</p>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <div className="col-span-full py-20 border-2 border-dashed rounded-2xl text-center text-slate-400">
            No products found. Add your first product to get started.
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductManager;
