
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Camera, 
  Upload, 
  Send, 
  Cpu, 
  Zap, 
  AlertTriangle, 
  Info, 
  ChevronDown, 
  RotateCcw,
  X,
  ShieldCheck,
  Search,
  Settings,
  HelpCircle
} from 'lucide-react';
import { Message, ChatState, SkillLevel } from './types';
import { generateElectronicsInsight } from './services/geminiService';

const STARTER_QUESTIONS = [
  "My circuit isn't powering on—where should I start probing with my multimeter to find the fault?",
  "What common protection components are found at a power input, and how do I test them?",
  "What are the best practices for safely probing a live circuit to avoid shorting pins?",
  "I suspect a short circuit on my board. What is a logical step-by-step process to locate it?",
  "Walk me through designing a basic GPCS (Control System) logic flow for a sensor and actuator.",
  "I just finished soldering a new PCB. What visual and electrical checks should I do before applying power?",
  "My microcontroller isn't reading a sensor correctly. How can I troubleshoot the signal path?"
];

const App: React.FC = () => {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
  });
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [skillLevel, setSkillLevel] = useState<SkillLevel>(SkillLevel.INTERMEDIATE);
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  
  // Dynamic starter questions
  const dynamicSuggestions = useMemo(() => {
    return [...STARTER_QUESTIONS].sort(() => 0.5 - Math.random()).slice(0, 3);
  }, [chatState.messages.length === 0]); 

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatState.messages, chatState.isLoading]);

  const handleSendMessage = async (customPrompt?: string, customImage?: string) => {
    const promptToUse = customPrompt || inputText;
    const imageToUse = customImage || selectedImage;

    if ((!promptToUse.trim() && !imageToUse) || chatState.isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: promptToUse || "Analyze this image.",
      image: customImage ? imageToUse || undefined : undefined, 
      timestamp: new Date(),
    };

    const displayMessage = customPrompt 
      ? { ...userMessage, text: "📷 Image uploaded. Automated analysis in progress..." } 
      : userMessage;

    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, displayMessage],
      isLoading: true,
      error: null,
    }));
    setInputText('');

    try {
      const aiResponse = await generateElectronicsInsight(
        userMessage.text,
        chatState.messages,
        skillLevel,
        imageToUse || undefined
      );

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: aiResponse,
        timestamp: new Date(),
      };

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isLoading: false,
      }));
    } catch (err: any) {
      setChatState(prev => ({
        ...prev,
        isLoading: false,
        error: err.message || "Engine failure.",
      }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setSelectedImage(base64);
        handleSendMessage("Initiate full Safety Check and Component Identification. Be concise for mobile.", base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetChat = () => {
    setChatState({
      messages: [],
      isLoading: false,
      error: null,
    });
    setSelectedImage(null);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#f1f5f9] text-slate-900 font-sans overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 bg-white border-b border-slate-200 px-4 py-4 md:px-6 flex items-center justify-between z-20 shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
            <Cpu size={20} />
          </div>
          <h1 className="text-lg md:text-xl font-extrabold tracking-tight text-slate-800">Sight2Sense</h1>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <button 
              onClick={() => setShowSkillDropdown(!showSkillDropdown)}
              className="flex items-center space-x-1.5 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border border-slate-200 text-slate-600"
            >
              <Settings size={12} className="text-slate-400" />
              <span>{skillLevel}</span>
              <ChevronDown size={10} />
            </button>
            {showSkillDropdown && (
              <div className="absolute right-0 mt-2 w-36 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-30 animate-in fade-in zoom-in-95 duration-150">
                {Object.values(SkillLevel).map((level) => (
                  <button
                    key={level}
                    onClick={() => {
                      setSkillLevel(level);
                      setShowSkillDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-slate-50 transition-colors ${skillLevel === level ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-600'}`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button 
            onClick={resetChat}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all rounded-xl"
            title="Reset Session"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
        
        {/* Sidebar: Context Area */}
        <div className="w-full md:w-1/3 lg:w-1/4 border-b md:border-b-0 md:border-r border-slate-200 bg-white overflow-y-auto p-4 md:p-6 flex flex-col space-y-6 max-h-[35vh] md:max-h-full">
          <section className="space-y-3">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] flex items-center space-x-2">
              <Camera size={12} className="text-indigo-500" />
              <span>Visual Context</span>
            </h2>
            
            <div 
              className={`relative aspect-video md:aspect-square rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer group overflow-hidden
                ${selectedImage ? 'border-indigo-200 bg-indigo-50/5' : 'border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/30'}`}
              onClick={() => fileInputRef.current?.click()}
            >
              {selectedImage ? (
                <>
                  <img src={selectedImage} alt="Circuit Context" className="w-full h-full object-contain p-2" />
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                    <div className="bg-white text-indigo-600 px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-2xl">
                      <Upload size={14} />
                      <span>Swap Image</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center p-4 space-y-2">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto text-indigo-500 group-hover:scale-110 transition-transform">
                    <Upload size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">Drop Component Image</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-medium">PCB, Device, or Schematic</p>
                  </div>
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] flex items-center space-x-2">
              <Zap size={12} className="text-amber-500" />
              <span>Probing Tips</span>
            </h2>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 space-y-2">
              <p className="text-[11px] font-medium text-amber-800 leading-relaxed">
                Always check for continuity between VCC and GND before applying power. A short here is catastrophic.
              </p>
              <div className="flex items-center space-x-1 text-[10px] font-bold text-amber-600">
                <AlertTriangle size={10} />
                <span>Safety First</span>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] flex items-center space-x-2">
              <ShieldCheck size={12} className="text-emerald-500" />
              <span>Lab Verification</span>
            </h2>
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5"></div>
                <p className="text-[11px] text-slate-600">Cross-reference IC markings with official datasheets.</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5"></div>
                <p className="text-[11px] text-slate-600">Verify polarity on electrolytic caps and diodes.</p>
              </div>
            </div>
          </section>
        </div>

        {/* Right: Chat Area */}
        <div className="flex-1 flex flex-col bg-slate-50 min-h-0">
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {chatState.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center max-w-lg mx-auto text-center space-y-8">
                <div className="space-y-2">
                  <div className="w-16 h-16 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto text-indigo-500">
                    <Search size={32} />
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-800">Identify. Probing. Fix.</h3>
                  <p className="text-sm text-slate-500 font-medium">Upload an image or describe your electronics challenge to get lab-grade insights.</p>
                </div>

                <div className="grid gap-3 w-full">
                  {dynamicSuggestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(q)}
                      className="text-left px-5 py-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 transition-all hover:shadow-md hover:border-indigo-100 group flex items-center justify-between"
                    >
                      <span className="line-clamp-2">{q}</span>
                      <Send size={14} className="text-slate-300 group-hover:text-indigo-500 flex-shrink-0 ml-3" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              chatState.messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] md:max-w-[75%] rounded-3xl px-4 py-3 shadow-sm ${
                    message.role === 'user' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white border border-slate-200 text-slate-800'
                  }`}>
                    {message.role === 'model' && (
                      <div className="flex items-center space-x-1.5 mb-2 pb-2 border-b border-slate-100">
                        <Cpu size={12} className="text-indigo-500" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sight2Sense Analysis</span>
                      </div>
                    )}
                    <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                      {message.text}
                    </div>
                    {message.image && message.role === 'user' && (
                      <div className="mt-3 rounded-xl overflow-hidden border border-white/20">
                        <img src={message.image} alt="User Context" className="max-h-60 w-full object-cover" />
                      </div>
                    )}
                    <div className={`mt-2 text-[10px] ${message.role === 'user' ? 'text-indigo-200' : 'text-slate-400'} font-bold`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {chatState.isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3 flex items-center space-x-3 shadow-sm">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Analyzing Systems...</span>
                </div>
              </div>
            )}
            
            {chatState.error && (
              <div className="flex justify-center">
                <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 flex items-center space-x-2 text-red-600">
                  <AlertTriangle size={16} />
                  <span className="text-xs font-bold">{chatState.error}</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="flex-shrink-0 bg-white border-t border-slate-200 p-4 md:p-6">
            <div className="max-w-4xl mx-auto flex items-end space-x-2 bg-slate-50 border border-slate-200 rounded-[2rem] p-2 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500/50 transition-all shadow-sm">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className={`p-2.5 rounded-full transition-all flex-shrink-0 ${selectedImage ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}`}
                title="Add circuit image"
              >
                <Camera size={20} />
              </button>
              
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask about components, faults, or GPCS design..."
                className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-3 px-2 text-sm font-medium placeholder:text-slate-400 max-h-32"
                rows={1}
              />
              
              <button
                onClick={() => handleSendMessage()}
                disabled={(!inputText.trim() && !selectedImage) || chatState.isLoading}
                className="p-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:bg-slate-300 transition-all shadow-lg shadow-indigo-200"
              >
                <Send size={20} />
              </button>
            </div>
            <div className="mt-3 text-center">
              <p className="text-[10px] text-slate-400 font-bold flex items-center justify-center space-x-1 uppercase tracking-widest">
                <ShieldCheck size={10} className="text-emerald-500" />
                <span>Mentoring Session • Always use a multimeter for verification</span>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Ensure the App component is exported as default to satisfy index.tsx import
export default App;
