import * as providerRepo from './provider.repository.js';
import { getProvider, getDefaultProvider } from './provider.factory.js';
import { calculateParts } from '../../shared/utils/sms.js';

export const listProviders = async () => providerRepo.findAll();

export const getPricing = async () => providerRepo.getPricing();

export const getUnitPrice = async (providerId, countryCode) => {
  const pricing = await providerRepo.getCurrentPricing(providerId, countryCode);
  return pricing ? parseFloat(pricing.price_per_part || pricing.price_per_sms) : 0;
};

export const estimateCost = async (messageBody, phoneNumbers, providerName) => {
  const provider = providerName
    ? await providerRepo.findByName(providerName)
    : await providerRepo.findActiveDefault();

  if (!provider) return { estimatedCost: 0, parts: 0, recipients: phoneNumbers.length };

  const parts = calculateParts(messageBody);
  // Extract country code (digits before local number, simplified approach)
  const countryCode = '237'; // TODO: derive from phone_number in production
  const pricing = await providerRepo.getCurrentPricing(provider.id, countryCode);
  const unitPrice = pricing ? parseFloat(pricing.price_per_part || pricing.price_per_sms) : 0;
  const estimatedCost = unitPrice * parts * phoneNumbers.length;

  return { estimatedCost, parts, unitPrice, recipients: phoneNumbers.length, provider: provider.name };
};

export const sendSMS = async (providerName, { destination, sender, message }) => {
  const provider = getProvider(providerName);
  return provider.send({ destination, sender, message });
};
