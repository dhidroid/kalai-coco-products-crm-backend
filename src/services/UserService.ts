import { UserRepository, UserRow } from '../repositories/UserRepository';
import { User, UserRole } from '../types/index';
import { ValidationError, ConflictError, NotFoundError } from '../utils/errors';
import bcrypt from 'bcryptjs';

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  private mapRowToUser(row: any): User {
    return {
      id: Number(row.user_id),
      user_id: Number(row.user_id),
      email: row.email,
      password: row.password_hash || '',
      firstName: row.first_name || '',
      lastName: row.last_name || '',
      role: row.role_name as UserRole,
      phone: row.phone || undefined,
      gstin: row.gstin || undefined,
      address: row.address || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async createUser(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    dob?: string;
    phone?: string;
  }): Promise<User> {
    const existingUser = await this.userRepository.getByEmail(data.email);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const roleId = await this.userRepository.getRoleIdByName(data.role);
    if (!roleId) {
      throw new ValidationError(`Role ${data.role} not found`);
    }

    const userId = await this.userRepository.create({
      email: data.email,
      passwordHash: hashedPassword,
      roleId: roleId,
      firstName: data.firstName,
      lastName: data.lastName,
      dob: data.dob,
      phone: data.phone,
    });

    const user = await this.userRepository.getById(userId);
    return this.mapRowToUser(user);
  }

  async getUserById(id: number): Promise<User> {
    const row = await this.userRepository.getById(id);
    if (!row) {
      throw new NotFoundError('User not found');
    }
    const user = this.mapRowToUser(row);
    user.password = ''; // Security
    return user;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const row = await this.userRepository.getByEmail(email);
    if (!row) return null;
    return this.mapRowToUser(row);
  }

  async getAllUsers(limit: number = 10, offset: number = 0): Promise<User[]> {
    const rows = await this.userRepository.getAll(limit, offset);
    return rows.map((row) => {
      const u = this.mapRowToUser(row);
      u.password = '';
      return u;
    });
  }

  async updateUser(id: number, updates: any): Promise<User> {
    const existing = await this.userRepository.getById(id);
    if (!existing) {
      throw new NotFoundError('User not found');
    }

    const repoUpdates: any = { ...updates };
    if (updates.password) {
      repoUpdates.passwordHash = await bcrypt.hash(updates.password, 10);
      delete repoUpdates.password;
    }
    if (updates.role) {
      const roleId = await this.userRepository.getRoleIdByName(updates.role);
      if (!roleId) throw new ValidationError(`Role ${updates.role} not found`);
      repoUpdates.roleId = roleId;
    }

    await this.userRepository.update(id, repoUpdates);
    return this.getUserById(id);
  }

  async deleteUser(id: number): Promise<void> {
    const existing = await this.userRepository.getById(id);
    if (!existing) {
      throw new NotFoundError('User not found');
    }
    await this.userRepository.softDelete(id);
  }

  async changeUserRole(userId: number, newRole: UserRole): Promise<User> {
    const roleId = await this.userRepository.getRoleIdByName(newRole);
    if (!roleId) {
      throw new ValidationError(`Role ${newRole} not found`);
    }

    await this.userRepository.update(userId, { roleId });
    return this.getUserById(userId);
  }
}

export default new UserService();

