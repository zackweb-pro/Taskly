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
      'Authorization': `Bearer ${key}`,
      'Prefer': 'return=minimal' // This tells Supabase to return minimal response for writes
    };
    
    // Add auth interface to match standard Supabase client
    this.auth = {
      getUser: async () => {
        try {
          if (typeof tasklyAuth !== 'undefined' && tasklyAuth.isLoggedIn()) {
            const session = await tasklyAuth.getStoredSession();
            if (session && session.user) {
              return {
                data: { user: session.user },
                error: null
              };
            }
          }
          return {
            data: { user: null },
            error: { message: 'User not authenticated' }
          };
        } catch (error) {
          return {
            data: { user: null },
            error: error
          };
        }
      },
      
      signInWithPassword: async (credentials) => {
        try {
          return await tasklyAuth.signIn(credentials.email, credentials.password);
        } catch (error) {
          return { data: null, error: error };
        }
      },
      
      signUp: async (credentials) => {
        try {
          return await tasklyAuth.signUp(credentials.email, credentials.password);
        } catch (error) {
          return { data: null, error: error };
        }
      },
      
      signOut: async () => {
        try {
          await tasklyAuth.signOut();
          return { error: null };
        } catch (error) {
          return { error: error };
        }
      }
    };
  }

  // Helper method to safely parse response
  async parseResponse(response, defaultValue = null) {
    try {
      const text = await response.text();
      if (!text || text.trim() === '') {
        return defaultValue;
      }
      return JSON.parse(text);
    } catch (error) {
      console.warn('Failed to parse response as JSON:', text);
      return defaultValue;
    }
  }

  // Get authenticated user ID
  async getUserId() {
    // Authentication is now mandatory, so always use the authenticated user ID
    if (typeof tasklyAuth !== 'undefined' && tasklyAuth.isLoggedIn()) {
      return tasklyAuth.getUserId();
    }
    
    // If not authenticated, return null (will trigger auth required flow)
    return null;
  }

  // Get authorization headers with user token
  async getAuthHeaders() {
    const baseHeaders = {
      'Content-Type': 'application/json',
      'apikey': this.key,
      'Authorization': `Bearer ${this.key}`
    };

    // Add user token if authenticated
    if (typeof tasklyAuth !== 'undefined' && tasklyAuth.isLoggedIn()) {
      const session = await tasklyAuth.getStoredSession();
      if (session && session.access_token) {
        baseHeaders['Authorization'] = `Bearer ${session.access_token}`;
      }
    }

    return baseHeaders;
  }

  // Insert data into a table
  async insert(table, data) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.url}/rest/v1/${table}`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      // For inserts with 'return=minimal', we expect empty response on success
      const result = await this.parseResponse(response, { success: true, data: data });
      return result;
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
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await this.parseResponse(response, []);
      return result;
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
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await this.parseResponse(response, { success: true, data: data });
      return result;
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
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await this.parseResponse(response, { success: true });
      return result;
    } catch (error) {
      console.error('Supabase delete error:', error);
      throw error;
    }
  }

  // Supabase-style query builder interface
  from(table) {
    const client = this;
    
    return {
      select: function(columns = '*') {
        return {
          eq: function(column, value) {
            return {
              order: async function(orderBy, options = {}) {
                try {
                  const headers = await client.getAuthHeaders();
                  const direction = options.ascending === false ? 'desc' : 'asc';
                  let url = `${client.url}/rest/v1/${table}`;
                  
                  const params = [];
                  if (columns !== '*') {
                    params.push(`select=${columns}`);
                  }
                  params.push(`${column}=eq.${value}`);
                  params.push(`order=${orderBy}.${direction}`);
                  
                  url += '?' + params.join('&');

                  const response = await fetch(url, {
                    method: 'GET',
                    headers: headers
                  });

                  if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
                  }

                  const result = await client.parseResponse(response, []);
                  return { data: result, error: null };
                } catch (error) {
                  console.error('Supabase select error:', error);
                  return { data: null, error: error };
                }
              }
            };
          }
        };
      },

      insert: async function(data) {
        try {
          const headers = await client.getAuthHeaders();
          const response = await fetch(`${client.url}/rest/v1/${table}`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(Array.isArray(data) ? data : [data])
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
          }

          const result = await client.parseResponse(response, data);
          return { data: result, error: null };
        } catch (error) {
          console.error('Supabase insert error:', error);
          return { data: null, error: error };
        }
      },

      update: function(data) {
        return {
          eq: function(column, value) {
            return {
              async then(resolve, reject) {
                try {
                  const headers = await client.getAuthHeaders();
                  const response = await fetch(`${client.url}/rest/v1/${table}?${column}=eq.${value}`, {
                    method: 'PATCH',
                    headers: headers,
                    body: JSON.stringify(data)
                  });

                  if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
                  }

                  const result = await client.parseResponse(response, data);
                  resolve({ data: result, error: null });
                } catch (error) {
                  console.error('Supabase update error:', error);
                  reject({ data: null, error: error });
                }
              }
            };
          }
        };
      }
    };
  }
}

// Create and export the Supabase client instance
// This will be initialized after config is loaded
let supabase = null;

// Initialize Supabase client with config
function initializeSupabase() {
  if (typeof config !== 'undefined') {
    const { supabaseUrl, supabaseKey } = config.getConfig();
    if (supabaseUrl && supabaseKey && 
        !supabaseUrl.includes('YOUR_SUPABASE_URL_HERE') && 
        !supabaseKey.includes('YOUR_SUPABASE_ANON_KEY_HERE') &&
        !supabaseUrl.includes('__SUPABASE_URL__') && 
        !supabaseKey.includes('__SUPABASE_ANON_KEY__')) {
      supabase = new SupabaseClient(supabaseUrl, supabaseKey);
      console.log('Supabase client initialized successfully');
    } else {
      console.warn('Supabase credentials are not properly configured. Please update config.js with your actual Supabase URL and anon key.');
    }
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
