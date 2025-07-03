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
  } else if (request.action === 'syncToCloud') {
    // Handle cloud sync by forwarding to popup/extension pages
    handleCloudSync(request.tasks)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep the message channel open for async response
  } else if (request.action === 'refreshPopupData') {
    // Signal any open popups to refresh their data
    try {
      // Use storage to signal refresh needed
      chrome.storage.local.set({ refreshNeeded: Date.now() });
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  } else if (request.action === 'forcePopupRefresh') {
    // Force popup to refresh from cloud immediately
    try {
      // Method 1: Use storage to signal refresh
      chrome.storage.local.set({ 
        forceRefresh: { 
          timestamp: Date.now(),
          source: 'bubble'
        } 
      });
      
      // Method 2: Try to message popup directly (if available)
      chrome.runtime.sendMessage({ 
        action: 'forcePopupRefresh' 
      }).catch(() => {
        // Ignore errors if popup is not open
      });
      
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  } else if (request.action === 'tasksUpdated') {
    // Update badge when tasks are updated
    updateBadge();
  }
});

// Handle cloud synchronization by queueing sync for popup
async function handleCloudSync(tasks) {
  try {
    // Since we can't directly access popup in Manifest V3 service worker,
    // we'll queue the sync and let the popup handle it when it's next opened
    await chrome.storage.local.set({ 
      pendingCloudSync: { 
        tasks: tasks, 
        timestamp: Date.now() 
      } 
    });

    // Try to notify any open tabs with the extension popup
    try {
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (tab.url && tab.url.includes('chrome-extension://')) {
          // Send message to extension pages
          chrome.tabs.sendMessage(tab.id, {
            action: 'processPendingSync',
            tasks: tasks
          }).catch(() => {
            // Ignore errors - tab might not have content script
          });
        }
      }
    } catch (error) {
      // Ignore tab messaging errors
    }

    return { 
      success: true, 
      message: 'Cloud sync queued - will complete when extension is next opened' 
    };

  } catch (error) {
    console.error('Cloud sync failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

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
