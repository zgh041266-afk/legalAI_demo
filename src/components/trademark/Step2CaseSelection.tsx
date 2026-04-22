'use client';

import { useState, useMemo, useCallback } from 'react';
import { SimilarityAnalysis, TrademarkCase } from '@/types';
import { TRADEMARK_CASES } from '@/data/cases';
import CaseCard from '@/components/CaseCard';

interface Step2CaseSelectionProps {
  analysisResult: SimilarityAnalysis;
  analysisInput: any;
  onCaseSelect: (caseItem: TrademarkCase) => void;
  onBack: () => void;
}

export default function Step2CaseSelection({
  analysisResult,
  analysisInput,
  onCaseSelect,
  onBack,
}: Step2CaseSelectionProps) {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  // 基于分析结果匹配推荐案例
  const recommendedCases = useMemo(() => {
    // 计算每个案例的匹配分数
    const scoredCases = TRADEMARK_CASES.map((caseItem) => {
      let score = 0;

      // 基于相似度等级匹配
      if (analysisResult.level === '高' && caseItem.outcome === 'plaintiff_won') {
        score += 30;
      }

      // 基于商品类别匹配
      if (
        analysisInput.goodsCategory &&
        caseItem.goodsCategory.includes(analysisInput.goodsCategory)
      ) {
        score += 25;
      }

      // 基于视觉相似度匹配
      if (analysisResult.details.visualSimilarity > 70) {
        score += 20;
      }

      // 基于文字相似度匹配
      if (analysisResult.details.textSimilarity > 70) {
        score += 15;
      }

      // 随机因素（让不同案例都有机会被推荐）
      score += Math.random() * 10;

      return { ...caseItem, matchScore: Math.min(100, Math.round(score)) };
    });

    // 按匹配分数排序，取前3个
    return scoredCases.sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);
  }, [analysisResult, analysisInput]);

  // 其他案例（非推荐的）
  const otherCases = useMemo(() => {
    const recommendedIds = new Set(recommendedCases.map((c) => c.id));
    return TRADEMARK_CASES.filter((c) => !recommendedIds.has(c.id));
  }, [recommendedCases]);

  // 处理案例选择
  const handleSelect = useCallback(
    (id: string) => {
      setSelectedCaseId(id);
    },
    []
  );

  // 确认选择并继续
  const handleConfirm = useCallback(() => {
    const selectedCase = TRADEMARK_CASES.find((c) => c.id === selectedCaseId);
    if (selectedCase) {
      onCaseSelect(selectedCase);
    }
  }, [selectedCaseId, onCaseSelect]);

  // 获取风险等级颜色
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

  // 获取建议行动样式
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
      {/* 标题 */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">AI侵权相似度分析</h2>
        <p className="text-slate-500">基于您提供的信息，AI已完成侵权相似度分析</p>
      </div>

      {/* 分析结果概览 */}
      <div className={`rounded-xl p-6 border-2 mb-8 ${getLevelColor(analysisResult.level)}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1">综合相似度评分</h3>
            <p className="text-sm opacity-80">基于视觉、文字、读音、概念四维度分析</p>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold">{analysisResult.overallScore}</div>
            <div className="text-sm mt-1">/ 100 分</div>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4">
          <span className="px-4 py-2 rounded-full font-semibold border-2 bg-white/50">
            风险等级：{analysisResult.level}
          </span>
          <span className={`px-4 py-2 rounded-full font-semibold ${getActionStyle(analysisResult.recommendation.action)}`}>
            建议：{analysisResult.recommendation.action}
          </span>
        </div>
      </div>

      {/* 四维度分析 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: '视觉相似度', value: analysisResult.details.visualSimilarity, icon: '👁️' },
          { label: '文字相似度', value: analysisResult.details.textSimilarity, icon: '🔤' },
          { label: '读音相似度', value: analysisResult.details.phoneticSimilarity, icon: '🔊' },
          { label: '概念相似度', value: analysisResult.details.conceptualSimilarity, icon: '💡' },
        ].map((item, index) => (
          <div key={index} className="bg-white rounded-lg p-4 border border-slate-200 text-center">
            <div className="text-2xl mb-2">{item.icon}</div>
            <div className="text-sm text-slate-500 mb-1">{item.label}</div>
            <div
              className={`text-2xl font-bold ${
                item.value >= 70 ? 'text-red-500' : item.value >= 40 ? 'text-yellow-500' : 'text-green-500'
              }`}
            >
              {item.value}
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full ${
                  item.value >= 70 ? 'bg-red-500' : item.value >= 40 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${item.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* AI推荐案例 */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <span>📌</span>
          AI智能推荐案例
          <span className="text-sm font-normal text-slate-400">（基于案情特征匹配）</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendedCases.map((caseItem) => (
            <div key={caseItem.id} className="relative">
              <div className="absolute -top-2 left-4 z-10">
                <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  匹配度 {caseItem.matchScore}%
                </span>
              </div>
              <CaseCard
                caseData={caseItem}
                selected={selectedCaseId === caseItem.id}
                onSelect={handleSelect}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 其他案例 */}
      {otherCases.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span>📚</span>
            其他参考案例
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {otherCases.map((caseItem) => (
              <CaseCard
                key={caseItem.id}
                caseData={caseItem}
                selected={selectedCaseId === caseItem.id}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-200">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
        >
          ← 返回修改信息
        </button>

        <button
          onClick={handleConfirm}
          disabled={!selectedCaseId}
          className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 text-white rounded-lg font-bold transition-colors shadow-lg disabled:shadow-none"
        >
          {selectedCaseId ? '下一步：确认律师函信息 →' : '请先选择一个案例'}
        </button>
      </div>
    </div>
  );
}
