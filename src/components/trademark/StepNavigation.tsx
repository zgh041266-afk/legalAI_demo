'use client';

import { WorkflowStep } from '@/types';

interface Step {
  id: WorkflowStep;
  label: string;
  icon: string;
}

interface StepNavigationProps {
  steps: Step[];
  currentStep: WorkflowStep;
  onStepClick: (stepId: WorkflowStep) => void;
  onToggleSidebar?: () => void;
}

export default function StepNavigation({ 
  steps, 
  currentStep, 
  onStepClick,
  onToggleSidebar 
}: StepNavigationProps) {
  return (
    <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
        {/* 标题 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            {/* 菜单按钮 */}
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors lg:hidden"
                title="切换侧边栏"
              >
                <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <span className="text-3xl">🛡️</span>
              权盾·知识产权智能助手
            </h1>
          </div>
          
          {/* 功能标签 */}
          <div className="hidden md:flex items-center gap-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              🤖 小理AI/腾讯元宝
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              📊 智能分析
            </span>
          </div>
        </div>

        {/* 步骤指示器 */}
        <div className="flex items-center justify-center gap-2 md:gap-8">
          {steps.map((step, index) => {
            const stepIndex = steps.findIndex(s => s.id === step.id);
            const isActive = currentStep === step.id;
            const isCompleted = stepIndex < steps.findIndex(s => s.id === currentStep);
            
            return (
              <div key={step.id} className="flex items-center">
                {index > 0 && (
                  <div className={`w-8 md:w-16 h-0.5 mr-2 md:mr-4 ${
                    isCompleted ? 'bg-blue-500' : 'bg-slate-300'
                  }`} />
                )}
                <button
                  onClick={() => onStepClick(step.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                    isActive 
                      ? 'bg-blue-500 text-white shadow-md' 
                      : isCompleted 
                        ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' 
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  <span className="text-lg">{step.icon}</span>
                  <span className="font-medium text-sm">{step.label}</span>
                  {isCompleted && (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </header>
  );
}
