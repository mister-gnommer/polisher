import type { SubmitEvent } from 'react';
import { useState } from 'react';
import { AVAILABLE_PROVIDERS } from '../lib/providers';
import type { PolisherProvider } from '../lib/providers/types';

function isKnownProvider(providerId: string, providers: PolisherProvider[]): boolean {
  return providers.some((p) => p.id === providerId);
}

interface SetupModalProps {
  isOpen: boolean;
  apiKeyStorageKey: string;
  providerStorageKey: string;
  onSave: (apiKey: string, providerId: string) => void;
}

export default function SetupModal({
  isOpen,
  apiKeyStorageKey,
  providerStorageKey,
  onSave,
}: SetupModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [providerId, setProviderId] = useState("abacus"); // default provider id
  const [error, setError] = useState<string | null>(null);

  const providers = AVAILABLE_PROVIDERS;

  if (!isOpen) {
    return null;
  }

  const handleSave = (event: SubmitEvent) => {
    event.preventDefault();
    const trimmedApiKey = apiKey.trim();
    if (!trimmedApiKey) {
      setError('API key is required.');
      return;
    }
    if (!isKnownProvider(providerId, providers)) {
      setError('Please choose a supported provider.');
      return;
    }

    setError(null);
    localStorage.setItem(apiKeyStorageKey, trimmedApiKey);
    localStorage.setItem(providerStorageKey, providerId);
    onSave(trimmedApiKey, providerId);
  };

  return (
    <div className="setup-backdrop" role="dialog" aria-modal="true" aria-labelledby="setupTitle">
      <section className="card setup-modal">
        <h2 id="setupTitle" className="heading">
          Provider setup
        </h2>
        <p className="subheading">Your API key and provider are stored in local storage on this device only.</p>

        <form className="setup-form" onSubmit={handleSave}>
          <label className="setup-field">
            <span className="label">API key</span>
            <input
              className="setup-input"
              type="password"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              required
            />
          </label>

          <label className="setup-field">
            <span className="label">Provider</span>
            <select className="setup-select" value={providerId} onChange={(event) => setProviderId(event.target.value)}>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
          </label>

          {error && <p className="setup-error">{error}</p>}

          <button className="polisher-button" type="submit">
            Save
          </button>
        </form>
      </section>
    </div>
  );
}
