'use client';

import { useState, useRef, useEffect } from 'react';
import InfringementReport from './InfringementReport';
import { SimilarityAnalysis, WorkflowStep } from '@/types';
import { TRADEMARK_CASES } from '@/data/cases';

interface TrademarkInfringementWorkflowProps {
  onGenerateLetter: (params: any) => void;
  onLoadingChange?: (loading: boolean) => void;
}

export default function TrademarkInfringementWorkflow({
  onGenerateLetter,
  onLoadingChange,
}: TrademarkInfringementWorkflowProps) {
  // 工作流步骤
  const [step, setStep] = useState<WorkflowStep>('input');
  
  // 输入数据
  const [inputData, setInputData] = useState({
    originalTrademarkName: '',
    originalTrademarkNumber: '',
    infringingMarkName: '',
    goodsCategory: '',
    platform: '',
    description: '',
  });
  
  // 图片数据
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [infringingImage, setInfringingImage] = useState<string | null>(null);
  
  // 分析结果
  const [analysisResult, setAnalysisResult] = useState<SimilarityAnalysis | null>(null);
  
  // UI状态
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 案例选择状态
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  
  // 律师函表单数据
  const [letterForm, setLetterForm] = useState({
    senderCompany: '',
    senderLawFirm: '',
    recipientCompany: '',
    recipientAddress: '',
    trademarkNumbers: '',
    trademarkName: '',
    infringingMark: '',
    infringingBehavior: '',
    demandDeadlineDays: '7',
    compensationAmount: '',
    lawyerName: '',
    phone: '',
    lawFirmAddress: '',
    goodsCategory: '',
  });
  
  const originalFileRef = useRef<HTMLInputElement>(null);
  const infringingFileRef = useRef<HTMLInputElement>(null);

  // 处理图片选择
  const handleImageSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'original' | 'infringing'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('图片文件大小不能超过10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (type === 'original') {
        setOriginalImage(result);
      } else {
        setInfringingImage(result);
      }
    };
    reader.readAsDataURL(file);
  };

  // 执行侵权分析
  const handleAnalyze = async () => {
    if (!inputData.originalTrademarkName.trim()) {
      setError('请填写我方商标名称');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setStep('analyzing');
    onLoadingChange?.(true);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalTrademarkName: inputData.originalTrademarkName,
          originalTrademarkNumber: inputData.originalTrademarkNumber || undefined,
          originalImage: originalImage || undefined,
          infringingMarkName: inputData.infringingMarkName || undefined,
          infringingImage: infringingImage || undefined,
          goodsCategory: inputData.goodsCategory || undefined,
          platform: inputData.platform || undefined,
          description: inputData.description || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '分析失败');
      }

      const data = await response.json();
      setAnalysisResult(data.analysis);
      setStep('report');
    } catch (err) {
      console.error('分析错误:', err);
      setError(err instanceof Error ? err.message : '分析过程中发生错误');
      setStep('input');
    } finally {
      setAnalyzing(false);
      onLoadingChange?.(false);
    }
  };

  // 确认生成律师函 - 跳转到案例选择表单
  const handleConfirmGenerate = () => {
    if (!analysisResult) return;
    
    // 预填充表单数据（基于AI分析结果）
    setLetterForm({
      senderCompany: '',
      senderLawFirm: '',
      recipientCompany: inputData.infringingMarkName || '',
      recipientAddress: '',
      trademarkNumbers: inputData.originalTrademarkNumber || '',
      trademarkName: inputData.originalTrademarkName,
      infringingMark: inputData.infringingMarkName || '',
      infringingBehavior: `经AI相似度分析，综合评分${analysisResult.overallScore}分，风险等级${analysisResult.level}。${analysisResult.analysis.confusionRisk}`,
      demandDeadlineDays: '7',
      compensationAmount: analysisResult.level === '高' ? '10万元' : analysisResult.level === '中' ? '5万元' : '3万元',
      lawyerName: '',
      phone: '',
      lawFirmAddress: '',
      goodsCategory: inputData.goodsCategory || '',
    });
    
    // 跳转到表单步骤
    setStep('form');
  };
  
  // 选择参考案例
  const handleSelectCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    const selectedCase = TRADEMARK_CASES.find((c) => c.id === caseId);
    if (selectedCase) {
      setLetterForm((prev) => ({
        ...prev,
        trademarkName: selectedCase.trademarkName,
        infringingMark: selectedCase.infringingMark,
        infringingBehavior: selectedCase.similarity,
        compensationAmount: selectedCase.compensation,
        goodsCategory: selectedCase.goodsCategory,
      }));
    }
  };
  
  // 提交律师函表单
  const handleSubmitLetterForm = (e: React.FormEvent) => {
    e.preventDefault();
    
    setStep('generating');
    
    // 调用父组件的生成函数
    onGenerateLetter({
      caseId: selectedCaseId || 'analysis',
      senderCompany: letterForm.senderCompany,
      senderLawFirm: letterForm.senderLawFirm,
      recipientCompany: letterForm.recipientCompany,
      recipientAddress: letterForm.recipientAddress,
      trademarkNumbers: letterForm.trademarkNumbers.split(/[,，、]/).filter(Boolean),
      trademarkName: letterForm.trademarkName,
      infringingMark: letterForm.infringingMark,
      infringingBehavior: letterForm.infringingBehavior,
      demandDeadlineDays: Number(letterForm.demandDeadlineDays),
      compensationAmount: letterForm.compensationAmount,
      lawyerName: letterForm.lawyerName,
      phone: letterForm.phone,
      lawFirmAddress: letterForm.lawFirmAddress,
      goodsCategory: letterForm.goodsCategory,
    });
  };
  
  // 返回报告页面
  const handleBackToReport = () => {
    setStep('report');
    setSelectedCaseId('');
  };

  // 返回修改
  const handleBackToInput = () => {
    setStep('input');
    setAnalysisResult(null);
  };

  // 重新分析
  const handleReAnalyze = () => {
    setStep('input');
    setAnalysisResult(null);
  };

  // 步骤1: 输入表单
  const renderInputStep = () => (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl">📋</span>
            商标侵权分析系统
          </h2>
          <p className="text-blue-100 text-sm mt-1">
            提交您的商标信息，AI将分析侵权相似度并提供专业建议
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                1
              </div>
              <span className="ml-2 text-blue-600 font-medium">输入信息</span>
            </div>
            <div className="w-16 h-0.5 bg-slate-300" />
            <div className="flex items-center opacity-40">
              <div className="w-8 h-8 rounded-full bg-slate-300 text-white flex items-center justify-center font-bold">
                2
              </div>
              <span className="ml-2 text-slate-500 font-medium">AI分析</span>
            </div>
            <div className="w-16 h-0.5 bg-slate-300" />
            <div className="flex items-center opacity-40">
              <div className="w-8 h-8 rounded-full bg-slate-300 text-white flex items-center justify-center font-bold">
                3
              </div>
              <span className="ml-2 text-slate-500 font-medium">生成律师函</span>
            </div>
          </div>

          {/* 商标信息 */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <span>🏷️</span> 我方商标信息
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  商标名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={inputData.originalTrademarkName}
                  onChange={(e) => setInputData({ ...inputData, originalTrademarkName: e.target.value })}
                  placeholder="如：MINISO名創優品"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  商标注册号
                </label>
                <input
                  type="text"
                  value={inputData.originalTrademarkNumber}
                  onChange={(e) => setInputData({ ...inputData, originalTrademarkNumber: e.target.value })}
                  placeholder="如：第13604462号"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            {/* 商标图片上传 */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-600 mb-2">
                商标图片（可选）
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                {originalImage ? (
                  <div className="relative inline-block">
                    <img src={originalImage} alt="我方商标" className="max-h-32 mx-auto rounded" />
                    <button
                      onClick={() => {
                        setOriginalImage(null);
                        if (originalFileRef.current) originalFileRef.current.value = '';
                      }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      ref={originalFileRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageSelect(e, 'original')}
                      className="hidden"
                      id="original-image"
                    />
                    <label htmlFor="original-image" className="cursor-pointer">
                      <div className="text-slate-500 mb-2">
                        <svg className="mx-auto h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="text-blue-500 hover:text-blue-600">点击上传商标图片</span>
                    </label>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 侵权信息 */}
          <div className="bg-red-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-red-700 mb-4 flex items-center gap-2">
              <span>⚠️</span> 疑似侵权信息
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  侵权方标识
                </label>
                <input
                  type="text"
                  value={inputData.infringingMarkName}
                  onChange={(e) => setInputData({ ...inputData, infringingMarkName: e.target.value })}
                  placeholder="如：优宿优品"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  商品/服务类别
                </label>
                <input
                  type="text"
                  value={inputData.goodsCategory}
                  onChange={(e) => setInputData({ ...inputData, goodsCategory: e.target.value })}
                  placeholder="如：第35类 零售服务"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>
            
            {/* 侵权图片上传 */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-600 mb-2">
                侵权方图片（可选）
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-red-400 transition-colors">
                {infringingImage ? (
                  <div className="relative inline-block">
                    <img src={infringingImage} alt="侵权方标识" className="max-h-32 mx-auto rounded" />
                    <button
                      onClick={() => {
                        setInfringingImage(null);
                        if (infringingFileRef.current) infringingFileRef.current.value = '';
                      }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      ref={infringingFileRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageSelect(e, 'infringing')}
                      className="hidden"
                      id="infringing-image"
                    />
                    <label htmlFor="infringing-image" className="cursor-pointer">
                      <div className="text-slate-500 mb-2">
                        <svg className="mx-auto h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="text-red-500 hover:text-red-600">点击上传侵权方图片</span>
                    </label>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 补充信息 */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <span>📝</span> 补充信息
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  发现平台
                </label>
                <input
                  type="text"
                  value={inputData.platform}
                  onChange={(e) => setInputData({ ...inputData, platform: e.target.value })}
                  placeholder="如：淘宝、拼多多"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  侵权描述
                </label>
                <input
                  type="text"
                  value={inputData.description}
                  onChange={(e) => setInputData({ ...inputData, description: e.target.value })}
                  placeholder="简要描述侵权情况"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 flex items-center gap-2">
                <span>❌</span> {error}
              </p>
            </div>
          )}

          {/* 分析按钮 */}
          <button
            onClick={handleAnalyze}
            disabled={analyzing || !inputData.originalTrademarkName.trim()}
            className="w-full py-4 rounded-xl font-bold text-lg transition-colors shadow-lg flex items-center justify-center gap-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 text-white"
          >
            {analyzing ? (
              <>
                <span className="animate-spin h-6 w-6 rounded-full border-3 border-white/30 border-t-white" />
                AI 正在分析侵权相似度...
              </>
            ) : (
              <>
                <span className="text-2xl">🔍</span>
                开始侵权相似度分析
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // 步骤2: 分析中
  const renderAnalyzingStep = () => (
    <div className="max-w-2xl mx-auto p-6 text-center">
      <div className="bg-white rounded-xl shadow-2xl p-12">
        <div className="animate-spin h-20 w-20 rounded-full border-4 border-blue-200 border-t-blue-600 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-slate-800 mb-4">AI 正在分析中...</h2>
        <p className="text-slate-600 mb-6">
          正在对比商标相似度，请稍候
        </p>
        <div className="flex items-center justify-center gap-2 text-slate-500">
          <span className="animate-pulse">⚡</span>
          <span>多维度分析：视觉 · 文字 · 读音 · 概念</span>
        </div>
        <button
          onClick={handleBackToInput}
          className="mt-8 px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
        >
          取消
        </button>
      </div>
    </div>
  );

  // 步骤3: 分析报告
  const renderReportStep = () => {
    if (!analysisResult) return null;

    return (
      <div className="max-w-6xl mx-auto p-4">
        <InfringementReport
          trademarkName={inputData.originalTrademarkName}
          infringingMark={inputData.infringingMarkName || '图片分析'}
          goodsCategory={inputData.goodsCategory || '未指定'}
          analysis={analysisResult}
          onConfirm={handleConfirmGenerate}
          onCancel={handleReAnalyze}
        />
      </div>
    );
  };

  // 步骤4: 案例选择和表单填写
  const renderFormStep = () => (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-600 to-orange-600 px-6 py-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl">⚖️</span>
            生成律师函
          </h2>
          <p className="text-yellow-100 text-sm mt-1">
            选择参考案例并填写详细信息，AI将生成专业律师函
          </p>
        </div>

        <div className="p-6">
          {/* 步骤指示器 */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="flex items-center opacity-60">
              <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">✓</div>
              <span className="ml-2 text-green-600 font-medium">AI分析</span>
            </div>
            <div className="w-16 h-0.5 bg-green-400" />
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-yellow-500 text-white flex items-center justify-center font-bold">2</div>
              <span className="ml-2 text-yellow-600 font-medium">填写信息</span>
            </div>
            <div className="w-16 h-0.5 bg-slate-300" />
            <div className="flex items-center opacity-40">
              <div className="w-8 h-8 rounded-full bg-slate-300 text-white flex items-center justify-center font-bold">3</div>
              <span className="ml-2 text-slate-500 font-medium">生成律师函</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左侧：案例选择 */}
            <div className="lg:col-span-1">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <span>📚</span> 选择参考案例
              </h3>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                <div
                  onClick={() => handleSelectCase('')}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedCaseId === ''
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-slate-200 hover:border-yellow-300'
                  }`}
                >
                  <h4 className="font-medium text-slate-800">🤖 基于AI分析结果</h4>
                  <p className="text-sm text-slate-500 mt-1">使用刚才的AI侵权分析结果生成</p>
                </div>
                {TRADEMARK_CASES.map((caseItem) => (
                  <div
                    key={caseItem.id}
                    onClick={() => handleSelectCase(caseItem.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedCaseId === caseItem.id
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-slate-200 hover:border-yellow-300'
                    }`}
                  >
                    <h4 className="font-medium text-slate-800">{caseItem.plaintiff} 案</h4>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{caseItem.similarity}</p>
                    <span className="inline-block mt-2 text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                      {caseItem.compensation}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 右侧：表单 */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmitLetterForm} className="space-y-5">
                {/* 委托方信息 */}
                <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">▪ 委托方信息</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">委托公司名称 <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={letterForm.senderCompany}
                        onChange={(e) => setLetterForm({ ...letterForm, senderCompany: e.target.value })}
                        placeholder="如：广东赛曼投资有限公司"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">委托律师事务所</label>
                      <input
                        type="text"
                        value={letterForm.senderLawFirm}
                        onChange={(e) => setLetterForm({ ...letterForm, senderLawFirm: e.target.value })}
                        placeholder="如：广东尚之信律师事务所"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">律师姓名</label>
                      <input
                        type="text"
                        value={letterForm.lawyerName}
                        onChange={(e) => setLetterForm({ ...letterForm, lawyerName: e.target.value })}
                        placeholder="经办律师姓名"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">联系电话</label>
                      <input
                        type="text"
                        value={letterForm.phone}
                        onChange={(e) => setLetterForm({ ...letterForm, phone: e.target.value })}
                        placeholder="如：020-88888888"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm text-slate-600 mb-1">律所地址</label>
                      <input
                        type="text"
                        value={letterForm.lawFirmAddress}
                        onChange={(e) => setLetterForm({ ...letterForm, lawFirmAddress: e.target.value })}
                        placeholder="律师事务所详细地址"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 被函方信息 */}
                <div className="bg-red-50 rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-red-700 mb-2">▪ 被函方信息</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">被告公司名称 <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={letterForm.recipientCompany}
                        onChange={(e) => setLetterForm({ ...letterForm, recipientCompany: e.target.value })}
                        placeholder="如：广州优宿企业管理有限公司"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">被告地址 <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={letterForm.recipientAddress}
                        onChange={(e) => setLetterForm({ ...letterForm, recipientAddress: e.target.value })}
                        placeholder="公司注册地址"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* 商标信息 */}
                <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-blue-700 mb-2">▪ 商标信息</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">我方注册商标 <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={letterForm.trademarkName}
                        onChange={(e) => setLetterForm({ ...letterForm, trademarkName: e.target.value })}
                        placeholder="如：MINISO名創優品及图"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">商标注册号 <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={letterForm.trademarkNumbers}
                        onChange={(e) => setLetterForm({ ...letterForm, trademarkNumbers: e.target.value })}
                        placeholder="多个用顿号分隔"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">商品/服务类别</label>
                      <input
                        type="text"
                        value={letterForm.goodsCategory}
                        onChange={(e) => setLetterForm({ ...letterForm, goodsCategory: e.target.value })}
                        placeholder="如：第35类 零售服务"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">侵权标识 <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={letterForm.infringingMark}
                        onChange={(e) => setLetterForm({ ...letterForm, infringingMark: e.target.value })}
                        placeholder="被告使用的侵权标识"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm text-slate-600 mb-1">侵权行为描述 <span className="text-red-500">*</span></label>
                      <textarea
                        value={letterForm.infringingBehavior}
                        onChange={(e) => setLetterForm({ ...letterForm, infringingBehavior: e.target.value })}
                        placeholder="近似性及侵权行为的具体描述"
                        rows={3}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* 诉求信息 */}
                <div className="bg-yellow-50 rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-yellow-700 mb-2">▪ 诉求信息</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">整改期限（天）<span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        value={letterForm.demandDeadlineDays}
                        onChange={(e) => setLetterForm({ ...letterForm, demandDeadlineDays: e.target.value })}
                        min={1}
                        max={30}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">索赔金额<span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={letterForm.compensationAmount}
                        onChange={(e) => setLetterForm({ ...letterForm, compensationAmount: e.target.value })}
                        placeholder="如：¥403万元"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* 按钮 */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleBackToReport}
                    className="flex-1 py-3 rounded-xl font-bold text-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
                  >
                    ← 返回报告
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] py-3 rounded-xl font-bold text-lg bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white transition-colors shadow-lg"
                  >
                    ✦ 生成律师函
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // 步骤5: 生成中
  const renderGeneratingStep = () => (
    <div className="max-w-2xl mx-auto p-6 text-center">
      <div className="bg-white rounded-xl shadow-2xl p-12">
        <div className="animate-spin h-20 w-20 rounded-full border-4 border-yellow-200 border-t-yellow-600 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-slate-800 mb-4">正在生成律师函...</h2>
        <p className="text-slate-600">
          基于分析结果，AI正在起草专业的律师函文档
        </p>
      </div>
    </div>
  );

  // 渲染当前步骤
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 py-8">
      {step === 'input' && renderInputStep()}
      {step === 'analyzing' && renderAnalyzingStep()}
      {step === 'report' && renderReportStep()}
      {step === 'form' && renderFormStep()}
      {step === 'generating' && renderGeneratingStep()}
    </div>
  );
}
