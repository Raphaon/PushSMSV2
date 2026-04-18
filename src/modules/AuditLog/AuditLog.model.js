class AuditLog {
  +id: UUID
  +tenantId: UUID
  +userId: UUID
  +action: String
  +entityType: String
  +entityId: UUID
  +metadataJson: JSON
  +createdAt: DateTime
  --
  +record()
  +findByEntity()
  +findByUser()
  +export()
}