import { BaseRepository } from './BaseRepository';
import { UserRole } from '../types/index';

export interface UserRow {
  user_id: number;
  email: string;
  password_hash: string;
  role_id: number;
  role_name: string;
  first_name: string;
  last_name: string;
  dob?: Date;
  phone?: string;
  company_name?: string;
  gstin?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  is_active: boolean;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

export class UserRepository extends BaseRepository {
  async getById(id: number): Promise<UserRow | null> {
    const result = await this.callFunction('fn_get_user_by_id', [id]);
    return result.rows[0] || null;
  }

  async getByEmail(email: string): Promise<UserRow | null> {
    const result = await this.callFunction('fn_get_user_by_email', [email]);
    return result.rows[0] || null;
  }

  async getAll(limit: number = 10, offset: number = 0): Promise<UserRow[]> {
    const result = await this.query(
      `SELECT u.user_id, u.email, u.role_id, r.name as role_name,
              ud.first_name, ud.last_name, u.is_active, u.created_at
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.role_id
       LEFT JOIN user_details ud ON u.user_id = ud.user_id
       WHERE u.is_deleted = FALSE
       ORDER BY u.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }

  async create(data: {
    email: string;
    passwordHash: string;
    roleId: number;
    firstName: string;
    lastName: string;
    dob?: string;
    phone?: string;
  }): Promise<number> {
    // We could use sp_register_user here
    const result = await this.callProcedure('sp_register_user', [
      data.roleId,
      data.email,
      data.passwordHash,
      data.firstName,
      data.lastName,
      data.dob || null,
      data.phone || null,
    ]);
    
    // sp_register_user doesn't have an OUT param for user_id in the SQL I saw
    // Let me check sp_register_user again in procedures.sql
    // It returns v_user_id but not as an OUT parameter.
    
    // I'll manually get it for now or fix the procedure.
    const user = await this.getByEmail(data.email);
    return user!.user_id;
  }

  async update(id: number, updates: any): Promise<void> {
    // Separate updates for users and user_details
    const userUpdates: any = {};
    if (updates.email) userUpdates.email = updates.email;
    if (updates.passwordHash) userUpdates.password_hash = updates.passwordHash;
    if (updates.roleId) userUpdates.role_id = updates.roleId;

    if (Object.keys(userUpdates).length > 0) {
      const keys = Object.keys(userUpdates);
      const values = Object.values(userUpdates);
      const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
      await this.query(`UPDATE users SET ${setClause}, updated_at = NOW() WHERE user_id = $${keys.length + 1}`, [...values, id]);
    }

    const detailUpdates: any = {};
    if (updates.firstName) detailUpdates.first_name = updates.firstName;
    if (updates.lastName) detailUpdates.last_name = updates.lastName;
    if (updates.dob) detailUpdates.dob = updates.dob;
    if (updates.phone) detailUpdates.phone = updates.phone;
    if (updates.company_name) detailUpdates.company_name = updates.company_name;
    if (updates.gstin) detailUpdates.gstin = updates.gstin;
    if (updates.address) detailUpdates.address = updates.address;
    if (updates.city) detailUpdates.city = updates.city;
    if (updates.state) detailUpdates.state = updates.state;
    if (updates.pincode) detailUpdates.pincode = updates.pincode;

    if (Object.keys(detailUpdates).length > 0) {
      const keys = Object.keys(detailUpdates);
      const values = Object.values(detailUpdates);
      const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
      await this.query(`UPDATE user_details SET ${setClause}, updated_at = NOW() WHERE user_id = $${keys.length + 1}`, [...values, id]);
    }
  }

  async softDelete(id: number): Promise<void> {
    await this.callProcedure('sp_delete_user', [id, null, null]);
  }

  async getRoleIdByName(roleName: string): Promise<number | null> {
    const result = await this.query('SELECT role_id FROM roles WHERE name = $1', [roleName]);
    return result.rows[0]?.role_id || null;
  }
}
