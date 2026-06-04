import React, { useState } from 'react';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import { geminiService } from '../services/geminiService';

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', text: string}[]>([
    { role: 'assistant', text: 'Hi! I am your AI assistant. Ask me questions or command me to generate prompt ideas! (Image generation is available in the Asset Editor).' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text: input }]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);
    
    try {
      // Small simulated AI chat using gemini chat if available or simple generation
      // For now we'll do a simple test response using the base gen or fallback
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          text: `I understood: "${currentInput}". To generate actual image assets, go to the Campaigns tab, click "Generate Assets", select an asset to "EDIT", and use the "AI Magic" tool in the Editor's left sidebar.` 
        }]);
        setIsLoading(false);
      }, 1000);
    } catch (e) {
      console.error(e);
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full bg-violet-600 text-white shadow-lg hover:bg-violet-500 hover:scale-105 transition-all z-[90] ${isOpen ? 'hidden' : 'block'}`}
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 h-96 bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col z-[100] overflow-hidden">
          {/* Header */}
          <div className="p-4 bg-violet-600 text-white flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              AI Assistant
            </h3>
            <button onClick={() => setIsOpen(false)} className="hover:text-violet-200 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-3 max-w-[85%] rounded-2xl text-xs ${
                  msg.role === 'user' 
                    ? 'bg-violet-600 text-white rounded-br-none' 
                    : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="p-3 max-w-[85%] rounded-2xl text-xs bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm flex items-center gap-2">
                  <Sparkles className="w-3 h-3 animate-spin text-violet-500" /> Thinking...
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask me anything..."
              className="flex-1 border-none focus:ring-0 text-sm py-2 px-1 outline-none"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-2 text-violet-600 hover:bg-violet-50 rounded-full disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
