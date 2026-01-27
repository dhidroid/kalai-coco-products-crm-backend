import { query } from '@config/database';
import type { User } from '../types/index';
import { UnauthorizedError, ValidationError } from '@utils/errors';
import bcrypt from 'bcryptjs';
import { generateToken } from '@utils/jwt';

export interface LoginResponse {
  user: User;
  token: string;
}

export class AuthService {
  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: string
  ): Promise<LoginResponse> {
    if (!email || !password || !firstName || !lastName || !role) {
      throw new ValidationError('All fields (email, password, firstName, lastName, role) are required');
    }

    // Validate role exists
    const roleResult = await query(
      'SELECT role_id FROM roles WHERE LOWER(name) = LOWER($1)',
      [role]
    );

    if (roleResult.rows.length === 0) {
      throw new ValidationError(`Invalid role: ${role}. Valid roles are: admin, manager, user, guest`);
    }

    const roleId = roleResult.rows[0].role_id;

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Call sp_register_user stored procedure
    try {
      await query(
        'CALL sp_register_user($1, $2, $3, $4, $5, $6, $7)',
        [roleId, email, passwordHash, firstName, lastName, null, null] // dob and phone as null for now
      );
    } catch (error: any) {
      if (error.code === '23505') { // UNIQUE_VIOLATION
        throw new ValidationError('Email already registered');
      }
      throw error;
    }

    // Fetch the created user using direct SQL
    const userResult = await query(
      `SELECT u.user_id, u.email, u.password_hash, r.name as role_name,
              ud.first_name, ud.last_name, u.created_at, u.updated_at
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       LEFT JOIN user_details ud ON u.user_id = ud.user_id
       WHERE u.email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      throw new ValidationError('User creation failed');
    }

    const userData = userResult.rows[0];
    const user: User = {
      id: userData.user_id,
      email: userData.email,
      password: passwordHash,
      firstName: userData.first_name || firstName,
      lastName: userData.last_name || lastName,
      role: userData.role_name as any,
      createdAt: userData.created_at,
      updatedAt: userData.updated_at,
    };

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, token };
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    // Get user with role and details using direct SQL
    const userResult = await query(
      `SELECT u.user_id, u.email, u.password_hash, r.name as role_name,
              ud.first_name, ud.last_name, u.created_at, u.is_active
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       LEFT JOIN user_details ud ON u.user_id = ud.user_id
       WHERE u.email = $1 AND u.is_active = true`,
      [email]
    );

    if (userResult.rows.length === 0) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const userData = userResult.rows[0];

    // Verify password with bcrypt
    const isPasswordValid = await bcrypt.compare(password, userData.password_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const user: User = {
      id: userData.user_id,
      email: userData.email,
      password: userData.password_hash,
      firstName: userData.first_name || '',
      lastName: userData.last_name || '',
      role: userData.role_name as any,
      createdAt: userData.created_at,
      updatedAt: userData.created_at,
    };

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, token };
  }

  async validateToken(token: string): Promise<User> {
    const result = await query(
      `SELECT u.* FROM users u
       WHERE u.id = (
         SELECT user_id FROM tokens WHERE token = $1 AND expires_at > NOW()
       )`,
      [token]
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedError('Invalid or expired token');
    }

    const user = result.rows[0];
    return {
      id: user.id,
      email: user.email,
      password: user.password,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }

  async logout(userId: number): Promise<void> {
    await query('DELETE FROM tokens WHERE user_id = $1', [userId]);
  }
}

export default new AuthService();
