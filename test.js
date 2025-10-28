import MySQLMCPTool from './index.js';

async function test() {
  const tool = new MySQLMCPTool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'test'
  });

  console.log('测试MySQL MCP工具...');
  
  const connected = await tool.connect();
  if (!connected) {
    console.log('无法连接到数据库，测试终止');
    return;
  }

  try {
    console.log('\n1. 获取表列表:');
    const tables = await tool.getTables();
    console.log(tables);

    console.log('\n2. 测试查询功能:');
    const result = await tool.executeQuery('SELECT 1 as test');
    console.log(result);

  } catch (error) {
    console.error('测试过程中出错:', error.message);
  } finally {
    await tool.disconnect();
  }
}

test();