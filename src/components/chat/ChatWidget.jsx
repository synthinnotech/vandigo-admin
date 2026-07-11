import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send, Mic, Bot } from 'lucide-react';
import clsx from 'clsx';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import Input from '../ui/Input';
import Button from '../ui/Button';

function formatMessageText(text) {
  return text.split('\n').map((line, i) => {
    const trimmed = line.trim();
    const isListItem = trimmed.startsWith('- ');
    const content = isListItem ? trimmed.slice(2) : line;
    const parts = content.split(/(\*\*[^*]+\*\*)/g).map((chunk, j) =>
      chunk.startsWith('**') && chunk.endsWith('**')
        ? <strong key={j}>{chunk.slice(2, -2)}</strong>
        : chunk
    );
    return isListItem ? (
      <div key={i} className="flex gap-1.5 pl-1">
        <span>&bull;</span>
        <span>{parts}</span>
      </div>
    ) : (
      <p key={i}>{parts}</p>
    );
  });
}

function Avatar() {
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 shadow-sm">
      <Bot size={14} className="text-gray-900" />
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex items-end gap-2 self-start">
      <Avatar />
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-gray-100 dark:bg-gray-700 px-3.5 py-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

function ChatPanel() {
  const { messages, isThinking, sendMessage, close } = useChat();
  const [draft, setDraft] = useState('');
  const listRef = useRef(null);

  const { supported: micSupported, listening, start, stop } = useSpeechRecognition({
    onResult: (transcript) => setDraft((d) => (d ? `${d} ${transcript}` : transcript)),
  });

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isThinking]);

  const handleSend = () => {
    if (!draft.trim()) return;
    sendMessage(draft);
    setDraft('');
  };

  return (
    <div className="fixed bottom-24 right-6 z-50 flex h-[560px] max-h-[70vh] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500" />

      <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3.5 dark:border-gray-700">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 shadow-sm">
            <Bot size={16} className="text-gray-900" />
          </div>
          <div>
            <h2 className="text-sm font-semibold leading-tight text-gray-900 dark:text-gray-100">AI Assistant</h2>
            <p className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Online
            </p>
          </div>
        </div>
        <button
          onClick={close}
          className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          aria-label="Close chat"
        >
          <X size={18} />
        </button>
      </div>

      <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto bg-gray-50/50 px-4 py-4 dark:bg-gray-900/20">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-900/20">
              <Bot size={22} className="text-amber-500" />
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Ask me anything about the panel, or tell me what you'd like to do — e.g. "open the drivers page" or "switch to dark mode".
            </p>
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={clsx(
              'flex items-end gap-2',
              m.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {m.role === 'assistant' && <Avatar />}
            <div
              className={clsx(
                'max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm [&_p]:m-0',
                m.role === 'user'
                  ? 'rounded-br-sm bg-amber-500 text-gray-900'
                  : 'rounded-bl-sm bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
              )}
            >
              {formatMessageText(m.text)}
            </div>
          </div>
        ))}
        {isThinking && <ThinkingIndicator />}
      </div>

      <div className="flex shrink-0 items-center gap-2 border-t border-gray-200 bg-white px-3 py-3 dark:border-gray-700 dark:bg-gray-800">
        <Input
          className="!rounded-full !border-gray-200 !bg-gray-50 !py-2.5 dark:!border-gray-600 dark:!bg-gray-900"
          accent="amber"
          placeholder={listening ? 'Listening…' : 'Type a message…'}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
          rightElement={
            micSupported ? (
              <button
                type="button"
                onClick={() => (listening ? stop() : start())}
                className={clsx(
                  'rounded-full p-1 transition-colors',
                  listening ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                )}
                aria-label={listening ? 'Stop listening' : 'Start voice input'}
              >
                <Mic size={16} />
              </button>
            ) : null
          }
        />
        <Button
          variant="amber"
          size="sm"
          icon={Send}
          onClick={handleSend}
          disabled={!draft.trim()}
          aria-label="Send"
          className="!h-10 !w-10 shrink-0 !rounded-full !p-0 [&>svg]:!m-0"
        />
      </div>
    </div>
  );
}

export default function ChatWidget() {
  const { token } = useAuth();
  const { isOpen, toggleOpen } = useChat();

  if (!token) return null;

  return (
    <>
      {isOpen && <ChatPanel />}
      <button
        onClick={toggleOpen}
        aria-label={isOpen ? 'Close AI assistant' : 'Open AI assistant'}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-gray-900 shadow-xl shadow-amber-500/30 transition-all hover:-translate-y-0.5 hover:shadow-amber-500/50 active:translate-y-0"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </>
  );
}
