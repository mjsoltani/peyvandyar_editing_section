import { Response } from 'express';

export interface SessionOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  maxAge?: number;
  path?: string;
  domain?: string;
}

export class SessionManager {
  private static readonly defaultOptions: SessionOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  };

  /**
   * Set a secure cookie
   */
  static setCookie(
    res: Response,
    name: string,
    value: string,
    options: SessionOptions = {}
  ): void {
    const cookieOptions = { ...this.defaultOptions, ...options };
    
    let cookieString = `${name}=${encodeURIComponent(value)}`;
    
    if (cookieOptions.maxAge) {
      cookieString += `; Max-Age=${cookieOptions.maxAge}`;
    }
    
    if (cookieOptions.path) {
      cookieString += `; Path=${cookieOptions.path}`;
    }
    
    if (cookieOptions.domain) {
      cookieString += `; Domain=${cookieOptions.domain}`;
    }
    
    if (cookieOptions.secure) {
      cookieString += '; Secure';
    }
    
    if (cookieOptions.httpOnly) {
      cookieString += '; HttpOnly';
    }
    
    if (cookieOptions.sameSite) {
      cookieString += `; SameSite=${cookieOptions.sameSite}`;
    }
    
    res.setHeader('Set-Cookie', cookieString);
  }

  /**
   * Set multiple cookies at once
   */
  static setCookies(
    res: Response,
    cookies: Array<{
      name: string;
      value: string;
      options?: SessionOptions;
    }>
  ): void {
    const cookieStrings: string[] = [];
    
    cookies.forEach(({ name, value, options = {} }) => {
      const cookieOptions = { ...this.defaultOptions, ...options };
      
      let cookieString = `${name}=${encodeURIComponent(value)}`;
      
      if (cookieOptions.maxAge) {
        cookieString += `; Max-Age=${cookieOptions.maxAge}`;
      }
      
      if (cookieOptions.path) {
        cookieString += `; Path=${cookieOptions.path}`;
      }
      
      if (cookieOptions.domain) {
        cookieString += `; Domain=${cookieOptions.domain}`;
      }
      
      if (cookieOptions.secure) {
        cookieString += '; Secure';
      }
      
      if (cookieOptions.httpOnly) {
        cookieString += '; HttpOnly';
      }
      
      if (cookieOptions.sameSite) {
        cookieString += `; SameSite=${cookieOptions.sameSite}`;
      }
      
      cookieStrings.push(cookieString);
    });
    
    res.setHeader('Set-Cookie', cookieStrings);
  }

  /**
   * Clear a cookie
   */
  static clearCookie(
    res: Response,
    name: string,
    options: Omit<SessionOptions, 'maxAge'> = {}
  ): void {
    const cookieOptions = { ...this.defaultOptions, ...options };
    
    let cookieString = `${name}=; Max-Age=0`;
    
    if (cookieOptions.path) {
      cookieString += `; Path=${cookieOptions.path}`;
    }
    
    if (cookieOptions.domain) {
      cookieString += `; Domain=${cookieOptions.domain}`;
    }
    
    if (cookieOptions.secure) {
      cookieString += '; Secure';
    }
    
    if (cookieOptions.httpOnly) {
      cookieString += '; HttpOnly';
    }
    
    if (cookieOptions.sameSite) {
      cookieString += `; SameSite=${cookieOptions.sameSite}`;
    }
    
    res.setHeader('Set-Cookie', cookieString);
  }

  /**
   * Clear multiple cookies
   */
  static clearCookies(
    res: Response,
    names: string[],
    options: Omit<SessionOptions, 'maxAge'> = {}
  ): void {
    const cookieStrings: string[] = [];
    
    names.forEach(name => {
      const cookieOptions = { ...this.defaultOptions, ...options };
      
      let cookieString = `${name}=; Max-Age=0`;
      
      if (cookieOptions.path) {
        cookieString += `; Path=${cookieOptions.path}`;
      }
      
      if (cookieOptions.domain) {
        cookieString += `; Domain=${cookieOptions.domain}`;
      }
      
      if (cookieOptions.secure) {
        cookieString += '; Secure';
      }
      
      if (cookieOptions.httpOnly) {
        cookieString += '; HttpOnly';
      }
      
      if (cookieOptions.sameSite) {
        cookieString += `; SameSite=${cookieOptions.sameSite}`;
      }
      
      cookieStrings.push(cookieString);
    });
    
    res.setHeader('Set-Cookie', cookieStrings);
  }

  /**
   * Set authentication tokens as secure cookies
   */
  static setAuthTokens(
    res: Response,
    accessToken: string,
    refreshToken: string
  ): void {
    const isProduction = process.env.NODE_ENV === 'production';
    
    this.setCookies(res, [
      {
        name: 'access_token',
        value: accessToken,
        options: {
          maxAge: 60 * 60, // 1 hour
          secure: isProduction,
          httpOnly: true,
          sameSite: 'lax',
        },
      },
      {
        name: 'refresh_token',
        value: refreshToken,
        options: {
          maxAge: 7 * 24 * 60 * 60, // 7 days
          secure: isProduction,
          httpOnly: true,
          sameSite: 'lax',
        },
      },
    ]);
  }

  /**
   * Clear authentication tokens
   */
  static clearAuthTokens(res: Response): void {
    this.clearCookies(res, ['access_token', 'refresh_token']);
  }

  /**
   * Extract token from request (cookie or Authorization header)
   */
  static extractAccessToken(req: any): string | null {
    // Try cookie first
    if (req.cookies && req.cookies.access_token) {
      return req.cookies.access_token;
    }
    
    // Try Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    return null;
  }

  /**
   * Extract refresh token from request
   */
  static extractRefreshToken(req: any): string | null {
    // Try cookie first
    if (req.cookies && req.cookies.refresh_token) {
      return req.cookies.refresh_token;
    }
    
    // Try request body
    if (req.body && req.body.refresh_token) {
      return req.body.refresh_token;
    }
    
    return null;
  }
}