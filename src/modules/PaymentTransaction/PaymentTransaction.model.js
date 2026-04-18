class PaymentTransaction {
  +id: UUID
  +tenantId: UUID
  +amount: Decimal
  +currency: String
  +paymentMethod: String
  +externalReference: String
  +status: String
  +description: String
  +createdAt: DateTime
  +confirmedAt: DateTime
  --
  +initiate()
  +confirm()
  +cancel()
  +fail()
  +refund()
  +syncProviderStatus()
}