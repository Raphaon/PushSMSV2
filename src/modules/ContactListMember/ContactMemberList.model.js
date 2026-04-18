

class ContactListMember {
  +id: UUID
  +tenantId: UUID
  +contactListId: UUID
  +contactId: UUID
  +addedAt: DateTime
  --
  +attach()
  +detach()
  +exists(): Boolean
}