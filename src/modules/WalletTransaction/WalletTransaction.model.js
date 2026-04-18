class WalletTransaction {
  +id: UUID
  +walletId: UUID
  +tenantId: UUID
  +paymentTransactionId: UUID
  +campaignId: UUID
  +type: String
  +direction: String
  +amount: Decimal
  +balanceBefore: Decimal
  +balanceAfter: Decimal
  +description: String
  +metadataJson: JSON
  +createdAt: DateTime
  --
  +record()
  +reverse()
  +linkPayment()
  +linkCampaign()
  +exportLedger()
}
