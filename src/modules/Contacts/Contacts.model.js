class Contact {
  +id: UUID
  +tenantId: UUID
  +firstName: String
  +lastName: String
  +phoneNumber: String
  +email: String
  +country: String
  +city: String
  +optInStatus: Boolean
  +status: String
  +createdAt: DateTime
  +updatedAt: DateTime
  --
  +create()
  +update()
  +normalizePhoneNumber()
  +validatePhoneNumber(): Boolean
  +optIn()
  +optOut()
  +deactivate()
  +archive()
}