'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { SimilarityAnalysis } from '@/types';

interface Step1InfoCollectionProps {
  onAnalysisComplete: (result: SimilarityAnalysis, input: any) => void;
  analysisResult?: SimilarityAnalysis | null;
  analysisInput?: any;
  onShowConfirmForm?: () => void;
}

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
  isAnalysisResult?: boolean;
}

interface FormData {
  originalTrademark: string;
  trademarkNumber: string;
  goodsCategory: string;
  infringingMark: string;
}

export default function Step1InfoCollection({ 
  onAnalysisComplete,
  analysisResult,
  analysisInput,
  onShowConfirmForm,
}: Step1InfoCollectionProps) {
  // 对话消息
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '你好，我是知识产权智能助手。我可以帮你进行商标侵权分析、类案检索和律师函生成。请描述你的需求，或在右侧填写表单信息。',
      timestamp: new Date(),
    },
  ]);

  // 用户输入
  const [inputMessage, setInputMessage] = useState('');

  // 右侧表单数据
  const [formData, setFormData] = useState<FormData>({
    originalTrademark: '',
    trademarkNumber: '',
    goodsCategory: '',
    infringingMark: '',
  });

  // 图片数据
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);

  // 右侧面板展开状态
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  // 分析状态
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 处理表单变更
  const handleFormChange = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // 生成分析结果消息内容
  const generateAnalysisResultMessage = (): Message => {
    return {
      id: `analysis_${Date.now()}`,
      role: 'assistant',
      content: 'analysis_result_placeholder',
      timestamp: new Date(),
      isAnalysisResult: true,
    };
  };

  // 从用户输入中提取商标信息
  const extractInfoFromText = useCallback((text: string) => {
    const extracted: Partial<FormData> = {};
    
    // 提取商标名称 - 匹配"商标名称是XXX"、"商标是XXX"、"我是XXX的法务"等模式
    const trademarkMatch = text.match(/(?:商标名称|商标)[是为]?[：:]?\s*["']?([^"'，,。；;\n]+?)["']?\s*(?:，|,|。|；|;|\n|$)/) ||
                          text.match(/我是([^\s]+?)的?(?:法务|律师|公司)/) ||
                          text.match(/([^\s]{2,10}?)的?商标/);
    if (trademarkMatch && !formData.originalTrademark) {
      const name = trademarkMatch[1].trim();
      // 过滤掉明显的非商标词
      if (!/^(注册号|申请号|的|是|为)$/.test(name)) {
        extracted.originalTrademark = name;
      }
    }
    
    // 提取商标注册号 - 匹配"注册号XXX"或直接匹配6位以上数字
    const numberMatch = text.match(/(?:注册号|商标号|申请号)[是为]?[：:]?\s*(\d{6,})/) ||
                       text.match(/[^\d](\d{6,})[^\d]/);
    if (numberMatch && !formData.trademarkNumber) {
      extracted.trademarkNumber = numberMatch[1];
    }
    
    // 提取商品类别 - 匹配"第X类"或"XX类"
    const categoryMatch = text.match(/第\s*(\d+)\s*类/) ||
                         text.match(/(?:类别|分类)[是为]?[：:]?\s*(\d+)/);
    if (categoryMatch && !formData.goodsCategory) {
      extracted.goodsCategory = `第${categoryMatch[1]}类`;
    }
    
    // 提取侵权方标识 - 匹配"发现'XXX'店铺"、"遇到XXX公司"等
    const infringingMatch = text.match(/(?:发现|遇到|看到|侵权方|对方)["']?([^"'，,。；;\n]*?(?:店铺|公司|商家|品牌))["']?/) ||
                           text.match(/(?:发现|遇到|看到)["']?([^"'，,。；;\n]{2,20})["']?/) ||
                           text.match(/(?:店铺名|商家名|对方)[是为]?[：:]?\s*["']?([^"'，,。；;\n]+?)["']?\s*(?:，|,|。|；|;|\n|$)/);
    if (infringingMatch && !formData.infringingMark) {
      extracted.infringingMark = infringingMatch[1].trim();
    }
    
    return extracted;
  }, [formData]);

  // 处理图片上传
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      if (file.size > 10 * 1024 * 1024) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const preview = event.target?.result as string;
        setImages(prev => [...prev, { file, preview }]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  // 删除图片
  const removeImage = useCallback((index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  // 开始AI侵权分析
  const handleStartAnalysis = useCallback(async () => {
    // 检查是否有任何信息（对话、表单、图片至少一个）
    const hasMessage = inputMessage.trim();
    const hasForm = Object.values(formData).some(v => v.trim());
    const hasImage = images.length > 0;

    if (!hasMessage && !hasForm && !hasImage) {
      setError('请至少提供一种信息：对话描述、表单填写或图片上传');
      return;
    }

    // 从用户输入中提取信息并自动填充表单
    const extractedInfo = hasMessage ? extractInfoFromText(inputMessage.trim()) : {};
    const mergedFormData = {
      ...formData,
      ...extractedInfo,
    };
    
    // 更新表单显示（如果提取到信息）
    if (Object.keys(extractedInfo).length > 0) {
      setFormData(mergedFormData);
    }

    // 添加用户消息到对话
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim() || '[图片材料]',
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage('');
    setAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalTrademarkName: mergedFormData.originalTrademark || undefined,
          originalTrademarkNumber: mergedFormData.trademarkNumber || undefined,
          images: images.map(img => img.preview),
          infringingMarkName: mergedFormData.infringingMark || undefined,
          goodsCategory: mergedFormData.goodsCategory || undefined,
          description: updatedMessages.filter(m => m.role === 'user').map(m => m.content).join('\n'),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '分析失败');
      }

      const data = await response.json();
      
      // 将分析结果作为消息添加到列表中，这样新消息会显示在卡片之后
      const analysisMessage = generateAnalysisResultMessage();
      setMessages(prev => [...prev, analysisMessage]);
      
      onAnalysisComplete(data.analysis, {
        formData: mergedFormData,
        messages: [...updatedMessages, analysisMessage],
        images: images.map(img => img.preview),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析过程中发生错误');
      // AI回复错误信息
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，分析过程中出现问题：' + (err instanceof Error ? err.message : '请稍后重试'),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setAnalyzing(false);
    }
  }, [inputMessage, formData, images, messages, onAnalysisComplete, extractInfoFromText]);



  return (
    <div className="h-[calc(100vh-140px)] flex gap-4">
      {/* 左侧：对话区 */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            message.isAnalysisResult && analysisResult ? (
              // 分析结果卡片作为消息渲染
              <div key={message.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 bg-blue-500 text-white">
                  AI
                </div>
                <div className="max-w-[80%] space-y-3">
                  <div className="bg-slate-100 text-slate-800 rounded-2xl rounded-tl-none px-4 py-3">
                    <p className="text-sm font-medium mb-2">✅ 分析完成！以下是我的专业意见：</p>
                  </div>
                  
                  {/* 分析报告卡片 */}
                  <div className={`rounded-xl p-4 border-2 ${
                    analysisResult.level === '高' ? 'bg-red-50 border-red-200' :
                    analysisResult.level === '中' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-green-50 border-green-200'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-semibold mb-1">综合相似度评分</h3>
                        <p className="text-xs opacity-75">基于视觉、文字、读音、概念四维度</p>
                      </div>
                      <div className="text-center">
                        <div className={`text-4xl font-bold ${
                          analysisResult.level === '高' ? 'text-red-600' :
                          analysisResult.level === '中' ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {analysisResult.overallScore}
                        </div>
                        <div className="text-xs mt-1">/ 100 分</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${
                        analysisResult.level === '高' ? 'bg-red-100 text-red-700 border-red-300' :
                        analysisResult.level === '中' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                        'bg-green-100 text-green-700 border-green-300'
                      }`}>
                        风险等级：{analysisResult.level}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold text-white ${
                        analysisResult.recommendation.action === '立即发函' ? 'bg-red-500' :
                        analysisResult.recommendation.action === '建议调查' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}>
                        建议：{analysisResult.recommendation.action}
                      </span>
                    </div>

                    {/* 四维度分析 */}
                    <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-current border-opacity-20">
                      {[
                        { label: '视觉', value: analysisResult.details.visualSimilarity, icon: '👁️' },
                        { label: '文字', value: analysisResult.details.textSimilarity, icon: '🔤' },
                        { label: '读音', value: analysisResult.details.phoneticSimilarity, icon: '🔊' },
                        { label: '概念', value: analysisResult.details.conceptualSimilarity, icon: '💡' },
                      ].map((item) => (
                        <div key={item.label} className="text-center text-xs">
                          <div className="text-lg mb-1">{item.icon}</div>
                          <div className="font-semibold">{item.value}%</div>
                          <div className="opacity-75">{item.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-100 text-slate-800 rounded-2xl rounded-tl-none px-4 py-3 text-sm">
                    <p className="mb-2"><strong>侵权分析：</strong></p>
                    <p>{analysisResult.analysis.confusionRisk}</p>
                    <p className="mt-2"><strong>法律建议：</strong></p>
                    <p>{analysisResult.recommendation.reason}</p>
                  </div>
                </div>
              </div>
            ) : (
              // 普通消息
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'assistant' ? '' : 'flex-row-reverse'}`}
              >
                {/* 头像 */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  message.role === 'assistant'
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {message.role === 'assistant' ? 'AI' : '我'}
                </div>

                {/* 消息内容 */}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'assistant'
                    ? 'bg-slate-100 text-slate-800 rounded-tl-none'
                    : 'bg-blue-500 text-white rounded-tr-none'
                }`}>
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <span className={`text-xs mt-1 block ${
                    message.role === 'assistant' ? 'text-slate-400' : 'text-blue-200'
                  }`}>
                    {message.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            )
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* 输入区 */}
        <div className="p-4 border-t border-slate-100">
          {/* 错误提示 */}
          {error && (
            <div className="mb-3 px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {/* 输入框 */}
          <div className="relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="描述你的需求，例如：我是名创优品的法务，商标注册号13604462，在淘宝发现'优宿优品'店铺卖包，疑似商标侵权，帮我取证并生成律师函。"
              rows={3}
              className="w-full px-4 py-3 pr-24 bg-slate-50 border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-sm text-slate-900 placeholder:text-slate-300"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleStartAnalysis();
                }
              }}
            />

            {/* 底部工具栏 */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 text-slate-400 hover:text-slate-600 text-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                上传文件
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />

              <button
                onClick={handleStartAnalysis}
                disabled={analyzing || (!inputMessage.trim() && images.length === 0 && !Object.values(formData).some(v => v.trim()))}
                className="px-4 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
              >
                {analyzing ? (
                  <>
                    <span className="animate-spin h-3 w-3 rounded-full border-2 border-white/30 border-t-white" />
                    分析中
                  </>
                ) : (
                  <>
                    <span>🔍</span>
                    开始分析
                  </>
                )}
              </button>
            </div>
          </div>


        </div>
      </div>

      {/* 右侧：表单面板 */}
      <div className={`transition-all duration-300 ${isPanelOpen ? 'w-80' : 'w-0'} overflow-hidden`}>
        <div className="h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          {/* 面板头部 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-semibold text-slate-700">图片侵权分析</h3>
            <button
              onClick={() => setIsPanelOpen(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 表单内容 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* 商标名称 */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">
                商标名称
              </label>
              <input
                type="text"
                value={formData.originalTrademark}
                onChange={(e) => handleFormChange('originalTrademark', e.target.value)}
                placeholder="名创优品"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-sm text-slate-900 placeholder:text-slate-300"
              />
            </div>

            {/* 商标注册号 */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">
                商标注册号
              </label>
              <input
                type="text"
                value={formData.trademarkNumber}
                onChange={(e) => handleFormChange('trademarkNumber', e.target.value)}
                placeholder="16100517"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-sm text-slate-900 placeholder:text-slate-300"
              />
            </div>

            {/* 商品类别 */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">
                商品类别
              </label>
              <input
                type="text"
                value={formData.goodsCategory}
                onChange={(e) => handleFormChange('goodsCategory', e.target.value)}
                placeholder="第21类"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-sm text-slate-900 placeholder:text-slate-300"
              />
            </div>

            {/* 侵权方标识 */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">
                侵权方标识
              </label>
              <input
                type="text"
                value={formData.infringingMark}
                onChange={(e) => handleFormChange('infringingMark', e.target.value)}
                placeholder="优宿优品"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:bg-white transition-all text-sm text-slate-900 placeholder:text-slate-300"
              />
            </div>

            {/* 上传图片 */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">
                上传疑似侵权图片
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer"
              >
                <div className="w-10 h-10 mx-auto mb-2 bg-slate-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-xs text-slate-500">点击上传图片</p>
              </div>

              {/* 已上传图片 */}
              {images.length > 0 && (
                <div className="mt-3 space-y-2">
                  {images.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img.preview}
                        alt={`图片 ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-slate-200"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 px-3 py-1 bg-slate-800/80 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        删除
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 确认信息按钮 - 放在图片上传组件下方 */}
              {analysisResult && onShowConfirmForm && (
                <button
                  onClick={onShowConfirmForm}
                  className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
                >
                  ✓ 确认信息 → 下一步
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 展开面板按钮（当面板关闭时显示） */}
      {!isPanelOpen && (
        <button
          onClick={() => setIsPanelOpen(true)}
          className="fixed right-6 top-1/2 -translate-y-1/2 w-10 h-10 bg-white shadow-lg border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:shadow-xl transition-all z-10"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
    </div>
  );
}
