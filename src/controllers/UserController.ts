import { Response } from 'express';
import type { AuthRequest, ApiResponse } from '../types/index';
import { UserRole } from '../types/index';
import UserService from '@services/UserService';
import { logger } from '@utils/logger';

export class UserController {
  async getAllUsers(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const users = await UserService.getAllUsers();

      const response: ApiResponse<any> = {
        success: true,
        message: 'Users retrieved successfully',
        data: users,
      };

      res.status(200).json(response);
    } catch (error) {
      throw error;
    }
  }

  async getUserById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await UserService.getUserById(parseInt(id, 10));

      const response: ApiResponse<any> = {
        success: true,
        message: 'User retrieved successfully',
        data: user,
      };

      res.status(200).json(response);
    } catch (error) {
      throw error;
    }
  }

  async createUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email, password, firstName, lastName, role } = req.body;
      const user = await UserService.createUser(
        email,
        password,
        firstName,
        lastName,
        role || UserRole.USER
      );

      logger.info('User created', { email });

      const response: ApiResponse<any> = {
        success: true,
        message: 'User created successfully',
        data: user,
      };

      res.status(201).json(response);
    } catch (error) {
      throw error;
    }
  }

  async updateUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;
      const user = await UserService.updateUser(parseInt(id, 10), updates);

      logger.info('User updated', { userId: id });

      const response: ApiResponse<any> = {
        success: true,
        message: 'User updated successfully',
        data: user,
      };

      res.status(200).json(response);
    } catch (error) {
      throw error;
    }
  }

  async deleteUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await UserService.deleteUser(parseInt(id, 10));

      logger.info('User deleted', { userId: id });

      const response: ApiResponse<null> = {
        success: true,
        message: 'User deleted successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      throw error;
    }
  }

  async changeRole(req: AuthRequest, res: Response): Promise<void> {
    try {
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
    } catch (error) {
      throw error;
    }
  }
}

export default new UserController();
