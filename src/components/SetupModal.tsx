import type { SubmitEvent } from 'react';
import { useState } from 'react';
import { AVAILABLE_PROVIDERS } from '../lib/providers';

export interface SetupSavePayload {
  apiKey: string | null;
  providerId: string;
  model: string;
}

interface SetupModalProps {
  mode: 'initial' | 'change';
  initialProviderId: string;
  initialModel: string;
  currentProviderId: string;
  onSave: (payload: SetupSavePayload) => void;
  onCancel: () => void;
}

const MODEL_PATTERN = /^[^\s/]+\/\S+$/;

export default function SetupModal({
  mode,
  initialProviderId,
  initialModel,
  currentProviderId,
  onSave,
  onCancel,
}: SetupModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [providerId, setProviderId] = useState(initialProviderId);
  const [model, setModel] = useState(initialModel);
  const [error, setError] = useState<string | null>(null);

  const providers = AVAILABLE_PROVIDERS;
  const usesUserModel =
    providers.find((provider) => provider.id === providerId)?.modelSource === 'user';
  const canKeepKey = mode === 'change' && providerId === currentProviderId;

  const handleSave = (event: SubmitEvent) => {
    event.preventDefault();
    const trimmedApiKey = apiKey.trim();
    const trimmedModel = model.trim();

    if (!trimmedApiKey && !canKeepKey) {
      setError('API key is required.');
      return;
    }
    if (usesUserModel) {
      if (!trimmedModel) {
        setError('Model is required.');
        return;
      }
      if (!MODEL_PATTERN.test(trimmedModel)) {
        setError('Model must look like vendor/model (e.g. openai/gpt-5.2).');
        return;
      }
    }

    setError(null);
    onSave({
      apiKey: trimmedApiKey || null,
      providerId,
      model: trimmedModel,
    });
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
              required={!canKeepKey}
            />
            {canKeepKey && <span className="muted setup-hint">Leave blank to keep current key</span>}
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

          {usesUserModel && (
            <label className="setup-field">
              <span className="label">Model</span>
              <input
                className="setup-input"
                type="text"
                placeholder="e.g. openai/gpt-5.2"
                value={model}
                onChange={(event) => setModel(event.target.value)}
                required
              />
            </label>
          )}

          {error && <p className="setup-error">{error}</p>}

          <div className="setup-actions">
            {mode === 'change' && (
              <button className="setup-cancel-button" type="button" onClick={onCancel}>
                Cancel
              </button>
            )}
            <button className="polisher-button" type="submit">
              Save
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
