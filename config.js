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
    
    // For development, use hardcoded values
    // TODO: Replace these with your actual Supabase credentials
    if (name === 'SUPABASE_URL') {
      return 'https://mksxrwldbhknicbbmssz.supabase.co'; // Replace with your Supabase URL
    }
    if (name === 'SUPABASE_ANON_KEY') {
      return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rc3hyd2xkYmhrbmljYmJtc3N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU4Mzg4ODAsImV4cCI6MjA1MTQxNDg4MH0.hhLPznLBeSXdhaBWqQJMf0I4YKG4k8E3-TP6cXfxhXQ'; // Replace with your Supabase anon key
    }
    
    // For production builds, use the placeholder values that get replaced
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
