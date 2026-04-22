'use client';

import { useState, useCallback, useEffect } from 'react';
import { WorkflowStep, SimilarityAnalysis, LawyerLetterParams, TrademarkCase } from '@/types';
import ProgressSidebar from './ProgressSidebar';
import Step1InfoCollection from './Step1InfoCollection';
import Step2CombinedConfirm from './Step2CombinedConfirm';
import Step4LetterPreview from './Step4LetterPreview';
import SessionSidebar, { ChatSession } from './SessionSidebar';
import ConfirmDialog from './ConfirmDialog';

// localStorage keys
const STORAGE_KEYS = {
  currentStep: 'workflow_currentStep',
  completedStep: 'workflow_completedStep',
  analysisResult: 'workflow_analysisResult',
  analysisInput: 'workflow_analysisInput',
  selectedCase: 'workflow_selectedCase',
  letterFormData: 'workflow_letterFormData',
  sessions: 'workflow_sessions',
  currentSessionId: 'workflow_currentSessionId',
};

interface MainWorkflowProps {
  onGenerateLetter: (params: LawyerLetterParams) => Promise<void>;
  letterContent: string;
  loading: boolean;
}

// 保存数据到 localStorage
const saveToStorage = (key: string, value: any) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
};

// 从 localStorage 恢复数据（仅客户端）
const loadFromStorage = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
};

// 生成唯一ID
const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// 生成默认标题
const generateDefaultTitle = (analysisResult: SimilarityAnalysis | null, selectedCase: TrademarkCase | null) => {
  if (selectedCase) {
    return `${selectedCase.plaintiff} 案`;
  }
  if (analysisResult) {
    return `侵权分析 (${analysisResult.overallScore}分)`;
  }
  return '新对话';
};

// 获取当前会话状态
const getSessionStatus = (completedStep: number, hasLetterContent: boolean): 'completed' | 'in_progress' => {
  if (completedStep >= 3 && hasLetterContent) {
    return 'completed';
  }
  return 'in_progress';
};

export default function MainWorkflow({
  onGenerateLetter,
  letterContent,
  loading,
}: MainWorkflowProps) {
  // 会话相关状态
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // 工作流状态
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('input');
  const [completedStep, setCompletedStep] = useState<number>(0);
  const [analysisResult, setAnalysisResult] = useState<SimilarityAnalysis | null>(null);
  const [analysisInput, setAnalysisInput] = useState<any>(null);
  const [selectedCase, setSelectedCase] = useState<TrademarkCase | null>(null);
  const [letterFormData, setLetterFormData] = useState<Partial<LawyerLetterParams>>({});

  // 客户端挂载后从 localStorage 恢复数据
  useEffect(() => {
    const storedSessions = loadFromStorage<ChatSession[]>(STORAGE_KEYS.sessions, []);
    const storedSessionId = loadFromStorage<string | null>(STORAGE_KEYS.currentSessionId, null);
    
    setSessions(storedSessions);
    setCurrentSessionId(storedSessionId);

    // 如果有会话ID，加载该会话的数据
    if (storedSessionId) {
      const session = storedSessions.find(s => s.id === storedSessionId);
      if (session) {
        setCurrentStep(session.data.currentStep);
        setCompletedStep(session.data.completedStep);
        setAnalysisResult(session.data.analysisResult);
        setAnalysisInput(session.data.analysisInput);
        setSelectedCase(session.data.selectedCase);
        setLetterFormData(session.data.letterFormData);
      }
    }

    setIsHydrated(true);
  }, []);

  // 保存会话列表到 localStorage
  useEffect(() => {
    if (isHydrated) {
      saveToStorage(STORAGE_KEYS.sessions, sessions);
      saveToStorage(STORAGE_KEYS.currentSessionId, currentSessionId);
    }
  }, [sessions, currentSessionId, isHydrated]);

  // 自动保存当前会话数据
  useEffect(() => {
    if (isHydrated && currentSessionId) {
      setSessions(prev => {
        const updated = prev.map(s => {
          if (s.id === currentSessionId) {
            return {
              ...s,
              updatedAt: new Date().toISOString(),
              status: getSessionStatus(completedStep, !!letterContent),
              data: {
                currentStep,
                completedStep,
                analysisResult,
                analysisInput,
                selectedCase,
                letterFormData,
                letterContent,
                messages: [],
              },
            };
          }
          return s;
        });
        return updated;
      });
    }
  }, [currentStep, completedStep, analysisResult, analysisInput, selectedCase, letterFormData, letterContent, currentSessionId, isHydrated]);

  // 创建新会话
  const createNewSession = useCallback(() => {
    const newSession: ChatSession = {
      id: generateId(),
      title: '新对话',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'in_progress',
      data: {
        currentStep: 'input',
        completedStep: 0,
        analysisResult: null,
        analysisInput: null,
        selectedCase: null,
        letterFormData: {},
        letterContent: '',
        messages: [],
      },
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    // 重置工作流状态
    setCurrentStep('input');
    setCompletedStep(0);
    setAnalysisResult(null);
    setAnalysisInput(null);
    setSelectedCase(null);
    setLetterFormData({});
  }, []);

  // 处理新建会话（显示确认框）
  const handleNewSession = useCallback(() => {
    // 检查是否有未保存的内容
    const hasContent = completedStep > 0 || analysisResult || selectedCase;
    if (hasContent) {
      setShowConfirmDialog(true);
    } else {
      createNewSession();
    }
  }, [completedStep, analysisResult, selectedCase, createNewSession]);

  // 保存当前会话并新建
  const handleSaveAndNew = useCallback(() => {
    // 更新当前会话标题
    setSessions(prev => {
      const updated = prev.map(s => {
        if (s.id === currentSessionId) {
          return {
            ...s,
            title: generateDefaultTitle(analysisResult, selectedCase),
            updatedAt: new Date().toISOString(),
            status: 'completed',
          };
        }
        return s;
      });
      return updated;
    });
    setShowConfirmDialog(false);
    createNewSession();
  }, [currentSessionId, analysisResult, selectedCase, createNewSession]);

  // 直接新建会话
  const handleDiscardAndNew = useCallback(() => {
    setShowConfirmDialog(false);
    createNewSession();
  }, [createNewSession]);

  // 选择历史会话
  const handleSelectSession = useCallback((session: ChatSession) => {
    setCurrentSessionId(session.id);
    setCurrentStep(session.data.currentStep);
    setCompletedStep(session.data.completedStep);
    setAnalysisResult(session.data.analysisResult);
    setAnalysisInput(session.data.analysisInput);
    setSelectedCase(session.data.selectedCase);
    setLetterFormData(session.data.letterFormData);
  }, []);

  // 删除会话
  const handleDeleteSession = useCallback((sessionId: string) => {
    setSessions(prev => {
      const updated = prev.filter(s => s.id !== sessionId);
      // 如果删除的是当前会话，切换到第一个或创建新会话
      if (currentSessionId === sessionId) {
        if (updated.length > 0) {
          handleSelectSession(updated[0]);
        } else {
          createNewSession();
        }
      }
      return updated;
    });
  }, [currentSessionId, handleSelectSession, createNewSession]);

  // 重命名会话
  const handleRenameSession = useCallback((sessionId: string, newTitle: string) => {
    setSessions(prev => prev.map(s => 
      s.id === sessionId ? { ...s, title: newTitle } : s
    ));
  }, []);

  // 步骤配置
  const steps = [
    { id: 'input' as WorkflowStep, label: '侵权分析', icon: '📝' },
    { id: 'form' as WorkflowStep, label: '确认信息', icon: '⚖️' },
    { id: 'complete' as WorkflowStep, label: '生成律师函', icon: '✅' },
  ];

  // 步骤1完成
  const handleAnalysisComplete = useCallback((result: SimilarityAnalysis, input: any) => {
    setAnalysisResult(result);
    setAnalysisInput(input);
    // 不自动设置 completedStep，只有用户点击"下一步"按钮时才设置
  }, []);

  // 步骤2完成
  const handleCaseSelect = useCallback((caseItem: TrademarkCase) => {
    setSelectedCase(caseItem);
    setCompletedStep(Math.max(completedStep, 2));
    setCurrentStep('form');
  }, [completedStep]);

  // 步骤3完成
  const handleFormSubmit = useCallback(
    async (formData: LawyerLetterParams) => {
      setLetterFormData(formData);
      setCompletedStep(Math.max(completedStep, 3));
      setCurrentStep('complete');
      await onGenerateLetter(formData);
    },
    [onGenerateLetter, completedStep]
  );

  // 返回上一步
  const handleBack = useCallback(() => {
    const stepMap: Record<WorkflowStep, WorkflowStep | null> = {
      input: null,
      analyzing: 'input',
      report: 'input',
      form: 'input',
      generating: 'form',
      complete: 'form',
    };
    const prevStep = stepMap[currentStep];
    if (prevStep) {
      setCurrentStep(prevStep);
    }
  }, [currentStep]);

  // 跳转到指定步骤
  const handleStepClick = useCallback(
    (stepId: WorkflowStep) => {
      const stepIndex = steps.findIndex(s => s.id === stepId);
      const canAccess = stepIndex <= completedStep;
      if (canAccess) {
        setCurrentStep(stepId);
      }
    },
    [completedStep]
  );

  // 重新生成
  const handleRegenerate = useCallback(() => {
    if (letterFormData && Object.keys(letterFormData).length > 0) {
      onGenerateLetter(letterFormData as LawyerLetterParams);
    }
  }, [letterFormData, onGenerateLetter]);

  // 渲染当前步骤内容
  const renderStepContent = () => {
    switch (currentStep) {
      case 'input':
        return (
          <Step1InfoCollection
            onAnalysisComplete={handleAnalysisComplete}
            analysisResult={analysisResult}
            analysisInput={analysisInput}
            onShowConfirmForm={() => {
              setCompletedStep(prev => Math.max(prev, 1));
              setCurrentStep('form');
            }}
          />
        );

      case 'form':
        if (analysisResult && analysisInput && completedStep >= 1) {
          return (
            <Step2CombinedConfirm
              analysisResult={analysisResult}
              analysisInput={analysisInput}
              selectedCase={selectedCase}
              onCaseSelect={handleCaseSelect}
              onSubmit={handleFormSubmit}
              onBack={handleBack}
            />
          );
        }
        // 如果没有完成步骤1，重定向回步骤1
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-500">请先完成侵权分析</p>
          </div>
        );

      case 'generating':
      case 'complete':
        if (completedStep >= 2) {
          return (
            <Step4LetterPreview
              content={letterContent}
              loading={loading}
              formData={letterFormData}
              onBack={handleBack}
              onRegenerate={handleRegenerate}
            />
          );
        }
        // 如果没有完成步骤2，重定向回步骤1
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-500">请先完成确认信息</p>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
        <div className="animate-pulse text-slate-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-100 to-slate-200">
      {/* 顶部标题栏 */}
      <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <span className="text-3xl">🛡️</span>
              权盾·知识产权智能助手
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              商标侵权分析、类案检索与律师函生成
            </p>
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
      </header>

      {/* 下方左右分栏 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧会话管理 */}
        <div className="w-72 flex-shrink-0 border-r border-slate-200 bg-white">
          <SessionSidebar
            sessions={sessions}
            currentSessionId={currentSessionId}
            onSelectSession={handleSelectSession}
            onNewSession={handleNewSession}
            onDeleteSession={handleDeleteSession}
            onRenameSession={handleRenameSession}
          />
        </div>

        {/* 右侧主内容 */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* 内容区 */}
          <div className="flex-1 flex gap-6 p-4 md:p-6 overflow-hidden">
            {/* 左侧进度栏 */}
            <div className="hidden lg:block w-64 flex-shrink-0">
              <ProgressSidebar
                steps={steps}
                currentStep={currentStep}
                completedStep={completedStep}
                analysisResult={analysisResult}
                selectedCase={selectedCase}
                onStepClick={handleStepClick}
              />
            </div>

            {/* 主内容 */}
            <div className="flex-1 min-w-0">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden h-full">
                {renderStepContent()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 确认对话框 */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="开始新对话？"
        message="检测到您有未完成的对话"
        detail="您可以选择保存当前进度到历史记录，或直接开始新对话"
        onSaveAndNew={handleSaveAndNew}
        onDiscardAndNew={handleDiscardAndNew}
        onCancel={() => setShowConfirmDialog(false)}
      />
    </div>
  );
}
