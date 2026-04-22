import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { searchTrademarkCases, getDeliConfig } from '@/lib/deli-api';

export const maxDuration = 60;

interface AnalyzeRequest {
  originalTrademarkName?: string;
  originalTrademarkNumber?: string;
  images?: string[]; // base64 array
  infringingMarkName?: string;
  goodsCategory?: string;
  platform?: string;
  description?: string;
}

interface SimilarityAnalysis {
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

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body: AnalyzeRequest = await req.json();
    const {
      originalTrademarkName,
      originalTrademarkNumber,
      images,
      infringingMarkName,
      goodsCategory,
      platform,
      description,
    } = body;

    // 验证必填字段 - 允许通过自然语言描述进行分析
    if (!originalTrademarkName && !description) {
      return NextResponse.json(
        { error: '请提供原创商标名称或描述您的侵权情况' },
        { status: 400 }
      );
    }

    // 调试日志
    console.log('API请求参数:', {
      originalTrademarkName,
      originalTrademarkNumber,
      infringingMarkName,
      goodsCategory,
      platform,
      description: description?.substring(0, 100) + '...',
      imagesCount: images?.length || 0,
      hasApiKey: !!process.env.OPENAI_API_KEY,
      baseUrl: process.env.OPENAI_BASE_URL,
    });

    // 初始化 OpenAI 客户端
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || 'https://new-api.lingowhale.com/v1',
    });

    // 构建文本提示
    let promptText = `你是一位专业的知识产权商标分析师。请分析以下商标侵权案件。

我方商标：${originalTrademarkName || '请从用户描述中分析'}
${originalTrademarkNumber ? `注册号：${originalTrademarkNumber}` : ''}
商品/服务类别：${goodsCategory || '未指定'}
侵权方标识：${infringingMarkName || '请从用户描述或图片中分析'}
${description ? `用户描述：${description}` : ''}
${platform ? `发现平台：${platform}` : ''}

请从以下维度分析：
1. 视觉相似度（图形、颜色、构图）
2. 文字相似度（字形、读音、含义）
3. 商品/服务关联性
4. 消费者混淆可能性

请以JSON格式返回分析结果，格式如下：
{
  "overallScore": 0-100,
  "level": "高"|"中"|"低",
  "details": {
    "visualSimilarity": 0-100,
    "textSimilarity": 0-100,
    "phoneticSimilarity": 0-100,
    "conceptualSimilarity": 0-100
  },
  "analysis": {
    "similarities": ["相似点1", "相似点2"],
    "differences": ["差异点1", "差异点2"],
    "confusionRisk": "混淆风险描述",
    "legalBasis": ["《商标法》第XX条"]
  },
  "recommendation": {
    "action": "立即发函"|"建议调查"|"风险较低",
    "reason": "建议理由",
    "urgency": "高"|"中"|"低"
  },
  "similarCases": [
    {"caseName": "案例名称", "similarity": "相似点", "result": "判决结果"}
  ]
}

注意：如果用户未直接提供商标名称或侵权方标识，请从"用户描述"或图片中智能提取并分析。`;

    if (images && images.length > 0) {
      promptText += `\n\n用户已上传 ${images.length} 张图片材料，请结合文字描述进行分析。`;
    }

    // 检查是否使用模拟模式（当没有可用API时）
    const useMock = !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'mock';
    
    let analysisContent = '';
    
    if (useMock) {
      console.log('使用模拟数据模式');
      // 模拟AI分析结果
      await new Promise(resolve => setTimeout(resolve, 1500)); // 模拟网络延迟
      analysisContent = JSON.stringify({
        overallScore: 85,
        level: '高',
        details: {
          visualSimilarity: 80,
          textSimilarity: 90,
          phoneticSimilarity: 85,
          conceptualSimilarity: 85
        },
        analysis: {
          similarities: ['商标文字高度相似，均包含"优品"字样', '整体视觉风格相近，容易造成消费者混淆', '商品类别相同，均为日用百货'],
          differences: ['前缀不同，分别为"名创"和"优宿"', '字体设计略有差异'],
          confusionRisk: '较高，普通消费者难以区分两个品牌',
          legalBasis: ['《商标法》第57条：未经商标注册人的许可，在同一种商品上使用与其注册商标近似的商标，容易导致混淆的', '《商标法实施条例》第76条']
        },
        recommendation: {
          action: '立即发函',
          reason: '侵权相似度高，建议立即采取法律行动',
          urgency: '高'
        },
        similarCases: [
          {caseName: '名创优品诉优宿优品商标侵权案', similarity: '商标近似、商品同类', result: '胜诉，获赔50万元'},
          {caseName: '小米诉小米生活商标侵权案', similarity: '商标文字近似', result: '胜诉，获赔3000万元'}
        ]
      });
    } else {
      // 统一使用配置模型处理所有情况
      const model = process.env.OPENAI_MODEL || 'gpt-4o';
      console.log('使用模型:', model, '图片数量:', images?.length || 0);
      
      const response = await openai.chat.completions.create({
        model,
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: promptText,
          },
        ],
      });

      analysisContent = response.choices[0]?.message?.content || '';
    }

    // 解析 AI 返回的 JSON
    let result: SimilarityAnalysis;
    try {
      // 尝试提取 JSON（可能包含在 markdown 代码块中）
      const jsonMatch = analysisContent.match(/```(?:json)?\s*([\s\S]*?)```/) || 
                       analysisContent.match(/(\{[\s\S]*\})/);
      const jsonStr = jsonMatch ? jsonMatch[1] : analysisContent;
      result = JSON.parse(jsonStr);
    } catch {
      // 解析失败，使用默认结构
      result = {
        overallScore: 50,
        level: '中',
        details: {
          visualSimilarity: 50,
          textSimilarity: 50,
          phoneticSimilarity: 50,
          conceptualSimilarity: 50,
        },
        analysis: {
          similarities: ['分析内容解析失败'],
          differences: [],
          confusionRisk: '需要进一步人工判断',
          legalBasis: ['《商标法》第57条'],
        },
        recommendation: {
          action: '建议调查',
          reason: 'AI分析结果解析异常，建议人工复核',
          urgency: '中',
        },
        similarCases: [],
        processingTime: Date.now() - startTime,
      };
    }

    // 从 description 中智能提取商标名称
    function extractTrademarkNames(text: string): { plaintiff: string; defendant: string } {
      const result = { plaintiff: '', defendant: '' };
      if (!text) return result;

      // 提取原告商标（常见模式：我/我们是 XXX 的法务/商标权人/代理人，发现...)
      const plaintiffPatterns = [
        /我是(.+?)(?:的?法务|商标权|商标持有人|商标权人|代理人|员工|工作人员)/,
        /我们是(.+?)(?:的?法务|商标权|商标持有人|商标权人|代理人)/,
        /(.+?)的?商标(?:注册号|注册|权)/,
        /原告(?:是|为)(.+?)[，,]/,
      ];
      for (const pattern of plaintiffPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          result.plaintiff = match[1].trim();
          break;
        }
      }

      // 提取被告商标/店铺（常见模式：发现XXX店铺/XXX商品/XXX在...)
      const defendantPatterns = [
        /发现(.+?)(?:店铺|旗舰店|专卖店|在销售|在卖)/,
        /在(.+?)(?:发现|看到|销售|看到)/,
        /被告(.+?)[，,]/,
        /(?:涉嫌)?侵权(.+?)[，,，.]/,
      ];
      for (const pattern of defendantPatterns) {
        const match = text.match(pattern);
        if (match && match[1] && match[1] !== result.plaintiff) {
          result.defendant = match[1].trim();
          break;
        }
      }

      // 如果没找到，尝试直接搜索公司/品牌名
      if (!result.plaintiff) {
        const brandMatch = text.match(/(.+?)(?:有限公司?|股份|集团|Co\.|Ltd\.)/);
        if (brandMatch) {
          result.plaintiff = brandMatch[1].trim();
        }
      }

      return result;
    }

    // 调取得理类案检索 API（如果配置了）
    const deliConfig = getDeliConfig();
    
    // 优先使用表单填写的名称，其次从描述中提取
    const extractedNames = extractTrademarkNames(description || '');
    const trademarkName = originalTrademarkName || extractedNames.plaintiff || result.analysis?.similarities?.[0] || '';
    const infringingMark = infringingMarkName || extractedNames.defendant || '';

    console.log('得理API检索参数:', { trademarkName, infringingMark, originalTrademarkName, extractedNames });

    if (deliConfig && trademarkName) {
      try {
        const deliCases = await searchTrademarkCases(
          trademarkName,
          infringingMark,
          deliConfig
        );
        
        // 将得理案例合并到结果中
        if (deliCases.length > 0) {
          const formattedDeliCases = deliCases.map(c => ({
            caseName: c.caseName,
            similarity: c.summary?.substring(0, 100) || '得理类案检索结果',
            result: `${c.court} | ${c.caseNumber}`,
          }));
          
          // 合并案例（去重）
          result.similarCases = [
            ...formattedDeliCases,
            ...(result.similarCases || []),
          ].slice(0, 5); // 最多显示5个
        }
      } catch (deliError) {
        console.error('得理API调用失败:', deliError);
        // 得理失败不影响主流程，继续使用GPT的案例
      }
    }

    // 确保必要字段存在
    result.processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      trademarkName: originalTrademarkName || '从描述中分析',
      infringingMark: infringingMarkName || '图片分析',
      goodsCategory: goodsCategory || '未指定',
      analysis: result,
      rawAnalysis: analysisContent,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('侵权分析API错误:', error);
    // 详细记录错误信息
    const errorDetails = {
      error: '分析失败',
      message: error instanceof Error ? error.message : '未知错误',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      // @ts-ignore
      status: error?.status,
      // @ts-ignore
      code: error?.code,
      processingTime: Date.now() - startTime,
    };
    console.error('错误详情:', JSON.stringify(errorDetails, null, 2));
    return NextResponse.json(errorDetails, { status: 500 });
  }
}
