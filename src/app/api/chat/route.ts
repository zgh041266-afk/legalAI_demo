import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'path';

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { messages } = body;

  // 获取最后一条用户消息
  const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop();
  if (!lastUserMessage) {
    return new Response('No user message found', { status: 400 });
  }

  // ── 启动 MCP 客户端 ─────────────────────────────────────────────────────
  const mcpServerPath = path.join(process.cwd(), 'mcp-server', 'index.ts');
  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['tsx', mcpServerPath],
    env: Object.fromEntries(
      Object.entries(process.env).filter((e): e is [string, string] => e[1] !== undefined)
    ),
  });

  const mcpClient = new Client(
    { name: 'legal-chat-client', version: '1.0.0' },
    { capabilities: {} }
  );

  await mcpClient.connect(transport);

  // ── 步骤1：意图识别 ─────────────────────────────────────────────────────
  let intentResult;
  try {
    intentResult = await mcpClient.callTool({
      name: 'parse_user_intent',
      arguments: { user_input: lastUserMessage.content },
    });
  } catch (err) {
    console.error('Intent parsing failed:', err);
  }

  const intent = intentResult
    ? JSON.parse(
        (intentResult.content as Array<{ type: string; text: string }>)
          .map((c) => c.text)
          .join('')
      )
    : null;

  // ── 步骤2：根据意图并行执行任务 ─────────────────────────────────────────
  const tasks: Promise<any>[] = [];

  // 如果需要类案检索
  if (intent?.type === 'case_search' || intent?.entities?.brandName) {
    tasks.push(
      mcpClient.callTool({
        name: 'search_similar_cases',
        arguments: {
          brand_name: intent.entities.brandName,
          trademark_number: intent.entities.trademarkNumber,
        },
      })
    );
  }

  // 如果需要证据收集（模拟）
  if (intent?.type === 'evidence_collection' || intent?.entities?.platform) {
    tasks.push(
      mcpClient.callTool({
        name: 'simulate_evidence_collection',
        arguments: {
          platform: intent.entities.platform || '淘宝',
          keywords: intent.entities.keywords || [intent.entities.brandName],
        },
      })
    );
  }

  const taskResults = await Promise.all(tasks);

  // 关闭 MCP 连接
  await mcpClient.close();

  // ── 步骤3：构造 GPT-5.1 提示词 ─────────────────────────────────────────
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || 'https://new-api.lingowhale.com/v1',
  });
  const model = process.env.OPENAI_MODEL || 'gpt-5-mini';

  const systemPrompt = `你是权盾AI助手，专注于商标侵权取证与法律文书生成。

你的能力：
1. 解析用户需求，提取关键信息（品牌名、商标号、平台、侵权类型）
2. 检索相似判例，提供法律依据
3. 模拟证据收集流程，生成侵权线索汇总表
4. 起草专业的商标侵权律师函

当前任务上下文：
${intent ? `- 用户意图：${intent.type}\n- 提取实体：${JSON.stringify(intent.entities, null, 2)}` : ''}
${taskResults.length > 0 ? `- 已执行任务结果：\n${taskResults.map((r, i) => `  任务${i + 1}: ${JSON.stringify(r.content)}`).join('\n')}` : ''}

回复要求：
- 语言专业、简洁、友好
- 如果识别到具体需求，主动说明下一步操作
- 如果信息不足，引导用户补充关键信息
- 使用中文回复`;

  const userMessage = lastUserMessage.content;

  // ── 步骤4：流式返回 ─────────────────────────────────────────────────────
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 先返回结构化数据（如果有）
        if (taskResults.length > 0) {
          // 模拟返回侵权线索
          const mockClues = [
            {
              id: '1',
              序号: 1,
              平台: '淘宝',
              商品标题: '优宿优品 USUPSO 精品百货店 创意家居生活用品',
              侵权URL: 'https://item.taobao.com/item.htm?id=123456789',
              侵权类型: '商标侵权',
              相似度得分: 87,
              抓取时间: new Date().toISOString(),
              商家名称: '优宿旗舰店',
              价格: '¥19.9',
              销量: '1200+',
            },
            {
              id: '2',
              序号: 2,
              平台: '淘宝',
              商品标题: 'USUPSO优宿 日用百货 创意小商品批发',
              侵权URL: 'https://item.taobao.com/item.htm?id=987654321',
              侵权类型: '商标侵权',
              相似度得分: 92,
              抓取时间: new Date().toISOString(),
              商家名称: '优宿生活馆',
              价格: '¥29.9',
              销量: '800+',
            },
          ];

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'infringement_clues', data: mockClues })}\n\n`
            )
          );
        }

        // 流式返回 AI 回复
        const gptStream = await openai.chat.completions.create({
          model,
          max_tokens: 4000,
          stream: true,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
        });

        for await (const chunk of gptStream) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'text', content: delta })}\n\n`)
            );
          }
        }

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'done', content: '' })}\n\n`)
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', content: msg })}\n\n`)
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
