import * as service from './audit-log.service.js';
import { sendPaginated } from '../../shared/utils/response.js';

export const listAuditLogs = async (req, res, next) => {
  try {
    const { logs, pagination } = await service.listAuditLogs(req.user.tenantId, req.query);
    return sendPaginated(res, logs, pagination);
  } catch (err) { next(err); }
};
