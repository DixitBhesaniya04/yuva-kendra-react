import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Zap, BrainCircuit, Trash2 } from 'lucide-react';
import { streamGeminiResponse } from './services/geminiService';
import { Message, Role, ModelType, Attachment } from './types';
import { MessageBubble } from './components/MessageBubble';
import { ChatInput } from './components/ChatInput';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: Role.Model,
      text: "Hey there! I'm Gemini Nexus. I can help you with analysis, creative writing, coding, and more. Upload an image or just start chatting!",
      timestamp: Date.now()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelType>(ModelType.Flash);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Remove "data:*/*;base64," prefix
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSendMessage = async (text: string, files: File[]) => {
    setIsLoading(true);

    // Process attachments
    const newAttachments: Attachment[] = [];
    for (const file of files) {
      try {
        const base64Data = await fileToBase64(file);
        newAttachments.push({
          mimeType: file.type,
          data: base64Data
        });
      } catch (e) {
        console.error("Failed to read file", e);
      }
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      role: Role.User,
      text: text,
      attachments: newAttachments,
      timestamp: Date.now(),
    };

    // Add user message to state
    setMessages(prev => [...prev, newMessage]);

    // Create placeholder for bot message
    const botMessageId = (Date.now() + 1).toString();
    const botPlaceholder: Message = {
      id: botMessageId,
      role: Role.Model,
      text: '', // Start empty
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, botPlaceholder]);

    // Stream response
    await streamGeminiResponse(
      selectedModel,
      messages.concat(newMessage), // Pass history + new message
      text, // Current text prompt (redundant but useful for logic)
      newAttachments, // Current attachments
      {
        onChunk: (chunkText) => {
          setMessages(prev => prev.map(msg => 
            msg.id === botMessageId 
              ? { ...msg, text: msg.text + chunkText } 
              : msg
          ));
        },
        onComplete: () => {
          setIsLoading(false);
        },
        onError: (error) => {
          setMessages(prev => prev.map(msg => 
            msg.id === botMessageId 
              ? { ...msg, text: "I encountered an error processing your request. Please try again.", isError: true } 
              : msg
          ));
          setIsLoading(false);
        }
      }
    );
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100 overflow-hidden">
      
      {/* Header */}
      <header className="flex-shrink-0 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 p-4 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="text-white" size={24} />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight">Gemini Nexus</h1>
              <p className="text-xs text-slate-400 font-medium">Powered by Google GenAI</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
             {/* Model Selector */}
            <div className="bg-slate-800 p-1 rounded-lg flex items-center border border-slate-700">
              <button 
                onClick={() => setSelectedModel(ModelType.Flash)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  selectedModel === ModelType.Flash 
                    ? 'bg-slate-700 text-indigo-400 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Zap size={14} />
                <span className="hidden sm:inline">Flash</span>
              </button>
              <button 
                onClick={() => setSelectedModel(ModelType.Pro)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  selectedModel === ModelType.Pro 
                    ? 'bg-slate-700 text-purple-400 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BrainCircuit size={14} />
                <span className="hidden sm:inline">Pro</span>
              </button>
            </div>

            <button 
              onClick={clearChat}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
              title="Clear Chat"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto scroll-smooth relative">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {messages.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center opacity-30 mt-20 select-none">
                <Sparkles size={80} className="text-slate-500 mb-4" />
                <p className="text-xl font-light">Start a conversation</p>
             </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </main>

      {/* Input Area */}
      <footer className="flex-shrink-0 z-10">
        <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
      </footer>
    </div>
  );
};

export default App;
