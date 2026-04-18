export const USER_ROLES = { ADMIN: 'ADMIN', OPERATOR: 'OPERATOR', SUPERADMIN: 'SUPERADMIN' };
export const USER_STATUS = { ACTIVE: 'active', SUSPENDED: 'suspended', INACTIVE: 'inactive' };

export const TENANT_STATUS = { ACTIVE: 'active', SUSPENDED: 'suspended', INACTIVE: 'inactive' };

export const CAMPAIGN_TYPES = { MARKETING: 'MARKETING', TRANSACTIONAL: 'TRANSACTIONAL' };
export const CAMPAIGN_STATUS = {
  DRAFT: 'DRAFT',
  SCHEDULED: 'SCHEDULED',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
};

export const MESSAGE_STATUS = {
  QUEUED: 'queued',
  SENT: 'sent',
  DELIVERED: 'delivered',
  FAILED: 'failed',
  SKIPPED: 'skipped',
};

export const RECIPIENT_STATUS = {
  QUEUED: 'queued',
  SENT: 'sent',
  DELIVERED: 'delivered',
  FAILED: 'failed',
  SKIPPED: 'skipped',
};

export const WALLET_TX_TYPES = {
  CREDIT: 'CREDIT',
  DEBIT: 'DEBIT',
  RESERVE: 'RESERVE',
  RELEASE: 'RELEASE',
  REFUND: 'REFUND',
};

export const WALLET_TX_DIRECTIONS = { IN: 'IN', OUT: 'OUT' };

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
};

export const SENDER_ID_TYPES = { ALPHANUMERIC: 'ALPHANUMERIC', LONGCODE: 'LONGCODE', SHORTCODE: 'SHORTCODE' };
export const SENDER_ID_STATUS = { PENDING: 'pending', ACTIVE: 'active', INACTIVE: 'inactive' };

export const OPT_OUT_CHANNELS = { SMS: 'SMS', MANUAL: 'MANUAL', API: 'API' };

export const API_KEY_STATUS = { ACTIVE: 'active', REVOKED: 'revoked' };

export const RECHARGE_STATUS = { PENDING: 'pending', APPROVED: 'approved', REJECTED: 'rejected' };

export const NOTIFICATION_TYPES = {
  LOW_CREDITS: 'low_credits',
  RECHARGE_APPROVED: 'recharge_approved',
  RECHARGE_REJECTED: 'recharge_rejected',
  SYSTEM: 'system',
};
