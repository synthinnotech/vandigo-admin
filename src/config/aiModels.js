export const AVAILABLE_MODELS = [
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Flash Lite',
    description: 'Optimized for speed and efficiency; best for simple tasks and high-volume requests',
  },
  {
    id: 'gemini-3-flash-preview',
    name: 'Flash',
    description: 'Fast, versatile multimodal model for scaling across a diverse range of tasks',
  },
];

export const DEFAULT_MODEL_ID = 'gemini-3-flash-preview';

export const MODEL_STORAGE_KEY = 'vandigo_ai_model';
export const VOICE_OUTPUT_STORAGE_KEY = 'vandigo_ai_voice_enabled';
