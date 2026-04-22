'use client';

import { ChatMessage } from '@/types';

interface ChatMessageItemProps {
  message: ChatMessage;
}

export default function ChatMessageItem({ message }: ChatMessageItemProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex gap-3 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isUser
              ? 'bg-gradient-to-br from-blue-500 to-blue-600'
              : 'bg-gradient-to-br from-yellow-400 to-orange-500'
          }`}
        >
          <span className="text-white text-sm font-semibold">
            {isUser ? '你' : '权'}
          </span>
        </div>

        {/* Message Content */}
        <div
          className={`rounded-xl px-4 py-3 ${
            isUser
              ? 'bg-blue-600/20 border border-blue-500/30'
              : 'bg-slate-800/50 border border-slate-700/50'
          }`}
        >
          <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {message.attachments.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-900/50 rounded-lg border border-slate-700/30"
                >
                  <span className="text-slate-400 text-xs">📄</span>
                  <span className="text-slate-300 text-xs flex-1 truncate">
                    {file.name}
                  </span>
                  <span className="text-slate-500 text-xs">
                    {(file.size / 1024).toFixed(1)}KB
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Timestamp */}
          <div className="mt-2 text-xs text-slate-500">
            {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
