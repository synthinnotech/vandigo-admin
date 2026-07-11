import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import clsx from 'clsx';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useChat } from '../../context/ChatContext';
import { summarizeRecord } from '../../services/geminiService';

const LENGTHS = [
  { value: 'short', label: 'Short' },
  { value: 'mid', label: 'Mid' },
  { value: 'detailed', label: 'Detailed' },
];

/**
 * Reusable "Summarize" action for any admin detail view. Pass the record's
 * plain-text field dump as `recordText` (label/value pairs, one per line).
 */
export default function SummarizeButton({ recordText, label = 'Summarize', className }) {
  const { modelId } = useChat();
  const [isOpen, setIsOpen] = useState(false);
  const [length, setLength] = useState('mid');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runSummary = async (selectedLength) => {
    setLoading(true);
    setError('');
    try {
      const text = await summarizeRecord({ modelId, recordText, length: selectedLength });
      setSummary(text);
    } catch (err) {
      setError(err.message || 'Could not generate a summary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const open = () => {
    setIsOpen(true);
    setSummary('');
    setError('');
    runSummary(length);
  };

  const changeLength = (value) => {
    setLength(value);
    runSummary(value);
  };

  return (
    <>
      <Button variant="secondary" size="sm" icon={Sparkles} className={className} onClick={open}>
        {label}
      </Button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="AI Summary" size="sm">
        <div className="space-y-4">
          <div className="flex gap-2">
            {LENGTHS.map((l) => (
              <button
                key={l.value}
                onClick={() => changeLength(l.value)}
                className={clsx(
                  'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  length === l.value
                    ? 'bg-amber-500 text-gray-900'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
          <div className="min-h-[80px] text-sm leading-relaxed text-gray-700 dark:text-gray-200">
            {loading ? (
              <p className="text-gray-400 dark:text-gray-500">Generating summary…</p>
            ) : error ? (
              <p className="text-red-600 dark:text-red-400">{error}</p>
            ) : (
              <p>{summary}</p>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
