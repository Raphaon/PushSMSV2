import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import pool, { withTransaction } from '../../shared/config/database/db.js';
import { UnauthorizedError, ConflictError, BadRequestError, NotFoundError } from '../../shared/errors/AppError.js';
import * as tenantRepo from '../tenants/tenant.repository.js';
import * as userRepo from '../users/user.repository.js';
import * as walletRepo from '../wallet/wallet.repository.js';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../email/mail.service.js';

const signToken = (user) =>
  jwt.sign(
    { sub: user.id, tenantId: user.tenant_id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

const buildUserPayload = (user, tenantName) => ({
  id: user.id,
  tenantId: user.tenant_id,
  tenantName,
  firstName: user.first_name,
  lastName: user.last_name,
  email: user.email,
  role: user.role,
});

export const login = async ({ email, password }) => {
  const result = await pool.query(
    `SELECT u.id, u.tenant_id, u.first_name, u.last_name, u.email,
            u.password_hash, u.role, u.status,
            t.status AS tenant_status, t.name AS tenant_name
     FROM users u
     JOIN tenants t ON t.id = u.tenant_id
     WHERE u.email = $1`,
    [email.toLowerCase()]
  );

  const user = result.rows[0];
  if (!user) throw new UnauthorizedError('Invalid email or password');

  const valid = await bcrypt.compare(password.trim(), user.password_hash);
  if (!valid) throw new UnauthorizedError('Invalid email or password');

  if (user.status !== 'active') throw new UnauthorizedError('Account suspended');
  if (user.tenant_status !== 'active') throw new UnauthorizedError('Tenant account suspended');

  await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

  return {
    token: signToken(user),
    user: buildUserPayload(user, user.tenant_name),
  };
};

export const register = async ({ companyName, firstName, lastName, email, password, country, timezone, currency }) => {
  // Check email uniqueness across all tenants
  const emailExists = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  if (emailExists.rows.length > 0) throw new ConflictError('An account with this email already exists');

  // Generate a unique slug from company name
  const baseSlug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  let slug = baseSlug;
  let attempt = 0;
  while (true) {
    const existing = await tenantRepo.findBySlug(slug);
    if (!existing) break;
    attempt++;
    slug = `${baseSlug}-${attempt}`;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const { tenant, user } = await withTransaction(async (client) => {
    const tenant = await tenantRepo.create(
      { name: companyName, slug, country: country || 'CM', timezone: timezone || 'Africa/Douala', currency: currency || 'XAF' },
      client
    );
    await walletRepo.createForTenant(tenant.id, client);
    const user = await userRepo.create(
      { tenantId: tenant.id, firstName, lastName, email, passwordHash, role: 'ADMIN' },
      client
    );
    return { tenant, user };
  });

  // Welcome email (non-blocking)
  sendWelcomeEmail(user.email, firstName).catch(() => {});

  return {
    token: signToken({ ...user, tenant_id: user.tenant_id }),
    user: buildUserPayload({ ...user, tenant_id: user.tenant_id }, tenant.name),
  };
};

export const forgotPassword = async (email) => {
  const result = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [email.toLowerCase()]);
  const user = result.rows[0];
  if (!user) return; // silent — don't reveal if email exists

  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await pool.query(
    'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3',
    [token, expires, user.id]
  );

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
  sendPasswordResetEmail(user.email, user.first_name, resetUrl).catch(() => {});
};

export const resetPassword = async (token, newPassword) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW()',
    [token]
  );
  if (!result.rows[0]) throw new BadRequestError('Token invalide ou expiré');
  const hash = await bcrypt.hash(newPassword, 12);
  await pool.query(
    'UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE id = $2',
    [hash, result.rows[0].id]
  );
};

export const changePassword = async (userId, tenantId, currentPassword, newPassword) => {
  const result = await pool.query('SELECT * FROM users WHERE id = $1 AND tenant_id = $2', [userId, tenantId]);
  const user = result.rows[0];
  if (!user) throw new NotFoundError('User not found');
  const valid = await bcrypt.compare(currentPassword.trim(), user.password_hash);
  if (!valid) throw new UnauthorizedError('Mot de passe actuel incorrect');
  const hash = await bcrypt.hash(newPassword, 12);
  await userRepo.updatePassword(userId, tenantId, hash);
};

export const getMe = async (userId) => {
  const result = await pool.query(
    `SELECT u.id, u.tenant_id, u.first_name, u.last_name, u.email, u.phone,
            u.role, u.status, u.last_login_at,
            t.name AS tenant_name, t.slug AS tenant_slug, t.currency, t.timezone
     FROM users u
     JOIN tenants t ON t.id = u.tenant_id
     WHERE u.id = $1`,
    [userId]
  );
  return result.rows[0] || null;
};
