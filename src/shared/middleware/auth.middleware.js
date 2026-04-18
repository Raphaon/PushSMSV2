import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '../errors/AppError.js';
import pool from '../config/database/db.js';

export const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = header.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Verify user still exists and belongs to active tenant
    const result = await pool.query(
      `SELECT u.id, u.tenant_id, u.email, u.role, u.status,
              t.status AS tenant_status
       FROM users u
       JOIN tenants t ON t.id = u.tenant_id
       WHERE u.id = $1`,
      [payload.sub]
    );

    if (!result.rows[0]) throw new UnauthorizedError('User not found');

    const user = result.rows[0];
    if (user.status !== 'active') throw new UnauthorizedError('Account suspended');
    if (user.tenant_status !== 'active') throw new ForbiddenError('Tenant suspended');

    req.user = {
      id: user.id,
      tenantId: user.tenant_id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Invalid or expired token'));
    }
    next(err);
  }
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return next(new ForbiddenError('Insufficient permissions'));
  }
  next();
};
