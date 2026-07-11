export const aiPolicy = {
  title: 'AI Assistant Usage Policy',
  sections: [
    {
      heading: 'What gets sent to Google',
      body: 'When you use the AI assistant, your typed or spoken messages — and, when you use "Summarize", the text fields of the record you\'re viewing — are sent to Google\'s Gemini API to generate a response. This data leaves the Vandigo Admin app and is subject to Google\'s Gemini API terms and privacy policy.',
    },
    {
      heading: 'Voice input',
      body: "Speech-to-text runs in your browser's built-in speech recognition engine, not through Gemini. Only the resulting text transcript is sent to the AI — raw audio is never uploaded.",
    },
    {
      heading: 'What this app stores',
      body: 'Vandigo Admin does not store your chat history on any server. Conversation messages live only in memory for your current browser session. The only things saved to your browser (localStorage) are your model choice and voice-reply preference.',
    },
    {
      heading: "Don't paste sensitive data",
      body: 'Avoid entering full payment card numbers, passwords, or other sensitive credentials into the chat. Treat it the same way you\'d treat a message to an external support tool.',
    },
  ],
};
