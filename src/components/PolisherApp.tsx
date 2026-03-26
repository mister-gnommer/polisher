import { useEffect, useMemo, useRef, useState } from 'react';
import { type PolishApiResponse } from '../lib/polishApi';
import { DEFAULT_POLISHING_LEVEL, getEffectiveLevel, POLISHING_LEVELS } from '../lib/polishingLevels';
import { buildSystemPrompt } from '../lib/polishPrompt';
import ErrorToast from './ErrorToast';
import './PolisherApp.css';
import SetupModal from './SetupModal';

const API_KEY_STORAGE_KEY = 'polisher.apikey';
const PROVIDER_STORAGE_KEY = 'polisher.provider';

export default function PolisherApp() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [level, setLevel] = useState<number | null>(DEFAULT_POLISHING_LEVEL);
  const [outputText, setOutputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(true);
  const [copyLabel, setCopyLabel] = useState<'Copy' | 'Copied!'>('Copy');
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const storedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY)?.trim() ?? '';
    const storedProvider = localStorage.getItem(PROVIDER_STORAGE_KEY)?.trim() ?? '';
    if (storedApiKey && storedProvider) {
      setApiKey(storedApiKey);
      setProvider(storedProvider);
      setIsSetupModalOpen(false);
      return;
    }

    localStorage.removeItem(API_KEY_STORAGE_KEY);
    localStorage.removeItem(PROVIDER_STORAGE_KEY);
    setApiKey(null);
    setProvider(null);
    setIsSetupModalOpen(true);
  }, []);

  // auto dismiss error message after 6 seconds
  useEffect(() => {
    if (!errorMessage) {
      return;
    }
    const timer = window.setTimeout(() => setErrorMessage(null), 6000);
    return () => window.clearTimeout(timer);
  }, [errorMessage]);

  const effectiveLevel = getEffectiveLevel(level);
  const currentLevel = POLISHING_LEVELS[effectiveLevel];
  const isInteractionBlocked = isSetupModalOpen || isLoading;

  const canPolish = useMemo(() => {
    return Boolean(apiKey) && Boolean(provider) && inputText.trim().length > 0 && !isLoading;
  }, [apiKey, provider, inputText, isLoading]);

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    setCopyLabel('Copied!');
    copyTimerRef.current = setTimeout(() => setCopyLabel('Copy'), 2000);
  };

  const handleSaveSetup = (nextApiKey: string, nextProvider: string) => {
    setApiKey(nextApiKey);
    setProvider(nextProvider);
    setIsSetupModalOpen(false);
  };

  const handlePolish = async () => {
    if (!canPolish) {
      return;
    }

    const prompt = buildSystemPrompt(POLISHING_LEVELS[effectiveLevel].description);

    setIsLoading(true);
    setErrorMessage(null);
    setOutputText('');

    try {
      const response = await fetch('/api/polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, provider, inputText, systemPrompt: prompt }),
      });

      const data: PolishApiResponse = await response.json();

      if ('error' in data) {
        throw new Error(data.error);
      }
      if (!response.ok) {
        throw new Error(`Server error ${response.status}`);
      }

      setOutputText(data.result);
    } catch (error) {
      console.error('Provider error:', error);
      setErrorMessage('Something went wrong while contacting the provider. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="polisher-grid">
        <section className="card polisher-panel">
          <div className="polisher-label-row">
            <label className="label" htmlFor="inputText">
              Text to polish
            </label>
            <span className="muted">{inputText.length} chars</span>
          </div>
          <textarea
            id="inputText"
            className="polisher-textarea"
            placeholder="Paste or type text here..."
            value={inputText}
            onChange={(event) => setInputText(event.target.value)}
            disabled={isInteractionBlocked}
          />
        </section>

        <section className="card polisher-panel polisher-controls">
          <div className="polisher-slider-row">
            <div className="polisher-slider-wrap">
              <label className="label" htmlFor="polishLevel">
                Polishing level
              </label>
              <input
                id="polishLevel"
                className="polisher-slider"
                type="range"
                min={1}
                max={5}
                step={1}
                value={effectiveLevel}
                onChange={(event) => setLevel(Number(event.target.value))}
                disabled={isInteractionBlocked}
              />
              <div className="polisher-level-meta">
                <span>{effectiveLevel}</span>
                <span className="muted">{currentLevel.title}</span>
              </div>
            </div>
            <button className="polisher-button" type="button" onClick={handlePolish} disabled={!canPolish}>
              {isLoading ? 'Polishing...' : 'POLISH'}
            </button>
          </div>

          <p className="muted">{currentLevel.description}</p>
        </section>

        <section className="card polisher-panel">
          <div className="polisher-label-row">
            <strong className="label">Polished text</strong>
            {outputText && (
              <button className="polisher-copy-button" type="button" onClick={handleCopy}>
                {copyLabel}
              </button>
            )}
          </div>
          <div className="polisher-output muted">
            {outputText || (isLoading ? 'Polishing...' : 'Your polished text will appear here.')}
          </div>
        </section>
      </div>

      <SetupModal
        isOpen={isSetupModalOpen}
        apiKeyStorageKey={API_KEY_STORAGE_KEY}
        providerStorageKey={PROVIDER_STORAGE_KEY}
        onSave={handleSaveSetup}
      />
      <ErrorToast message={errorMessage} onDismiss={() => setErrorMessage(null)} />
    </>
  );
}
