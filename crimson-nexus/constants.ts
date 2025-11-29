
export const APP_NAME = "Crimson Nexus";
export const APP_VERSION = "v1.1.0-Nexus";

// API Keys from Environment or Fallback
// Prioritize process.env.API_KEY as per system instructions for the main AI key
export const GEMINI_API_KEY = process.env.API_KEY || process.env.GEMINI_API_KEY || 'AIzaSyBmAHmfLN-gtdt4BP2Zf3FJoIZTO03CgR4'; 
export const BREVO_API_KEY = process.env.BREVO_API_KEY || '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';

// Developer Credentials
export const DEVELOPER_EMAIL = "crimsonnexus119@gmail.com";
export const DEVELOPER_ID = "crimsonnexus119";

// Brevo Config
export const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || "crimsonnexus119@gmail.com";
export const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || "Crimson Nexus";

export const MOCK_HASH_PREFIX = "0xCNX";
