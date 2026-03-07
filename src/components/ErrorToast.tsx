interface ErrorToastProps {
  message: string | null;
  onDismiss: () => void;
}

export default function ErrorToast({ message, onDismiss }: ErrorToastProps) {
  if (!message) {
    return null;
  }

  return (
    <div className="toast" role="status">
      <span>{message}</span>
      <button type="button" onClick={onDismiss} aria-label="Dismiss error">
        x
      </button>
    </div>
  );
}
