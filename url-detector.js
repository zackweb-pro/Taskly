// Extension URL detector utility
// Helps with Supabase configuration by showing current extension URLs

class ExtensionUrlDetector {
  constructor() {
    this.extensionId = chrome.runtime.id;
    this.baseUrl = chrome.runtime.getURL('');
  }

  // Get all relevant URLs for Supabase configuration
  getConfigurationUrls() {
    return {
      extensionId: this.extensionId,
      baseUrl: this.baseUrl,
      loginUrl: chrome.runtime.getURL('login.html'),
      popupUrl: chrome.runtime.getURL('popup.html'),
      redirectUrls: [
        `${this.baseUrl}login.html`,
        `${this.baseUrl}popup.html`,
        `${this.baseUrl}login.html?confirmed=true`
      ]
    };
  }

  // Display configuration help in console
  logConfigurationHelp() {
    const urls = this.getConfigurationUrls();
    
    console.group('🔧 Supabase Configuration Help');
    console.log('Extension ID:', urls.extensionId);
    console.log('Base URL:', urls.baseUrl);
    console.log('');
    console.log('Add these URLs to Supabase Dashboard → Authentication → URL Configuration:');
    console.log('');
    console.log('Site URL:');
    console.log(`  ${urls.baseUrl}`);
    console.log('');
    console.log('Redirect URLs:');
    urls.redirectUrls.forEach(url => console.log(`  ${url}`));
    console.log('');
    console.log('OR use wildcard patterns for any extension:');
    console.log('  chrome-extension://*/*');
    console.log('  chrome-extension://*/login.html');
    console.log('  chrome-extension://*/popup.html');
    console.groupEnd();
  }

  // Show configuration in UI (for development)
  showConfigurationModal() {
    const urls = this.getConfigurationUrls();
    
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: monospace;
    `;
    
    modal.innerHTML = `
      <div style="background: white; padding: 30px; border-radius: 10px; max-width: 600px; max-height: 80vh; overflow-y: auto;">
        <h2 style="margin-top: 0; color: #333;">🔧 Supabase Configuration</h2>
        <p><strong>Extension ID:</strong> ${urls.extensionId}</p>
        <p><strong>Base URL:</strong> ${urls.baseUrl}</p>
        
        <h3>Add to Supabase Dashboard:</h3>
        <p><em>Go to Authentication → URL Configuration</em></p>
        
        <h4>Site URL:</h4>
        <code style="background: #f5f5f5; padding: 5px; display: block; margin: 5px 0;">${urls.baseUrl}</code>
        
        <h4>Redirect URLs:</h4>
        ${urls.redirectUrls.map(url => 
          `<code style="background: #f5f5f5; padding: 5px; display: block; margin: 5px 0;">${url}</code>`
        ).join('')}
        
        <h4>Or use wildcards (recommended):</h4>
        <code style="background: #e8f5e8; padding: 5px; display: block; margin: 5px 0;">chrome-extension://*/*</code>
        <code style="background: #e8f5e8; padding: 5px; display: block; margin: 5px 0;">chrome-extension://*/login.html</code>
        <code style="background: #e8f5e8; padding: 5px; display: block; margin: 5px 0;">chrome-extension://*/popup.html</code>
        
        <button onclick="this.parentElement.parentElement.remove()" 
                style="margin-top: 20px; padding: 10px 20px; background: #007cba; color: white; border: none; border-radius: 5px; cursor: pointer;">
          Close
        </button>
      </div>
    `;
    
    document.body.appendChild(modal);
  }
}

// Create global instance
const extensionUrlDetector = new ExtensionUrlDetector();

// Auto-log configuration help in development
if (chrome.runtime.getManifest().key) {
  // Development mode (has key field)
  extensionUrlDetector.logConfigurationHelp();
}

// Make it available globally
if (typeof window !== 'undefined') {
  window.extensionUrlDetector = extensionUrlDetector;
}
