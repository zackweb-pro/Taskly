// Taskly Background Script
chrome.runtime.onInstalled.addListener(() => {
  console.log('Taskly extension installed');
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openPopup') {
    // Try to open the action popup
    chrome.action.openPopup().catch(() => {
      // If popup fails, open in new tab
      chrome.tabs.create({
        url: chrome.runtime.getURL('popup.html')
      });
    });
  } else if (request.action === 'openInTab') {
    // Open extension in new tab
    chrome.tabs.create({
      url: chrome.runtime.getURL('popup.html')
    });
  }
});

// Optional: Badge text to show task count
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.tasklyTasks) {
    updateBadge();
  }
});

async function updateBadge() {
  try {
    const result = await chrome.storage.local.get(['tasklyTasks']);
    const tasks = result.tasklyTasks || [];
    
    // Filter for today's incomplete tasks
    const today = new Date().toDateString();
    const todaysPendingTasks = tasks.filter(task => 
      new Date(task.dateCreated).toDateString() === today && !task.completed
    );
    
    const count = todaysPendingTasks.length;
    const badgeText = count > 0 ? count.toString() : '';
    
    chrome.action.setBadgeText({ text: badgeText });
    chrome.action.setBadgeBackgroundColor({ color: '#667eea' });
  } catch (error) {
    console.error('Error updating badge:', error);
  }
}

// Update badge on startup
updateBadge();
