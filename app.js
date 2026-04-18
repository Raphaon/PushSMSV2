import express from 'express';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Routes
import authRoutes from './src/modules/auth/auth.route.js';
import tenantRoutes from './src/modules/tenants/tenant.routes.js';
import userRoutes from './src/modules/users/user.routes.js';
import contactRoutes from './src/modules/contacts/contact.routes.js';
import contactListRoutes from './src/modules/contact-lists/contact-list.routes.js';
import senderIdRoutes from './src/modules/sender-ids/sender-id.routes.js';
import smsTemplateRoutes from './src/modules/sms-templates/sms-template.routes.js';
import optOutRoutes from './src/modules/opt-outs/opt-out.routes.js';
import walletRoutes from './src/modules/wallet/wallet.routes.js';
import paymentRoutes from './src/modules/payments/payment.routes.js';
import providerRoutes from './src/modules/providers/provider.routes.js';
import campaignRoutes from './src/modules/campaigns/campaign.routes.js';
import messageRoutes from './src/modules/messages/message.routes.js';
import auditLogRoutes from './src/modules/audit-logs/audit-log.routes.js';
import apiKeyRoutes from './src/modules/api-keys/api-key.routes.js';
import notificationRoutes from './src/modules/notifications/notification.routes.js';
import rechargeRequestRoutes from './src/modules/recharge-requests/recharge-request.routes.js';

// Middleware
import { errorHandler, notFoundHandler } from './src/shared/middleware/error.middleware.js';

const app = express();

// CORS — must be before any routes
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',').map(s => s.trim());
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-API-Key');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/static', express.static(path.join(__dirname, 'src/shared/static')));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'PushSMS', timestamp: new Date().toISOString() }));

// API v1
const v1 = '/api/v1';

app.use(`${v1}/auth`, authRoutes);
app.use(`${v1}/tenants`, tenantRoutes);
app.use(`${v1}/users`, userRoutes);
app.use(`${v1}/contacts`, contactRoutes);
app.use(`${v1}/contact-lists`, contactListRoutes);
app.use(`${v1}/sender-ids`, senderIdRoutes);
app.use(`${v1}/sms-templates`, smsTemplateRoutes);
app.use(`${v1}/opt-outs`, optOutRoutes);
app.use(`${v1}/wallet`, walletRoutes);
app.use(`${v1}/payments`, paymentRoutes);
app.use(`${v1}/providers`, providerRoutes);
app.use(`${v1}/campaigns`, campaignRoutes);
app.use(`${v1}/messages`, messageRoutes);
app.use(`${v1}/audit-logs`, auditLogRoutes);
app.use(`${v1}/api-keys`, apiKeyRoutes);
app.use(`${v1}/notifications`, notificationRoutes);
app.use(`${v1}/recharge-requests`, rechargeRequestRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
