'use client';

import { useState, useEffect } from 'react';
import { WorkflowStep, SimilarityAnalysis, LawyerLetterParams, TrademarkCase } from '@/types';

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  status: 'completed' | 'in_progress';
  data: {
    currentStep: WorkflowStep;
    completedStep: number;
    analysisResult: SimilarityAnalysis | null;
    analysisInput: any;
    selectedCase: TrademarkCase | null;
    letterFormData: Partial<LawyerLetterParams>;
    letterContent: string;
    messages: Array<{ role: string; content: string }>;
  };
}

interface SessionSidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (session: ChatSession) => void;
  onNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newTitle: string) => void;
}

export default function SessionSidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onRenameSession,
}: SessionSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const dayDiff = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (dayDiff === 0) return '今天';
    if (dayDiff === 1) return '昨天';
    if (dayDiff < 7) return `${dayDiff}天前`;
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  // 开始重命名
  const startRename = (session: ChatSession) => {
    setEditingId(session.id);
    setEditingTitle(session.title);
  };

  // 保存重命名
  const saveRename = (sessionId: string) => {
    if (editingTitle.trim()) {
      onRenameSession(sessionId, editingTitle.trim());
    }
    setEditingId(null);
    setEditingTitle('');
  };

  return (
    <div className="h-full flex flex-col bg-white text-slate-800 border-r border-slate-200">
      {/* 头部 */}
      <div className="p-4 border-b border-slate-200">
        <button
          onClick={onNewSession}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新建对话
        </button>
      </div>

      {/* 历史会话列表 */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          <h3 className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            历史记录
          </h3>
          <div className="space-y-1">
            {sessions.length === 0 ? (
              <p className="px-3 py-4 text-sm text-slate-400 text-center">
                暂无历史记录
              </p>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className={`group relative flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                    currentSessionId === session.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-slate-100'
                  }`}
                  onClick={() => !editingId && onSelectSession(session)}
                >
                  {/* 状态标识 */}
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    session.status === 'in_progress' ? 'bg-red-500' : 'bg-slate-400'
                  }`} />

                  {/* 会话标题 */}
                  {editingId === session.id ? (
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onBlur={() => saveRename(session.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveRename(session.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="flex-1 bg-white px-2 py-1 rounded text-sm text-slate-800 outline-none focus:ring-1 focus:ring-blue-500 border border-slate-300"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="flex-1 truncate text-sm text-slate-700">
                      {session.title}
                    </span>
                  )}

                  {/* 日期 */}
                  <span className="text-xs text-slate-400 flex-shrink-0">
                    {formatDate(session.updatedAt)}
                  </span>

                  {/* 操作按钮 */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 bg-white border border-slate-200 rounded-md p-0.5 shadow-sm">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startRename(session);
                      }}
                      className="p-1 hover:bg-slate-200 rounded"
                      title="重命名"
                    >
                      <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                      className="p-1 hover:bg-red-100 rounded"
                      title="删除"
                    >
                      <svg className="w-3.5 h-3.5 text-slate-500 hover:text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 底部 */}
      <div className="p-3 border-t border-slate-200">
        <p className="text-xs text-slate-400 text-center">
          共 {sessions.length} 条记录
        </p>
      </div>
    </div>
  );
}
