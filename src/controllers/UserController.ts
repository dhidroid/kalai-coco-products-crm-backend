import { Response } from 'express';
import type { AuthRequest, ApiResponse } from '../types/index';
import { UserRole } from '../types/index';
import UserService from '@services/UserService';
import { logger } from '@utils/logger';

export class UserController {
  async getAllUsers(req: AuthRequest, res: Response): Promise<void> {
    const limit = Number(req.query.limit) || 10;
    const offset = Number(req.query.offset) || 0;
    
    const users = await UserService.getAllUsers(limit, offset);
    
    const response: ApiResponse<any> = {
      success: true,
      message: 'Users retrieved successfully',
      data: users,
    };

    res.status(200).json(response);
  }

  async getUserById(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const user = await UserService.getUserById(parseInt(id, 10));

    const response: ApiResponse<any> = {
      success: true,
      message: 'User retrieved successfully',
      data: user,
    };

    res.status(200).json(response);
  }

  async createUser(req: AuthRequest, res: Response): Promise<void> {
    const { email, password, firstName, lastName, role, phone, dob } = req.body;
    const user = await UserService.createUser({
      email,
      password,
      firstName,
      lastName,
      role: role || UserRole.EMPLOYEE,
      phone,
      dob
    });

    logger.info('User created', { email });

    const response: ApiResponse<any> = {
      success: true,
      message: 'User created successfully',
      data: user,
    };

    res.status(201).json(response);
  }

  async updateUser(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const user = await UserService.updateUser(parseInt(id, 10), req.body);

    logger.info('User updated', { userId: id });

    const response: ApiResponse<any> = {
      success: true,
      message: 'User updated successfully',
      data: user,
    };

    res.status(200).json(response);
  }

  async deleteUser(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;
    await UserService.deleteUser(parseInt(id, 10));

    logger.info('User deleted', { userId: id });

    const response: ApiResponse<null> = {
      success: true,
      message: 'User deleted successfully',
    };

    res.status(200).json(response);
  }

  async changeRole(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { role } = req.body;
    const user = await UserService.changeUserRole(parseInt(id, 10), role);

    logger.info('User role changed', { userId: id, newRole: role });

    const response: ApiResponse<any> = {
      success: true,
      message: 'User role changed successfully',
      data: user,
    };

    res.status(200).json(response);
  }
}

export default new UserController();

