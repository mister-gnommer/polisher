import { diffWords } from 'diff';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_POLISHING_LEVEL, FLOW_DESCRIPTIONS, getEffectiveLevel, POLISHING_LEVELS } from '../lib/polishingLevels';
import { buildSystemPrompt } from '../lib/polishPrompt';
import { getProviderById } from '../lib/providers';
import CelebrationToast from './CelebrationToast';
import ErrorToast from './ErrorToast';
import './PolisherApp.css';
import SettingsModal from './SettingsModal';
import SetupModal, { type SetupSavePayload } from './SetupModal';

const API_KEY_STORAGE_KEY = 'polisher.apikey';
const PROVIDER_STORAGE_KEY = 'polisher.provider';
const MODEL_STORAGE_KEY = 'polisher.model';
const LIVE_POLISH_KEY = 'polisher.livePolish';
const FLOW_IMPROVEMENT_KEY = 'polisher.flowImprovement';
const LIVE_DEBOUNCE_MS = 800;

function computeDiffRatio(input: string, output: string): number {
  const parts = diffWords(input, output);
  let changedWords = 0;
  let totalWords = 0;

  for (const part of parts) {
    const words = part.value.trim().split(/\s+/).filter(Boolean);
    totalWords += words.length;
    if (part.added || part.removed) {
      changedWords += words.length;
    }
  }

  return totalWords > 0 ? changedWords / totalWords : 0;
}

export default function PolisherApp() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [level, setLevel] = useState<number | null>(DEFAULT_POLISHING_LEVEL);
  const [outputText, setOutputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(true);
  const [setupMode, setSetupMode] = useState<'initial' | 'change'>('initial');
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
  const [isFlowEnabled, setIsFlowEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem(FLOW_IMPROVEMENT_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationDiffRatio, setCelebrationDiffRatio] = useState(0);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const performPolishRef = useRef<(clearOutput: boolean) => Promise<void>>(async () => {});
  const abortControllerRef = useRef<AbortController | null>(null);
  const isLiveEnabledRef = useRef(isLiveEnabled);
  isLiveEnabledRef.current = isLiveEnabled;

  useEffect(() => {
    const storedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY)?.trim() ?? '';
    const storedProvider = localStorage.getItem(PROVIDER_STORAGE_KEY)?.trim() ?? '';
    const storedModel = localStorage.getItem(MODEL_STORAGE_KEY)?.trim() ?? '';
    const providerDef = storedProvider ? getProviderById(storedProvider) : undefined;
    if (storedApiKey && providerDef && (providerDef.modelSource === 'fixed' || storedModel)) {
      setApiKey(storedApiKey);
      setProvider(storedProvider);
      setModel(providerDef.modelSource === 'user' ? storedModel : null);
      setIsSetupModalOpen(false);
      return;
    }

    localStorage.removeItem(API_KEY_STORAGE_KEY);
    localStorage.removeItem(PROVIDER_STORAGE_KEY);
    localStorage.removeItem(MODEL_STORAGE_KEY);
    setApiKey(null);
    setProvider(null);
    setModel(null);
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
    setShowCelebration(false);
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
    localStorage.setItem(FLOW_IMPROVEMENT_KEY, String(isFlowEnabled));
  }, [isFlowEnabled]);

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

  const diffRatioPct = useMemo(() => {
    if (!inputText.trim() || !outputText) {
      return null;
    }
    return (computeDiffRatio(inputText, outputText) * 100).toFixed(1);
  }, [inputText, outputText]);

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    setCopyLabel('Copied!');
    copyTimerRef.current = setTimeout(() => setCopyLabel('Copy'), 2000);
  };

  const handleClearSettings = () => {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    localStorage.removeItem(PROVIDER_STORAGE_KEY);
    localStorage.removeItem(MODEL_STORAGE_KEY);
    localStorage.removeItem(LIVE_POLISH_KEY);
    localStorage.removeItem(FLOW_IMPROVEMENT_KEY);
    setApiKey(null);
    setProvider(null);
    setModel(null);
    setIsLiveEnabled(false);
    setIsFlowEnabled(false);
    setIsSettingsOpen(false);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    setSetupMode('initial');
    setIsSetupModalOpen(true);
  };

  const handleSaveSetup = ({ apiKey: nextApiKey, providerId, model: nextModel }: SetupSavePayload) => {
    const resolvedApiKey = nextApiKey ?? apiKey;
    if (!resolvedApiKey) {
      // SetupModal enforces the key; this guards against persisting a stale null
      return;
    }
    const providerDef = getProviderById(providerId);
    const resolvedModel = providerDef?.modelSource === 'user' ? nextModel : null;

    localStorage.setItem(API_KEY_STORAGE_KEY, resolvedApiKey);
    localStorage.setItem(PROVIDER_STORAGE_KEY, providerId);
    if (resolvedModel) {
      localStorage.setItem(MODEL_STORAGE_KEY, resolvedModel);
    } else {
      localStorage.removeItem(MODEL_STORAGE_KEY);
    }
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsLoading(false);
    setApiKey(resolvedApiKey);
    setProvider(providerId);
    setModel(resolvedModel);
    setIsSetupModalOpen(false);
  };

  const performPolish = async (clearOutput: boolean) => {
    if (!apiKey || !provider || !inputText.trim()) {
      return;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const prompt = buildSystemPrompt(
      POLISHING_LEVELS[effectiveLevel].description,
      isFlowEnabled ? FLOW_DESCRIPTIONS[effectiveLevel] : undefined,
    );

    setIsLoading(true);
    setShowCelebration(false);
    setErrorMessage(null);
    if (clearOutput) {
      setOutputText('');
    }

    try {
      // Easter egg: Cthulhu phrase bypasses LLM, forces celebration
      const CTHULHU_PHRASE = "Ph'nglui mglw'nafh Cthulhu R'lyeh Wgah'nagl fhtan.";
      if (inputText.trim() === CTHULHU_PHRASE) {
        setOutputText(inputText);
        setCelebrationDiffRatio(0);
        setShowCelebration(true);
        return;
      }

      const response = await fetch('/api/polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, provider, model: model ?? undefined, inputText, systemPrompt: prompt }),
        signal: controller.signal,
      });

      let data: unknown = null;
      try {
        data = await response.json();
      } catch (error) {
        console.error('Could not parse response body:', error);
      }

      if (abortControllerRef.current !== controller || controller.signal.aborted) {
        return;
      }

      if (typeof data !== 'object' || data === null) {
        throw new Error('Invalid response body');
      }
      if ('error' in data && typeof data.error === 'string' && data.error.trim()) {
        setErrorMessage(data.error);
        return;
      }
      if (!response.ok || !('result' in data) || typeof data.result !== 'string') {
        throw new Error(`Server error ${response.status}`);
      }

      setOutputText(data.result);

      // Celebration: level ≥ 3, > 20 words, diff < 5%
      const effectiveLevelAtCall = getEffectiveLevel(level);
      const words = inputText.trim().split(/\s+/).filter(Boolean);
      if (effectiveLevelAtCall >= 3 && words.length > 20) {
        const ratio = computeDiffRatio(inputText, data.result);
        if (ratio < 0.10) {
          setCelebrationDiffRatio(ratio);
          setShowCelebration(true);
        }
      }
    } catch (error) {
      if (abortControllerRef.current !== controller || controller.signal.aborted) {
        return;
      }
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

          <div className="toggle-row">
          <label className={`live-toggle ${isInteractionBlocked ? 'live-toggle--disabled' : ''}`}>
            <input
              type="checkbox"
              className="live-toggle-checkbox"
              checked={isFlowEnabled}
              onChange={(event) => setIsFlowEnabled(event.target.checked)}
              disabled={isInteractionBlocked}
            />
            <span className="live-toggle-track">
              <span className="live-toggle-thumb" />
            </span>
            <span className="live-toggle-label">Improve readability flow</span>
          </label>

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
        </div>

          <p className="muted">{currentLevel.description}</p>
        </section>

        <section className="card polisher-panel">
          <div className="polisher-label-row">
            <strong className="label">Polished text</strong>
            {diffRatioPct !== null && <span className="muted"> ({diffRatioPct}% diff)</span>}
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
        onChangeProvider={() => {
          setIsSettingsOpen(false);
          setSetupMode('change');
          setIsSetupModalOpen(true);
        }}
      />
      {isSetupModalOpen && (
        <SetupModal
          mode={setupMode}
          initialProviderId={provider ?? 'abacus'}
          initialModel={model ?? ''}
          currentProviderId={provider ?? ''}
          onSave={handleSaveSetup}
          onCancel={() => setIsSetupModalOpen(false)}
        />
      )}
      <ErrorToast message={errorMessage} onDismiss={() => setErrorMessage(null)} />
      <CelebrationToast
        message={showCelebration ? 'Already great! Very few changes needed.' : null}
        diffRatio={celebrationDiffRatio}
        onDismiss={() => setShowCelebration(false)}
      />
    </>
  );
}
