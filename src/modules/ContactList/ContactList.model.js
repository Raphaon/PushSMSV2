class ContactList {
  +id: UUID
  +tenantId: UUID
  +name: String
  +description: String
  +createdAt: DateTime
  +updatedAt: DateTime
  --
  +create()
  +rename()
  +addContact(contact: Contact)
  +removeContact(contact: Contact)
  +countMembers(): Integer
  +clear()
  +archive()
  +exportCsv()
}