interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearSettings: () => void;
}

const PLANNED_FEATURES = [
  'Additional polishing rules (toggle dash normalization and friends)',
  'Live debounced polishing — no button required',
  'Model & temperature selection',
  'Rich text input/output',
];

export default function SettingsModal({ isOpen, onClose, onClearSettings }: SettingsModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="setup-backdrop" role="dialog" aria-modal="true" aria-labelledby="settingsTitle">
      <section className="card setup-modal">
        <div className="settings-header">
          <h2 id="settingsTitle" className="heading">
            Settings
          </h2>
          <button className="settings-close-button" type="button" onClick={onClose} aria-label="Close settings">
            ✕
          </button>
        </div>

        <div className="settings-section">
          <p className="label">Account</p>
          <p className="muted settings-section-desc">
            Removes your API key and provider from this device. You will need to set them up again.
          </p>
          <button className="settings-danger-button" type="button" onClick={onClearSettings}>
            Clear all local settings
          </button>
        </div>

        <div className="settings-section">
          <p className="label">Coming whenever</p>
          <ul className="settings-planned-list">
            {PLANNED_FEATURES.map((feature) => (
              <li key={feature} className="settings-planned-item">
                <span className="settings-planned-badge">coming whenever</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
