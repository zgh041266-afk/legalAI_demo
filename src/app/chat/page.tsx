'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatMessage, InfringementClue, EvidencePackage, GeneratedLetter, ImageAnalysisResult } from '@/types';
import ChatMessageItem from '@/components/ChatMessageItem';
import InfringementTable from '@/components/InfringementTable';
import EvidencePackageList from '@/components/EvidencePackageList';
import LetterPreview from '@/components/LetterPreview';
import ImageUploadAnalyzer from '@/components/ImageUploadAnalyzer';

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: '你好，我是权盾AI助手。我可以帮你进行商标侵权取证、类案检索和法律文书生成。请描述你的需求，或上传相关证据材料。',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [infringementClues, setInfringementClues] = useState<InfringementClue[]>([]);
  const [evidencePackages, setEvidencePackages] = useState<EvidencePackage[]>([]);
  const [lawyerLetter, setLawyerLetter] = useState<GeneratedLetter | null>(null);
  const [imageAnalysisResult, setImageAnalysisResult] = useState<ImageAnalysisResult | null>(null);
  const [showImageAnalyzer, setShowImageAnalyzer] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) throw new Error('请求失败');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let assistantId = Date.now().toString();

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = JSON.parse(line.slice(6));

          if (data.type === 'text') {
            assistantContent += data.content;
            setMessages((prev) => {
              const existing = prev.find((m) => m.id === assistantId);
              if (existing) {
                return prev.map((m) =>
                  m.id === assistantId ? { ...m, content: assistantContent } : m
                );
              }
              return [
                ...prev,
                {
                  id: assistantId,
                  role: 'assistant',
                  content: assistantContent,
                  timestamp: Date.now(),
                },
              ];
            });
          } else if (data.type === 'infringement_clues') {
            setInfringementClues(data.data);
          } else if (data.type === 'evidence_packages') {
            setEvidencePackages(data.data);
          } else if (data.type === 'lawyer_letter') {
            setLawyerLetter(data.data);
          }
        }
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: '抱歉，处理请求时出现错误，请稍后重试。',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleImageAnalysisComplete(result: ImageAnalysisResult) {
    setImageAnalysisResult(result);

    // 添加分析结果消息到聊天
    const analysisMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `图片分析完成！检测到${result.analysis.detectedText.length}个文字元素，${result.analysis.detectedLogos.length}个潜在Logo。侵权风险等级：${result.analysis.infringementRisk === 'high' ? '高风险' : result.analysis.infringementRisk === 'medium' ? '中等风险' : '低风险'}。`,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, analysisMessage]);
  }

  function toggleImageAnalyzer() {
    setShowImageAnalyzer(!showImageAnalyzer);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-lg">权</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">权盾AI</h1>
              <p className="text-xs text-slate-400">商标侵权智能取证与文书生成平台</p>
            </div>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 text-xs rounded-full border border-yellow-500/20">
              GPT-5-mini
            </span>
            <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full border border-blue-500/20">
              MCP
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：对话区 */}
          <div className="lg:col-span-2 flex flex-col h-[calc(100vh-140px)]">
            {/* 快捷功能按钮 */}
            <div className="flex gap-2 mb-4">
              <button className="px-4 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 text-sm rounded-lg border border-slate-700/50 transition-colors">
                📚 类案检索
              </button>
              <button className="px-4 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 text-sm rounded-lg border border-slate-700/50 transition-colors">
                📝 文书生成
              </button>
              <button
                onClick={toggleImageAnalyzer}
                className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                  showImageAnalyzer
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                    : 'bg-slate-800/50 hover:bg-slate-800 text-slate-300 border-slate-700/50'
                }`}
              >
                🖼️ 图片侵权分析
              </button>
              <button className="px-4 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 text-sm rounded-lg border border-slate-700/50 transition-colors">
                🔍 证据指引
              </button>
            </div>

            {/* 消息列表 */}
            <div className="flex-1 overflow-y-auto bg-slate-900/30 rounded-xl border border-slate-800/50 p-4 space-y-4">
              {messages.map((msg) => (
                <ChatMessageItem key={msg.id} message={msg} />
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <div className="animate-spin h-4 w-4 border-2 border-slate-600 border-t-yellow-400 rounded-full" />
                  正在分析中...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* 输入框 */}
            <div className="mt-4 bg-slate-900/50 rounded-xl border border-slate-800/50 p-4">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="描述你的需求，例如：我是名创优品的法务，商标注册号13604462，在淘宝发现'优宿优品'店铺卖包，疑似商标侵权，帮我取证并生成律师函。"
                className="w-full bg-transparent text-slate-200 placeholder:text-slate-600 resize-none outline-none"
                rows={3}
              />
              <div className="flex items-center justify-between mt-3">
                <button className="px-3 py-1.5 text-slate-400 hover:text-slate-300 text-sm flex items-center gap-2 transition-colors">
                  📎 上传文件
                </button>
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 disabled:bg-slate-700 disabled:text-slate-500 text-black font-semibold rounded-lg transition-colors"
                >
                  发送
                </button>
              </div>
            </div>
          </div>

          {/* 右侧：结果展示区 */}
          <div className="space-y-4">
            {/* 图片侵权分析器 */}
            {showImageAnalyzer && (
              <div className="bg-slate-900/50 rounded-xl border border-slate-800/50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800/50 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-blue-400">图片侵权分析</h3>
                  <button
                    onClick={toggleImageAnalyzer}
                    className="text-slate-400 hover:text-slate-300 text-sm"
                  >
                    ✕
                  </button>
                </div>
                <div className="p-4">
                  <ImageUploadAnalyzer
                    onAnalysisComplete={handleImageAnalysisComplete}
                  />
                </div>
              </div>
            )}

            {/* 侵权线索汇总表 */}
            {infringementClues.length > 0 && (
              <InfringementTable clues={infringementClues} />
            )}

            {/* 证据包列表 */}
            {evidencePackages.length > 0 && (
              <EvidencePackageList packages={evidencePackages} />
            )}

            {/* 律师函预览 */}
            {lawyerLetter && (
              <div className="bg-slate-900/50 rounded-xl border border-slate-800/50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800/50">
                  <h3 className="text-sm font-semibold text-yellow-400">律师函预览</h3>
                </div>
                <div className="p-4">
                  <div className="prose prose-invert prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-slate-300 text-sm leading-relaxed">
                      {lawyerLetter.content}
                    </pre>
                  </div>
                  <button
                    onClick={() => {
                      // 下载 DOCX
                      const blob = new Blob([lawyerLetter.content], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = '律师函.txt';
                      link.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="mt-4 w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-lg transition-colors"
                  >
                    下载律师函
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
