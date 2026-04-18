# PushSMS — Documentation API complète

**Base URL** : `http://localhost:4000/api/v1`  
**Format** : JSON  
**Authentification** : Bearer JWT (sauf `POST /auth/login` et `POST /auth/register`)

> **CORS** : autorisé depuis `http://localhost:3000` (configurable via `CORS_ORIGINS` dans `.env`)

---

## Format de réponse standard

### Succès
```json
{
  "success": true,
  "message": "Description",
  "data": { ... }
}
```

### Liste paginée
```json
{
  "success": true,
  "message": "Success",
  "data": [ ... ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Erreur
```json
{
  "success": false,
  "message": "Description de l'erreur",
  "errors": [
    { "field": "email", "message": "email is required" }
  ]
}
```

---

## Codes HTTP

| Code | Signification |
|------|---------------|
| 200 | Succès |
| 201 | Ressource créée |
| 400 | Données invalides |
| 401 | Non authentifié |
| 403 | Accès refusé |
| 404 | Ressource introuvable |
| 409 | Conflit (doublon) |
| 422 | Erreur de validation |
| 500 | Erreur serveur |

---

## Paramètres de pagination (communs)

Tous les endpoints de listing acceptent :

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `page` | number | 1 | Numéro de page |
| `limit` | number | 20 | Résultats par page (max 100) |

---

# 1. AUTH

## POST /auth/register

Crée un nouveau tenant + compte administrateur en une seule opération atomique. Auto-connecte l'utilisateur.

**Authentification requise** : Non

**Body**
```json
{
  "companyName": "Acme Corp",
  "firstName": "Jean",
  "lastName": "Dupont",
  "email": "jean@acme.com",
  "password": "MonMotDePasse1!",
  "country": "CM",
  "timezone": "Africa/Douala",
  "currency": "XAF"
}
```

**Réponse 201**
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "tenantId": "uuid",
      "tenantName": "Acme Corp",
      "firstName": "Jean",
      "lastName": "Dupont",
      "email": "jean@acme.com",
      "role": "ADMIN"
    }
  }
}
```

**Erreurs**
| Code | Message |
|------|---------|
| 400 | Validation failed |
| 409 | An account with this email already exists |

---

## POST /auth/login

Authentifie un utilisateur et retourne un JWT.

**Authentification requise** : Non

**Body**
```json
{
  "email": "admin@demo.com",
  "password": "Admin1234!"
}
```

**Réponse 200**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "b0000000-0000-0000-0000-000000000001",
      "tenantId": "a0000000-0000-0000-0000-000000000001",
      "tenantName": "Demo Company",
      "firstName": "Admin",
      "lastName": "Demo",
      "email": "admin@demo.com",
      "role": "ADMIN"
    }
  }
}
```

**Erreurs**
| Code | Message |
|------|---------|
| 400 | Validation failed (champ manquant) |
| 401 | Invalid email or password |
| 401 | Account suspended |

---

## GET /auth/me

Retourne le profil de l'utilisateur connecté.

**Authentification requise** : Oui

**Headers**
```
Authorization: Bearer <token>
```

**Réponse 200**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": "b0000000-0000-0000-0000-000000000001",
    "tenant_id": "a0000000-0000-0000-0000-000000000001",
    "first_name": "Admin",
    "last_name": "Demo",
    "email": "admin@demo.com",
    "phone": null,
    "role": "ADMIN",
    "status": "active",
    "last_login_at": "2026-04-17T10:00:00Z",
    "tenant_name": "Demo Company",
    "tenant_slug": "demo-company",
    "currency": "XAF",
    "timezone": "Africa/Douala"
  }
}
```

---

# 2. TENANTS

## POST /tenants

Crée un nouveau tenant (entreprise cliente).

**Authentification requise** : Non (endpoint d'onboarding)

**Body**
```json
{
  "name": "Mon Entreprise",
  "slug": "mon-entreprise",
  "country": "CM",
  "timezone": "Africa/Douala",
  "currency": "XAF"
}
```

| Champ | Type | Requis | Règles |
|-------|------|--------|--------|
| `name` | string | Oui | 2-255 caractères |
| `slug` | string | Oui | 2-100 caractères, uniquement `[a-z0-9-]` |
| `country` | string | Non | Code pays (ex: CM, SN, CI) |
| `timezone` | string | Non | Défaut: UTC |
| `currency` | string | Non | Défaut: XAF |

**Réponse 201**
```json
{
  "success": true,
  "message": "Tenant created successfully",
  "data": {
    "id": "uuid-généré",
    "name": "Mon Entreprise",
    "slug": "mon-entreprise",
    "country": "CM",
    "timezone": "Africa/Douala",
    "currency": "XAF",
    "status": "active",
    "created_at": "2026-04-17T10:00:00Z"
  }
}
```

---

## GET /tenants/:id

Retourne le profil d'un tenant.

**Authentification requise** : Oui

**Réponse 200**
```json
{
  "success": true,
  "data": {
    "id": "a0000000-0000-0000-0000-000000000001",
    "name": "Demo Company",
    "slug": "demo-company",
    "country": "CM",
    "timezone": "Africa/Douala",
    "currency": "XAF",
    "status": "active"
  }
}
```

---

## PATCH /tenants/:id

Modifie un tenant. **Rôle requis : ADMIN**

**Body** (tous les champs sont optionnels)
```json
{
  "name": "Nouveau Nom",
  "timezone": "Africa/Abidjan",
  "status": "suspended"
}
```

| Champ `status` | Description |
|----------------|-------------|
| `active` | Actif |
| `suspended` | Suspendu |
| `inactive` | Inactif |

**Réponse 200**
```json
{
  "success": true,
  "message": "Tenant updated",
  "data": { ... }
}
```

---

# 3. USERS

> Tous les endpoints Users nécessitent une authentification.  
> Un utilisateur ne peut accéder qu'aux utilisateurs de **son propre tenant**.

## GET /users

Liste les utilisateurs du tenant courant.

**Query params**
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page |
| `limit` | number | Résultats par page |
| `search` | string | Recherche sur email, prénom, nom |

**Réponse 200**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "first_name": "Alice",
      "last_name": "Martin",
      "email": "alice@demo.com",
      "phone": "+237600000000",
      "role": "OPERATOR",
      "status": "active",
      "last_login_at": null,
      "created_at": "2026-04-17T10:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

---

## POST /users

Crée un utilisateur dans le tenant. **Rôle requis : ADMIN**

**Body**
```json
{
  "firstName": "Alice",
  "lastName": "Martin",
  "email": "alice@demo.com",
  "phone": "+237600000000",
  "password": "MotDePasse123!",
  "role": "OPERATOR"
}
```

| Champ | Requis | Règles |
|-------|--------|--------|
| `email` | Oui | Email valide, unique dans le tenant |
| `password` | Oui | Min 8 caractères |
| `role` | Non | `ADMIN` ou `OPERATOR` (défaut: OPERATOR) |

**Réponse 201**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "uuid",
    "email": "alice@demo.com",
    "role": "OPERATOR",
    "status": "active"
  }
}
```

---

## GET /users/:id

Retourne le détail d'un utilisateur du tenant.

**Réponse 200** : objet utilisateur complet (sans password_hash)

---

## PATCH /users/:id

Modifie un utilisateur. **Rôle requis : ADMIN**

**Body** (tous optionnels)
```json
{
  "firstName": "Alice",
  "lastName": "Dupont",
  "phone": "+237611111111",
  "role": "ADMIN",
  "status": "suspended"
}
```

---

## DELETE /users/:id

Désactive un utilisateur (soft delete — status = inactive). **Rôle requis : ADMIN**

> Un utilisateur ne peut pas supprimer son propre compte.

**Réponse 200**
```json
{ "success": true, "message": "User deactivated" }
```

---

## POST /users/:id/change-password

Modifie le mot de passe d'un utilisateur.

**Body**
```json
{
  "currentPassword": "AncienMotDePasse",
  "newPassword": "NouveauMotDePasse123!"
}
```

**Réponse 200**
```json
{ "success": true, "message": "Password changed successfully" }
```

---

# 4. CONTACTS

> Tous les contacts sont isolés par tenant.

## GET /contacts

Liste les contacts du tenant.

**Query params**
| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Recherche sur téléphone, prénom, nom, email |
| `status` | string | `active` ou `archived` |

**Réponse 200**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "first_name": "Jean",
      "last_name": "Kamga",
      "phone_number": "+237674937152",
      "email": null,
      "country": "CM",
      "city": "Douala",
      "opt_in_status": "opted_in",
      "status": "active",
      "created_at": "2026-04-17T10:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

---

## POST /contacts

Crée un contact.

**Body**
```json
{
  "firstName": "Jean",
  "lastName": "Kamga",
  "phoneNumber": "237674937152",
  "email": "jean@exemple.com",
  "country": "CM",
  "city": "Douala"
}
```

| Champ | Requis | Règles |
|-------|--------|--------|
| `phoneNumber` | Oui | Normalisé E.164, unique par tenant |

> Le numéro est automatiquement normalisé (ex: `00237...` → `+237...`)

**Réponse 201** : objet contact créé

---

## GET /contacts/:id

Retourne le détail d'un contact.

---

## PATCH /contacts/:id

Modifie un contact.

**Body** (tous optionnels)
```json
{
  "firstName": "Jean",
  "city": "Yaoundé",
  "optInStatus": "opted_out",
  "status": "archived"
}
```

---

## DELETE /contacts/:id

Archive un contact (soft delete).

---

# 5. CONTACT LISTS

## GET /contact-lists

Liste les listes de diffusion du tenant.

**Réponse 200**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Clients VIP",
      "description": "Nos meilleurs clients",
      "member_count": 150,
      "status": "active"
    }
  ]
}
```

---

## POST /contact-lists

Crée une liste de diffusion.

**Body**
```json
{
  "name": "Clients VIP",
  "description": "Nos meilleurs clients"
}
```

---

## GET /contact-lists/:id

Retourne le détail d'une liste.

---

## PATCH /contact-lists/:id

Modifie le nom ou la description d'une liste.

```json
{ "name": "Nouveau nom" }
```

---

## DELETE /contact-lists/:id

Supprime une liste (et ses membres, par cascade).

---

## GET /contact-lists/:id/members

Liste les contacts membres de la liste.

**Réponse 200**
```json
{
  "data": [
    {
      "id": "uuid",
      "first_name": "Jean",
      "last_name": "Kamga",
      "phone_number": "+237674937152",
      "opt_in_status": "opted_in",
      "added_at": "2026-04-17T10:00:00Z"
    }
  ]
}
```

---

## POST /contact-lists/:id/members

Ajoute un contact à la liste.

**Body**
```json
{ "contactId": "uuid-du-contact" }
```

---

## DELETE /contact-lists/:id/members/:contactId

Retire un contact de la liste.

**Réponse 200**
```json
{ "success": true, "message": "Contact removed from list" }
```

---

# 6. SENDER IDs

## GET /sender-ids

Liste les expéditeurs SMS du tenant.

**Réponse 200**
```json
{
  "data": [
    {
      "id": "uuid",
      "value": "MonApp",
      "type": "ALPHANUMERIC",
      "status": "active"
    }
  ]
}
```

---

## POST /sender-ids

Crée un Sender ID.

**Body**
```json
{
  "value": "MonApp",
  "type": "ALPHANUMERIC"
}
```

| Champ `type` | Règle |
|--------------|-------|
| `ALPHANUMERIC` | 1-11 caractères alphanumériques |
| `LONGCODE` | Numéro long international |
| `SHORTCODE` | Code court |

---

## PATCH /sender-ids/:id/activate

Active un Sender ID.

**Réponse 200**
```json
{ "success": true, "message": "Sender ID activated" }
```

---

## PATCH /sender-ids/:id/deactivate

Désactive un Sender ID.

---

# 7. SMS TEMPLATES

## GET /sms-templates

Liste les modèles SMS du tenant.

---

## POST /sms-templates

Crée un modèle SMS.

**Body**
```json
{
  "name": "Bienvenue",
  "body": "Bonjour {{prenom}}, bienvenue chez {{entreprise}} !",
  "variables": ["prenom", "entreprise"],
  "category": "MARKETING"
}
```

> Les variables sont injectées avec la syntaxe `{{nom_variable}}`

---

## GET /sms-templates/:id

Retourne un modèle SMS.

---

## PATCH /sms-templates/:id

Modifie un modèle SMS.

**Body** (tous optionnels)
```json
{
  "name": "Nouveau nom",
  "body": "Nouveau corps",
  "isActive": false
}
```

---

## DELETE /sms-templates/:id

Supprime un modèle SMS.

---

## POST /sms-templates/:id/preview

Prévisualise un modèle avec des variables injectées.

**Body**
```json
{
  "variables": {
    "prenom": "Jean",
    "entreprise": "Mon Entreprise"
  }
}
```

**Réponse 200**
```json
{
  "data": {
    "body": "Bonjour Jean, bienvenue chez Mon Entreprise !",
    "parts": 1,
    "charCount": 45
  }
}
```

---

# 8. OPT-OUTS

> Le registre d'opt-out est centré sur le **numéro de téléphone**, pas sur le contact.

## GET /opt-outs

Liste les opt-outs du tenant.

---

## GET /opt-outs/check?phone=237674937152

Vérifie si un numéro est dans le registre d'opt-out.

**Réponse 200**
```json
{
  "data": {
    "phone": "+237674937152",
    "optedOut": true
  }
}
```

---

## POST /opt-outs

Enregistre un opt-out.

**Body**
```json
{
  "phoneNumber": "237674937152",
  "channel": "MANUAL",
  "reason": "Demande du client"
}
```

| Champ `channel` | Description |
|-----------------|-------------|
| `SMS` | Opt-out via SMS entrant |
| `MANUAL` | Enregistrement manuel |
| `API` | Via API externe |

> Met automatiquement à jour `opt_in_status = opted_out` sur le contact correspondant.

---

## DELETE /opt-outs

Supprime un opt-out (ré-optin).

**Body**
```json
{ "phoneNumber": "237674937152" }
```

---

# 9. WALLET

## GET /wallet

Retourne le portefeuille du tenant courant.

**Réponse 200**
```json
{
  "data": {
    "id": "uuid",
    "tenant_id": "uuid",
    "balance": "50000.0000",
    "reserved_balance": "0.0000",
    "status": "active",
    "availableBalance": 50000,
    "reservedBalance": 0,
    "last_recharge_at": null
  }
}
```

| Champ | Description |
|-------|-------------|
| `balance` | Solde disponible (hors réservé) |
| `reserved_balance` | Montant bloqué pour campagnes en cours |
| `availableBalance` | Alias numérique de `balance` |

---

## GET /wallet/transactions

Retourne l'historique du ledger wallet.

**Réponse 200**
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "CREDIT",
      "direction": "IN",
      "amount": "10000.0000",
      "balance_before": "40000.0000",
      "balance_after": "50000.0000",
      "description": "Payment confirmed: mobile_money",
      "created_at": "2026-04-17T10:00:00Z"
    }
  ]
}
```

| Type | Direction | Description |
|------|-----------|-------------|
| `CREDIT` | IN | Rechargement confirmé |
| `DEBIT` | OUT | Coût réel d'une campagne |
| `RESERVE` | OUT | Fonds bloqués lors du lancement |
| `RELEASE` | IN | Libération de l'excédent réservé |
| `REFUND` | IN | Remboursement |

---

# 10. PAYMENTS

## POST /payments

Initie une transaction de paiement. **Rôle requis : ADMIN**

**Body**
```json
{
  "amount": 10000,
  "currency": "XAF",
  "paymentMethod": "mobile_money",
  "description": "Rechargement compte SMS",
  "externalReference": "REF-OM-12345"
}
```

**Réponse 201**
```json
{
  "data": {
    "id": "uuid",
    "amount": "10000.0000",
    "status": "pending",
    "payment_method": "mobile_money"
  }
}
```

---

## POST /payments/:id/confirm

Confirme un paiement et crédite le wallet. **Rôle requis : ADMIN**

> Cette action est **atomique** : confirmation du paiement + crédit wallet dans la même transaction DB.

**Réponse 200**
```json
{
  "success": true,
  "message": "Payment confirmed and wallet credited"
}
```

---

## POST /payments/:id/cancel

Annule un paiement en attente. **Rôle requis : ADMIN**

---

# 11. PROVIDERS

## GET /providers

Liste les providers SMS configurés.

**Réponse 200**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "OBITSMS",
      "api_base_url": "https://obitsms.com/api/bulksms",
      "auth_type": "query_param",
      "status": "active",
      "priority": 1
    }
  ]
}
```

---

## GET /providers/pricing

Retourne la grille tarifaire des providers.

**Réponse 200**
```json
{
  "data": [
    {
      "id": "uuid",
      "provider_name": "OBITSMS",
      "country_code": "237",
      "currency": "XAF",
      "price_per_sms": "25.000000",
      "price_per_part": "25.000000",
      "effective_from": "2026-04-17T00:00:00Z"
    }
  ]
}
```

---

# 12. CAMPAIGNS

## GET /campaigns

Liste les campagnes du tenant.

**Query params**
| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filtrer par statut |

**Statuts possibles**

| Statut | Description |
|--------|-------------|
| `DRAFT` | Brouillon |
| `SCHEDULED` | Planifiée |
| `PROCESSING` | En cours d'envoi |
| `COMPLETED` | Terminée |
| `FAILED` | Échouée |
| `CANCELLED` | Annulée |

---

## POST /campaigns

Crée une campagne (statut initial : DRAFT).

**Body**
```json
{
  "name": "Promo Ramadan",
  "messageBody": "Bonjour ! Profitez de -20% sur tout notre catalogue ce Ramadan. Code: RAMADAN20",
  "type": "MARKETING",
  "senderIdId": "uuid-du-sender-id",
  "contactListId": "uuid-de-la-liste",
  "templateId": null
}
```

| Champ | Requis | Description |
|-------|--------|-------------|
| `name` | Oui | Nom interne de la campagne |
| `messageBody` | Oui | Corps du SMS |
| `senderIdId` | Oui | UUID d'un Sender ID du tenant |
| `contactListId` | Non | UUID d'une liste de contacts |
| `type` | Non | `MARKETING` ou `TRANSACTIONAL` |

**Réponse 201** : objet campagne créé

---

## GET /campaigns/:id

Retourne le détail d'une campagne.

---

## PATCH /campaigns/:id

Modifie une campagne. **Uniquement en statut DRAFT.**

**Body** (tous optionnels)
```json
{
  "name": "Nouveau nom",
  "messageBody": "Nouveau message",
  "senderIdId": "autre-uuid"
}
```

---

## POST /campaigns/:id/schedule

Planifie l'envoi d'une campagne.

**Body**
```json
{
  "scheduledAt": "2026-04-20T08:00:00Z"
}
```

> La date doit être dans le futur.

---

## POST /campaigns/:id/launch

**Lance l'envoi immédiat de la campagne.**

> Aucun body requis.

**Flow complet (atomique)** :
1. Validation sender + liste de contacts (ownership tenant)
2. Filtrage opt-outs
3. Calcul coût estimé
4. Réservation wallet
5. Gel des destinataires (`campaign_recipients`)
6. Envoi via ObitSMS pour chaque destinataire
7. Enregistrement des `message_events`
8. Débit coût réel + libération excédent
9. Mise à jour des compteurs

**Réponse 200**
```json
{
  "success": true,
  "message": "Campaign launched successfully",
  "data": {
    "id": "uuid",
    "status": "COMPLETED",
    "target_count": 150,
    "sent_count": 148,
    "failed_count": 2,
    "estimated_cost": "3750.0000",
    "actual_cost": "3700.0000",
    "launched_at": "2026-04-17T10:00:00Z",
    "completed_at": "2026-04-17T10:01:23Z"
  }
}
```

**Erreurs spécifiques**

| Code | Message |
|------|---------|
| 400 | Only DRAFT/SCHEDULED campaigns can be launched |
| 400 | Campaign has no contact list attached |
| 400 | No valid recipients after opt-out filtering |
| 402 | Insufficient wallet balance |
| 403 | Sender ID does not belong to this tenant |
| 503 | No active SMS provider configured |

---

## POST /campaigns/:id/cancel

Annule une campagne (DRAFT ou SCHEDULED uniquement).

---

## GET /campaigns/:id/report

Retourne le rapport de performance d'une campagne.

**Réponse 200**
```json
{
  "data": {
    "id": "uuid",
    "name": "Promo Ramadan",
    "status": "COMPLETED",
    "targetCount": 150,
    "sentCount": 148,
    "deliveredCount": 120,
    "failedCount": 2,
    "estimatedCost": "3750.0000",
    "actualCost": "3700.0000",
    "deliveryRate": "81.08%",
    "launchedAt": "2026-04-17T10:00:00Z",
    "completedAt": "2026-04-17T10:01:23Z"
  }
}
```

---

# 13. MESSAGES

## GET /messages

Liste les messages SMS individuels du tenant.

**Query params**
| Param | Description |
|-------|-------------|
| `campaignId` | Filtrer par campagne |

**Réponse 200**
```json
{
  "data": [
    {
      "id": "uuid",
      "campaign_id": "uuid",
      "destination_number": "+237674937152",
      "sender_value": "MonApp",
      "body": "Bonjour Jean...",
      "parts_count": 1,
      "unit_price": "25.000000",
      "total_price": "25.0000",
      "provider_message_id": "MSG_12345",
      "status": "sent",
      "sent_at": "2026-04-17T10:00:05Z"
    }
  ]
}
```

**Statuts message**

| Statut | Description |
|--------|-------------|
| `queued` | En file d'attente |
| `sent` | Envoyé au provider |
| `delivered` | Confirmé livré |
| `failed` | Échec d'envoi |
| `skipped` | Ignoré (opt-out) |

---

## GET /messages/:id

Retourne le détail d'un message.

---

## GET /messages/:id/events

Retourne l'historique d'événements d'un message.

**Réponse 200**
```json
{
  "data": [
    {
      "id": "uuid",
      "message_id": "uuid",
      "event_type": "sent",
      "event_date": "2026-04-17T10:00:05Z",
      "provider_status": "SENT",
      "raw_payload": { ... },
      "reason_code": null
    },
    {
      "event_type": "delivered",
      "event_date": "2026-04-17T10:00:12Z",
      "provider_status": "DELIVERED"
    }
  ]
}
```

---

# 14. AUDIT LOGS

**Rôle requis : ADMIN**

## GET /audit-logs

Liste le journal d'audit du tenant.

**Query params**
| Param | Description |
|-------|-------------|
| `userId` | Filtrer par utilisateur |
| `entityType` | Filtrer par type d'entité |

**Réponse 200**
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "action": "CAMPAIGN_LAUNCHED",
      "entity_type": "campaign",
      "entity_id": "uuid",
      "metadata": { "campaignName": "Promo Ramadan" },
      "created_at": "2026-04-17T10:00:00Z"
    }
  ]
}
```

---

# 15. API KEYS

**Rôle requis : ADMIN**

## GET /api-keys

Liste les clés API du tenant (sans les secrets).

**Réponse 200**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Intégration ERP",
      "key_prefix": "psk_abc123",
      "status": "active",
      "expires_at": null,
      "last_used_at": "2026-04-17T09:00:00Z",
      "created_at": "2026-04-01T10:00:00Z"
    }
  ]
}
```

---

## POST /api-keys

Génère une nouvelle clé API.

**Body**
```json
{
  "name": "Intégration ERP",
  "expiresAt": "2027-01-01T00:00:00Z"
}
```

**Réponse 201**
```json
{
  "success": true,
  "message": "API key created. Store the fullKey securely — it will not be shown again.",
  "data": {
    "id": "uuid",
    "name": "Intégration ERP",
    "key_prefix": "psk_abc123ef",
    "status": "active",
    "fullKey": "psk_abc123ef_64caractèresaléatoiresuniquement affiché une fois"
  }
}
```

> **IMPORTANT** : `fullKey` est affiché **une seule fois** à la création. Il est impossible de le retrouver ensuite.

---

## DELETE /api-keys/:id

Révoque une clé API.

**Réponse 200**
```json
{ "success": true, "message": "API key revoked" }
```

---

# Exemples de flux complets

## Flux 1 : Envoi d'une campagne SMS

```
1. POST /auth/login                          → obtenir le token
2. POST /sender-ids                          → créer "MonApp" (type ALPHANUMERIC)
3. PATCH /sender-ids/:id/activate            → activer le sender
4. POST /contacts                            → créer des contacts
5. POST /contact-lists                       → créer une liste "Clients"
6. POST /contact-lists/:id/members           → ajouter les contacts
7. POST /payments                            → initier un paiement de 50 000 XAF
8. POST /payments/:id/confirm                → confirmer → wallet crédité
9. POST /campaigns                           → créer la campagne
10. POST /campaigns/:id/launch               → lancer l'envoi
11. GET  /campaigns/:id/report               → consulter les résultats
12. GET  /messages?campaignId=...            → voir les SMS individuels
```

## Flux 2 : Gestion des opt-outs

```
1. GET  /opt-outs/check?phone=237674937152   → vérifier si opté out
2. POST /opt-outs                            → enregistrer un opt-out
3. DELETE /opt-outs                          → lever l'opt-out (re-optin)
```

---

# Health Check

## GET /health

Endpoint de santé du serveur (aucune authentification requise).

**Réponse 200**
```json
{
  "status": "ok",
  "service": "PushSMS",
  "timestamp": "2026-04-17T10:00:00.000Z"
}
```
