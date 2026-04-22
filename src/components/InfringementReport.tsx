'use client';

import { SimilarityAnalysis } from '@/types';

interface InfringementReportProps {
  trademarkName: string;
  infringingMark: string;
  goodsCategory: string;
  analysis: SimilarityAnalysis;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function InfringementReport({
  trademarkName,
  infringingMark,
  goodsCategory,
  analysis,
  onConfirm,
  onCancel,
  loading = false,
}: InfringementReportProps) {
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-red-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 70) return 'bg-red-50 border-red-200';
    if (score >= 40) return 'bg-yellow-50 border-yellow-200';
    return 'bg-green-50 border-green-200';
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case '高':
        return 'bg-red-100 text-red-800 border-red-300';
      case '中':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case '低':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case '立即发函':
        return 'bg-red-500 text-white';
      case '建议调查':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-green-500 text-white';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl max-w-5xl mx-auto overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <span className="text-3xl">🔍</span>
          侵权相似度分析报告
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          {new Date().toLocaleString('zh-CN')}
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* 案件概览 */}
        <div className="bg-slate-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-slate-600 mb-3">📋 案件概览</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-3 rounded border border-slate-200">
              <div className="text-xs text-slate-500 mb-1">我方商标</div>
              <div className="font-semibold text-slate-800">{trademarkName}</div>
            </div>
            <div className="bg-white p-3 rounded border border-slate-200">
              <div className="text-xs text-slate-500 mb-1">疑似侵权标识</div>
              <div className="font-semibold text-slate-800">{infringingMark}</div>
            </div>
            <div className="bg-white p-3 rounded border border-slate-200">
              <div className="text-xs text-slate-500 mb-1">商品类别</div>
              <div className="font-semibold text-slate-800">{goodsCategory}</div>
            </div>
          </div>
        </div>

        {/* 综合评分 */}
        <div className={`rounded-lg p-6 border-2 ${getScoreBg(analysis.overallScore)}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">综合相似度评分</h3>
              <p className="text-sm text-slate-600 mt-1">
                基于视觉、文字、读音、概念四维度分析
              </p>
            </div>
            <div className="text-center">
              <div className={`text-5xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                {analysis.overallScore}
              </div>
              <div className="text-sm text-slate-500 mt-1">/ 100 分</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className={`px-4 py-2 rounded-full font-semibold border-2 ${getLevelBadge(analysis.level)}`}>
              侵权风险等级：{analysis.level}
            </span>
          </div>
        </div>

        {/* 分项评分 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: '视觉相似度', value: analysis.details.visualSimilarity, icon: '👁️' },
            { label: '文字相似度', value: analysis.details.textSimilarity, icon: '🔤' },
            { label: '读音相似度', value: analysis.details.phoneticSimilarity, icon: '🔊' },
            { label: '概念相似度', value: analysis.details.conceptualSimilarity, icon: '💡' },
          ].map((item, index) => (
            <div key={index} className="bg-white rounded-lg p-4 border border-slate-200 text-center">
              <div className="text-2xl mb-2">{item.icon}</div>
              <div className="text-sm text-slate-500 mb-1">{item.label}</div>
              <div className={`text-2xl font-bold ${getScoreColor(item.value)}`}>
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

        {/* 详细分析 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 相似点 */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
              <span>✅</span> 相似之处
            </h3>
            <ul className="space-y-2">
              {analysis.analysis.similarities.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-green-700">
                  <span className="text-green-500 mt-0.5">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* 差异点 */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
              <span>⚪</span> 差异之处
            </h3>
            <ul className="space-y-2">
              {analysis.analysis.differences.length > 0 ? (
                analysis.analysis.differences.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-blue-700">
                    <span className="text-blue-500 mt-0.5">•</span>
                    {item}
                  </li>
                ))
              ) : (
                <li className="text-sm text-blue-600 italic">差异不明显</li>
              )}
            </ul>
          </div>
        </div>

        {/* 混淆风险 & 法律依据 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <h3 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
              <span>⚠️</span> 混淆可能性分析
            </h3>
            <p className="text-sm text-purple-700 leading-relaxed">
              {analysis.analysis.confusionRisk}
            </p>
          </div>

          <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
            <h3 className="font-semibold text-indigo-800 mb-3 flex items-center gap-2">
              <span>⚖️</span> 法律依据
            </h3>
            <ul className="space-y-1">
              {analysis.analysis.legalBasis.map((item, index) => (
                <li key={index} className="text-sm text-indigo-700">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 相似案例 */}
        {analysis.similarCases.length > 0 && (
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span>📁</span> 相似判例参考
            </h3>
            <div className="space-y-3">
              {analysis.similarCases.map((caseItem, index) => (
                <div
                  key={index}
                  className="bg-white p-3 rounded border border-slate-200 flex items-start gap-3"
                >
                  <div className="bg-slate-100 rounded px-2 py-1 text-xs font-medium text-slate-600">
                    案例{index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-slate-800">{caseItem.caseName}</div>
                    <div className="text-sm text-slate-600 mt-1">
                      相似点：{caseItem.similarity}
                    </div>
                    <div className="text-sm text-slate-600">
                      判决：{caseItem.result}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 建议 & 行动 */}
        <div className={`rounded-lg p-6 border-2 ${
          analysis.recommendation.action === '立即发函' 
            ? 'bg-red-50 border-red-300' 
            : analysis.recommendation.action === '建议调查'
              ? 'bg-yellow-50 border-yellow-300'
              : 'bg-green-50 border-green-300'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`px-4 py-2 rounded-lg font-bold text-white ${getActionBadge(analysis.recommendation.action)}`}>
              {analysis.recommendation.action}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-slate-800 mb-2">建议理由</div>
              <p className="text-slate-700">{analysis.recommendation.reason}</p>
              <div className="mt-2 text-sm">
                <span className="text-slate-500">紧急程度：</span>
                <span className={`font-medium ${
                  analysis.recommendation.urgency === '高' 
                    ? 'text-red-600' 
                    : analysis.recommendation.urgency === '中'
                      ? 'text-yellow-600'
                      : 'text-green-600'
                }`}>
                  {analysis.recommendation.urgency === '高' ? '🔴 高' : 
                   analysis.recommendation.urgency === '中' ? '🟡 中' : '🟢 低'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 处理信息 */}
        <div className="text-xs text-slate-400 text-center">
          分析耗时：{analysis.processingTime}ms | AI辅助分析，仅供参考
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200">
          <button
            onClick={onCancel}
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
          >
            取消 / 返回修改
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-8 py-3 rounded-lg font-bold transition-colors shadow-lg flex items-center gap-2 ${
              loading
                ? 'bg-slate-400 cursor-not-allowed'
                : analysis.level === '高'
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-yellow-500 hover:bg-yellow-400 text-black'
            }`}
          >
            {loading ? (
              <>
                <span className="animate-spin h-5 w-5 rounded-full border-2 border-white/30 border-t-white" />
                正在生成律师函...
              </>
            ) : (
              <>
                {analysis.level === '高' ? '⚡ 确认发函' : '📝 生成律师函'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
