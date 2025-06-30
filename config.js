// Environment configuration for Chrome extension
// Since Chrome extensions can't directly use .env files, we need a config approach

class Config {
  constructor() {
    // Use build-time environment variable replacement for production
    // These placeholders will be replaced during build process
    this.SUPABASE_URL = this.getEnvVar('SUPABASE_URL', '__SUPABASE_URL__');
    this.SUPABASE_ANON_KEY = this.getEnvVar('SUPABASE_ANON_KEY', '__SUPABASE_ANON_KEY__');
  }

  getEnvVar(name, defaultValue) {
    // In a Chrome extension, we can't directly access process.env
    // This is a placeholder for different environment handling strategies
    
    // Option 1: Use chrome.storage for user-set credentials
    // Option 2: Build-time replacement (using webpack or similar)
    // Option 3: Fetch from a secure endpoint
    
    // For now, return the default value
    // TODO: Implement secure credential management
    return defaultValue;
  }

  // Method to check if running in development
  isDevelopment() {
    return chrome.runtime && chrome.runtime.getManifest().key === undefined;
  }

  // Method to get config based on environment
  getConfig() {
    return {
      supabaseUrl: this.SUPABASE_URL,
      supabaseKey: this.SUPABASE_ANON_KEY,
      isDev: this.isDevelopment()
    };
  }
}

// Create global config instance
const config = new Config();

// Make it available globally
if (typeof window !== 'undefined') {
  window.config = config;
}
