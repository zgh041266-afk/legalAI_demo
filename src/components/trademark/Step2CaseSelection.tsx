'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { SimilarityAnalysis, TrademarkCase, LawyerLetterParams } from '@/types';
import { TRADEMARK_CASES } from '@/data/cases';
import CaseCard from '@/components/CaseCard';

interface Step2CombinedConfirmProps {
  analysisResult: SimilarityAnalysis;
  analysisInput: any;
  selectedCase: TrademarkCase | null;
  onCaseSelect: (caseItem: TrademarkCase) => void;
  onSubmit: (formData: LawyerLetterParams) => void;
  onBack: () => void;
}

interface FormData {
  senderCompany: string;
  senderLawFirm: string;
  lawyerName: string;
  phone: string;
  recipientCompany: string;
  recipientAddress: string;
  trademarkName: string;
  trademarkNumbers: string;
  infringingMark: string;
  infringingBehavior: string;
  goodsCategory: string;
  demandDeadlineDays: number;
  compensationAmount: string;
}

// 智能表单输入组件：有值时正常显示，无值时显示灰色placeholder
function SmartInput({
  label,
  required,
  value,
  onChange,
  placeholder,
  type = 'text',
  ...props
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const hasValue = value && value.trim().length > 0;

  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={hasValue ? '' : placeholder}
        className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
          hasValue ? 'text-slate-800' : 'text-slate-400'
        }`}
        {...props}
      />
    </div>
  );
}

// 智能文本域组件
function SmartTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  ...props
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows?: number;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const hasValue = value && value.trim().length > 0;

  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 mb-1">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={hasValue ? '' : placeholder}
        className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none ${
          hasValue ? 'text-slate-800' : 'text-slate-400'
        }`}
        {...props}
      />
    </div>
  );
}

export default function Step2CombinedConfirm({
  analysisResult,
  analysisInput,
  selectedCase,
  onCaseSelect,
  onSubmit,
  onBack,
}: Step2CombinedConfirmProps) {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(selectedCase?.id || null);
  const [showForm, setShowForm] = useState(!!selectedCase);

  const [formData, setFormData] = useState<FormData>({
    senderCompany: '',
    senderLawFirm: '',
    lawyerName: '',
    phone: '',
    recipientCompany: '',
    recipientAddress: '',
    trademarkName: '',
    trademarkNumbers: '',
    infringingMark: '',
    infringingBehavior: '',
    goodsCategory: '',
    demandDeadlineDays: 7,
    compensationAmount: '',
  });

  // 获取 goodsCategory（兼容不同数据格式）
  const goodsCategory = analysisInput?.goodsCategory || analysisInput?.formData?.goodsCategory;

  // 基于分析结果匹配推荐案例
  const recommendedCases = useMemo(() => {
    const scoredCases = TRADEMARK_CASES.map((caseItem) => {
      let score = 0;

      if (analysisResult.level === '高' && caseItem.outcome === 'plaintiff_won') {
        score += 30;
      }

      if (goodsCategory && caseItem.goodsCategory.includes(goodsCategory)) {
        score += 25;
      }

      if (analysisResult.details.visualSimilarity > 70) {
        score += 20;
      }

      if (analysisResult.details.textSimilarity > 70) {
        score += 15;
      }

      score += Math.random() * 10;

      return { ...caseItem, matchScore: Math.min(100, Math.round(score)) };
    });

    return scoredCases.sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);
  }, [analysisResult, goodsCategory]);

  const otherCases = useMemo(() => {
    const recommendedIds = new Set(recommendedCases.map((c) => c.id));
    return TRADEMARK_CASES.filter((c) => !recommendedIds.has(c.id));
  }, [recommendedCases]);

  // 预填充表单数据
  const generateBehaviorDesc = useCallback(() => {
    // 兼容不同数据格式
    const platform = analysisInput?.platform || analysisInput?.formData?.platform || '相关平台';
    const infringingMark = analysisInput?.infringingMark || analysisInput?.formData?.infringingMark || '';
    const originalTrademark = analysisInput?.originalTrademark || analysisInput?.formData?.originalTrademark || '';

    const parts = [
      `经调查，贵方在${platform}上使用的"${infringingMark}"标识，`,
      `与我方注册商标"${originalTrademark}"构成近似。`,
      `AI相似度分析显示：综合评分${analysisResult.overallScore}分，风险等级${analysisResult.level}。`,
      analysisResult.analysis.confusionRisk,
    ];
    return parts.join('');
  }, [analysisInput, analysisResult]);

  useEffect(() => {
    if (selectedCaseId) {
      const caseItem = TRADEMARK_CASES.find((c) => c.id === selectedCaseId);
      if (caseItem) {
        // 兼容不同数据格式
        const infringingMark = analysisInput?.infringingMark || analysisInput?.formData?.infringingMark || '';
        const originalTrademark = analysisInput?.originalTrademark || analysisInput?.formData?.originalTrademark || '';
        const trademarkNumber = analysisInput?.trademarkNumber || analysisInput?.formData?.trademarkNumber || '';
        const goodsCategory = analysisInput?.goodsCategory || analysisInput?.formData?.goodsCategory || caseItem.goodsCategory;

        setFormData({
          senderCompany: '',
          senderLawFirm: '',
          lawyerName: '',
          phone: '',
          recipientCompany: infringingMark ? `${infringingMark}相关主体` : '',
          recipientAddress: '',
          trademarkName: originalTrademark,
          trademarkNumbers: trademarkNumber,
          infringingMark: infringingMark,
          infringingBehavior: generateBehaviorDesc(),
          goodsCategory: goodsCategory,
          demandDeadlineDays: 7,
          compensationAmount: caseItem.compensation,
        });
      }
    }
  }, [selectedCaseId, analysisInput, generateBehaviorDesc]);

  const handleSelectCase = useCallback((caseItem: TrademarkCase) => {
    setSelectedCaseId(caseItem.id);
    onCaseSelect(caseItem);
    setShowForm(true);
  }, [onCaseSelect]);

  const handleFormChange = useCallback((field: keyof FormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!formData.senderCompany.trim()) {
        alert('请填写委托公司名称');
        return;
      }

      const selectedCaseItem = TRADEMARK_CASES.find((c) => c.id === selectedCaseId);
      if (!selectedCaseItem) {
        alert('请选择案例');
        return;
      }

      const submitData: LawyerLetterParams = {
        caseId: selectedCaseId || '',
        senderCompany: formData.senderCompany,
        senderLawFirm: formData.senderLawFirm,
        recipientCompany: formData.recipientCompany,
        recipientAddress: formData.recipientAddress,
        trademarkNumbers: formData.trademarkNumbers.split(',').map((n) => n.trim()),
        trademarkName: formData.trademarkName,
        infringingMark: formData.infringingMark,
        infringingBehavior: formData.infringingBehavior,
        demandDeadlineDays: formData.demandDeadlineDays,
        compensationAmount: formData.compensationAmount,
      };

      onSubmit(submitData);
    },
    [selectedCaseId, formData, onSubmit]
  );

  const getLevelColor = (level: string) => {
    switch (level) {
      case '高':
        return 'text-red-600 bg-red-50 border-red-200';
      case '中':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case '低':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getActionStyle = (action: string) => {
    switch (action) {
      case '立即发函':
        return 'bg-red-500 text-white';
      case '建议调查':
        return 'bg-yellow-500 text-white';
      case '风险较低':
        return 'bg-green-500 text-white';
      default:
        return 'bg-slate-500 text-white';
    }
  };

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* 标题 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">选择参考案例 & 确认信息</h2>
          <p className="text-slate-500">选择一个相似度高的案例，填写律师函信息</p>
        </div>

        {/* 推荐案例 */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">推荐案例</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {recommendedCases.map((caseItem) => (
              <CaseCard
                key={caseItem.id}
                caseData={caseItem}
                selected={selectedCaseId === caseItem.id}
                onSelect={() => handleSelectCase(caseItem)}
              />
            ))}
          </div>
        </div>

        {/* 其他案例 */}
        {otherCases.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">其他案例</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {otherCases.map((caseItem) => (
                <button
                  key={caseItem.id}
                  onClick={() => handleSelectCase(caseItem)}
                  className={`p-0 cursor-pointer transition-all text-left ${
                    selectedCaseId === caseItem.id
                      ? 'ring-2 ring-blue-500 rounded-lg overflow-hidden'
                      : 'hover:shadow-md'
                  }`}
                >
                  <div className="p-3 bg-white rounded-lg border border-slate-200 hover:border-blue-300">
                    <p className="font-medium text-slate-800 truncate text-sm">{caseItem.plaintiff}</p>
                    <p className="text-xs text-slate-500 truncate">vs {caseItem.defendant}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 律师函确认表单 */}
        {showForm && selectedCaseId && (
          <form onSubmit={handleSubmit} className="mt-8 border-t pt-8">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">律师函详细信息</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* 发件方信息 */}
              <div className="md:col-span-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-3">发件方信息</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SmartInput
                    label="委托公司名称"
                    required
                    value={formData.senderCompany}
                    onChange={(val) => handleFormChange('senderCompany', val)}
                    placeholder="请输入委托公司名称"
                  />
                  <SmartInput
                    label="委托律所"
                    value={formData.senderLawFirm}
                    onChange={(val) => handleFormChange('senderLawFirm', val)}
                    placeholder="请输入委托律所"
                  />
                  <SmartInput
                    label="律师姓名"
                    value={formData.lawyerName}
                    onChange={(val) => handleFormChange('lawyerName', val)}
                    placeholder="请输入律师姓名"
                  />
                  <SmartInput
                    label="联系电话"
                    value={formData.phone}
                    onChange={(val) => handleFormChange('phone', val)}
                    placeholder="请输入联系电话"
                  />
                </div>
              </div>

              {/* 被告方信息 */}
              <div className="md:col-span-2 p-4 bg-red-50 rounded-lg border border-red-200">
                <h4 className="font-medium text-red-900 mb-3">被告方信息</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SmartInput
                    label="被告公司/店铺名称"
                    required
                    value={formData.recipientCompany}
                    onChange={(val) => handleFormChange('recipientCompany', val)}
                    placeholder="请输入被告公司/店铺名称"
                  />
                  <SmartInput
                    label="被告地址"
                    value={formData.recipientAddress}
                    onChange={(val) => handleFormChange('recipientAddress', val)}
                    placeholder="请输入被告地址"
                  />
                </div>
              </div>

              {/* 商标信息 */}
              <div className="md:col-span-2 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-medium text-purple-900 mb-3">商标信息</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SmartInput
                    label="注册商标名称"
                    value={formData.trademarkName}
                    onChange={(val) => handleFormChange('trademarkName', val)}
                    placeholder="请输入注册商标名称"
                  />
                  <SmartInput
                    label="商标注册号"
                    value={formData.trademarkNumbers}
                    onChange={(val) => handleFormChange('trademarkNumbers', val)}
                    placeholder="请输入商标注册号"
                  />
                  <SmartInput
                    label="侵权标识"
                    value={formData.infringingMark}
                    onChange={(val) => handleFormChange('infringingMark', val)}
                    placeholder="请输入侵权标识"
                  />
                  <SmartInput
                    label="商品类别"
                    value={formData.goodsCategory}
                    onChange={(val) => handleFormChange('goodsCategory', val)}
                    placeholder="请输入商品类别"
                  />
                </div>
              </div>

              {/* 侵权行为说明 */}
              <div className="md:col-span-2">
                <SmartTextarea
                  label="侵权行为说明"
                  value={formData.infringingBehavior}
                  onChange={(val) => handleFormChange('infringingBehavior', val)}
                  placeholder="请详细描述侵权行为"
                  rows={4}
                />
              </div>

              {/* 要求与赔偿 */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  要求期限（天）
                </label>
                <input
                  type="number"
                  value={formData.demandDeadlineDays}
                  onChange={(e) => handleFormChange('demandDeadlineDays', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800"
                  min="1"
                  max="90"
                />
              </div>

              <SmartInput
                label="要求赔偿金额"
                value={formData.compensationAmount}
                onChange={(val) => handleFormChange('compensationAmount', val)}
                placeholder="请输入要求赔偿金额"
              />
            </div>

            {/* 按钮 */}
            <div className="flex gap-4 justify-end">
              <button
                type="button"
                onClick={onBack}
                className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
              >
                上一步
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                下一步 → 生成律师函
              </button>
            </div>
          </form>
        )}

        {/* 如果未选择案例，提示 */}
        {!showForm && (
          <div className="mt-8 p-6 bg-slate-50 rounded-lg border border-slate-200 text-center">
            <p className="text-slate-600">请先选择一个案例，然后填写律师函信息</p>
          </div>
        )}
      </div>
    </div>
  );
}
