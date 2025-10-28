import mysql from 'mysql2/promise.js';

class MySQLMCPTool {
  constructor(config = {}) {
    this.connection = null;
    this.config = {
      host: config.host || 'localhost',
      user: config.user || 'root',
      password: config.password || '',
      database: config.database || 'test',
      connectTimeout: config.connectTimeout || 10000, // 10秒连接超时
      ...config
    };
  }

  async connect() {
    try {
      console.log('正在连接MySQL数据库...');
      console.log('连接配置:', {
        host: this.config.host,
        user: this.config.user,
        database: this.config.database,
        connectTimeout: this.config.connectTimeout
      });
      
      this.connection = await mysql.createConnection(this.config);
      console.log('MySQL连接成功');
      return true;
    } catch (error) {
      console.error('MySQL连接失败:', error.message);
      console.error('错误堆栈:', error.stack);
      return false;
    }
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.end();
      console.log('MySQL连接已关闭');
    }
  }

  async executeQuery(sql, params = []) {
    if (!this.connection) {
      await this.connect();
    }
    
    try {
      const [rows] = await this.connection.execute(sql, params);
      return { success: true, data: rows };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getTables() {
    return this.executeQuery('SHOW TABLES');
  }

  async getTableSchema(tableName) {
    return this.executeQuery(`DESCRIBE ${tableName}`);
  }

  async select(tableName, where = {}, limit = 100) {
    let sql = `SELECT * FROM ${tableName}`;
    const params = [];
    
    if (Object.keys(where).length > 0) {
      const conditions = Object.keys(where).map(key => `${key} = ?`);
      sql += ` WHERE ${conditions.join(' AND ')}`;
      params.push(...Object.values(where));
    }
    
    sql += ` LIMIT ${limit}`;
    
    return this.executeQuery(sql, params);
  }

  async insert(tableName, data) {
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);
    
    const sql = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`;
    return this.executeQuery(sql, values);
  }

  async update(tableName, data, where) {
    const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
    const values = [...Object.values(data), ...Object.values(where)];
    
    const sql = `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause}`;
    return this.executeQuery(sql, values);
  }

  async delete(tableName, where) {
    const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
    const values = Object.values(where);
    
    const sql = `DELETE FROM ${tableName} WHERE ${whereClause}`;
    return this.executeQuery(sql, values);
  }
}

export default MySQLMCPTool;