import { query } from '@config/database';

export abstract class BaseRepository {
  protected async query(sql: string, params: any[] = []) {
    return query(sql, params);
  }

  protected async callProcedure(procedureName: string, params: any[] = []) {
    const placeholders = params.map((_, i) => `$${i + 1}`).join(', ');
    const sql = `CALL ${procedureName}(${placeholders})`;
    return query(sql, params);
  }

  protected async callFunction(functionName: string, params: any[] = []) {
    const placeholders = params.map((_, i) => `$${i + 1}`).join(', ');
    const sql = `SELECT * FROM ${functionName}(${placeholders})`;
    return query(sql, params);
  }
}
