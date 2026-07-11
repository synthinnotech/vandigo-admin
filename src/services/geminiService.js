const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

function endpointFor(modelId) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${API_KEY}`;
}

/**
 * Calls Gemini's generateContent with the given history (array of
 * { role: 'user'|'model', parts: [...] }), system prompt, and tool
 * declarations. Returns a typed result so callers never have to guess
 * what came back:
 *   { type: 'text', text }
 *   { type: 'functionCall', name, args, modelPart }
 *   { type: 'error', message, retryable }
 */
export async function generateContent({ modelId, systemPrompt, tools, history }) {
  if (!API_KEY) {
    return {
      type: 'error',
      retryable: false,
      message: 'AI assistant is not configured (missing REACT_APP_GEMINI_API_KEY).',
    };
  }

  let response;
  try {
    response = await fetch(endpointFor(modelId), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        tools: tools?.length ? [{ function_declarations: tools }] : undefined,
        contents: history,
      }),
    });
  } catch {
    return { type: 'error', retryable: true, message: 'Network error reaching the AI service. Please check your connection and try again.' };
  }

  if (response.status === 429) {
    return { type: 'error', retryable: true, message: "I'm getting a lot of requests right now — please try again in a moment." };
  }
  if (!response.ok) {
    return { type: 'error', retryable: response.status >= 500, message: `AI service error (${response.status}). Please try again.` };
  }

  let data;
  try {
    data = await response.json();
  } catch {
    return { type: 'error', retryable: true, message: 'Received an unreadable response from the AI service.' };
  }

  const candidate = data?.candidates?.[0];
  const parts = candidate?.content?.parts ?? [];
  const functionCallPart = parts.find((p) => p.functionCall);

  if (functionCallPart) {
    return {
      type: 'functionCall',
      name: functionCallPart.functionCall.name,
      args: functionCallPart.functionCall.args ?? {},
      modelPart: candidate.content,
    };
  }

  const text = parts.map((p) => p.text).filter(Boolean).join('\n').trim();
  if (!text) {
    return { type: 'error', retryable: true, message: "I couldn't come up with a response for that. Could you rephrase?" };
  }
  return { type: 'text', text };
}

/**
 * One-shot prose summary of arbitrary plain-text record data. No history,
 * no tools — just text in, text out.
 */
export async function summarizeRecord({ modelId, recordText, length = 'mid' }) {
  const lengthGuidance = {
    short: 'in 1-2 sentences',
    mid: 'in a short paragraph (3-5 sentences)',
    detailed: 'in a detailed paragraph covering all notable fields',
  }[length] || 'in a short paragraph';

  const prompt = `Summarize the following record ${lengthGuidance}. Respond with prose only — no headers, no bullet points, no markdown.\n\nRecord data:\n${recordText}`;

  const result = await generateContent({
    modelId,
    systemPrompt: 'You write concise, plain-prose summaries of admin panel records for a ride-hailing platform. Never use headers or bullet lists.',
    tools: [],
    history: [{ role: 'user', parts: [{ text: prompt }] }],
  });

  if (result.type === 'text') return result.text;
  if (result.type === 'error') throw new Error(result.message);
  throw new Error('Unexpected response while summarizing.');
}
