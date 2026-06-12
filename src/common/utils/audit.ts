import prisma from '../../config/database';
import { Request } from 'express';

interface CreateAuditLogParams {
  userId?: string | bigint | number;
  action: string;
  module: string;
  description?: string;
  req?: Request;
}

export const createAuditLog = async (params: CreateAuditLogParams) => {
  try {
    let ipAddress = null;
    let userAgent = null;

    if (params.req) {
      ipAddress = params.req.ip || params.req.socket.remoteAddress || null;
      userAgent = params.req.get('user-agent') || null;
    }

    await prisma.auditLog.create({
      data: {
        user_id: params.userId ? BigInt(params.userId) : null,
        action: params.action,
        module: params.module,
        description: params.description,
        ip_address: ipAddress,
        user_agent: userAgent
      }
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // We intentionally don't throw to prevent breaking the main process
  }
};
