import React, { useState, useRef, ChangeEvent } from 'react';
import { Send, Image as ImageIcon, X, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSend: (text: string, files: File[]) => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading }) => {
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    // Auto-resize
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
    // Reset input value so same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    if ((!text.trim() && files.length === 0) || isLoading) return;
    
    onSend(text, files);
    setText('');
    setFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-6">
      <div className="relative bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700 shadow-2xl p-2 transition-all focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500/50">
        
        {/* File Previews */}
        {files.length > 0 && (
          <div className="flex gap-2 p-2 overflow-x-auto mb-2 bg-slate-900/30 rounded-lg mx-1">
            {files.map((file, i) => (
              <div key={i} className="relative group flex-shrink-0">
                <div className="w-16 h-16 rounded-md bg-slate-700 overflow-hidden flex items-center justify-center border border-slate-600">
                  {file.type.startsWith('image/') ? (
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt="preview" 
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                    />
                  ) : (
                    <span className="text-xs text-slate-300 p-1 text-center break-all">{file.name.slice(0, 8)}...</span>
                  )}
                </div>
                <button
                  onClick={() => removeFile(i)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* File Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="p-3 text-slate-400 hover:text-indigo-400 hover:bg-slate-700/50 rounded-xl transition-colors disabled:opacity-50"
            title="Attach image"
          >
            <ImageIcon size={20} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/png, image/jpeg, image/webp, image/heic, image/heif"
            multiple
          />

          {/* Text Input */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={isLoading ? "Generating response..." : "Ask Gemini something..."}
            rows={1}
            disabled={isLoading}
            className="flex-1 bg-transparent text-slate-200 placeholder-slate-500 py-3 px-1 resize-none focus:outline-none max-h-[150px] scrollbar-thin"
            style={{ minHeight: '44px' }}
          />

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={isLoading || (!text.trim() && files.length === 0)}
            className={`p-3 rounded-xl flex items-center justify-center transition-all duration-200 ${
              isLoading || (!text.trim() && files.length === 0)
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20'
            }`}
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
      </div>
      <p className="text-center text-xs text-slate-500 mt-2">
        Gemini may display inaccurate info, including about people, so double-check its responses.
      </p>
    </div>
  );
};
