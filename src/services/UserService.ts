import { query } from '@config/database';
import type { User } from '../types/index';
import { UserRole } from '../types/index';
import { ValidationError, ConflictError, NotFoundError } from '@utils/errors';
import bcrypt from 'bcryptjs';

export class UserService {
  async createUser(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: UserRole = UserRole.USER
  ): Promise<User> {
    // Check if user already exists
    const existingUser = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get role_id from role name
    const roleResult = await query('SELECT role_id FROM roles WHERE name = $1', [role]);
    if (roleResult.rows.length === 0) {
      throw new ValidationError(`Role ${role} not found`);
    }
    const roleId = roleResult.rows[0].role_id;

    // Create user with direct INSERT
    const result = await query(
      'INSERT INTO users (email, password_hash, role_id) VALUES ($1, $2, $3) RETURNING user_id, email, password_hash, role_id, is_active, created_at, updated_at',
      [email, hashedPassword, roleId]
    );

    if (result.rows.length === 0) {
      throw new ValidationError('Failed to create user');
    }

    const user = result.rows[0];

    // Insert user details
    await query(
      'INSERT INTO user_details (user_id, first_name, last_name) VALUES ($1, $2, $3)',
      [user.user_id, firstName, lastName]
    );

    return {
      id: user.user_id,
      email: user.email,
      password: user.password_hash,
      firstName: firstName,
      lastName: lastName,
      role: role,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }

  async getUserById(id: number): Promise<User> {
    const result = await query(
      `SELECT u.user_id, u.email, u.password_hash, r.name as role_name,
              ud.first_name, ud.last_name, u.created_at, u.updated_at
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.role_id
       LEFT JOIN user_details ud ON u.user_id = ud.user_id
       WHERE u.user_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    const user = result.rows[0];
    return {
      id: user.user_id,
      email: user.email,
      password: '', // Password not returned for security
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      role: user.role_name as UserRole,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const result = await query(
      `SELECT u.user_id, u.email, u.password_hash, r.name as role_name,
              ud.first_name, ud.last_name, u.created_at, u.updated_at
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.role_id
       LEFT JOIN user_details ud ON u.user_id = ud.user_id
       WHERE u.email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];
    return {
      id: user.user_id,
      email: user.email,
      password: user.password_hash || '',
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      role: user.role_name as UserRole,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }

  async getAllUsers(): Promise<User[]> {
    const result = await query(
      `SELECT u.user_id, u.email, u.password_hash, r.name as role_name,
              ud.first_name, ud.last_name, u.created_at, u.updated_at
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.role_id
       LEFT JOIN user_details ud ON u.user_id = ud.user_id
       ORDER BY u.created_at DESC`
    );

    return result.rows.map((user: any) => {
      return {
        id: user.user_id,
        email: user.email,
        password: '', // Password not returned for security
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        role: user.role_name as UserRole,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      };
    });
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const user = await this.getUserById(id);

    const newPassword = updates.password
      ? await bcrypt.hash(updates.password, 10)
      : user.password;

    const result = await query(
      `UPDATE users 
       SET email = COALESCE($1, email),
           password_hash = $2,
           updated_at = NOW()
       WHERE user_id = $3
       RETURNING *`,
      [
        updates.email || null,
        newPassword,
        id,
      ]
    );

    if (updates.firstName || updates.lastName) {
      await query(
        'UPDATE user_details SET first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name) WHERE user_id = $3',
        [updates.firstName || null, updates.lastName || null, id]
      );
    }

    const updatedUser = result.rows[0];
    return {
      id: updatedUser.user_id,
      email: updatedUser.email,
      password: updatedUser.password_hash,
      firstName: updates.firstName || user.firstName,
      lastName: updates.lastName || user.lastName,
      role: user.role,
      createdAt: updatedUser.created_at,
      updatedAt: updatedUser.updated_at,
    };
  }

  async deleteUser(id: number): Promise<void> {
    // Call stored procedure to delete user
    const result = await query(
      'CALL sp_delete_user($1, NULL::varchar, NULL::varchar)',
      [id]
    );

    // Stored procedures don't return rows in pg, so we verify user existed before deletion
    const userCheck = await query('SELECT user_id FROM users WHERE user_id = $1', [id]);
    if (userCheck.rows.length > 0) {
      throw new NotFoundError('Failed to delete user');
    }
  }

  async changeUserRole(userId: number, newRole: UserRole): Promise<User> {
    // Get role_id for the new role
    const roleResult = await query('SELECT role_id FROM roles WHERE name = $1', [newRole]);
    if (roleResult.rows.length === 0) {
      throw new ValidationError(`Role ${newRole} not found`);
    }
    const roleId = roleResult.rows[0].role_id;

    // Call stored procedure to change role
    await query(
      'CALL sp_change_user_role($1, $2, NULL::varchar, NULL::varchar)',
      [userId, roleId]
    );

    return this.getUserById(userId);
  }
}

export default new UserService();
