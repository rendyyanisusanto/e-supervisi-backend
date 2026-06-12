import prisma from '../../config/database';
import { env } from '../../config/env';

export const waGatewayService = {
  normalizePhoneNumber(phone: string): string {
    let normalized = phone.replace(/[\s\-\+]/g, '');
    if (normalized.startsWith('0')) {
      normalized = '62' + normalized.substring(1);
    }
    return normalized;
  },

  renderWaTemplate(content: string, variables: Record<string, string>): string {
    let rendered = content;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      rendered = rendered.replace(regex, value);
    }
    return rendered;
  },

  async sendWhatsAppMessage(phone: string, message: string) {
    if (!env.GATEWAY_URL) throw new Error('Gateway URL not configured');
    
    const normalizedPhone = this.normalizePhoneNumber(phone);
    const endpoint = `${env.GATEWAY_URL}${env.GATEWAY_SEND_PATH}`;
    
    const auth = Buffer.from(`${env.GATEWAY_USER}:${env.GATEWAY_PASS}`).toString('base64');
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`
        },
        body: JSON.stringify({
          to: normalizedPhone,
          message: message
        }),
        signal: AbortSignal.timeout(env.GATEWAY_TIMEOUT)
      });
      
      const responseData = await response.text();
      
      if (!response.ok) {
        throw new Error(`Gateway Error: ${response.status} ${responseData}`);
      }
      
      return responseData;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send WhatsApp message');
    }
  },

  async createWaLog(payload: any) {
    return await prisma.waLog.create({
      data: {
        template_id: payload.template_id,
        supervision_id: payload.supervision_id,
        teacher_id: payload.teacher_id,
        phone: payload.phone,
        recipient_name: payload.recipient_name,
        template_code: payload.template_code,
        message: payload.message,
        status: payload.status,
        response: payload.response,
        error_message: payload.error_message,
        sent_at: payload.status === 'SENT' ? new Date() : null
      }
    });
  },

  async getWaLogs(req: any) {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const where: any = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.template_code) where.template_code = req.query.template_code;
    if (req.query.teacher_id) where.teacher_id = BigInt(req.query.teacher_id);
    if (req.query.search) {
      where.OR = [
        { recipient_name: { contains: req.query.search } },
        { phone: { contains: req.query.search } }
      ];
    }
    
    if (req.query.start_date && req.query.end_date) {
      where.created_at = {
        gte: new Date(req.query.start_date),
        lte: new Date(req.query.end_date)
      };
    }
    
    const total = await prisma.waLog.count({ where });
    const logs = await prisma.waLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' }
    });
    
    return {
      data: logs.map(l => ({
        ...l,
        id: l.id.toString(),
        template_id: l.template_id?.toString() || null,
        supervision_id: l.supervision_id?.toString() || null,
        teacher_id: l.teacher_id?.toString() || null,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  },

  async sendTestTemplate(templateIdStr: string, payload: { phone: string, variables: any }) {
    const template = await prisma.waTemplate.findUnique({ where: { id: BigInt(templateIdStr) } });
    if (!template) throw new Error('Template tidak ditemukan');
    
    const message = this.renderWaTemplate(template.content, payload.variables);
    
    let status = 'PENDING';
    let responseData = null;
    let errorMessage = null;
    
    try {
      responseData = await this.sendWhatsAppMessage(payload.phone, message);
      status = 'SENT';
    } catch (error: any) {
      status = 'FAILED';
      errorMessage = error.message;
    }
    
    const log = await this.createWaLog({
      template_id: template.id,
      phone: payload.phone,
      recipient_name: payload.variables.nama_guru || payload.phone,
      template_code: template.code,
      message,
      status,
      response: responseData,
      error_message: errorMessage
    });
    
    if (status === 'FAILED') throw new Error(errorMessage || 'Gagal mengirim pesan');
    
    return { ...log, id: log.id.toString(), template_id: log.template_id?.toString() };
  },

  async retryWaLog(logIdStr: string) {
    const log = await prisma.waLog.findUnique({ where: { id: BigInt(logIdStr) } });
    if (!log) throw new Error('Log tidak ditemukan');
    if (log.status === 'SENT') throw new Error('Pesan sudah terkirim, tidak bisa di-retry');
    
    let status = 'PENDING';
    let responseData = null;
    let errorMessage = null;
    
    try {
      responseData = await this.sendWhatsAppMessage(log.phone, log.message);
      status = 'SENT';
    } catch (error: any) {
      status = 'FAILED';
      errorMessage = error.message;
    }
    
    const updated = await prisma.waLog.update({
      where: { id: log.id },
      data: {
        status: status as any,
        response: responseData,
        error_message: errorMessage,
        sent_at: status === 'SENT' ? new Date() : null
      }
    });
    
    if (status === 'FAILED') throw new Error(errorMessage || 'Gagal mengirim pesan (Retry)');
    
    return { ...updated, id: updated.id.toString() };
  }
};
