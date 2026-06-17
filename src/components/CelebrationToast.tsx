// 🤖 AI-generated
import confetti from 'canvas-confetti';
import { useEffect, useRef } from 'react';

interface CelebrationToastProps {
  message: string | null;
  diffRatio: number;
  onDismiss: () => void;
}

export default function CelebrationToast({ message, diffRatio, onDismiss }: CelebrationToastProps) {
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!message) {
      return;
    }

    const opts = { particleCount: 60, spread: 70, origin: { y: 0.6 } };
    confetti({ ...opts, origin: { x: 0.3, y: 0.6 } });
    const t1 = setTimeout(() => confetti({ ...opts, origin: { x: 0.7, y: 0.55 } }), 200);
    const t2 = setTimeout(() => confetti({ particleCount: 80, spread: 90, origin: { x: 0.5, y: 0.5 } }), 400);

    dismissTimerRef.current = setTimeout(() => onDismissRef.current(), 4000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, [message]);

  if (!message) {
    return null;
  }

  return (
    <div className="toast toast--info" role="status">
      <span>{message}</span>
      <button type="button" onClick={onDismiss} aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}
