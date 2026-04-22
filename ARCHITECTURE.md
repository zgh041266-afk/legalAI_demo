# 商标侵权律师函智能生成系统 - 架构设计文档 (v2.0)

## 1. 系统概述

本系统是一个基于 GPT-5.1/GPT-4o 和 MCP（Model Context Protocol）的法律文书智能生成平台，专注于商标侵权律师函的自动化起草。系统通过结构化的案例知识库、AI侵权分析、律师确认流程和文档生成工作流，实现从用户输入到专业法律文书输出的全流程自动化。

### 核心能力
- **侵权相似度分析**: AI 多维度分析视觉/文字/读音/概念相似度
- 5 个真实商标侵权案例的知识库（MINISO、瑞幸咖啡、小米、蜜雪冰城、外星人电解质水）
- 基于 MCP 协议的模块化工具调用架构
- GPT-5.1/GPT-4o Vision 驱动的律师函智能生成
- 律师确认流程 - 先生成分析报告，再决定是否发函
- 多格式文档导出 (DOCX/HTML/PDF/Markdown/TXT)
- 实时流式输出

---

## 2. 架构设计

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         前端层 (Next.js 16)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │  案例库展示   │  │  表单收集器   │  │  实时预览 + 导出   │   │
│  │ CaseLibrary  │  │ GeneratorPanel│  │   LetterPreview    │   │
│  └──────────────┘  └──────────────┘  └────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTP POST
┌─────────────────────────────────────────────────────────────────┐
│                    API 路由层 (Next.js API)                      │
│                   /api/generate/route.ts                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  1. 接收用户参数                                          │  │
│  │  2. 启动 MCP 客户端 (StdioClientTransport)               │  │
│  │  3. 调用 MCP 工具获取案例数据 + 模板                     │  │
│  │  4. 构造 GPT-5.1 提示词                                   │  │
│  │  5. 流式返回生成结果 (SSE)                               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                    ↓ stdio (subprocess)        ↓ HTTPS
         ┌──────────────────────┐      ┌─────────────────────┐
         │   MCP Server 层       │      │   LLM 推理层        │
         │  mcp-server/index.ts  │      │  GPT-5.1 API        │
         │                       │      │  (lingowhale)       │
         │  ┌─────────────────┐ │      │                     │
         │  │ 4 个 MCP 工具：  │ │      │  - 流式生成         │
         │  │ • list_cases    │ │      │  - 8000 tokens      │
         │  │ • get_details   │ │      │  - 中文法律文书     │
         │  │ • get_template  │ │      └─────────────────────┘
         │  │ • gen_points    │ │
         │  └─────────────────┘ │
         │                       │
         │  ┌─────────────────┐ │
         │  │  案例数据存储    │ │
         │  │  (内存 JSON)     │ │
         │  └─────────────────┘ │
         └──────────────────────┘
```

### 2.2 技术栈

**前端**
- Next.js 16.2.3 (App Router + Turbopack)
- React 19 + TypeScript
- Tailwind CSS (暗色主题)
- docx + file-saver (客户端 DOCX 生成)

**后端**
- Next.js API Routes (Serverless)
- OpenAI SDK 6.34.0 (GPT-5.1 via lingowhale)
- @modelcontextprotocol/sdk (MCP 客户端/服务端)

**协议与通信**
- MCP (Model Context Protocol) - stdio transport
- Server-Sent Events (SSE) - 流式响应
- OpenAI Chat Completions API

---

## 3. 技术说明

### 3.1 数据处理侧

#### 3.1.1 原始数据来源

**案例数据**（`src/data/cases.ts`）
- 5 个真实商标侵权判决案例
- 数据结构：
  ```typescript
  {
    id: string;              // 案例唯一标识
    caseNumber: string;      // 法院案号
    plaintiff: string;       // 原告
    defendant: string;       // 被告
    trademarkName: string;   // 注册商标
    infringingMark: string;  // 侵权标识
    compensation: string;    // 赔偿金额
    keyPoints: string[];     // 判决要点
    similarity: string;      // 近似性分析
    goodsCategory: string;   // 商品类别
  }
  ```

**律师函模板**（`src/data/cases.ts` + `mcp-server/index.ts`）
- 基于名创优品案真实律师函结构
- 5 个标准章节：权利基础、侵权认定、要求义务、后续行动、联系方式

#### 3.1.2 数据处理过程

```
用户输入参数
    ↓
[API Route] 接收并验证
    ↓
[MCP Client] 调用 3 个工具：
    ├─ get_case_details(caseId)        → 获取参考案例完整信息
    ├─ get_lawyer_letter_template()    → 获取律师函标准格式
    └─ generate_complaint_points()     → 生成侵权要点分析
    ↓
[数据融合] 构造结构化上下文：
    {
      案例事实: caseDetails,
      文书模板: letterTemplate,
      侵权分析: complaintPoints,
      用户参数: { 委托方、被告方、商标信息、诉求 }
    }
    ↓
[提示词工程] 注入 GPT-5.1 system + user prompt
    ↓
[流式生成] SSE 实时返回
```

#### 3.1.3 提示词设计

**System Prompt 结构**
```
角色定义：专业知识产权律师
任务目标：生成正式商标侵权律师函
质量要求：
  - 语言正式、符合中国法律文书规范
  - 结构完整（五大章节）
  - 法律引用准确（商标法第57条等）
  - 侵权分析有理有据
  - 威慑力强但措辞专业

上下文注入：
  1. 律师函标准模板（含占位符）
  2. 侵权要点分析（5 个维度）
  3. 参考案例详情（可选）
```

**User Prompt 结构**
```
请根据以下信息起草律师函：

【委托方信息】
- 公司名称、律所、律师、联系方式

【被函方信息】
- 公司名称、地址

【商标信息】
- 注册商标、注册号、侵权标识、侵权行为描述

【诉求信息】
- 整改期限、索赔金额、发函日期
```

#### 3.1.4 工作流编排

**MCP 工具调用顺序**
1. `get_case_details` - 获取参考案例（如果用户选择了案例）
2. `get_lawyer_letter_template` - 获取标准格式模板
3. `generate_complaint_points` - 根据用户输入生成侵权分析

**并发策略**
- 3 个 MCP 工具调用串行执行（因为有依赖关系）
- MCP Server 作为子进程启动，通过 stdio 通信
- 调用完成后立即关闭 MCP 连接，释放资源

**流式输出**
```typescript
OpenAI Stream → ReadableStream → SSE Format
每个 chunk: data: {"type":"text","content":"..."}\n\n
结束标记: data: {"type":"done","content":""}\n\n
```

---

### 3.2 用户需求侧

#### 3.2.1 需求收集方式

**选项式收集**（主要方式）
- 案例选择：5 个预设案例卡片，点击选择
- 自动填充：选择案例后自动填充商标名称、侵权标识、商品类别、索赔金额
- 结构化表单：
  ```
  委托方信息：公司名称*、律所、律师、电话、地址
  被函方信息：公司名称*、地址*
  商标信息：商标名称*、注册号*、类别、侵权标识*、侵权行为*
  诉求信息：整改期限*（1-30天）、索赔金额*
  ```

**自然语言提问式**（未来扩展）
- 当前未实现
- 可扩展为对话式收集：
  ```
  AI: "请描述侵权方使用的标识"
  用户: "他们用的是 USUPSO 优宿优品"
  AI: "这与您的 MINISO 商标在哪些方面相似？"
  ```

#### 3.2.2 需求结构化

**输入参数类型定义**（`src/types/index.ts`）
```typescript
interface LawyerLetterParams {
  caseId: string;                    // 参考案例ID
  senderCompany: string;             // 委托方
  senderLawFirm?: string;            // 律所
  recipientCompany: string;          // 被告
  recipientAddress: string;          // 被告地址
  trademarkNumbers: string[];        // 商标注册号数组
  trademarkName: string;             // 商标名称
  infringingMark: string;            // 侵权标识
  infringingBehavior: string;        // 侵权行为描述
  demandDeadlineDays: number;        // 整改期限
  compensationAmount: string;        // 索赔金额
  lawyerName?: string;               // 律师姓名
  phone?: string;                    // 联系电话
  lawFirmAddress?: string;           // 律所地址
  goodsCategory?: string;            // 商品类别
}
```

**验证规则**
- 必填字段：委托方、被告、商标名称、注册号、侵权标识、侵权行为、索赔金额
- 格式校验：整改期限 1-30 天
- 数组处理：商标注册号用顿号分隔（"第13604462号、第14589119号"）

#### 3.2.3 知识库匹配

**匹配策略**
1. **精确匹配**：用户选择案例 ID → 直接获取完整案例数据
2. **类别匹配**：根据商品类别筛选相似案例
   ```typescript
   // MCP 工具支持
   list_trademark_cases({ filter_by_category: "第43类" })
   ```
3. **相似度匹配**（未来扩展）：
   - 基于商标名称的文本相似度
   - 基于侵权行为描述的语义相似度

**知识库结构**
```
案例库 (5 cases)
  ├─ 基础信息：案号、当事人、法院、判决
  ├─ 商标信息：注册商标、侵权标识、商品类别
  ├─ 判决要点：4-5 个关键点
  └─ 相似性分析：文字/视觉/读音近似性描述
```

#### 3.2.4 侵权文书输出工作流

```
[1] 用户填写表单 → 前端验证
    ↓
[2] POST /api/generate → 后端接收
    ↓
[3] 启动 MCP Server (子进程)
    ↓
[4] 并行调用 MCP 工具
    ├─ 获取案例详情
    ├─ 获取律师函模板
    └─ 生成侵权要点
    ↓
[5] 构造 GPT-5.1 提示词
    ├─ System: 角色 + 要求 + 模板 + 要点 + 案例
    └─ User: 结构化参数
    ↓
[6] 调用 GPT-5.1 API (stream=true)
    ↓
[7] SSE 流式返回前端
    ├─ 前端实时渲染
    └─ 累积完整文本
    ↓
[8] 用户点击导出 → 客户端生成 DOCX
```

#### 3.2.5 输出信息要素

**律师函标准结构**（5 个章节）

**一、权利基础与法律依据**
- 商标注册证信息（注册号、商标名称、类别）
- 法律授权委托关系
- 法律条文引用（商标法第 57 条、民法典相关条款）

**二、侵权行为事实认定**
- 被告使用的侵权标识描述
- 商标近似性分析（文字/视觉/读音）
- 商品/服务类别相同性论证
- 混淆可能性分析
- 损害后果说明

**三、要求义务**
- 立即停止侵权行为
- 书面道歉声明
- 赔偿经济损失（具体金额）
- 履行期限（通常 7 日）

**四、后续法律行动**
- 行政投诉（国家知识产权局）
- 民事诉讼（人民法院）
- 刑事控告（视情节）

**五、联系方式**
- 律师事务所名称
- 经办律师姓名
- 联系电话/传真
- 律所地址
- 发函日期

**元数据**
- 收件方公司名称及地址
- 委托方公司名称
- 文书类型：律师函
- 生成时间戳

---

## 4. 关键技术实现

### 4.1 MCP 架构

**为什么使用 MCP？**
- 模块化：工具定义与业务逻辑分离
- 可扩展：新增工具无需修改 API 代码
- 标准化：遵循 Model Context Protocol 规范
- 隔离性：MCP Server 作为独立进程运行

**通信机制**
```typescript
// API Route 侧（客户端）
const transport = new StdioClientTransport({
  command: 'npx',
  args: ['tsx', 'mcp-server/index.ts'],
});
const client = new Client({ name: 'legal-doc-client' });
await client.connect(transport);

// 调用工具
const result = await client.callTool({
  name: 'get_case_details',
  arguments: { case_id: 'miniso' }
});

// MCP Server 侧
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  // 处理工具调用
  return { content: [{ type: 'text', text: JSON.stringify(data) }] };
});
```

### 4.2 流式生成

**SSE 格式**
```
data: {"type":"text","content":"律"}\n\n
data: {"type":"text","content":"师"}\n\n
data: {"type":"text","content":"函"}\n\n
...
data: {"type":"done","content":""}\n\n
```

**前端消费**
```typescript
const eventSource = new EventSource('/api/generate');
eventSource.onmessage = (e) => {
  const chunk = JSON.parse(e.data);
  if (chunk.type === 'text') {
    setContent(prev => prev + chunk.content);
  }
};
```

### 4.3 DOCX 导出

**客户端生成**（避免 SSR 问题）
```typescript
const { Document, Paragraph, TextRun, Packer } = await import('docx');
const doc = new Document({
  sections: [{
    children: [
      new Paragraph({
        text: '律师函',
        heading: HeadingLevel.HEADING_1,
      }),
      // ... 更多段落
    ]
  }]
});
const blob = await Packer.toBlob(doc);
saveAs(blob, '律师函.docx');
```

---

## 5. 未来扩展

### 5.1 图片识别功能
- 上传商标图片 → GPT-5.1 Vision API
- 自动识别侵权标识的视觉相似度
- 生成图文对比分析报告

### 5.2 多轮对话式需求收集
- 引导式提问收集案情
- 自动补全缺失信息
- 智能推荐相似案例

### 5.3 知识库扩展
- 接入裁判文书网 API
- 实时更新案例库
- 支持全文检索

### 5.4 多文书类型
- 起诉状
- 答辩状
- 证据清单
- 代理词

---

## 6. 增强功能 (v2.0)

### 6.1 侵权相似度分析

**新增API**: `/api/analyze`

功能：
- 接收商标名称、图片、侵权方标识等输入
- 调用 GPT-4o Vision 分析图片相似度（如上传图片）
- 仅文字分析时使用 GPT-5.1
- 返回结构化分析报告

**分析维度**：
- 视觉相似度 (0-100)
- 文字相似度 (0-100)
- 读音相似度 (0-100)
- 概念相似度 (0-100)

**侵权等级判定**：
- 高 (≥70分)：建议立即发函
- 中 (40-69分)：建议调查
- 低 (<40分)：风险较低

### 6.2 律师确认流程

```
┌─────────────────────────────────────────────────────────────┐
│                    智能分析工作流                            │
├─────────────────────────────────────────────────────────────┤
│  步骤1: 输入信息                                            │
│  ├─ 填写我方商标名称/注册号                                  │
│  ├─ 上传我方商标图片（可选）                                 │
│  ├─ 填写疑似侵权方标识/上传图片                              │
│  └─ 填写商品类别、平台、描述                                 │
│                          ↓                                  │
│  步骤2: AI侵权分析                                          │
│  ├─ 图片识别（使用GPT-4o Vision）                           │
│  ├─ 多维度相似度计算                                        │
│  ├─ 混淆风险评估                                            │
│  └─ 法律依据建议                                            │
│                          ↓                                  │
│  步骤3: 查看分析报告                                         │
│  ├─ 综合评分（0-100分）                                     │
│  ├─ 分项评分（视觉/文字/读音/概念）                          │
│  ├─ 相似点/差异点对比                                       │
│  ├─ 法律依据引用                                            │
│  └─ 行动建议（立即发函/建议调查/风险较低）                    │
│                          ↓                                  │
│  步骤4: 律师确认                                            │
│  ├─ 审阅分析报告                                            │
│  ├─ 确认是否生成律师函                                      │
│  └─ 如需修改可返回重新分析                                  │
│                          ↓                                  │
│  步骤5: 生成律师函                                          │
│  └─ 基于分析结果生成专业律师函                               │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 多格式导出

支持导出的格式：

| 格式 | 说明 | 适用场景 |
|------|------|----------|
| DOCX | Word 文档 | 编辑、打印、存档 |
| HTML | 网页格式 | 转换为 PDF |
| PDF | 打印/另存为 PDF | 正式文件发送 |
| Markdown | Markdown 格式 | 技术文档、电子表格导入 |
| TXT | 纯文本 | 简单记录 |

### 6.4 新增组件

| 组件 | 说明 |
|------|------|
| `TrademarkInfringementWorkflow.tsx` | 完整的侵权分析工作流组件 |
| `InfringementReport.tsx` | 侵权分析报告展示组件 |

### 6.5 新增类型定义

```typescript
// 侵权相似度分析
interface SimilarityAnalysis {
  overallScore: number;        // 0-100 综合评分
  level: '高' | '中' | '低';   // 侵权风险等级
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

// 工作流状态
type WorkflowStep = 'input' | 'analyzing' | 'report' | 'generating' | 'complete';
```

---

## 7. 部署说明

**环境变量**（`.env.local`）
```bash
OPENAI_API_KEY=sk-xxx
OPENAI_BASE_URL=https://new-api.lingowhale.com/v1
```

**启动命令**
```bash
npm install
npm run dev  # 开发环境
npm run build && npm start  # 生产环境
```

**依赖要求**
- Node.js >= 18
- npx (用于启动 MCP Server)
- tsx (TypeScript 执行器)

---

## 8. 系统使用指南

### 8.1 智能分析模式（推荐）

1. **打开系统**: 访问首页，默认进入「智能分析模式」
2. **填写信息**: 输入我方商标名称、注册号，上传商标图片（如有）
3. **上传侵权证据**: 输入疑似侵权方标识，上传侵权方图片（如有）
4. **提交分析**: 点击「开始侵权相似度分析」
5. **查看报告**: 审阅 AI 生成的分析报告
6. **确认发函**: 根据分析结果决定是否生成律师函
7. **导出文档**: 选择需要的格式导出（DOCX/HTML/PDF/Markdown/TXT）

### 8.2 经典案例模式

1. **选择案例**: 从案例库选择一个参考案例
2. **填写表单**: 根据表单填写委托方、被函方、商标信息
3. **生成律师函**: 点击「生成律师函」
4. **预览下载**: 预览生成的律师函，选择格式导出

### 8.3 导出格式说明

- **DOCX**: 适用于需要编辑的 Word 文档
- **HTML**: 可直接在浏览器打开，可打印为 PDF
- **PDF**: 通过浏览器打印功能生成
- **Markdown**: 适用于技术文档或导入其他系统
- **TXT**: 纯文本格式，适用于简单记录
