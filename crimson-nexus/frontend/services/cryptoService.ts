
// AES-GCM Encryption Service using Web Crypto API
// Used to encrypt sensitive local storage data

const ENCRYPTION_KEY_ID = 'crimson_nexus_master_key';

// Helper to generate or retrieve a master key for the device
const getMasterKey = async (): Promise<CryptoKey> => {
  // In a real app, this would be derived from user password + salt. 
  // For this PWA simulation, we generate a persistent key for the browser session context.
  let keyJson = localStorage.getItem(ENCRYPTION_KEY_ID);
  
  if (keyJson) {
    const keyData = JSON.parse(keyJson);
    return window.crypto.subtle.importKey(
      "jwk",
      keyData,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
  }

  const key = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  const exported = await window.crypto.subtle.exportKey("jwk", key);
  localStorage.setItem(ENCRYPTION_KEY_ID, JSON.stringify(exported));
  return key;
};

export const encryptData = async (data: any): Promise<string> => {
  try {
    const key = await getMasterKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(JSON.stringify(data));

    const encryptedContent = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      encodedData
    );

    const encryptedArray = new Uint8Array(encryptedContent);
    const combined = new Uint8Array(iv.length + encryptedArray.length);
    combined.set(iv);
    combined.set(encryptedArray, iv.length);

    // Convert to Base64 for storage
    return btoa(String.fromCharCode(...combined));
  } catch (e) {
    console.error("Encryption failed", e);
    return JSON.stringify(data); // Fallback to plain if crypto fails (dev safeguard)
  }
};

export const decryptData = async <T>(encryptedString: string, defaultValue: T): Promise<T> => {
  try {
    // Check if it's plain JSON (backward compatibility)
    if (encryptedString.startsWith('{') || encryptedString.startsWith('[')) {
        return JSON.parse(encryptedString);
    }

    const key = await getMasterKey();
    const combined = new Uint8Array(
      atob(encryptedString).split('').map(c => c.charCodeAt(0))
    );

    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      data
    );

    const decoded = new TextDecoder().decode(decrypted);
    return JSON.parse(decoded);
  } catch (e) {
    // Fail gracefully implies it might be unencrypted legacy data or broken
    try {
        return JSON.parse(encryptedString);
    } catch {
        return defaultValue;
    }
  }
};
