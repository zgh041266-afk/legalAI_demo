'use client';

import { useState, useEffect, useCallback } from 'react';
import { SimilarityAnalysis, TrademarkCase, LawyerLetterParams } from '@/types';

interface Step3LetterFormProps {
  selectedCase: TrademarkCase;
  analysisResult: SimilarityAnalysis;
  analysisInput: any;
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

export default function Step3LetterForm({
  selectedCase,
  analysisResult,
  analysisInput,
  onSubmit,
  onBack,
}: Step3LetterFormProps) {
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

  // 预填充表单数据
  useEffect(() => {
    // 生成侵权行为描述
    const generateBehaviorDesc = () => {
      const parts = [
        `经调查，贵方在${analysisInput.platform || '相关平台'}上使用的"${analysisInput.infringingMark}"标识，`,
        `与我方注册商标"${analysisInput.originalTrademark}"构成近似。`,
        `AI相似度分析显示：综合评分${analysisResult.overallScore}分，风险等级${analysisResult.level}。`,
        analysisResult.analysis.confusionRisk,
      ];
      return parts.join('');
    };

    setFormData({
      senderCompany: '',
      senderLawFirm: '',
      lawyerName: '',
      phone: '',
      recipientCompany: analysisInput.infringingMark
        ? `${analysisInput.infringingMark}相关主体`
        : '',
      recipientAddress: '',
      trademarkName: analysisInput.originalTrademark || '',
      trademarkNumbers: analysisInput.trademarkNumber || '',
      infringingMark: analysisInput.infringingMark || '',
      infringingBehavior: generateBehaviorDesc(),
      goodsCategory: analysisInput.goodsCategory || selectedCase.goodsCategory,
      demandDeadlineDays: 7,
      compensationAmount: selectedCase.compensation,
    });
  }, [selectedCase, analysisResult, analysisInput]);

  const handleChange = useCallback(
    (field: keyof FormData, value: string | number) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // 验证必填字段
      if (!formData.senderCompany.trim()) {
        alert('请填写委托公司名称');
        return;
      }
      if (!formData.recipientCompany.trim()) {
        alert('请填写被告公司名称');
        return;
      }
      if (!formData.recipientAddress.trim()) {
        alert('请填写被告地址');
        return;
      }

      const params: LawyerLetterParams = {
        caseId: selectedCase.id,
        senderCompany: formData.senderCompany,
        senderLawFirm: formData.senderLawFirm,
        recipientCompany: formData.recipientCompany,
        recipientAddress: formData.recipientAddress,
        trademarkNumbers: formData.trademarkNumbers
          .split(/[,，、]/)
          .filter(Boolean),
        trademarkName: formData.trademarkName,
        infringingMark: formData.infringingMark,
        infringingBehavior: formData.infringingBehavior,
        demandDeadlineDays: formData.demandDeadlineDays,
        compensationAmount: formData.compensationAmount,
        date: new Date().toISOString().split('T')[0],
      };

      onSubmit(params);
    },
    [formData, selectedCase.id, onSubmit]
  );

  return (
    <div className="p-6 md:p-8">
      {/* 标题 */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          律师函信息确认
        </h2>
        <p className="text-slate-500">
          参考案例：
          <span className="font-semibold text-blue-600">
            {selectedCase.plaintiff}案
          </span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 委托方信息 */}
        <div className="bg-slate-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <span className="text-blue-500">▪</span>
            委托方信息
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                委托公司名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.senderCompany}
                onChange={(e) => handleChange('senderCompany', e.target.value)}
                placeholder="如：广东赛曼投资有限公司"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                委托律师事务所
              </label>
              <input
                type="text"
                value={formData.senderLawFirm}
                onChange={(e) => handleChange('senderLawFirm', e.target.value)}
                placeholder="如：广东尚之信律师事务所"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                律师姓名
              </label>
              <input
                type="text"
                value={formData.lawyerName}
                onChange={(e) => handleChange('lawyerName', e.target.value)}
                placeholder="经办律师姓名"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                联系电话
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="如：020-88888888"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 被函方信息 */}
        <div className="bg-red-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-red-700 mb-4 flex items-center gap-2">
            <span className="text-red-500">▪</span>
            被函方信息
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                被告公司名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.recipientCompany}
                onChange={(e) => handleChange('recipientCompany', e.target.value)}
                placeholder="如：广州优宿企业管理有限公司"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-600 mb-1">
                被告地址 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.recipientAddress}
                onChange={(e) => handleChange('recipientAddress', e.target.value)}
                placeholder="公司注册地址或经营地址"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>
          </div>
        </div>

        {/* 商标与侵权信息 */}
        <div className="bg-blue-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-700 mb-4 flex items-center gap-2">
            <span className="text-blue-500">▪</span>
            商标与侵权信息
            <span className="text-sm font-normal text-slate-400">（已预填充，可修改）</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                我方注册商标
              </label>
              <input
                type="text"
                value={formData.trademarkName}
                onChange={(e) => handleChange('trademarkName', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                商标注册号
              </label>
              <input
                type="text"
                value={formData.trademarkNumbers}
                onChange={(e) => handleChange('trademarkNumbers', e.target.value)}
                placeholder="多个用逗号分隔"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                商品/服务类别
              </label>
              <input
                type="text"
                value={formData.goodsCategory}
                onChange={(e) => handleChange('goodsCategory', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                侵权标识
              </label>
              <input
                type="text"
                value={formData.infringingMark}
                onChange={(e) => handleChange('infringingMark', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-600 mb-1">
                侵权行为描述
              </label>
              <textarea
                value={formData.infringingBehavior}
                onChange={(e) => handleChange('infringingBehavior', e.target.value)}
                rows={4}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* 诉求信息 */}
        <div className="bg-yellow-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-yellow-700 mb-4 flex items-center gap-2">
            <span className="text-yellow-500">▪</span>
            诉求信息
            <span className="text-sm font-normal text-slate-400">（已预填充，可修改）</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                整改期限（天）
              </label>
              <input
                type="number"
                value={formData.demandDeadlineDays}
                onChange={(e) =>
                  handleChange('demandDeadlineDays', parseInt(e.target.value) || 7)
                }
                min={1}
                max={30}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                索赔金额
              </label>
              <input
                type="text"
                value={formData.compensationAmount}
                onChange={(e) => handleChange('compensationAmount', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
          </div>
        </div>

        {/* 按钮 */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-200">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
          >
            ← 返回选择案例
          </button>
          <button
            type="submit"
            className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-lg font-bold transition-colors shadow-lg"
          >
            ✦ 生成律师函
          </button>
        </div>
      </form>
    </div>
  );
}
