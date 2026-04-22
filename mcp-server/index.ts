#!/usr/bin/env node
/**
 * MCP Server — Legal Document Tools
 * Exposes trademark case data and lawyer letter template generation tools
 * to Claude via the Model Context Protocol (stdio transport).
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

// ─── Case Data ────────────────────────────────────────────────────────────────

const CASES = [
  {
    id: 'luckin-coffee',
    caseNumber: '(2023)粤0304民初50083号',
    year: 2023,
    plaintiff: '瑞幸咖啡（中国）有限公司',
    defendant: '幸猫咖啡有限公司',
    trademarkName: 'LUCKIN COFFEE / 瑞幸咖啡',
    infringingMark: 'LUCKY***COFFEE 幸某咖啡及图',
    court: '广东省深圳市龙华区人民法院',
    verdict: '侵权成立，立即停止使用侵权标识',
    compensation: '¥50万元',
    goodsCategory: '第43类 餐饮服务/咖啡饮品',
    keyPoints: [
      '被告标识与原告驰名商标在视觉效果、读音上高度近似',
      '同类咖啡饮品服务领域使用构成混淆',
      '动物+圆形+LUCK设计元素组合近似',
      '主观恶意明显，属攀附知名商标行为',
    ],
    similarity:
      '文字读音近似（LUCKIN/LUCKY），动物形象+圆形徽章设计高度相似，同为咖啡饮品类',
    outcome: 'plaintiff_won',
  },
  {
    id: 'xiaomi',
    caseNumber: '(2025)沪民终305号',
    year: 2025,
    plaintiff: '小米科技有限责任公司',
    defendant: '凡小米电子科技有限公司',
    trademarkName: '小米 / MI',
    infringingMark: '凡小米 / M',
    court: '上海市高级人民法院',
    verdict: '构成商标侵权及不正当竞争，驰名商标跨类保护适用',
    compensation: '¥3000万元',
    goodsCategory: '第9类 电子产品/手机/智能硬件',
    keyPoints: [
      '小米商标被认定为驰名商标，享有跨类保护',
      '"凡小米"完整包含"小米"核心标识，足以误导消费者',
      '"M"标与小米"MI"标在字母构成上近似',
      '赔偿额创同类案件新高，彰显对驰名商标的强力保护',
    ],
    similarity: '"凡小米"包含完整"小米"字样，字母M与MI近似，均涉及电子产品领域',
    outcome: 'plaintiff_won',
  },
  {
    id: 'miniso',
    caseNumber: '(2021)京民终820号',
    year: 2021,
    plaintiff: '广东赛曼投资有限公司（名创优品）',
    defendant: '广州优宿企业管理有限公司',
    trademarkName: 'MINISO名創優品及图（第13604462号、第14589119号）',
    infringingMark: 'USUPSO优宿優品及图',
    court: '北京市高级人民法院',
    verdict: '构成商标侵权，整体视觉效果高度近似，混淆可能性成立',
    compensation: '¥403万元',
    goodsCategory: '第35类 零售服务/精品百货',
    keyPoints: [
      'USUPSO标识整体布局与MINISO高度近似：手提袋背景+双行文字+笑脸图形',
      '矩形方框+笑脸图形+中英双文字的组合元素构成近似',
      '均指定使用于零售服务类别，消费者混淆可能性高',
      '被告注册并使用"优宿優品"，与"名创优品"在含义上形成对应',
    ],
    similarity:
      '整体视觉效果：手提袋轮廓+笑脸图形+英文+中文四要素排列方式相同，字母USUPSO与MINISO构词规律相似',
    outcome: 'plaintiff_won',
  },
  {
    id: 'mixue',
    caseNumber: '(2025)内知民终1号',
    year: 2025,
    plaintiff: '蜜雪冰城股份有限公司',
    defendant: '蜜念雪饮品管理有限公司',
    trademarkName: '蜜雪冰城 / 蜜雪',
    infringingMark: '蜜念雪',
    court: '内蒙古自治区高级人民法院知识产权庭',
    verdict: '侵权成立，停止使用侵权标识及特定品牌颜色组合',
    compensation: '¥80万元',
    goodsCategory: '第43类 现制茶饮/餐饮服务',
    keyPoints: [
      '"蜜念雪"与"蜜雪冰城"/"蜜雪"在读音、含义上整体近似',
      '被告在特许经营中使用与原告相同的红白色彩方案，加剧混淆',
      '现制饮品同一经营领域，消费者辨识度低，易发生混淆误认',
      '特许加盟模式下侵权，扩大了侵权范围和社会影响',
    ],
    similarity: '"蜜念雪"与"蜜雪"共用"蜜"、"雪"二字，读音相近，同为茶饮品牌且使用相同主色调',
    outcome: 'plaintiff_won',
  },
  {
    id: 'alien',
    caseNumber: '(2024)粤民终5689号',
    year: 2024,
    plaintiff: '元气森林（北京）食品科技集团有限公司',
    defendant: '广州遇见外星人饮料有限公司',
    trademarkName: '外星人 / ALIEN（电解质水）',
    infringingMark: '遇见外星人 / ALIEN SEEN',
    court: '广东省高级人民法院',
    verdict: '构成商标侵权，"外星人"为知名商标，被告标识完整包含其核心部分',
    compensation: '¥120万元',
    goodsCategory: '第32类 电解质水/功能性饮料',
    keyPoints: [
      '"遇见外星人"完整包含"外星人"注册商标，属典型的在他人商标前添加词语',
      '英文标识"ALIEN SEEN"包含"ALIEN"完整字样',
      '同为电解质水/功能性饮料，商品类别完全相同',
      '"外星人"品牌经大量宣传已具有较高知名度，被告攀附意图明显',
    ],
    similarity: '"遇见外星人"完整含"外星人"，ALIEN SEEN含ALIEN，均为电解质水产品，整体混淆可能性极高',
    outcome: 'plaintiff_won',
  },
];

const LAWYER_LETTER_TEMPLATE = `
【律师函格式模板 — 商标侵权】

来源参考：(2021)京民终820号 名创优品案律师函

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
律  师  函
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【收件方】：{recipientCompany}
【地址】：{recipientAddress}

本所受{senderCompany}委托，就贵司涉嫌侵害我委托人注册商标专用权一事，现依法向贵司发出本律师函。

一、权利基础与法律依据

我委托人依法持有以下注册商标：
{trademarkNumbers}
商标名称：{trademarkName}
注册商品/服务类别：{goodsCategory}
上述商标均处于有效注册状态，我委托人对其享有合法排他性权利。

本函所涉侵权行为违反《中华人民共和国商标法》第五十七条第（二）项、第（三）项之规定，及《民法典》关于知识产权保护的相关条款。

二、侵权行为事实认定

贵司目前使用的"{infringingMark}"标识，与我委托人注册商标构成近似：

1. 文字/视觉近似性：{similarityAnalysis}
2. 商品/服务类别相同或高度类似，目标消费群体高度重叠
3. 上述使用行为足以导致相关公众对商品/服务来源产生混淆、误认
4. 贵司上述行为已侵害我委托人注册商标专用权，造成实质性经济损失

三、要求义务

请贵司在收到本函后{demandDeadlineDays}日内：

1. 立即停止一切侵犯我委托人商标专用权的行为，包括但不限于停止生产、销售、宣传使用前述侵权标识；
2. 向我委托人出具书面致歉声明；
3. 就上述侵权行为对我委托人造成的经济损失及维权合理费用予以赔偿，赔偿金额不低于人民币{compensationAmount}。

四、后续法律行动

若贵司逾期未予回应或未依前述要求履行相应义务，我委托人将保留采取下列措施的权利：
1. 向国家知识产权局提起商标侵权行政投诉；
2. 向有管辖权的人民法院提起民事诉讼，追究贵司的侵权民事责任；
3. 视侵权情节，就刑事责任保留向司法机关控告的权利。

五、联系方式

{lawFirmName}
经办律师：{lawyerName}
电话：{phone}
传真：{fax}
地址：{lawFirmAddress}

发函日期：{date}

（盖章）
`;

// ─── Tool Definitions ─────────────────────────────────────────────────────────

const TOOLS: Tool[] = [
  {
    name: 'list_trademark_cases',
    description:
      '获取所有商标侵权案件列表，包含案件基本信息（案号、当事人、商标名称、赔偿金额等）',
    inputSchema: {
      type: 'object',
      properties: {
        filter_by_category: {
          type: 'string',
          description: '可选：按商品/服务类别过滤（如 "第43类"、"饮料"）',
        },
      },
    },
  },
  {
    name: 'get_case_details',
    description: '获取特定商标侵权案件的完整详情，包括判决要点、相似性分析、裁判结果等',
    inputSchema: {
      type: 'object',
      properties: {
        case_id: {
          type: 'string',
          description:
            '案件ID，可选值：luckin-coffee | xiaomi | miniso | mixue | alien',
          enum: ['luckin-coffee', 'xiaomi', 'miniso', 'mixue', 'alien'],
        },
      },
      required: ['case_id'],
    },
  },
  {
    name: 'get_lawyer_letter_template',
    description:
      '获取律师函格式模板，基于名创优品案真实律师函结构，包含五大核心章节的标准格式',
    inputSchema: {
      type: 'object',
      properties: {
        reference_case_id: {
          type: 'string',
          description: '可选：参考案例ID，用于在模板中注入该案例的具体事实',
        },
      },
    },
  },
  {
    name: 'generate_complaint_points',
    description: '根据案件信息生成侵权投诉要点，用于律师函侵权行为部分的结构化论述',
    inputSchema: {
      type: 'object',
      properties: {
        plaintiff_trademark: {
          type: 'string',
          description: '原告注册商标名称',
        },
        defendant_mark: {
          type: 'string',
          description: '被告使用的侵权标识',
        },
        goods_category: {
          type: 'string',
          description: '商品/服务类别',
        },
        similarity_basis: {
          type: 'string',
          description: '商标近似性依据描述',
        },
      },
      required: ['plaintiff_trademark', 'defendant_mark', 'goods_category'],
    },
  },
  // ========== 新增工具 ==========
  {
    name: 'parse_user_intent',
    description: '解析用户自然语言输入，提取意图类型和关键实体（品牌名、商标号、平台、关键词等）',
    inputSchema: {
      type: 'object',
      properties: {
        user_input: {
          type: 'string',
          description: '用户的自然语言输入',
        },
      },
      required: ['user_input'],
    },
  },
  {
    name: 'search_similar_cases',
    description: '根据品牌名或商标号检索相似判例，返回最相关的案例及裁判要旨',
    inputSchema: {
      type: 'object',
      properties: {
        brand_name: {
          type: 'string',
          description: '品牌名称',
        },
        trademark_number: {
          type: 'string',
          description: '商标注册号',
        },
        infringement_type: {
          type: 'string',
          description: '侵权类型（如：商标侵权、不正当竞争）',
        },
      },
    },
  },
  {
    name: 'simulate_evidence_collection',
    description: '模拟证据收集流程，生成侵权线索汇总表（实际部署时应对接真实爬虫或API）',
    inputSchema: {
      type: 'object',
      properties: {
        platform: {
          type: 'string',
          description: '目标平台（淘宝、京东、拼多多等）',
        },
        keywords: {
          type: 'array',
          items: { type: 'string' },
          description: '搜索关键词列表',
        },
      },
      required: ['platform', 'keywords'],
    },
  },
  // ========== 新增：图片侵权分析工具 ==========
  {
    name: 'analyze_image_infringement',
    description: '使用AI视觉分析上传的图片，判断是否构成商标侵权',
    inputSchema: {
      type: 'object',
      properties: {
        image_url: {
          type: 'string',
          description: '图片的URL或base64数据',
        },
        trademark_name: {
          type: 'string',
          description: '商标名称',
        },
        trademark_number: {
          type: 'string',
          description: '商标注册号（可选）',
        },
        goods_category: {
          type: 'string',
          description: '商品/服务类别（可选）',
        },
      },
      required: ['image_url', 'trademark_name'],
    },
  },
  {
    name: 'compare_images_similarity',
    description: '比较两张图片的视觉相似度，用于侵权判断',
    inputSchema: {
      type: 'object',
      properties: {
        image1_url: {
          type: 'string',
          description: '第一张图片URL',
        },
        image2_url: {
          type: 'string',
          description: '第二张图片URL',
        },
        comparison_type: {
          type: 'string',
          description: '比较类型：overall（整体）|logo（logo）|text（文字）|layout（布局）',
          enum: ['overall', 'logo', 'text', 'layout'],
        },
      },
      required: ['image1_url', 'image2_url'],
    },
  },
];

// ─── Server Setup ─────────────────────────────────────────────────────────────

const server = new Server(
  { name: 'legal-doc-mcp-server', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'list_trademark_cases': {
      const filter = (args?.filter_by_category as string | undefined)?.toLowerCase();
      const cases = filter
        ? CASES.filter(
            (c) =>
              c.goodsCategory.toLowerCase().includes(filter) ||
              c.trademarkName.toLowerCase().includes(filter)
          )
        : CASES;

      const summary = cases.map((c) => ({
        id: c.id,
        caseNumber: c.caseNumber,
        year: c.year,
        plaintiff: c.plaintiff,
        defendant: c.defendant,
        trademarkName: c.trademarkName,
        infringingMark: c.infringingMark,
        court: c.court,
        compensation: c.compensation,
        goodsCategory: c.goodsCategory,
        outcome: c.outcome,
      }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ total: summary.length, cases: summary }, null, 2),
          },
        ],
      };
    }

    case 'get_case_details': {
      const caseId = args?.case_id as string;
      const caseData = CASES.find((c) => c.id === caseId);
      if (!caseData) {
        return {
          content: [{ type: 'text', text: `错误：未找到案件ID "${caseId}"` }],
          isError: true,
        };
      }
      return {
        content: [{ type: 'text', text: JSON.stringify(caseData, null, 2) }],
      };
    }

    case 'get_lawyer_letter_template': {
      const refId = args?.reference_case_id as string | undefined;
      let refCase = null;
      if (refId) {
        refCase = CASES.find((c) => c.id === refId);
      }

      const response: Record<string, unknown> = {
        template: LAWYER_LETTER_TEMPLATE,
        placeholders: {
          recipientCompany: '被函方公司全称',
          recipientAddress: '被函方地址',
          senderCompany: '委托方公司名称',
          trademarkNumbers: '商标注册号列表',
          trademarkName: '商标名称',
          goodsCategory: '核定使用商品/服务类别',
          infringingMark: '侵权标识',
          similarityAnalysis: '商标近似性具体分析',
          demandDeadlineDays: '整改期限天数',
          compensationAmount: '索赔金额',
          lawFirmName: '律师事务所名称',
          lawyerName: '经办律师姓名',
          phone: '联系电话',
          fax: '传真号码',
          lawFirmAddress: '律师事务所地址',
          date: '发函日期',
        },
        sections: [
          { id: 1, heading: '权利基础与法律依据', required: true },
          { id: 2, heading: '侵权行为事实认定', required: true },
          { id: 3, heading: '要求义务', required: true },
          { id: 4, heading: '后续法律行动', required: true },
          { id: 5, heading: '联系方式', required: true },
        ],
      };

      if (refCase) {
        response.reference_case = {
          id: refCase.id,
          caseNumber: refCase.caseNumber,
          verdict: refCase.verdict,
          keyPoints: refCase.keyPoints,
          similarity: refCase.similarity,
        };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
      };
    }

    case 'generate_complaint_points': {
      const { plaintiff_trademark, defendant_mark, goods_category, similarity_basis } =
        args as {
          plaintiff_trademark: string;
          defendant_mark: string;
          goods_category: string;
          similarity_basis?: string;
        };

      const points = {
        complaint_points: [
          {
            point: '商标近似性',
            analysis: `被告使用的"${defendant_mark}"标识与原告注册商标"${plaintiff_trademark}"在文字构成、整体外观或读音上高度近似${similarity_basis ? `，具体表现为：${similarity_basis}` : ''}`,
          },
          {
            point: '商品/服务类别相同',
            analysis: `被告在"${goods_category}"类别上使用侵权标识，与原告商标核定使用的商品/服务类别相同或高度类似`,
          },
          {
            point: '混淆可能性',
            analysis: `上述标识的近似程度足以使相关公众对商品/服务来源产生混淆或误认，认为系原告"${plaintiff_trademark}"品牌或与其存在特定关联关系`,
          },
          {
            point: '侵权故意',
            analysis: `"${plaintiff_trademark}"品牌已在相关行业具有较高知名度，被告明知其存在仍注册使用与之近似的"${defendant_mark}"标识，主观恶意明显`,
          },
          {
            point: '损害后果',
            analysis: `被告上述侵权行为严重损害了原告的商标专用权及商誉，造成实质经济损失，依法应承担停止侵权、赔偿损失等民事责任`,
          },
        ],
        legal_basis: [
          '《中华人民共和国商标法》第五十七条第（二）项',
          '《中华人民共和国商标法》第六十三条',
          '《中华人民共和国民法典》第一百七十九条',
        ],
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(points, null, 2) }],
      };
    }

    // ========== 新增工具处理 ==========
    case 'parse_user_intent': {
      const userInput = (args?.user_input as string) || '';

      // 简单的意图识别逻辑（实际应使用 NLP 模型）
      const intent: any = {
        type: 'consultation',
        entities: {},
        confidence: 0.5,
      };

      // 提取品牌名
      const brandPatterns = [
        /(?:我是|代表|委托方是?)([^，。,\s]+?)(?:的|公司|品牌)/,
        /商标[是为]?([^，。,\s]+)/,
      ];
      for (const pattern of brandPatterns) {
        const match = userInput.match(pattern);
        if (match) {
          intent.entities.brandName = match[1];
          break;
        }
      }

      // 提取商标注册号
      const trademarkMatch = userInput.match(/(?:商标注册号|注册号)[是为：:]*?(\d+)/);
      if (trademarkMatch) {
        intent.entities.trademarkNumber = trademarkMatch[1];
      }

      // 提取平台
      const platforms = ['淘宝', '京东', '拼多多', '天猫', '抖音', '快手'];
      for (const platform of platforms) {
        if (userInput.includes(platform)) {
          intent.entities.platform = platform;
          break;
        }
      }

      // 判断意图类型
      if (userInput.includes('取证') || userInput.includes('证据') || userInput.includes('发现')) {
        intent.type = 'evidence_collection';
        intent.confidence = 0.8;
      } else if (userInput.includes('类案') || userInput.includes('判例') || userInput.includes('案例')) {
        intent.type = 'case_search';
        intent.confidence = 0.8;
      } else if (userInput.includes('律师函') || userInput.includes('文书') || userInput.includes('起诉状')) {
        intent.type = 'document_generation';
        intent.confidence = 0.8;
      }

      // 提取关键词
      const keywords: string[] = [];
      if (intent.entities.brandName) keywords.push(intent.entities.brandName);
      const keywordMatch = userInput.match(/['"]([^'"]+)['"]/g);
      if (keywordMatch) {
        keywords.push(...keywordMatch.map((k) => k.replace(/['"]/g, '')));
      }
      intent.entities.keywords = keywords;

      return {
        content: [{ type: 'text', text: JSON.stringify(intent, null, 2) }],
      };
    }

    case 'search_similar_cases': {
      const brandName = args?.brand_name as string | undefined;
      const trademarkNumber = args?.trademark_number as string | undefined;

      // 简单的相似度匹配
      const matchedCases = CASES.filter((c) => {
        if (brandName && c.trademarkName.includes(brandName)) return true;
        if (trademarkNumber && c.trademarkName.includes(trademarkNumber)) return true;
        return false;
      });

      const result = {
        query: { brandName, trademarkNumber },
        total: matchedCases.length,
        cases: matchedCases.map((c) => ({
          id: c.id,
          caseNumber: c.caseNumber,
          plaintiff: c.plaintiff,
          defendant: c.defendant,
          trademarkName: c.trademarkName,
          verdict: c.verdict,
          compensation: c.compensation,
          keyPoints: c.keyPoints,
          relevance: 0.85, // 模拟相似度得分
        })),
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }

    case 'simulate_evidence_collection': {
      const platform = (args?.platform as string) || '淘宝';
      const keywords = (args?.keywords as string[]) || [];

      // 模拟生成侵权线索（实际应调用爬虫或API）
      const mockClues = keywords.flatMap((keyword, idx) => [
        {
          id: `clue-${idx * 2 + 1}`,
          序号: idx * 2 + 1,
          平台: platform,
          商品标题: `${keyword}相似商品 精品百货店 创意家居生活用品`,
          侵权URL: `https://item.taobao.com/item.htm?id=${100000000 + idx * 2 + 1}`,
          侵权类型: '商标侵权',
          相似度得分: 85 + Math.floor(Math.random() * 10),
          抓取时间: new Date().toISOString(),
          商家名称: `${keyword}旗舰店`,
          价格: `¥${(Math.random() * 50 + 10).toFixed(1)}`,
          销量: `${Math.floor(Math.random() * 2000)}+`,
        },
        {
          id: `clue-${idx * 2 + 2}`,
          序号: idx * 2 + 2,
          平台: platform,
          商品标题: `${keyword}同款 日用百货 创意小商品批发`,
          侵权URL: `https://item.taobao.com/item.htm?id=${100000000 + idx * 2 + 2}`,
          侵权类型: '商标侵权',
          相似度得分: 80 + Math.floor(Math.random() * 15),
          抓取时间: new Date().toISOString(),
          商家名称: `${keyword}生活馆`,
          价格: `¥${(Math.random() * 80 + 20).toFixed(1)}`,
          销量: `${Math.floor(Math.random() * 1500)}+`,
        },
      ]);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ platform, keywords, total: mockClues.length, clues: mockClues }, null, 2),
          },
        ],
      };
    }

    case 'analyze_image_infringement': {
      const { image_url, trademark_name, trademark_number, goods_category } = args as {
        image_url: string;
        trademark_name: string;
        trademark_number?: string;
        goods_category?: string;
      };

      // 这里调用图片分析API（在实际实现中会通过HTTP调用）
      // 现在返回模拟结果
      const mockAnalysis = {
        imageId: `img_${Date.now()}`,
        detectedText: [trademark_name, '相似标识', '品牌名称'],
        detectedLogos: [
          {
            brand: trademark_name,
            confidence: 0.87,
            boundingBox: [50, 50, 200, 100]
          }
        ],
        infringementRisk: 'high',
        riskReasons: [
          `检测到与"${trademark_name}"高度相似的标识`,
          '视觉元素排列方式近似',
          '颜色搭配具有混淆可能性'
        ],
        similarCases: ['miniso', 'xiaomi'],
        visualSimilarity: 0.85
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockAnalysis, null, 2),
          },
        ],
      };
    }

    case 'compare_images_similarity': {
      const { image1_url, image2_url, comparison_type } = args as {
        image1_url: string;
        image2_url: string;
        comparison_type?: string;
      };

      // 模拟图片相似度比较
      const mockComparison = {
        image1: image1_url,
        image2: image2_url,
        similarityScore: 0.78,
        differences: [
          '颜色差异：图片1使用红色调，图片2使用橙色调',
          '文字位置略有不同',
          '整体布局基本一致'
        ],
        comparisonDetails: {
          colorSimilarity: 0.82,
          shapeSimilarity: 0.85,
          textSimilarity: 0.90,
          layoutSimilarity: 0.75
        }
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockComparison, null, 2),
          },
        ],
      };
    }

    default:
      return {
        content: [{ type: 'text', text: `未知工具: ${name}` }],
        isError: true,
      };
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Server is running on stdio — do not write to stdout
}

main().catch((err) => {
  process.stderr.write(`MCP server error: ${err}\n`);
  process.exit(1);
});
