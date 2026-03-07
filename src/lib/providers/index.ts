import { abacusProvider } from "./abacus";
import type { PolisherProvider } from "./types";

const providersById: Record<string, PolisherProvider> = {
  [abacusProvider.id]: abacusProvider,
};

export const getProviderById = (id: string): PolisherProvider => {
  return providersById[id];
};

export const isValidProviderId = (id: string): boolean => id in providersById;

export const AVAILABLE_PROVIDERS = Object.values(providersById);
