class Wallet {
  +id: UUID
  +tenantId: UUID
  +balance: Decimal
  +reservedBalance: Decimal
  +status: String
  +lastRechargeAt: DateTime
  +createdAt: DateTime
  +updatedAt: DateTime
  --
  +credit(amount: Decimal)
  +debit(amount: Decimal)
  +reserve(amount: Decimal)
  +releaseReservation(amount: Decimal)
  +getAvailableBalance(): Decimal
  +hasSufficientFunds(amount: Decimal): Boolean
  +lock()
  +unlock()
}