/**
 * SMS Provider Interface contract.
 * All providers must implement the send() method and return a normalized response.
 */
export class SMSProviderInterface {
  get name() { throw new Error('Provider must define a name'); }

  /**
   * @param {object} params
   * @param {string} params.destination  - E.164 or local phone number
   * @param {string} params.sender       - Sender ID or number
   * @param {string} params.message      - SMS body
   * @returns {Promise<ProviderResponse>}
   */
  async send({ destination, sender, message }) {
    throw new Error('send() must be implemented');
  }
}

/**
 * @typedef {object} ProviderResponse
 * @property {boolean} success
 * @property {string} provider
 * @property {string|null} providerMessageId
 * @property {string} status - 'SENT' | 'FAILED'
 * @property {string|null} failureReason
 * @property {any} rawResponse
 */
