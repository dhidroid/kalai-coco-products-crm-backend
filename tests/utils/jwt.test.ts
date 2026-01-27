import { generateToken, verifyToken, decodeToken } from '../../src/utils/jwt';
import { UserRole } from '../../src/types/index';

describe('JWT Utils', () => {
  it('should generate a valid token', () => {
    const payload = {
      userId: 1,
      email: 'test@example.com',
      role: UserRole.USER,
    };

    const token = generateToken(payload);
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
  });

  it('should verify a valid token', () => {
    const payload = {
      userId: 1,
      email: 'test@example.com',
      role: UserRole.USER,
    };

    const token = generateToken(payload);
    const decoded = verifyToken(token);

    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
  });

  it('should decode a token without verification', () => {
    const payload = {
      userId: 1,
      email: 'test@example.com',
      role: UserRole.USER,
    };

    const token = generateToken(payload);
    const decoded = decodeToken(token);

    expect(decoded).toBeTruthy();
    expect(decoded?.userId).toBe(payload.userId);
  });

  it('should throw error for invalid token', () => {
    expect(() => {
      verifyToken('invalid.token.here');
    }).toThrow();
  });

  it('should return null for invalid token on decode', () => {
    const result = decodeToken('invalid.token.here');
    expect(result).toBeNull();
  });
});
