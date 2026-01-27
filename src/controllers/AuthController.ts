import { Response } from 'express';
import type { AuthRequest, ApiResponse } from '../types/index';
import AuthService from '@services/AuthService';
import { logger } from '@utils/logger';

export class AuthController {
  async register(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email, password, firstName, lastName, role } = req.body;
      const result = await AuthService.register(email, password, firstName, lastName, role);

      logger.info('User registered successfully', { email, role });

      const response: ApiResponse<any> = {
        success: true,
        message: 'User registered successfully',
        data: {
          user: result.user,
          token: result.token,
        },
      };

      res.status(201).json(response);
    } catch (error) {
      throw error;
    }
  }

  async login(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);

      logger.info('User logged in successfully', { email });

      const response: ApiResponse<any> = {
        success: true,
        message: 'User logged in successfully',
        data: {
          user: result.user,
          token: result.token,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      throw error;
    }
  }

  async logout(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      await AuthService.logout(req.user.userId);

      logger.info('User logged out', { userId: req.user.userId });

      const response: ApiResponse<null> = {
        success: true,
        message: 'User logged out successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      throw error;
    }
  }

  async getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const response: ApiResponse<any> = {
        success: true,
        message: 'Current user retrieved',
        data: req.user,
      };

      res.status(200).json(response);
    } catch (error) {
      throw error;
    }
  }
}

export default new AuthController();
