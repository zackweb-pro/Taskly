// Authentication module for Taskly Chrome Extension
// Handles user login, registration, and session management with Supabase

class TasklyAuth {
  constructor() {
    this.currentUser = null;
    this.isAuthenticated = false;
    this.initializeAuth();
  }

  async initializeAuth() {
    try {
      // Check if user is already logged in
      const session = await this.getStoredSession();
      if (session && session.access_token) {
        this.currentUser = session.user;
        this.isAuthenticated = true;
        console.log('User already authenticated:', this.currentUser.email);
      }
    } catch (error) {
      console.log('No existing session found');
    }
  }

  // Store session in Chrome storage
  async storeSession(session) {
    try {
      await chrome.storage.local.set({
        tasklySession: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          user: session.user,
          expires_at: session.expires_at
        }
      });
    } catch (error) {
      console.error('Error storing session:', error);
    }
  }

  // Get session from Chrome storage
  async getStoredSession() {
    try {
      const result = await chrome.storage.local.get(['tasklySession']);
      return result.tasklySession || null;
    } catch (error) {
      console.error('Error getting stored session:', error);
      return null;
    }
  }

  // Clear stored session
  async clearSession() {
    try {
      await chrome.storage.local.remove(['tasklySession']);
      this.currentUser = null;
      this.isAuthenticated = false;
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }

  // Sign up with email and password
  async signUp(email, password) {
    try {
      // Ensure supabase is initialized
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const response = await fetch(`${supabase.url}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabase.key,
          'Authorization': `Bearer ${supabase.key}`
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      });

      const data = await response.json();
      console.log('Signup response:', data); // Debug log

      if (response.ok && data.user) {
        // Store session if provided
        if (data.session) {
          await this.storeSession(data.session);
          this.currentUser = data.user;
          this.isAuthenticated = true;
        }
        return { success: true, user: data.user, needsConfirmation: !data.session };
      } else {
        return { success: false, error: data.error_description || data.msg || data.message || 'Sign up failed' };
      }
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: error.message || 'Network error during sign up' };
    }
  }

  // Sign in with email and password
  async signIn(email, password) {
    try {
      // Ensure supabase is initialized
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const response = await fetch(`${supabase.url}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabase.key,
          'Authorization': `Bearer ${supabase.key}`
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      });

      const data = await response.json();
      console.log('Sign in response:', data); // Debug log

      if (response.ok && data.access_token) {
        // Store session
        await this.storeSession(data);
        this.currentUser = data.user;
        this.isAuthenticated = true;
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error_description || data.msg || data.message || 'Invalid credentials' };
      }
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: error.message || 'Network error during sign in' };
    }
  }

  // Sign out
  async signOut() {
    try {
      const session = await this.getStoredSession();
      if (session && session.access_token) {
        // Call Supabase sign out endpoint
        await fetch(`${supabase.url}/auth/v1/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabase.key,
            'Authorization': `Bearer ${session.access_token}`
          }
        });
      }
    } catch (error) {
      console.error('Error during sign out:', error);
    } finally {
      // Always clear local session
      await this.clearSession();
    }
  }

  // Get current user ID for database operations
  getUserId() {
    return this.currentUser ? this.currentUser.id : null;
  }

  // Check if user is authenticated
  isLoggedIn() {
    return this.isAuthenticated && this.currentUser;
  }

  // Get user email
  getUserEmail() {
    return this.currentUser ? this.currentUser.email : null;
  }

  // Refresh token if needed
  async refreshSession() {
    try {
      const session = await this.getStoredSession();
      if (!session || !session.refresh_token) {
        return false;
      }

      const response = await fetch(`${supabase.url}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabase.key
        },
        body: JSON.stringify({
          refresh_token: session.refresh_token
        })
      });

      const data = await response.json();

      if (response.ok && data.access_token) {
        await this.storeSession(data);
        this.currentUser = data.user;
        this.isAuthenticated = true;
        return true;
      } else {
        await this.clearSession();
        return false;
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      await this.clearSession();
      return false;
    }
  }

  // Send password reset email
  async resetPassword(email) {
    try {
      // Ensure supabase is initialized
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const response = await fetch(`${supabase.url}/auth/v1/recover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabase.key,
          'Authorization': `Bearer ${supabase.key}`
        },
        body: JSON.stringify({
          email: email
        })
      });

      const data = await response.json();
      console.log('Password reset response:', data); // Debug log
      
      if (response.ok) {
        return { success: true, message: 'Password reset email sent' };
      } else {
        return { success: false, message: data.error_description || data.msg || data.message || 'Error sending reset email' };
      }
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, message: error.message || 'Network error' };
    }
  }
}

// Create global auth instance
const tasklyAuth = new TasklyAuth();

// Make it available globally
if (typeof window !== 'undefined') {
  window.tasklyAuth = tasklyAuth;
}
