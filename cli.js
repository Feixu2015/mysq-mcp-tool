#!/usr/bin/env node

import MySQLMCPTool from './index.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { program } = require('commander');

const tool = new MySQLMCPTool();

program
  .name('mysql-mcp-tool')
  .description('MySQL MCP工具 - 用于AI模型调用的数据库操作工具')
  .version('1.0.0');

program
  .command('query')
  .description('执行SQL查询')
  .argument('<sql>', 'SQL语句')
  .option('-p, --params <params>', '参数JSON字符串')
  .option('-h, --host <host>', 'MySQL主机', process.env.MYSQL_HOST || 'localhost')
  .option('-u, --user <user>', 'MySQL用户名', process.env.MYSQL_USER || 'root')
  .option('-P, --password <password>', 'MySQL密码', process.env.MYSQL_PASSWORD || '')
  .option('-d, --database <database>', '数据库名', process.env.MYSQL_DATABASE || 'test')
  .action(async (sql, options) => {
    const queryTool = new MySQLMCPTool({
      host: options.host,
      user: options.user,
      password: options.password,
      database: options.database
    });
    const params = options.params ? JSON.parse(options.params) : [];
    const result = await queryTool.executeQuery(sql, params);
    console.log(JSON.stringify(result, null, 2));
    await queryTool.disconnect();
  });

program
  .command('tables')
  .description('获取所有表')
  .action(async () => {
    await tool.connect();
    const result = await tool.getTables();
    console.log(JSON.stringify(result, null, 2));
    await tool.disconnect();
  });

program
  .command('schema')
  .description('获取表结构')
  .argument('<table>', '表名')
  .action(async (table) => {
    await tool.connect();
    const result = await tool.getTableSchema(table);
    console.log(JSON.stringify(result, null, 2));
    await tool.disconnect();
  });

// MCP服务器模式
program
  .command('server')
  .description('启动MCP服务器模式')
  .option('-h, --host <host>', 'MySQL主机', process.env.MYSQL_HOST || 'localhost')
  .option('-u, --user <user>', 'MySQL用户名', process.env.MYSQL_USER || 'root')
  .option('-p, --password <password>', 'MySQL密码', process.env.MYSQL_PASSWORD || '')
  .option('-d, --database <database>', '数据库名', process.env.MYSQL_DATABASE || 'test')
  .allowUnknownOption()
  .action(async (options, command) => {
    // 解析未知选项，兼容用户直接传递环境变量的方式
    const unknownOptions = command.args.filter(arg => arg.includes('='));
    const envVars = {};
    unknownOptions.forEach(option => {
      const [key, value] = option.split('=');
      envVars[key] = value;
    });

    console.log('启动MCP服务器模式，配置信息:');
    console.log('- 主机:', process.env.MYSQL_HOST || options.host);
    console.log('- 用户:', process.env.MYSQL_USER || options.user);
    console.log('- 数据库:', process.env.MYSQL_DATABASE || options.database);
    console.log('- 密码: *****'); // 不显示密码
    
    const mcpTool = new MySQLMCPTool({
      host: process.env.MYSQL_HOST || options.host,
      user: process.env.MYSQL_USER || options.user,
      password: process.env.MYSQL_PASSWORD || options.password,
      database: process.env.MYSQL_DATABASE || options.database,
      connectTimeout: 10000
    });

    // 启动MCP服务器
    await startMCPServer(mcpTool);
  });

async function startMCPServer(mysqlTool) {
  console.log('MySQL MCP服务器已启动，等待请求...');

  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on('line', async (line) => {
    if (!line.trim()) return;
    
    try {
      const request = JSON.parse(line);
      const response = await handleMCPRequest(request, mysqlTool);
      console.log(JSON.stringify(response));
    } catch (error) {
      let requestId = null;
      try {
        const parsed = JSON.parse(line);
        requestId = parsed.id;
      } catch (e) {
        // Ignore parsing error
      }
      
      console.log(JSON.stringify({ 
        jsonrpc: "2.0",
        error: { 
          code: -32603, 
          message: error.message 
        },
        id: requestId
      }));
    }
  });
}

async function handleMCPRequest(request, mysqlTool) {
  const { method, params, id } = request;

  // 添加调试日志
  console.error(`DEBUG: 收到请求 ${method}`, JSON.stringify(request, null, 2));

  switch (method) {
    case 'initialize':
      const initResult = {
        jsonrpc: "2.0",
        id,
        result: { 
          protocolVersion: "2024-11-05", 
          capabilities: { 
            tools: {} 
          }, 
          serverInfo: { 
            name: "mysql-mcp-tool", 
            version: "1.0.0" 
          } 
        }
      };
      console.error(`DEBUG: 返回初始化响应`, JSON.stringify(initResult, null, 2));
      return initResult;

    case 'tools/list':
      const toolsResult = {
        jsonrpc: "2.0",
        id,
        result: {
          tools: [
            {
              name: 'mysql_query',
              description: '执行MySQL查询',
              inputSchema: {
                type: 'object',
                properties: {
                  sql: { type: 'string', description: 'SQL语句' },
                  params: { type: 'array', description: '查询参数' }
                },
                required: ['sql']
              }
            },
            {
              name: 'mysql_tables',
              description: '获取所有表',
              inputSchema: { type: 'object', properties: {} }
            },
            {
              name: 'mysql_schema',
              description: '获取表结构',
              inputSchema: {
                type: 'object',
                properties: {
                  table: { type: 'string', description: '表名' }
                },
                required: ['table']
              }
            },
            {
              name: 'mysql_insert',
              description: '⚠️ 警告：插入数据 - 使用者自负责任',
              inputSchema: {
                type: 'object',
                properties: {
                  table: { type: 'string', description: '表名' },
                  data: { type: 'object', description: '要插入的数据对象' }
                },
                required: ['table', 'data']
              }
            },
            {
              name: 'mysql_update',
              description: '⚠️ 警告：更新数据 - 使用者自负责任',
              inputSchema: {
                type: 'object',
                properties: {
                  table: { type: 'string', description: '表名' },
                  data: { type: 'object', description: '要更新的数据对象' },
                  where: { type: 'object', description: '更新条件' }
                },
                required: ['table', 'data']
              }
            },
            {
              name: 'mysql_delete',
              description: '⚠️ 警告：删除数据 - 使用者自负责任',
              inputSchema: {
                type: 'object',
                properties: {
                  table: { type: 'string', description: '表名' },
                  where: { type: 'object', description: '删除条件' }
                },
                required: ['table']
              }
            }
          ]
        }
      };
      console.error(`DEBUG: 返回工具列表`, JSON.stringify(toolsResult, null, 2));
      return toolsResult;

    case 'tools/call':
      const { name, arguments: args } = params;
      
      if (!mysqlTool.connection) {
        await mysqlTool.connect();
      }

      let result;
      switch (name) {
        case 'mysql_query':
          result = await mysqlTool.executeQuery(args.sql, args.params || []);
          break;
        case 'mysql_tables':
          result = await mysqlTool.getTables();
          break;
        case 'mysql_schema':
          result = await mysqlTool.getTableSchema(args.table);
          break;
        case 'mysql_insert':
          result = await mysqlTool.insert(args.table, args.data);
          break;
        case 'mysql_update':
          result = await mysqlTool.update(args.table, args.data, args.where || {});
          break;
        case 'mysql_delete':
          result = await mysqlTool.delete(args.table, args.where || {});
          break;
        default:
          throw new Error(`未知工具: ${name}`);
      }

      return { 
        jsonrpc: "2.0",
        id, 
        result: { content: [{ type: 'text', text: JSON.stringify(result) }] } 
      };

    default:
      console.error(`DEBUG: 未知方法 ${method}`);
      throw new Error(`未知方法: ${method}`);
  }
}

program.parse();