/**
 * 得理法律开放平台 API 调用工具
 * 文档: https://openapi.delilegal.com
 */

const DELI_API_BASE = 'https://openapi.delilegal.com';

interface DeliConfig {
  appid: string;
  secret: string;
}

interface CaseResult {
  caseId: string;
  caseName: string;
  caseNumber: string;
  court: string;
  date: string;
  caseType: string;
  summary: string;
  similarity?: string;
}

// 案件检索参数
interface CaseSearchParams {
  // 排序方式：correlation(相关性) 或 time(裁判时间)
  sortField?: 'correlation' | 'time';
  // 排序顺序：asc(升序) 或 desc(降序)
  sortOrder?: 'asc' | 'desc';
  // 关键词数组，如 ["商标侵权", "近似商标"]
  keywordArr?: string[];
  // 长文本检索，通常与 keywordArr 二选一
  longText?: string;
  // 案例裁判日期起始年份
  caseYearStart?: number;
  // 案例裁判日期结束年份
  caseYearEnd?: number;
  // 法院层级数组：0=最高法院, 1=高级法院, 2=中级法院, 3=基层法院
  courtLevelArr?: string[];
  // 文书类型数组：30=判决书, 31=裁决书, 32=调解书, 33=决定书, 34=通知书, 99=其他
  judgementTypeArr?: string[];
}

/**
 * 类案检索 - 根据关键词搜索相关案例
 */
export async function searchSimilarCases(
  keywordArr: string[],
  config: DeliConfig,
  options?: {
    page?: number;
    size?: number;
    sortField?: 'correlation' | 'time';
    sortOrder?: 'asc' | 'desc';
    courtLevelArr?: string[];
    judgementTypeArr?: string[];
    caseYearStart?: number;
    caseYearEnd?: number;
  }
): Promise<CaseResult[]> {
  const { appid, secret } = config;

  try {
    const requestBody = {
      sortField: options?.sortField || 'correlation',
      sortOrder: options?.sortOrder || 'desc',
      condition: {
        keywordArr: keywordArr,
        courtLevelArr: options?.courtLevelArr || [],
        judgementTypeArr: options?.judgementTypeArr || ['30'], // 默认只查判决书
        caseYearStart: options?.caseYearStart,
        caseYearEnd: options?.caseYearEnd,
      }
    };

    const response = await fetch(`${DELI_API_BASE}/api/qa/v3/search/queryListCase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'appid': appid,
        'secret': secret,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`得理API请求失败: ${response.status}`);
    }

    const data = await response.json();
    console.log('得理API响应:', JSON.stringify(data).substring(0, 500));

    // 得理 API 返回格式: { success: true, code: 0, body: { data: [...] } }
    if (data.success && data.body?.data) {
      return data.body.data.map((item: any) => ({
        caseId: item.id || '',
        caseName: item.title || '',
        caseNumber: item.caseNumber || '',
        court: item.court || '',
        date: item.judgementDate || '',
        caseType: item.cause || item.caseType || '',
        summary: item.content?.substring(0, 300) || '',
        similarity: '得理类案检索结果',
      }));
    }

    console.error('得理API返回格式异常:', data);
    return [];
  } catch (error) {
    console.error('得理API调用失败:', error);
    return [];
  }
}

/**
 * 根据商标信息检索相似案例
 */
export async function searchTrademarkCases(
  trademarkName: string,
  infringingMark: string,
  config: DeliConfig
): Promise<CaseResult[]> {
  // 构建检索关键词数组
  const keywordArr = [
    trademarkName,
    infringingMark,
    '商标侵权',
    '商标近似'
  ].filter(k => k.trim() !== '');

  return searchSimilarCases(keywordArr, config, {
    sortField: 'correlation',
    sortOrder: 'desc',
    courtLevelArr: ['0', '1', '2', '3'], // 所有层级
    judgementTypeArr: ['30'], // 只查判决书
    size: 3,
  });
}

/**
 * 获取得理配置（从环境变量）
 */
export function getDeliConfig(): DeliConfig | null {
  const appid = process.env.DELI_APPID;
  const secret = process.env.DELI_SECRET;

  if (!appid || !secret) {
    console.warn('得理API配置缺失，请在.env.local中配置 DELI_APPID 和 DELI_SECRET');
    return null;
  }

  return { appid, secret };
}
