// Supabase client configuration
// Credentials are now managed through config.js

// Simple Supabase client implementation for Chrome extension
class SupabaseClient {
  constructor(url, key) {
    this.url = url;
    this.key = key;
    this.headers = {
      'Content-Type': 'application/json',
      'apikey': key,
      'Authorization': `Bearer ${key}`
    };
  }

  // Generate a simple user ID based on Chrome extension ID and installation
  async getUserId() {
    try {
      const result = await chrome.storage.local.get(['tasklyUserId']);
      if (result.tasklyUserId) {
        return result.tasklyUserId;
      }
      
      // Generate a unique user ID
      const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      await chrome.storage.local.set({ tasklyUserId: userId });
      return userId;
    } catch (error) {
      console.error('Error getting user ID:', error);
      return 'user_' + Date.now();
    }
  }

  // Insert data into a table
  async insert(table, data) {
    try {
      const response = await fetch(`${this.url}/rest/v1/${table}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }
  }

  // Select data from a table
  async select(table, options = {}) {
    try {
      let url = `${this.url}/rest/v1/${table}`;
      const params = new URLSearchParams();

      if (options.select) {
        params.append('select', options.select);
      }
      if (options.eq) {
        Object.entries(options.eq).forEach(([key, value]) => {
          params.append(`${key}`, `eq.${value}`);
        });
      }
      if (options.order) {
        params.append('order', options.order);
      }

      if (params.toString()) {
        url += '?' + params.toString();
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Supabase select error:', error);
      throw error;
    }
  }

  // Update data in a table
  async update(table, data, options = {}) {
    try {
      let url = `${this.url}/rest/v1/${table}`;
      const params = new URLSearchParams();

      if (options.eq) {
        Object.entries(options.eq).forEach(([key, value]) => {
          params.append(`${key}`, `eq.${value}`);
        });
      }

      if (params.toString()) {
        url += '?' + params.toString();
      }

      const response = await fetch(url, {
        method: 'PATCH',
        headers: this.headers,
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Supabase update error:', error);
      throw error;
    }
  }

  // Delete data from a table
  async delete(table, options = {}) {
    try {
      let url = `${this.url}/rest/v1/${table}`;
      const params = new URLSearchParams();

      if (options.eq) {
        Object.entries(options.eq).forEach(([key, value]) => {
          params.append(`${key}`, `eq.${value}`);
        });
      }

      if (params.toString()) {
        url += '?' + params.toString();
      }

      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Supabase delete error:', error);
      throw error;
    }
  }
}

// Create and export the Supabase client instance
// This will be initialized after config is loaded
let supabase = null;

// Initialize Supabase client with config
function initializeSupabase() {
  if (typeof config !== 'undefined') {
    const { supabaseUrl, supabaseKey } = config.getConfig();
    supabase = new SupabaseClient(supabaseUrl, supabaseKey);
  } else {
    console.error('Config not loaded. Make sure config.js is included before supabase.js');
  }
  return supabase;
}

// Auto-initialize if config is available
if (typeof config !== 'undefined') {
  supabase = initializeSupabase();
}

// Make it available globally
if (typeof window !== 'undefined') {
  window.supabase = supabase;
  window.initializeSupabase = initializeSupabase;
}
