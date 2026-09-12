import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Sparkles, BrainCircuit, X, MessageSquare, 
  Image as ImageIcon, Loader2, Bot, User 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'model';
  parts: { text?: string; inlineData?: any }[];
  isThinking?: boolean;
}

export default function SmartAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      parts: [{ text: 'مرحباً بك! أنا المساعد الذكي لمجوهرات بابل. يمكنك طرح أي استفسار حول الجرد أو إرفاق صورة لتحليلها بدقة.' }]
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [useHighThinking, setUseHighThinking] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      parts: []
    };

    if (input.trim()) {
      userMessage.parts.push({ text: input });
    }

    if (selectedImage) {
      // Extract base64 part
      const cleanBase64 = selectedImage.replace(/^data:image\/\w+;base64,/, "");
      userMessage.parts.push({ 
        inlineData: { mimeType: 'image/jpeg', data: cleanBase64 }
      });
    }

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSelectedImage(null);
    setLoading(true);

    try {
      let responseText = '';
      
      // Format messages for the API
      const apiMessages = messages.filter(m => m.id !== 'welcome').concat(userMessage).map(m => ({
        role: m.role,
        parts: m.parts
      }));

      // If there's an image, we use the analyze-image endpoint (or we can just send it via chat)
      // The Gemini API handles both in generateContent, so let's just use chat endpoint
      // Actually we created a dedicated analyze-image endpoint for pure image analysis
      // but let's use /api/chat so it has conversation history.
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: apiMessages,
          useHighThinking
        })
      });

      const data = await res.json();
      
      if (res.ok) {
        responseText = data.text;
      } else {
        responseText = 'عذراً، حدث خطأ أثناء الاتصال بالمساعد الذكي: ' + (data.error || '');
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        parts: [{ text: responseText }]
      }]);

    } catch (err) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        parts: [{ text: 'حدث خطأ في الشبكة.' }]
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-tr from-amber-500 to-yellow-600 rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all z-40 border-4 border-[#0b0f19] shadow-amber-500/20"
      >
        <Sparkles size={24} className="text-[#0b0f19]" />
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-[380px] max-w-[calc(100vw-48px)] h-[600px] max-h-[70vh] bg-[#111827] border border-slate-800 shadow-2xl rounded-2xl flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Bot size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                    مساعد الذكاء الاصطناعي
                  </h3>
                  <p className="text-[10px] text-slate-400">Gemini AI Engine</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* High Thinking Toggle */}
            <div className="px-4 py-2 bg-slate-800/30 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-300 flex items-center gap-1.5">
                <BrainCircuit size={14} className={useHighThinking ? 'text-emerald-400' : 'text-slate-500'} />
                التحليل العميق (High Thinking)
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={useHighThinking}
                  onChange={(e) => setUseHighThinking(e.target.checked)}
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                    m.role === 'user' 
                      ? 'bg-amber-500 text-[#0b0f19] rounded-tr-none font-medium' 
                      : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                  }`}>
                    {/* Render Image if exists in user message */}
                    {m.parts.map((p, i) => (
                      <div key={i}>
                        {p.inlineData && (
                          <img 
                            src={`data:${p.inlineData.mimeType};base64,${p.inlineData.data}`} 
                            alt="Uploaded" 
                            className="w-full rounded-lg mb-2 max-h-48 object-cover"
                          />
                        )}
                        {p.text && (
                          <div className={`markdown-body ${m.role === 'user' ? '!text-[#0b0f19]' : '!text-slate-200'}`}>
                            <ReactMarkdown>{p.text}</ReactMarkdown>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-end">
                  <div className="bg-slate-800 text-slate-400 rounded-2xl rounded-tl-none p-4 flex items-center gap-2 border border-slate-700">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-xs">جاري التفكير {useHighThinking ? 'بعمق...' : '...'}</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-slate-900 border-t border-slate-800">
              {selectedImage && (
                <div className="mb-2 relative inline-block">
                  <img src={selectedImage} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-slate-700" />
                  <button 
                    onClick={() => setSelectedImage(null)}
                    className="absolute -top-2 -right-2 bg-slate-800 rounded-full p-1 border border-slate-600 text-slate-300 hover:text-white"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageSelect}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 text-slate-400 hover:text-amber-400 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                  title="إرفاق صورة للتحليل"
                >
                  <ImageIcon size={18} />
                </button>
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="اسأل المساعد..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                <button 
                  onClick={handleSend}
                  disabled={loading || (!input.trim() && !selectedImage)}
                  className="p-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-[#0b0f19] rounded-xl transition-colors flex items-center justify-center"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
