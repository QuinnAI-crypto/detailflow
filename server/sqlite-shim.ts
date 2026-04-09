import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';

let db: SqlJsDatabase | null = null;

export async function getDatabase(): Promise<SqlJsDatabase> {
  if (db) return db;
  
  const SQL = await initSqlJs();
  const dbPath = path.join(process.cwd(), 'data.db');
  
  try {
    if (fs.existsSync(dbPath)) {
      const buffer = fs.readFileSync(dbPath);
      db = new SQL.Database(buffer);
    } else {
      db = new SQL.Database();
    }
  } catch {
    db = new SQL.Database();
  }
  
  return db;
}

// Shim to make sql.js work with better-sqlite3 Drizzle driver
export function createBetterSqlite3Compat(sqlJsDb: SqlJsDatabase) {
  return {
    pragma: () => {},
    prepare: (sql: string) => {
      return {
        run: (...params: any[]) => {
          sqlJsDb.run(sql, params);
          return { changes: sqlJsDb.getRowsModified() };
        },
        get: (...params: any[]) => {
          const stmt = sqlJsDb.prepare(sql);
          if (params.length) stmt.bind(params);
          if (stmt.step()) {
            const cols = stmt.getColumnNames();
            const vals = stmt.get();
            const row: any = {};
            cols.forEach((col, i) => { row[col] = vals[i]; });
            stmt.free();
            return row;
          }
          stmt.free();
          return undefined;
        },
        all: (...params: any[]) => {
          const results: any[] = [];
          const stmt = sqlJsDb.prepare(sql);
          if (params.length) stmt.bind(params);
          while (stmt.step()) {
            const cols = stmt.getColumnNames();
            const vals = stmt.get();
            const row: any = {};
            cols.forEach((col, i) => { row[col] = vals[i]; });
            results.push(row);
          }
          stmt.free();
          return results;
        }
      };
    },
    exec: (sql: string) => sqlJsDb.exec(sql),
    close: () => sqlJsDb.close(),
  };
}
