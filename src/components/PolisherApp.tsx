import { diffWords } from 'diff';
import { useEffect, useMemo, useRef, useState } from 'react';
import { type PolishApiResponse } from '../lib/polishApi';
import { DEFAULT_POLISHING_LEVEL, getEffectiveLevel, POLISHING_LEVELS } from '../lib/polishingLevels';
import { buildSystemPrompt } from '../lib/polishPrompt';
import ErrorToast from './ErrorToast';
import './PolisherApp.css';
import SettingsModal from './SettingsModal';
import SetupModal from './SetupModal';

const API_KEY_STORAGE_KEY = 'polisher.apikey';
const PROVIDER_STORAGE_KEY = 'polisher.provider';
const LIVE_POLISH_KEY = 'polisher.livePolish';
const LIVE_DEBOUNCE_MS = 800;

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
  const [showDiff, setShowDiff] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLiveEnabled, setIsLiveEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LIVE_POLISH_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const performPolishRef = useRef<(clearOutput: boolean) => Promise<void>>(async () => {});
  const abortControllerRef = useRef<AbortController | null>(null);
  const isLiveEnabledRef = useRef(isLiveEnabled);
  isLiveEnabledRef.current = isLiveEnabled;

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

  useEffect(() => {
    if (!isLiveEnabledRef.current) {
      setOutputText('');
      setShowDiff(false);
    }
  }, [inputText]);

  useEffect(() => {
    if (!isLiveEnabledRef.current || !inputText.trim()) {
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      performPolishRef.current(false);
    }, LIVE_DEBOUNCE_MS);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [inputText]);

  useEffect(() => {
    if (!isLiveEnabled && debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, [isLiveEnabled]);

  useEffect(() => {
    localStorage.setItem(LIVE_POLISH_KEY, String(isLiveEnabled));
  }, [isLiveEnabled]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const effectiveLevel = getEffectiveLevel(level);
  const currentLevel = POLISHING_LEVELS[effectiveLevel];
  const isInteractionBlocked = isSetupModalOpen || (isLoading && !isLiveEnabled);

  const canPolish = useMemo(() => {
    return Boolean(apiKey) && Boolean(provider) && inputText.trim().length > 0 && !isLoading;
  }, [apiKey, provider, inputText, isLoading]);

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    setCopyLabel('Copied!');
    copyTimerRef.current = setTimeout(() => setCopyLabel('Copy'), 2000);
  };

  const handleClearSettings = () => {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    localStorage.removeItem(PROVIDER_STORAGE_KEY);
    localStorage.removeItem(LIVE_POLISH_KEY);
    setApiKey(null);
    setProvider(null);
    setIsLiveEnabled(false);
    setIsSettingsOpen(false);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    setIsSetupModalOpen(true);
  };

  const handleSaveSetup = (nextApiKey: string, nextProvider: string) => {
    setApiKey(nextApiKey);
    setProvider(nextProvider);
    setIsSetupModalOpen(false);
  };

  const performPolish = async (clearOutput: boolean) => {
    if (!apiKey || !provider || !inputText.trim()) {
      return;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const prompt = buildSystemPrompt(POLISHING_LEVELS[effectiveLevel].description);

    setIsLoading(true);
    setErrorMessage(null);
    if (clearOutput) {
      setOutputText('');
    }

    try {
      const response = await fetch('/api/polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, provider, inputText, systemPrompt: prompt }),
        signal: controller.signal,
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
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      console.error('Provider error:', error);
      setErrorMessage('Something went wrong while contacting the provider. Please try again.');
    } finally {
      if (abortControllerRef.current === controller) {
        setIsLoading(false);
      }
    }
  };

  performPolishRef.current = performPolish;

  const handlePolish = async () => {
    if (!canPolish) {
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    await performPolish(true);
  };

  return (
    <>
      <button
        className="settings-trigger"
        type="button"
        onClick={() => setIsSettingsOpen(true)}
        aria-label="Open settings"
      >
        <svg className="settings-trigger-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" clipRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 0 1-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 0 1 .947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 0 1 2.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 0 1 2.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 0 1 .947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 0 1-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 0 1-2.287-.947ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
        </svg> Settings
      </button>
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

          <label className={`live-toggle ${isInteractionBlocked ? 'live-toggle--disabled' : ''}`}>
            <input
              type="checkbox"
              className="live-toggle-checkbox"
              checked={isLiveEnabled}
              onChange={(event) => setIsLiveEnabled(event.target.checked)}
              disabled={isInteractionBlocked}
            />
            <span className="live-toggle-track">
              <span className="live-toggle-thumb" />
            </span>
            <span className="live-toggle-label">Live polish</span>
          </label>

          <p className="muted">{currentLevel.description}</p>
        </section>

        <section className="card polisher-panel">
          <div className="polisher-label-row">
            <strong className="label">Polished text</strong>
            {outputText && (
              <div className="polisher-output-actions">
                <button
                  className="polisher-copy-button"
                  type="button"
                  onClick={() => setShowDiff((v) => !v)}
                >
                  {showDiff ? 'Output' : 'Diff'}
                </button>
                <button className="polisher-copy-button" type="button" onClick={handleCopy}>
                  {copyLabel}
                </button>
              </div>
            )}
          </div>
          <div className="polisher-output muted">
            {!outputText ? (
              isLoading ? 'Polishing...' : 'Your polished text will appear here.'
            ) : showDiff ? (
              diffWords(inputText, outputText).map((part, i) => (
                <span
                  key={i}
                  className={
                    part.added
                      ? 'diff-added'
                      : part.removed
                        ? 'diff-removed'
                        : undefined
                  }
                >
                  {part.value}
                </span>
              ))
            ) : (
              outputText
            )}
          </div>
        </section>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onClearSettings={handleClearSettings}
      />
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
