# PushSMS — Backend API

Multi-tenant SMS SaaS backend built with Node.js + Express + PostgreSQL.

---

## Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express 5
- **Database**: PostgreSQL (pg driver, raw SQL)
- **Auth**: JWT (jsonwebtoken) + bcryptjs
- **Validation**: Joi
- **HTTP Client**: Axios (ObitSMS provider)

---

## Installation

```bash
# 1. Clone and install
npm install

# 2. Configure environment
cp .env .env.local  # edit .env with your credentials

# 3. Create PostgreSQL database
createdb -U postgres PushSMS

# 4. Apply schema
npm run db:schema

# 5. Seed demo data
npm run db:seed

# 6. Start server
npm run dev
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `DB_HOST` | PostgreSQL host |
| `DB_NAME` | Database name (PushSMS) |
| `DB_USERNAME` | DB user |
| `DB_PASSWORD` | DB password |
| `JWT_SECRET` | Long random string (min 64 chars) |
| `JWT_EXPIRES_IN` | Token TTL (e.g. `24h`) |
| `OBITSMS_USERNAME` | ObitSMS account username |
| `OBITSMS_PASSWORD` | ObitSMS account password |
| `OBITSMS_BASE_URL` | ObitSMS API endpoint |

---

## Project Structure

```
src/
  modules/
    auth/             POST /api/v1/auth/login, GET /api/v1/auth/me
    tenants/          Tenant management
    users/            User CRUD (tenant-scoped)
    contacts/         Contact management
    contact-lists/    Audience groups
    sender-ids/       SMS sender IDs
    sms-templates/    Reusable message templates
    opt-outs/         Opt-out registry (phone-centric)
    wallet/           Prepaid wallet + ledger
    payments/         Payment transaction lifecycle
    providers/        ObitSMS abstraction layer
    campaigns/        Campaign management + launch flow
    messages/         Individual SMS records
    audit-logs/       Immutable audit trail
    api-keys/         API key management
  shared/
    config/database/  db.js + schema.sql + seed.sql
    errors/           AppError hierarchy
    middleware/        auth, error, validate
    utils/            response, pagination, phone, sms
    constants/        Enums (statuses, types, etc.)
```

---

## API Endpoints

### Auth
```
POST   /api/v1/auth/login
GET    /api/v1/auth/me
```

### Tenants
```
POST   /api/v1/tenants
GET    /api/v1/tenants/:id
PATCH  /api/v1/tenants/:id
```

### Users
```
GET    /api/v1/users
POST   /api/v1/users
GET    /api/v1/users/:id
PATCH  /api/v1/users/:id
DELETE /api/v1/users/:id
POST   /api/v1/users/:id/change-password
```

### Contacts
```
GET    /api/v1/contacts
POST   /api/v1/contacts
GET    /api/v1/contacts/:id
PATCH  /api/v1/contacts/:id
DELETE /api/v1/contacts/:id
```

### Contact Lists
```
GET    /api/v1/contact-lists
POST   /api/v1/contact-lists
GET    /api/v1/contact-lists/:id
PATCH  /api/v1/contact-lists/:id
DELETE /api/v1/contact-lists/:id
GET    /api/v1/contact-lists/:id/members
POST   /api/v1/contact-lists/:id/members
DELETE /api/v1/contact-lists/:id/members/:contactId
```

### Sender IDs
```
GET    /api/v1/sender-ids
POST   /api/v1/sender-ids
PATCH  /api/v1/sender-ids/:id/activate
PATCH  /api/v1/sender-ids/:id/deactivate
```

### SMS Templates
```
GET    /api/v1/sms-templates
POST   /api/v1/sms-templates
GET    /api/v1/sms-templates/:id
PATCH  /api/v1/sms-templates/:id
DELETE /api/v1/sms-templates/:id
POST   /api/v1/sms-templates/:id/preview
```

### Campaigns
```
GET    /api/v1/campaigns
POST   /api/v1/campaigns
GET    /api/v1/campaigns/:id
PATCH  /api/v1/campaigns/:id
POST   /api/v1/campaigns/:id/schedule
POST   /api/v1/campaigns/:id/launch    ← triggers full SMS send flow
POST   /api/v1/campaigns/:id/cancel
GET    /api/v1/campaigns/:id/report
```

### Messages
```
GET    /api/v1/messages
GET    /api/v1/messages/:id
GET    /api/v1/messages/:id/events
```

### Wallet & Billing
```
GET    /api/v1/wallet
GET    /api/v1/wallet/transactions
POST   /api/v1/payments
POST   /api/v1/payments/:id/confirm
POST   /api/v1/payments/:id/cancel
```

### Opt-outs
```
GET    /api/v1/opt-outs
POST   /api/v1/opt-outs
DELETE /api/v1/opt-outs
GET    /api/v1/opt-outs/check?phone=237XXXXXXXXX
```

### Providers
```
GET    /api/v1/providers
GET    /api/v1/providers/pricing
```

### API Keys
```
GET    /api/v1/api-keys
POST   /api/v1/api-keys
DELETE /api/v1/api-keys/:id
```

### Audit Logs (ADMIN only)
```
GET    /api/v1/audit-logs
```

---

## Campaign Launch Flow

When `POST /api/v1/campaigns/:id/launch` is called, the backend executes inside a single PostgreSQL transaction:

1. Validate campaign, sender, contact list ownership (tenant isolation)
2. Fetch active opted-in contacts, filter against opt-out registry
3. Fetch active SMS provider + pricing
4. Calculate estimated cost (recipients × parts × unit_price)
5. Reserve estimated cost in wallet (`reserved_balance`)
6. Freeze recipients in `campaign_recipients`
7. Create `messages` records for each recipient
8. Call ObitSMS provider for each message
9. Record `message_events` for each result
10. Settle wallet: debit actual cost, release excess reservation
11. Update campaign counters and mark `COMPLETED`

If any step fails, the entire transaction rolls back.

---

## Multi-Tenant Security

Every query that reads or writes user data includes a `tenant_id = $X` filter. The tenant ID is extracted from the JWT payload, never from client input. No cross-tenant data leakage is possible through the API layer.

---

## Demo Credentials (after seed)

```
Email:    admin@demo.com
Password: Admin1234!
```
"# PushSMSV2" 
