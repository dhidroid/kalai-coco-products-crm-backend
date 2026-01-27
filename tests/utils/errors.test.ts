import { AppError, ValidationError, UnauthorizedError, ForbiddenError, NotFoundError } from '../../src/utils/errors';

describe('Error Classes', () => {
  it('should create AppError with correct status code', () => {
    const error = new AppError(400, 'Test error');
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Test error');
    expect(error.isOperational).toBe(true);
  });

  it('should create ValidationError with status 400', () => {
    const error = new ValidationError('Validation failed');
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Validation failed');
  });

  it('should create UnauthorizedError with status 401', () => {
    const error = new UnauthorizedError('Unauthorized');
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Unauthorized');
  });

  it('should create ForbiddenError with status 403', () => {
    const error = new ForbiddenError('Forbidden');
    expect(error.statusCode).toBe(403);
    expect(error.message).toBe('Forbidden');
  });

  it('should create NotFoundError with status 404', () => {
    const error = new NotFoundError('Not found');
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('Not found');
  });
});
