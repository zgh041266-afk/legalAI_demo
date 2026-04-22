/**
 * 得理 API 测试脚本 - 使用正确的 API 格式
 * 运行: node test-deli-api.mjs
 */

const DELI_API_BASE = 'https://openapi.delilegal.com';
const APPID = 'QthdBErlyaYvyXul';
const SECRET = 'EC5D455E6BD348CE8E18BE05926D2EBE';

/**
 * 测试类案检索 API
 */
async function testQueryListCase() {
  console.log('=== 得理 API 类案检索测试 ===\n');

  // 构造请求体（符合文档格式）
  const requestBody = {
    sortField: 'correlation',
    sortOrder: 'desc',
    condition: {
      keywordArr: ['商标侵权', '近似商标'],
      courtLevelArr: ['0', '1', '2', '3'],
      judgementTypeArr: ['30'], // 判决书
    }
  };

  console.log('请求地址:', `${DELI_API_BASE}/api/qa/v3/search/queryListCase`);
  console.log('请求体:', JSON.stringify(requestBody, null, 2));
  console.log('\nHeaders:');
  console.log('  appid:', APPID);
  console.log('  secret:', SECRET.substring(0, 4) + '****');

  try {
    const response = await fetch(`${DELI_API_BASE}/api/qa/v3/search/queryListCase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'appid': APPID,
        'secret': SECRET,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('\nHTTP 状态码:', response.status);
    const data = await response.json();
    console.log('\n响应数据:');
    console.log(JSON.stringify(data, null, 2));

    if (data.code === 200) {
      console.log('\n✅ API 调用成功！');
      console.log('返回案例数量:', data.data?.length || 0);
      if (data.data && data.data.length > 0) {
        console.log('\n第一个案例示例:');
        console.log('  名称:', data.data[0].caseName || data.data[0].title);
        console.log('  法院:', data.data[0].court);
        console.log('  案号:', data.data[0].caseNumber);
      }
    } else {
      console.log('\n❌ API 返回错误:', data.message || '未知错误');
    }
  } catch (error) {
    console.error('\n❌ 请求失败:', error.message);
  }
}

// 测试商标侵权检索
async function testTrademarkSearch() {
  console.log('\n\n=== 商标侵权检索测试 ===\n');

  const requestBody = {
    sortField: 'correlation',
    sortOrder: 'desc',
    condition: {
      keywordArr: ['小米', '商标侵权', '近似'],
      courtLevelArr: ['0', '1', '2', '3'],
      judgementTypeArr: ['30'],
    }
  };

  console.log('关键词: 小米 + 商标侵权 + 近似\n');

  try {
    const response = await fetch(`${DELI_API_BASE}/api/qa/v3/search/queryListCase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'appid': APPID,
        'secret': SECRET,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    console.log('响应:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('请求失败:', error.message);
  }
}

// 运行测试
async function runTests() {
  await testQueryListCase();
  await testTrademarkSearch();
}

runTests();
