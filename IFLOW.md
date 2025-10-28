# MySQL MCP 工具

针对MySQL数据库操作的MCP工具实现。

## 功能特性

- MySQL数据库连接管理
- 表结构查询
- 数据增删改查操作
- 错误处理和连接状态管理

## 使用方法

```javascript
import MySQLMCPTool from './index.js';

const tool = new MySQLMCPTool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'test'
});

await tool.connect();
const result = await tool.select('users', { id: 1 });
await tool.disconnect();
```

## API文档

### 基础方法
- `connect()` - 连接数据库
- `disconnect()` - 断开连接
- `executeQuery(sql, params)` - 执行SQL查询

### 数据操作
- `getTables()` - 获取所有表
- `getTableSchema(tableName)` - 获取表结构
- `select(tableName, where, limit)` - 查询数据
- `insert(tableName, data)` - 插入数据
- `update(tableName, data, where)` - 更新数据
- `delete(tableName, where)` - 删除数据

## 运行测试

```bash
npm install
npm test
```

## MCP服务器配置

### 方法1: 本地路径配置
将以下配置添加到你的MCP客户端配置文件中：

```json
{
  "mcpServers": {
    "mysql": {
      "command": "node",
      "args": ["/Users/feixu/Downloads/toy1/cli.js", "server"],
      "env": {
        "MYSQL_HOST": "localhost",
        "MYSQL_USER": "root",
        "MYSQL_PASSWORD": "",
        "MYSQL_DATABASE": "test"
      }
    }
  }
}
```

### 方法2: 全局安装使用npx

```bash
npm link
```

然后使用npx调用：

```json
{
  "mcpServers": {
    "mysql": {
      "command": "npx",
      "args": ["mysql-mcp-tool", "server"],
      "env": {
        "MYSQL_HOST": "localhost",
        "MYSQL_USER": "root",
        "MYSQL_PASSWORD": "",
        "MYSQL_DATABASE": "test"
      }
    }
  }
}
```

## 命令行使用

```bash
# 查询表
mysql-mcp-tool tables

# 查看表结构
mysql-mcp-tool schema users

# 执行SQL
mysql-mcp-tool query "SELECT * FROM users WHERE id = ?" -p '["1"]'

# 启动MCP服务器
mysql-mcp-tool server -h localhost -u root -p password -d mydb
```

## 依赖

- mysql2: MySQL数据库驱动
- commander: 命令行参数解析
- Node.js ES模块支持