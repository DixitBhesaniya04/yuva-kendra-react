import React from 'react';
import { User, Bot, AlertCircle } from 'lucide-react';
import { Message, Role } from '../types';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === Role.User;
  const isError = message.isError;

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[70%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-indigo-600' : isError ? 'bg-red-500' : 'bg-emerald-600'
        } shadow-lg`}>
          {isUser ? <User size={16} className="text-white" /> : 
           isError ? <AlertCircle size={16} className="text-white" /> :
           <Bot size={16} className="text-white" />}
        </div>

        {/* Bubble */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`rounded-2xl px-5 py-3 shadow-md backdrop-blur-sm ${
            isUser 
              ? 'bg-indigo-600 text-white rounded-tr-sm' 
              : isError
                ? 'bg-red-900/50 border border-red-500/50 text-red-200 rounded-tl-sm'
                : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-sm'
          }`}>
            
            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {message.attachments.map((att, index) => (
                  <img 
                    key={index}
                    src={`data:${att.mimeType};base64,${att.data}`} 
                    alt="Attachment" 
                    className="max-w-[200px] max-h-[200px] rounded-lg object-cover border border-slate-600/50"
                  />
                ))}
              </div>
            )}

            {/* Text Content */}
            <div className="whitespace-pre-wrap leading-relaxed text-sm md:text-base break-words font-light">
              {message.text}
            </div>
          </div>
          
          {/* Timestamp */}
          <span className="text-xs text-slate-500 mt-1 px-1">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};
