class ApiKey {
  +id: UUID
  +tenantId: UUID
  +name: String
  +keyPrefix: String
  +secretHash: String
  +status: String
  +expiresAt: DateTime
  +lastUsedAt: DateTime
  +createdAt: DateTime
  --
  +generate()
  +revoke()
  +rotate()
  +validate()
}
