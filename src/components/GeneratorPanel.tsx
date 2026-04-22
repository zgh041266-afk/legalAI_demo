'use client';

import { useState, useEffect } from 'react';
import { TRADEMARK_CASES } from '@/data/cases';
import { LawyerLetterParams } from '@/types';

interface GeneratorPanelRrops {
  selectedCaseId: string;
  onGenerate: (params: LawyerLetterParams) => void;
  loading: boolean;
}

export default function GeneratorPanel({
  selectedCaseId,
  onGenerate,
  loading,
}: GeneratorPanelRrops) {
  const selectedCase = TRADEMARK_CASES.find((c) => c.id === selectedCaseId);

  const [form, setForm] = useState({
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

  // Auto-fill when selected case changes
  useEffect(() => {
    if (selectedCase) {
      setForm((prev) => ({
        ...prev,
        trademarkName: selectedCase.trademarkName,
        infringingMark: selectedCase.infringingMark,
        infringingBehavior: selectedCase.similarity,
        compensationAmount: selectedCase.compensation,
        goodsCategory: selectedCase.goodsCategory,
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCaseId]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onGenerate({
      ...form,
      caseId: selectedCaseId,
      trademarkNumbers: form.trademarkNumbers.split('、').filter(Boolean),
      demandDeadlineDays: Number(form.demandDeadlineDays),
    } as unknown as LawyerLetterParams);
  }

  function FieldInput({
    label,
    name,
    placeholder,
    required = false,
  }: {
    label: string;
    name: string;
    placeholder: string;
    required?: boolean;
  }) {
    return (
      <div className="space-y-1">
        <label className="block text-sm text-slate-300">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
        <input
          type="text"
          name={name}
          value={(form as Record<string, string>)[name] || ''}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full bg-slate-800/60 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-yellow-400/60 focus:border-yellow-400/60"
          required={required}
        />
      </div>
    );
  }

  function TextAreaField({
    label,
    name,
    placeholder,
    required = false,
  }: {
    label: string;
    name: string;
    placeholder: string;
    required?: boolean;
  }) {
    return (
      <div className="space-y-1">
        <label className="block text-sm text-slate-300">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
        <textarea
          name={name}
          value={(form as Record<string, string>)[name] || ''}
          onChange={handleChange}
          placeholder={placeholder}
          rows={3}
          className="w-full bg-slate-800/60 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-yellow-400/60 resize-none"
          required={required}
        />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-yellow-400 mb-1">生成律师函</h2>
        {selectedCase && (
          <p className="text-slate-400 text-sm">
            参考案例：<span className="text-yellow-300">{selectedCase.plaintiff}</span> 案
          </p>
        )}
      </div>

      {/* Sender */}
      <div className="bg-slate-800/30 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-yellow-500 mb-2">▪ 委托方信息</h3>
        <FieldInput label="委托公司名称" name="senderCompany" placeholder="如：广东赛曼投资有限公司" required />
        <FieldInput label="委托律师事务所" name="senderLawFirm" placeholder="如：广东尚之信律师事务所" />
        <FieldInput label="律师姓名" name="lawyerName" placeholder="经办律师姓名" />
        <FieldInput label="联系电话" name="phone" placeholder="如：020-88888888" />
        <FieldInput label="律所地址" name="lawFirmAddress" placeholder="律师事务所详细地址" />
      </div>

      {/* Recipient */}
      <div className="bg-slate-800/30 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-yellow-500 mb-2">▪ 被函方信息</h3>
        <FieldInput label="被告公司名称" name="recipientCompany" placeholder="如：广州优宿企业管理有限公司" required />
        <FieldInput label="被告地址" name="recipientAddress" placeholder="公司注册地址" required />
      </div>

      {/* Trademark */}
      <div className="bg-slate-800/30 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-yellow-500 mb-2">▪ 商标信息</h3>
        <FieldInput label="我方注册商标" name="trademarkName" placeholder="如：MINISO名創優品及图" required />
        <FieldInput label="商标注册号" name="trademarkNumbers" placeholder="多个用顿号分隔，如：第13604462号、第14589119号" required />
        <FieldInput label="商品/服务类别" name="goodsCategory" placeholder="如：第35类 零售服务/精品百货" />
        <FieldInput label="侵权标识" name="infringingMark" placeholder="被告使用的侵权标识" required />
        <TextAreaField label="侵权行为描述" name="infringingBehavior" placeholder="近似性及侵权行为的具体描述" required />
      </div>

      {/* Demands */}
      <div className="bg-slate-800/30 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-yellow-500 mb-2">▪ 诉求信息</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-sm text-slate-300">整改期限（天）<span className="text-red-400 ml-1">*</span></label>
            <input
              type="number"
              name="demandDeadlineDays"
              value={form.demandDeadlineDays}
              onChange={handleChange}
              min={1}
              max={30}
              className="w-full bg-slate-800/60 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-yellow-400/60"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm text-slate-300">索赔金额<span className="text-red-400 ml-1">*</span></label>
            <input
              type="text"
              name="compensationAmount"
              value={form.compensationAmount}
              onChange={handleChange}
              placeholder="如：¥403万元"
              className="w-full bg-slate-800/60 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-yellow-400/60"
              required
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-black text-base font-bold py-3 rounded-xl transition-colors duration-200 shadow-lg"
      >
        {loading ? (
          <span className="flex items-center justifu-center gap-2">
            <span className="animate-spin h-4 w-4 rounded-full border-2 border-black/30 border-t-black" />
            AI 正在起草律师函…
          </span>
        ) : (
          '✦ 生成律师函'
        )}
      </button>
    </form>
  );
}
