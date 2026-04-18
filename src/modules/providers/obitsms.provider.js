import axios from 'axios';
import { SMSProviderInterface } from './provider.interface.js';

const TIMEOUT_MS = 15000;

export class ObitSMSProvider extends SMSProviderInterface {
  get name() { return 'OBITSMS'; }

  async send({ destination, sender, message }) {
    const username = process.env.OBITSMS_USERNAME;
    const password = process.env.OBITSMS_PASSWORD;

    if (!username || !password) {
      return {
        success: false,
        provider: this.name,
        providerMessageId: null,
        status: 'FAILED',
        failureReason: 'ObitSMS credentials not configured',
        rawResponse: null,
      };
    }

    try {
      const dest = destination.replace(/^\+/, '');
      const response = await axios.get(process.env.OBITSMS_BASE_URL || 'https://obitsms.com/api/bulksms', {
        params: { username, password, sender, destination: dest, message },
        timeout: TIMEOUT_MS,
      });

      const raw = response.data;
      const normalized = this._normalizeResponse(raw);

      return {
        success: normalized.success,
        provider: this.name,
        providerMessageId: normalized.messageId,
        status: normalized.success ? 'SENT' : 'FAILED',
        failureReason: normalized.success ? null : normalized.error,
        rawResponse: raw,
      };
    } catch (err) {
      return this._handleError(err);
    }
  }

  _normalizeResponse(raw) {
    if (!raw) return { success: false, error: 'Empty response from provider' };

    const body = typeof raw === 'string' ? raw.toLowerCase() : String(raw).toLowerCase();

    // ObitSMS returns plain text responses
    if (body.includes('error') || body.includes('fail') || body.includes('invalid')) {
      return { success: false, messageId: null, error: String(raw) };
    }

    // Try to extract message ID if provider sends one
    const messageId = typeof raw === 'object' ? (raw.messageid || raw.msgid || raw.id || null) : null;

    return { success: true, messageId: messageId ? String(messageId) : null };
  }

  _handleError(err) {
    let failureReason = 'Unknown error';

    if (axios.isAxiosError(err)) {
      if (err.code === 'ECONNABORTED') failureReason = 'Request timeout';
      else if (err.response) failureReason = `HTTP ${err.response.status}`;
      else failureReason = 'Network error';
    }

    return {
      success: false,
      provider: this.name,
      providerMessageId: null,
      status: 'FAILED',
      failureReason,
      rawResponse: err.response?.data || null,
    };
  }
}
