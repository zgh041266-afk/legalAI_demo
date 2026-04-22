// ========== 原有类型 ==========
export interface TrademarkCase {
  id: string;
  caseNumber: string;
  year: number;
  plaintiff: string;
  defendant: string;
  trademarkName: string;
  infringingMark: string;
  court: string;
  verdict: string;
  compensation: string;
  keyPoints: string[];
  similarity: string;
  goodsCategory: string;
  outcome: 'plaintiff_won' | 'defendant_won' | 'partial';
}

export interface LawyerLetterParams {
  caseId: string;
  senderCompany: string;
  senderLawFirm: string;
  recipientCompany: string;
  recipientAddress: string;
  trademarkNumbers: string[];
  trademarkName: string;
  infringingMark: string;
  infringingBehavior: string;
  demandDeadlineDays: number;
  compensationAmount: string;
  date: string;
}

export interface GeneratedLetter {
  title: string;
  content: string;
  sections: {
    heading: string;
    body: string;
  }[];
}

export interface StreamChunk {
  type: 'text' | 'thinking' | 'done' | 'error';
  content: string;
}

// ========== 新增：对话式交互类型 ==========
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  attachments?: FileAttachment[];
}

export interface FileAttachment {
  name: string;
  type: string;
  size: number;
  url?: string;
  data?: string; // base64
}

// ========== 新增：用户意图解析 ==========
export interface UserIntent {
  type: 'evidence_collection' | 'case_search' | 'document_generation' | 'consultation';
  entities: {
    brandName?: string;
    trademarkNumber?: string;
    rightsHolder?: string;
    platform?: string; // 淘宝、京东、拼多多等
    keywords?: string[];
    infringementType?: string;
  };
  confidence: number;
}

// ========== 新增：侵权线索 ==========
export interface InfringementClue {
  id: string;
  序号: number;
  平台: string;
  商品标题: string;
  侵权URL: string;
  侵权类型: string;
  相似度得分: number;
  证据包路径?: string;
  抓取时间: string;
  商家名称?: string;
  价格?: string;
  销量?: string;
}

// ========== 新增：证据包 ==========
export interface EvidencePackage {
  caseId: string;
  packageId: string;
  clueId: string;
  screenshots: EvidenceScreenshot[];
  metadata: EvidenceMetadata;
  zipPath?: string;
  createdAt: string;
}

export interface EvidenceScreenshot {
  filename: string;
  url: string;
  hash: string; // SHA256
  timestamp: string;
  type: 'fullpage' | 'detail' | 'seller';
}

export interface EvidenceMetadata {
  url: string;
  platform: string;
  captureTime: string;
  userAgent: string;
  ipAddress?: string;
  pageTitle: string;
  sellerInfo?: {
    name: string;
    id: string;
    location?: string;
  };
}

// ========== 新增：任务状态 ==========
export interface TaskStatus {
  taskId: string;
  type: 'intent_analysis' | 'evidence_collection' | 'case_search' | 'document_generation';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number; // 0-100
  message: string;
  result?: any;
  error?: string;
  startTime: number;
  endTime?: number;
}

// ========== 新增：系统输出产物 ==========
export interface SystemOutput {
  sessionId: string;
  outputs: {
    infringementTable?: InfringementClue[];
    evidencePackages?: EvidencePackage[];
    lawyerLetter?: GeneratedLetter;
  };
  tasks: TaskStatus[];
  createdAt: string;
}

// ========== 新增：图片侵权分析类型 ==========
export interface ImageAnalysisResult {
  imageId: string;
  originalImage: string; // base64 data URL
  analysis: {
    detectedText: string[]; // OCR识别的文字
    detectedLogos: Array<{
      brand: string;
      confidence: number; // 0-1
      boundingBox: [number, number, number, number]; // [x, y, width, height]
    }>;
    infringementRisk: 'high' | 'medium' | 'low';
    riskReasons: string[];
    similarCases: string[]; // 相关案例ID
    visualSimilarity: number; // 0-1 整体视觉相似度
  };
  timestamp: number;
  processingTime: number; // 处理耗时(ms)
}

export interface ImageComparison {
  image1: string;
  image2: string;
  similarityScore: number; // 0-1
  differences: string[];
  comparisonDetails: {
    colorSimilarity: number;
    shapeSimilarity: number;
    textSimilarity: number;
    layoutSimilarity: number;
  };
}

export interface ImageAnalysisRequest {
  image: File | string; // File对象或base64字符串
  trademarkName: string;
  trademarkNumber?: string;
  goodsCategory?: string;
  referenceImages?: string[]; // 参考商标图片URL数组
}

// ========== 新增：侵权相似度分析类型 ==========
export interface SimilarityAnalysis {
  overallScore: number; // 0-100
  level: '高' | '中' | '低';
  details: {
    visualSimilarity: number;
    textSimilarity: number;
    phoneticSimilarity: number;
    conceptualSimilarity: number;
  };
  analysis: {
    similarities: string[];
    differences: string[];
    confusionRisk: string;
    legalBasis: string[];
  };
  recommendation: {
    action: '立即发函' | '建议调查' | '风险较低';
    reason: string;
    urgency: '高' | '中' | '低';
  };
  similarCases: Array<{
    caseName: string;
    similarity: string;
    result: string;
  }>;
  processingTime: number;
}

export interface AnalyzeResponse {
  success: boolean;
  trademarkName: string;
  infringingMark: string;
  goodsCategory: string;
  analysis: SimilarityAnalysis;
  rawAnalysis?: string;
  timestamp: string;
}

// ========== 新增：工作流状态类型 ==========
export type WorkflowStep = 'input' | 'analyzing' | 'report' | 'form' | 'generating' | 'complete';

export interface WorkflowState {
  step: WorkflowStep;
  inputData: {
    originalTrademarkName: string;
    originalTrademarkNumber?: string;
    originalImage?: string;
    infringingMarkName?: string;
    infringingImage?: string;
    goodsCategory?: string;
    platform?: string;
    description?: string;
  };
  analysisResult?: SimilarityAnalysis;
  letterContent?: string;
}
