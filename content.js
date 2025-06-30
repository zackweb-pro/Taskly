// Taskly Content Script - Floating Icon
class TasklyFloatingIcon {
  constructor() {
    this.isVisible = false;
    this.createFloatingIcon();
    this.setupEventListeners();
  }

  createFloatingIcon() {
    // Don't create icon on Chrome extension pages
    if (window.location.href.startsWith('chrome-extension://') || 
        window.location.href.startsWith('chrome://') ||
        window.location.href.startsWith('edge://') ||
        window.location.href.startsWith('about:')) {
      return;
    }

    // Create floating icon container
    this.iconContainer = document.createElement('div');
    this.iconContainer.id = 'taskly-floating-icon';
    this.iconContainer.innerHTML = `
      <div class="taskly-icon-button">
        <span class="taskly-icon">✓</span>
        <span class="taskly-tooltip">Open Taskly</span>
      </div>
    `;

    // Add to page
    document.body.appendChild(this.iconContainer);
    
    // Show after a brief delay
    setTimeout(() => {
      this.iconContainer.classList.add('visible');
    }, 1000);
  }

  setupEventListeners() {
    if (!this.iconContainer) return;

    this.iconContainer.addEventListener('click', () => {
      this.openTaskly();
    });

    // Hide/show based on scroll
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      this.iconContainer.style.opacity = '0.5';
      
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.iconContainer.style.opacity = '1';
      }, 150);
    });
  }

  async openTaskly() {
    try {
      // Try to open the extension popup
      await chrome.runtime.sendMessage({ action: 'openPopup' });
    } catch (error) {
      console.log('Could not open popup, opening in new tab');
      // Fallback: open extension page in new tab
      chrome.runtime.sendMessage({ action: 'openInTab' });
    }
  }
}

// Initialize only if not already initialized
if (!window.tasklyFloatingIcon) {
  window.tasklyFloatingIcon = new TasklyFloatingIcon();
}
