import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, JWTPayload } from './jwt';

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

export function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  options?: { roles?: Array<'super_admin' | 'kam' | 'distributor'> }
) {
  return async (req: AuthenticatedRequest) => {
    try {
      const authHeader = req.headers.get('authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'No token provided',
            },
          },
          { status: 401 }
        );
      }

      const token = authHeader.substring(7);
      const payload = verifyToken(token);
      
      // Check role authorization
      if (options?.roles && !options.roles.includes(payload.role)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Insufficient permissions',
            },
          },
          { status: 403 }
        );
      }

      // Attach user to request
      req.user = payload;

      return handler(req);
    } catch (error: any) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: error.message || 'Authentication failed',
          },
        },
        { status: 401 }
      );
    }
  };
}

export function isSuperAdmin(user: JWTPayload): boolean {
  return user.role === 'super_admin';
}

export function isKAM(user: JWTPayload): boolean {
  return user.role === 'kam';
}

// New authMiddleware for direct use in API routes
export async function authMiddleware(
  req: NextRequest,
  allowedRoles?: Array<'super_admin' | 'kam' | 'distributor'>
): Promise<{ authorized: boolean; message: string; user?: JWTPayload }> {
  try {
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        authorized: false,
        message: 'No token provided',
      };
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    
    // Check role authorization
    if (allowedRoles && !allowedRoles.includes(payload.role)) {
      return {
        authorized: false,
        message: 'Insufficient permissions',
      };
    }

    return {
      authorized: true,
      message: 'Authorized',
      user: payload,
    };
  } catch (error: any) {
    return {
      authorized: false,
      message: error.message || 'Authentication failed',
    };
  }
}

// Alias for verifyAuth (same as authMiddleware but returns authenticated instead of authorized)
export async function verifyAuth(
  req: NextRequest,
  allowedRoles?: Array<'super_admin' | 'kam' | 'distributor'>
): Promise<{ authenticated: boolean; message: string; user?: JWTPayload }> {
  try {
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        authenticated: false,
        message: 'No token provided',
      };
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    
    // Check role authorization
    if (allowedRoles && !allowedRoles.includes(payload.role)) {
      return {
        authenticated: false,
        message: 'Insufficient permissions',
      };
    }

    return {
      authenticated: true,
      message: 'Authorized',
      user: payload,
    };
  } catch (error: any) {
    return {
      authenticated: false,
      message: error.message || 'Authentication failed',
    };
  }
}

