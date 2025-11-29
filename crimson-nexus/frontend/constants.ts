
export const APP_NAME = "Crimson Nexus";
export const APP_VERSION = "v1.1.0-Nexus";

// Helper to safely get env vars in both Vite (import.meta.env) and Node (process.env) contexts
const getEnv = (key: string) => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
    return (import.meta as any).env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return '';
};

// API Keys from Environment or Fallback
export const GEMINI_API_KEY = getEnv('VITE_GEMINI_API_KEY') || getEnv('GEMINI_API_KEY') || getEnv('API_KEY') || 'AIzaSyBmAHmfLN-gtdt4BP2Zf3FJoIZTO03CgR4'; 
export const BREVO_API_KEY = getEnv('VITE_BREVO_API_KEY') || getEnv('BREVO_API_KEY') || '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';

// SMTP Credentials for Backend/Node use
export const SMTP_HOST = "smtp-relay.brevo.com";
export const SMTP_PORT = 587;
export const SMTP_LOGIN = "9b2acc001@smtp-brevo.com";
export const SMTP_KEY = "xsmtpsib-e093fa1ff7f85c35f73709b9e04a99d072992a27c3ca904d8551217df10669dc-eobrwOXjGxBVpCSZ";

// Developer Credentials
export const DEVELOPER_EMAIL = "crimsonnexus119@gmail.com";
export const DEVELOPER_ID = "crimsonnexus119";

// Email Config
export const BREVO_SENDER_EMAIL = getEnv('VITE_BREVO_SENDER_EMAIL') || getEnv('BREVO_SENDER_EMAIL') || "crimsonnexus119@gmail.com";
export const BREVO_SENDER_NAME = getEnv('VITE_BREVO_SENDER_NAME') || getEnv('BREVO_SENDER_NAME') || "Crimson Nexus";

export const MOCK_HASH_PREFIX = "0xCNX";
