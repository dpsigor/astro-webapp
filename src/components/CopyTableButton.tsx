import { useEffect, useRef, useState } from 'react';
import { copyTable } from '../lib/clipboard';
import { Button } from './Button';

const LABEL = 'Copy as Markdown';
const FEEDBACK_MS = 2000;

interface CopyTableButtonProps {
  headers: string[];
  rows: string[][];
  className?: string;
}

/**
 * Button that copies a table to the clipboard. The outcome is shown on the
 * button for a moment, and errors are also logged to the console.
 */
export function CopyTableButton({
  headers,
  rows,
  className,
}: CopyTableButtonProps) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timeout.current), []);

  const showFeedback = (message: string) => {
    clearTimeout(timeout.current);
    setFeedback(message);
    timeout.current = setTimeout(() => setFeedback(null), FEEDBACK_MS);
  };

  const handleClick = async () => {
    try {
      await copyTable(headers, rows);
      showFeedback('Copied!');
    } catch (err) {
      console.error('Failed to copy table to clipboard', err);
      const reason =
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'permission denied'
          : err instanceof Error
            ? err.message
            : String(err);
      showFeedback(`Copy failed: ${reason}`);
    }
  };

  return (
    <Button size="sm" className={className} onClick={handleClick}>
      {feedback ?? LABEL}
    </Button>
  );
}
