const STORAGE_KEY = 'adcraft_openai_key'

export function getStoredApiKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

export function setStoredApiKey(key: string): void {
  try {
    if (key.trim()) {
      localStorage.setItem(STORAGE_KEY, key.trim())
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    // ignore
  }
}

export function getActiveApiKey(): string {
  return import.meta.env.VITE_OPENAI_API_KEY || getStoredApiKey()
}

export function hasActiveApiKey(): boolean {
  return !!getActiveApiKey()
}
