# MySQL MCP 工具

针对MySQL数据库操作的MCP（Model Context Protocol）工具实现，为AI模型提供数据库操作能力。

## 功能特性

- MySQL数据库连接管理
- 表结构查询
- 数据增删改查操作
- 错误处理和连接状态管理
- MCP协议支持，可与AI模型集成

## 安装

```bash
npm install
```

## 使用方法

### 作为MCP服务器

将以下配置添加到你的MCP客户端配置文件中：

```json
{
  "mcpServers": {
    "mysql-mcp-tool": {
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

### 命令行使用

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

### 编程使用

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

## MCP工具

该工具提供以下MCP工具：

1. **mysql_query** - 执行MySQL查询
   - 参数：sql（必需），params（可选）
   
2. **mysql_tables** - 获取所有表
   - 参数：无
   
3. **mysql_schema** - 获取表结构
   - 参数：table（必需）

4. **mysql_insert** - ⚠️ 警告：插入数据 - 使用者自负责任
   - 参数：table（必需），data（必需）

5. **mysql_update** - ⚠️ 警告：更新数据 - 使用者自负责任
   - 参数：table（必需），data（必需），where（可选）

6. **mysql_delete** - ⚠️ 警告：删除数据 - 使用者自负责任
   - 参数：table（必需），where（可选）

## 开发

```bash
# 安装依赖
npm install

# 运行测试
npm test

# 启动开发模式
npm start
```

## 依赖

- mysql2: MySQL数据库驱动
- commander: 命令行参数解析
- Node.js ES模块支持

## 许可证

MIT