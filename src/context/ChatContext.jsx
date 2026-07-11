import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateContent } from '../services/geminiService';
import { systemPrompt, tools, dispatchAction } from '../services/aiActions';
import { DEFAULT_MODEL_ID, MODEL_STORAGE_KEY, VOICE_OUTPUT_STORAGE_KEY } from '../config/aiModels';
import { useTheme } from './ThemeContext';

const ChatContext = createContext(null);

let nextMessageId = 1;

function speak(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new window.SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(utterance);
}

export function ChatProvider({ children }) {
  const navigate = useNavigate();
  const { toggle: toggleTheme } = useTheme();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [modelId, setModelIdState] = useState(
    () => localStorage.getItem(MODEL_STORAGE_KEY) || DEFAULT_MODEL_ID
  );
  const [voiceEnabled, setVoiceEnabledState] = useState(
    () => localStorage.getItem(VOICE_OUTPUT_STORAGE_KEY) === 'true'
  );

  const historyRef = useRef([]);

  const setModelId = useCallback((id) => {
    setModelIdState(id);
    localStorage.setItem(MODEL_STORAGE_KEY, id);
  }, []);

  const setVoiceEnabled = useCallback((enabled) => {
    setVoiceEnabledState(enabled);
    localStorage.setItem(VOICE_OUTPUT_STORAGE_KEY, String(enabled));
  }, []);

  const pushMessage = useCallback((role, text) => {
    setMessages((prev) => [...prev, { id: nextMessageId++, role, text }]);
    if (role === 'assistant' && voiceEnabled) speak(text);
  }, [voiceEnabled]);

  const sendMessage = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed || isThinking) return;

    pushMessage('user', trimmed);
    historyRef.current = [...historyRef.current, { role: 'user', parts: [{ text: trimmed }] }];
    setIsThinking(true);

    try {
      let result = await generateContent({ modelId, systemPrompt, tools, history: historyRef.current });

      if (result.type === 'functionCall') {
        historyRef.current = [...historyRef.current, result.modelPart];

        const actionResult = dispatchAction(result.name, result.args, { navigate, toggleTheme });

        historyRef.current = [
          ...historyRef.current,
          { role: 'user', parts: [{ functionResponse: { name: result.name, response: actionResult } }] },
        ];

        result = await generateContent({ modelId, systemPrompt, tools, history: historyRef.current });
      }

      if (result.type === 'text') {
        historyRef.current = [...historyRef.current, { role: 'model', parts: [{ text: result.text }] }];
        pushMessage('assistant', result.text);
      } else if (result.type === 'error') {
        pushMessage('assistant', result.message);
      } else {
        pushMessage('assistant', "Done. Let me know if you'd like anything else.");
      }
    } finally {
      setIsThinking(false);
    }
  }, [modelId, isThinking, navigate, toggleTheme, pushMessage]);

  const value = {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggleOpen: () => setIsOpen((o) => !o),
    messages,
    isThinking,
    sendMessage,
    modelId,
    setModelId,
    voiceEnabled,
    setVoiceEnabled,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export const useChat = () => useContext(ChatContext);
