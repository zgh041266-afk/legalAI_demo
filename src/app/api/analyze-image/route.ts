import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import path from 'path';
import fs from 'fs/promises';

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get('image') as File;
    const trademarkName = formData.get('trademarkName') as string;
    const trademarkNumber = formData.get('trademarkNumber') as string || '';
    const goodsCategory = formData.get('goodsCategory') as string || '';

    if (!imageFile || !trademarkName) {
      return Response.json(
        { error: '缺少必要参数：image 或 trademarkName' },
        { status: 400 }
      );
    }

    // 1. 读取图片文件并转换为base64
    const imageBuffer = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const imageDataUrl = `data:${imageFile.type};base64,${base64Image}`;

    // 2. 初始化OpenAI客户端
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL,
    });

    // 3. 构建GPT-4 Vision提示词
    const prompt = `你是一个专业的商标侵权视觉分析专家。请仔细分析这张图片，判断是否涉及商标侵权：

商标信息：
- 商标名称：${trademarkName}
${trademarkNumber ? `- 注册号：${trademarkNumber}` : ''}
${goodsCategory ? `- 使用类别：${goodsCategory}` : ''}

请按以下步骤分析：
1. 提取图片中所有可见的文字、logo、图形元素
2. 与提供的商标信息进行比较
3. 判断侵权风险等级（high/medium/low）
4. 提供详细的分析理由

请以JSON格式返回结果：
{
  "detectedText": ["提取的文字数组"],
  "detectedLogos": [{"brand": "品牌名", "confidence": 0.95, "boundingBox": [x, y, width, height]}],
  "infringementRisk": "high|medium|low",
  "riskReasons": ["具体理由1", "具体理由2"],
  "similarCases": ["相关案例ID"],
  "visualSimilarity": 0.85
}`;

    // 4. 调用GPT-4 Vision API
    const startTime = Date.now();
    const response = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: { url: imageDataUrl }
            }
          ]
        }
      ],
      max_tokens: 2000,
      temperature: 0.1,
    });

    const processingTime = Date.now() - startTime;
    const analysisText = response.choices[0]?.message?.content || '{}';

    // 5. 解析AI响应
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (parseError) {
      console.error('解析AI响应失败:', parseError);
      analysis = {
        detectedText: [],
        detectedLogos: [],
        infringementRisk: 'low',
        riskReasons: ['AI分析结果解析失败'],
        similarCases: [],
        visualSimilarity: 0
      };
    }

    // 6. 构建完整结果
    const result = {
      imageId: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      originalImage: imageDataUrl,
      analysis: {
        detectedText: analysis.detectedText || [],
        detectedLogos: analysis.detectedLogos || [],
        infringementRisk: analysis.infringementRisk || 'low',
        riskReasons: analysis.riskReasons || [],
        similarCases: analysis.similarCases || [],
        visualSimilarity: analysis.visualSimilarity || 0
      },
      timestamp: Date.now(),
      processingTime
    };

    return Response.json(result);

  } catch (error) {
    console.error('图片分析API错误:', error);
    return Response.json(
      {
        error: '图片分析失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}