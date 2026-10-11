import { FastifyRequest, FastifyReply } from 'fastify';
import { UserRole, AccountStatus } from '@prisma/client';
import { prisma } from '../db/prisma.js';

export interface AuthPayload {
  userId: string;
  email: string;
  role: UserRole;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AuthPayload;
    user: AuthPayload;
  }
}

export async function verifyAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (request.cookies && request.cookies.campusface_token) {
      token = request.cookies.campusface_token;
    }

    if (!token) {
      return;
    }

    const decoded = request.server.jwt.verify<AuthPayload>(token);
    if (!decoded || !decoded.userId) {
      return;
    }

    // Verify user is still active in DB
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, accountStatus: true }
    });

    if (!user || user.accountStatus !== AccountStatus.ACTIVE) {
      return;
    }

    request.user = {
      userId: user.id,
      email: user.email,
      role: user.role
    };
  } catch (err) {
    // Invalid token, request.user remains undefined
  }
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  await verifyAuth(request, reply);

  if (!request.user) {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Authentication is required to perform this action'
    });
  }
}

export function requireRole(allowedRoles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await requireAuth(request, reply);
    if (reply.sent) return;

    if (!request.user || !allowedRoles.includes(request.user.role)) {
      return reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: 'You do not have the required permissions to access this resource'
      });
    }
  };
}
