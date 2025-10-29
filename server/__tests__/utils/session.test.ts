import { Response } from 'express';
import { SessionManager } from '../../utils/session';

describe('SessionManager', () => {
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockResponse = {
      setHeader: jest.fn(),
    };
  });

  describe('setCookie', () => {
    it('should set basic cookie with default options', () => {
      SessionManager.setCookie(mockResponse as Response, 'test', 'value');

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Set-Cookie',
        'test=value; Path=/; Secure; HttpOnly; SameSite=lax'
      );
    });

    it('should set cookie with custom options', () => {
      SessionManager.setCookie(mockResponse as Response, 'test', 'value', {
        maxAge: 3600,
        domain: 'example.com',
        secure: false,
        httpOnly: false,
        sameSite: 'strict',
      });

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Set-Cookie',
        'test=value; Max-Age=3600; Path=/; Domain=example.com; SameSite=strict'
      );
    });

    it('should encode cookie value', () => {
      SessionManager.setCookie(mockResponse as Response, 'test', 'value with spaces');

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Set-Cookie',
        'test=value%20with%20spaces; Path=/; Secure; HttpOnly; SameSite=lax'
      );
    });
  });

  describe('setCookies', () => {
    it('should set multiple cookies', () => {
      SessionManager.setCookies(mockResponse as Response, [
        { name: 'cookie1', value: 'value1' },
        { name: 'cookie2', value: 'value2', options: { maxAge: 3600 } },
      ]);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('Set-Cookie', [
        'cookie1=value1; Path=/; Secure; HttpOnly; SameSite=lax',
        'cookie2=value2; Max-Age=3600; Path=/; Secure; HttpOnly; SameSite=lax',
      ]);
    });
  });

  describe('clearCookie', () => {
    it('should clear cookie with default options', () => {
      SessionManager.clearCookie(mockResponse as Response, 'test');

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Set-Cookie',
        'test=; Max-Age=0; Path=/; Secure; HttpOnly; SameSite=lax'
      );
    });

    it('should clear cookie with custom options', () => {
      SessionManager.clearCookie(mockResponse as Response, 'test', {
        domain: 'example.com',
        path: '/custom',
      });

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Set-Cookie',
        'test=; Max-Age=0; Path=/custom; Domain=example.com; Secure; HttpOnly; SameSite=lax'
      );
    });
  });

  describe('clearCookies', () => {
    it('should clear multiple cookies', () => {
      SessionManager.clearCookies(mockResponse as Response, ['cookie1', 'cookie2']);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('Set-Cookie', [
        'cookie1=; Max-Age=0; Path=/; Secure; HttpOnly; SameSite=lax',
        'cookie2=; Max-Age=0; Path=/; Secure; HttpOnly; SameSite=lax',
      ]);
    });
  });

  describe('setAuthTokens', () => {
    it('should set access and refresh tokens with appropriate expiration', () => {
      SessionManager.setAuthTokens(mockResponse as Response, 'access-token', 'refresh-token');

      expect(mockResponse.setHeader).toHaveBeenCalledWith('Set-Cookie', [
        'access_token=access-token; Max-Age=3600; Path=/; Secure; HttpOnly; SameSite=lax',
        'refresh_token=refresh-token; Max-Age=604800; Path=/; Secure; HttpOnly; SameSite=lax',
      ]);
    });
  });

  describe('clearAuthTokens', () => {
    it('should clear both access and refresh tokens', () => {
      SessionManager.clearAuthTokens(mockResponse as Response);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('Set-Cookie', [
        'access_token=; Max-Age=0; Path=/; Secure; HttpOnly; SameSite=lax',
        'refresh_token=; Max-Age=0; Path=/; Secure; HttpOnly; SameSite=lax',
      ]);
    });
  });

  describe('extractAccessToken', () => {
    it('should extract token from cookies', () => {
      const mockRequest = {
        cookies: { access_token: 'cookie-token' },
        headers: {},
      };

      const token = SessionManager.extractAccessToken(mockRequest);
      expect(token).toBe('cookie-token');
    });

    it('should extract token from Authorization header', () => {
      const mockRequest = {
        cookies: {},
        headers: { authorization: 'Bearer header-token' },
      };

      const token = SessionManager.extractAccessToken(mockRequest);
      expect(token).toBe('header-token');
    });

    it('should prefer cookie over header', () => {
      const mockRequest = {
        cookies: { access_token: 'cookie-token' },
        headers: { authorization: 'Bearer header-token' },
      };

      const token = SessionManager.extractAccessToken(mockRequest);
      expect(token).toBe('cookie-token');
    });

    it('should return null when no token found', () => {
      const mockRequest = {
        cookies: {},
        headers: {},
      };

      const token = SessionManager.extractAccessToken(mockRequest);
      expect(token).toBeNull();
    });

    it('should return null for malformed Authorization header', () => {
      const mockRequest = {
        cookies: {},
        headers: { authorization: 'InvalidFormat token' },
      };

      const token = SessionManager.extractAccessToken(mockRequest);
      expect(token).toBeNull();
    });
  });

  describe('extractRefreshToken', () => {
    it('should extract refresh token from cookies', () => {
      const mockRequest = {
        cookies: { refresh_token: 'cookie-refresh-token' },
        body: {},
      };

      const token = SessionManager.extractRefreshToken(mockRequest);
      expect(token).toBe('cookie-refresh-token');
    });

    it('should extract refresh token from request body', () => {
      const mockRequest = {
        cookies: {},
        body: { refresh_token: 'body-refresh-token' },
      };

      const token = SessionManager.extractRefreshToken(mockRequest);
      expect(token).toBe('body-refresh-token');
    });

    it('should prefer cookie over body', () => {
      const mockRequest = {
        cookies: { refresh_token: 'cookie-refresh-token' },
        body: { refresh_token: 'body-refresh-token' },
      };

      const token = SessionManager.extractRefreshToken(mockRequest);
      expect(token).toBe('cookie-refresh-token');
    });

    it('should return null when no refresh token found', () => {
      const mockRequest = {
        cookies: {},
        body: {},
      };

      const token = SessionManager.extractRefreshToken(mockRequest);
      expect(token).toBeNull();
    });
  });
});