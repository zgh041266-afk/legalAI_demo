'use client';

import { useState, useEffect } from 'react';
import { WorkflowStep, SimilarityAnalysis, TrademarkCase } from '@/types';

interface Step {
  id: WorkflowStep;
  label: string;
  icon: string;
}

interface ProgressSidebarProps {
  steps: Step[];
  currentStep: WorkflowStep;
  completedStep: number; // 已完成的最大步骤（1=步骤1完成, 2=步骤2完成, 3=步骤3完成）
  analysisResult: SimilarityAnalysis | null;
  selectedCase: TrademarkCase | null;
  onStepClick: (stepId: WorkflowStep) => void;
}

export default function ProgressSidebar({
  steps,
  currentStep,
  completedStep,
  analysisResult,
  selectedCase,
  onStepClick,
}: ProgressSidebarProps) {
  // 防止 hydration 不匹配：初始值设为 false，等客户端挂载后恢复
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 服务端渲染和客户端初始渲染时显示占位，避免 hydration 不匹配
  if (!isMounted) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <span>📋</span> 处理进度
          </h3>
          <div className="space-y-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className="w-full flex items-center gap-3 p-2 rounded-lg text-left bg-slate-50"
              >
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs bg-slate-300 text-slate-500">
                  {index + 1}
                </span>
                <span className="text-sm text-slate-600">{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 判断步骤是否已完成：基于 completedStep 判断
  const isStepCompleted = (stepIndex: number): boolean => {
    return stepIndex < completedStep;
  };

  // 判断步骤是否可点击：只有已完成或当前步骤才可点击
  const isStepClickable = (stepId: string): boolean => {
    const stepIndex = steps.findIndex(s => s.id === stepId);
    // 只有已完成（completedStep > stepIndex）或当前步骤（stepIndex <= completedStep）才可点击
    return stepIndex <= completedStep;
  };

  return (
    <div className="space-y-4">
      {/* 进度概览 */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <span>📋</span> 处理进度
        </h3>
        
        <div className="space-y-2">
          {steps.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted = isStepCompleted(index);
            const isClickable = isStepClickable(step.id);

            return (
              <button
                key={step.id}
                onClick={() => isClickable && onStepClick(step.id)}
                disabled={!isClickable}
                className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-all ${
                  isActive
                    ? 'bg-blue-50 border border-blue-200'
                    : isClickable
                    ? 'bg-green-50 hover:bg-green-100 cursor-pointer'
                    : 'bg-slate-50 opacity-50 cursor-not-allowed'
                }`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : isCompleted
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-300 text-slate-500'
                }`}>
                  {isActive ? index + 1 : (isCompleted ? '✓' : index + 1)}
                </span>
                <span className={`text-sm ${
                  isActive ? 'font-medium text-blue-700' : 'text-slate-600'
                }`}>
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 分析结果摘要 */}
      {analysisResult && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <span>📊</span> 分析结果
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">相似度评分</span>
              <span className={`font-bold ${
                analysisResult.overallScore >= 70 ? 'text-red-600' :
                analysisResult.overallScore >= 40 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {analysisResult.overallScore}分
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">风险等级</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                analysisResult.level === '高' ? 'bg-red-100 text-red-700' :
                analysisResult.level === '中' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {analysisResult.level}风险
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">建议行动</span>
              <span className="text-sm font-medium text-slate-700">
                {analysisResult.recommendation?.action || '建议调查'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 已选案例 */}
      {selectedCase && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <span>📚</span> 参考案例
          </h3>
          
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">
              {selectedCase.plaintiff} 案
            </p>
            <p className="text-xs text-slate-500">
              赔偿: {selectedCase.compensation}
            </p>
            <p className="text-xs text-slate-500">
              法院: {selectedCase.court}
            </p>
          </div>
        </div>
      )}

      {/* 操作提示 */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <p className="text-xs text-blue-700 leading-relaxed">
          <span className="font-medium">💡 提示：</span>
          您可以随时点击左侧步骤返回修改。所有数据会自动保存。
        </p>
      </div>
    </div>
  );
}
