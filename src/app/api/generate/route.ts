import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'path';

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    caseId,
    senderCompany,
    senderLawFirm,
    recipientCompany,
    recipientAddress,
    trademarkNumbers,
    trademarkName,
    infringingMark,
    infringingBehavior,
    demandDeadlineDays,
    compensationAmount,
    lawyerName,
    phone,
    lawFirmAddress,
  } = body;

  // ── Spin up MCP server ─────────────────────────────────────────────────────
  const mcpServerPath = path.join(process.cwd(), 'mcp-server', 'index.ts');
  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['tsx', mcpServerPath],
    env: Object.fromEntries(
      Object.entries(process.env).filter((e): e is [string, string] => e[1] !== undefined)
    ),
  });

  const mcpClient = new Client(
    { name: 'legal-doc-client', version: '1.0.0' },
    { capabilities: {} }
  );

  await mcpClient.connect(transport);

  // ── Fetch case details + template via MCP ──────────────────────────────────
  let caseDetails = '';
  let letterTemplate = '';
  let complaintPoints = '';

  try {
    if (caseId) {
      const caseResult = await mcpClient.callTool({
        name: 'get_case_details',
        arguments: { case_id: caseId },
      });
      caseDetails = (caseResult.content as Array<{ type: string; text: string }>)
        .map((c) => c.text)
        .join('');
    }

    const templateResult = await mcpClient.callTool({
      name: 'get_lawyer_letter_template',
      arguments: { reference_case_id: caseId || 'miniso' },
    });
    letterTemplate = (templateResult.content as Array<{ type: string; text: string }>)
      .map((c) => c.text)
      .join('');

    const pointsResult = await mcpClient.callTool({
      name: 'generate_complaint_points',
      arguments: {
        plaintiff_trademark: trademarkName,
        defendant_mark: infringingMark,
        goods_category: body.goodsCategory || '相关商品/服务',
        similarity_basis: infringingBehavior,
      },
    });
    complaintPoints = (pointsResult.content as Array<{ type: string; text: string }>)
      .map((c) => c.text)
      .join('');
  } finally {
    await mcpClient.close();
  }

  // ── Stream from GPT-5.1 via lingowhale OpenAI-compatible API ────────────────
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || 'https://new-api.lingowhale.com/v1',
  });
  const model = process.env.OPENAI_MODEL || 'gpt-5-mini';

  const today = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const systemPrompt = `你是一位专业的知识产权律师，擅长起草商标侵权律师函。
你的任务是根据提供的案情信息，生成一份正式、专业、具有法律效力的商标侵权律师函。

要求：
1. 语言正式、严谨，符合中国法律文书规范
2. 结构完整，包含五大章节：权利基础与法律依据、侵权行为事实认定、要求义务、后续法律行动、联系方式
3. 法律引用准确（《商标法》第五十七条等）
4. 侵权分析有理有据，逻辑严密
5. 威慑力强，但措辞专业不激进
6. 全文使用中文

以下是参考的律师函模板和诉求要点：
${letterTemplate}

以下是投诉要点分析：
${complaintPoints}

${caseDetails ? `以下是参考案例详情：\n${caseDetails}` : ''}`;

  const userMessage = `请根据以下信息，起草一份完整的商标侵权律师函：

**委托方（原告）**：${senderCompany}
**委托律师事务所**：${senderLawFirm || '本律师事务所'}
**律师姓名**：${lawyerName || '本所律师'}
**联系电话**：${phone || '请填写联系电话'}
**律所地址**：${lawFirmAddress || '请填写律所地址'}

**被函方（被告）**：${recipientCompany}
**被函方地址**：${recipientAddress}

**我方注册商标**：${trademarkName}
**商标注册号**：${Array.isArray(trademarkNumbers) ? trademarkNumbers.join('、') : trademarkNumbers}

**侵权标识**：${infringingMark}
**侵权行为描述**：${infringingBehavior}

**整改期限**：${demandDeadlineDays || 7}日
**索赔金额**：不低于人民币${compensationAmount}
**发函日期**：${today}

请生成完整律师函正文，格式规范，章节清晰，内容详尽。`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const gptStream = await openai.chat.completions.create({
          model,
          max_tokens: 8000,
          stream: true,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
        });

        for await (const chunk of gptStream) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) {
            const data = JSON.stringify({ type: 'text', content: delta });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
        }

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'done', content: '' })}\n\n`)
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'error', content: msg })}\n\n`
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
