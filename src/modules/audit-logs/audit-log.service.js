import * as repo from './audit-log.repository.js';
import { getPagination, buildPaginationMeta } from '../../shared/utils/pagination.js';

export const listAuditLogs = async (tenantId, query) => {
  const { page, limit, offset } = getPagination(query);
  const { rows, total } = await repo.findByTenant(tenantId, {
    limit, offset,
    userId: query.userId,
    // Accept both resource_type (frontend) and entityType (legacy)
    entityType: query.resource_type || query.entityType,
    action: query.action,
  });
  return { logs: rows, pagination: buildPaginationMeta(total, page, limit) };
};

export const logAction = async (data, client) => repo.log(data, client);
