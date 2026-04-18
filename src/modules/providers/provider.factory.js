import { ObitSMSProvider } from './obitsms.provider.js';

const registry = new Map();

const register = (name, instance) => registry.set(name.toUpperCase(), instance);

register('OBITSMS', new ObitSMSProvider());

export const getProvider = (name) => {
  const provider = registry.get(name.toUpperCase());
  if (!provider) throw new Error(`Unknown SMS provider: ${name}`);
  return provider;
};

export const getDefaultProvider = () => {
  const [first] = registry.values();
  return first;
};
