// Taskly Content Script - Floating Icon and Popup with Dual Storage Support
class TasklyFloatingIcon {
  constructor() {
    this.isVisible = false;
    this.isPopupOpen = false;
    this.tasks = [];
    this.isGuestMode = false;
    this.isCloudMode = false;
    this.createFloatingIcon();
    this.createFloatingPopup();
    this.setupEventListeners();
    this.initializeMode();
  }

  async initializeMode() {
    try {
      // Check user mode (guest vs authenticated)
      const guestMode = await chrome.storage.local.get(['tasklyGuestMode']);
      this.isGuestMode = guestMode.tasklyGuestMode === true;
      this.isCloudMode = !this.isGuestMode;
      
      console.log('Content script mode:', this.isGuestMode ? 'Guest' : 'Cloud');
      
      // Load tasks after determining mode
      await this.loadTasks();
      
      // Listen for storage changes to keep in sync with main popup
      this.setupStorageListener();
    } catch (error) {
      console.error('Error initializing mode:', error);
      // Default to guest mode if there's an error
      this.isGuestMode = true;
      this.isCloudMode = false;
      await this.loadTasks();
    }
  }

  setupStorageListener() {
    // Listen for changes to task storage
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local' && changes.tasklyTasks) {
        // Tasks were updated in the main popup, refresh our view
        this.loadTasks();
      }
    });
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
        <span class="task-badge" id="taskBadge">0</span>
      </div>
    `;

    // Add to page
    document.body.appendChild(this.iconContainer);
    
    // Show after a brief delay
    setTimeout(() => {
      this.iconContainer.classList.add('visible');
    }, 1000);
  }

  createFloatingPopup() {
    // Create floating popup container
    this.popupContainer = document.createElement('div');
    this.popupContainer.id = 'taskly-floating-popup';
    this.popupContainer.innerHTML = `
      <div class="taskly-popup-content">
        <div class="taskly-popup-header">
          <h3>🌟 Taskly</h3>
          <button class="taskly-close-btn" id="tasklyCloseBtn">×</button>
        </div>
        
        <div class="taskly-popup-date" id="popupDate"></div>
        
        <div class="taskly-input-section">
          <input type="text" id="taskInputPopup" placeholder="Add a new task..." maxlength="100">
          <button id="addTaskBtnPopup">+</button>
        </div>
        
        <div class="taskly-tasks-section">
          <div class="taskly-tasks-header">
            <span class="taskly-task-count" id="popupTaskCount">0 tasks</span>
          </div>
          
          <div class="taskly-tasks-list" id="popupTasksList">
            <!-- Tasks will be dynamically added here -->
          </div>
          
          <div class="taskly-empty-state" id="popupEmptyState">
            <p>🎯 No tasks for today</p>
            <p>Add your first task above!</p>
          </div>
        </div>
        
        <div class="taskly-popup-footer">
          <button id="clearCompletedBtnPopup" class="taskly-clear-btn">Clear Completed</button>
        </div>
      </div>
    `;

    // Add to page
    document.body.appendChild(this.popupContainer);
  }

  setupEventListeners() {
    if (!this.iconContainer) return;

    // Icon click event
    this.iconContainer.addEventListener('click', async (e) => {
      e.stopPropagation();
      await this.togglePopup();
    });

    // Close popup when clicking outside
    document.addEventListener('click', (e) => {
      if (this.isPopupOpen && 
          !this.popupContainer.contains(e.target) && 
          !this.iconContainer.contains(e.target)) {
        this.closePopup();
      }
    });

    // Close button
    const closeBtn = this.popupContainer.querySelector('#tasklyCloseBtn');
    closeBtn.addEventListener('click', () => {
      this.closePopup();
    });

    // Add task functionality
    const taskInput = this.popupContainer.querySelector('#taskInputPopup');
    const addTaskBtn = this.popupContainer.querySelector('#addTaskBtnPopup');
    
    addTaskBtn.addEventListener('click', () => {
      this.addTask();
    });

    taskInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addTask();
      }
    });

    // Clear completed tasks
    const clearBtn = this.popupContainer.querySelector('#clearCompletedBtnPopup');
    clearBtn.addEventListener('click', () => {
      this.clearCompletedTasks();
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

    // Escape key to close popup
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isPopupOpen) {
        this.closePopup();
      }
    });
  }

  async togglePopup() {
    if (this.isPopupOpen) {
      this.closePopup();
    } else {
      await this.openPopup();
    }
  }

  async openPopup() {
    // Prevent page scrolling more robustly
    const currentScrollY = window.scrollY;
    const currentScrollX = window.scrollX;
    
    // Calculate optimal popup position to avoid scroll issues
    const viewportHeight = window.innerHeight;
    const popupHeight = 550; // max-height from CSS
    const iconPosition = this.iconContainer.getBoundingClientRect();
    
    // Temporarily disable smooth scrolling
    const originalScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    
    this.isPopupOpen = true;
    
    // Position popup dynamically to avoid viewport issues
    if (iconPosition.top < popupHeight + 100) {
      // If icon is too high, position popup below icon
      this.popupContainer.style.bottom = 'auto';
      this.popupContainer.style.top = `${iconPosition.bottom + 10}px`;
    } else {
      // Default position above icon
      this.popupContainer.style.top = 'auto';
      this.popupContainer.style.bottom = '95px';
    }
    
    this.popupContainer.classList.add('visible');
    this.iconContainer.classList.add('popup-open');
    
    // Force scroll position to stay the same
    window.scrollTo(currentScrollX, currentScrollY);
    
    // Restore original scroll behavior after animation
    setTimeout(() => {
      document.documentElement.style.scrollBehavior = originalScrollBehavior;
    }, 400);
    
    // Update date
    this.updateDate();
    
    // Focus input without causing scroll
    setTimeout(() => {
      const input = this.popupContainer.querySelector('#taskInputPopup');
      input.focus({ preventScroll: true });
    }, 300);
    
    // Load and render tasks (refresh from storage)
    await this.loadTasks();
  }

  closePopup() {
    this.isPopupOpen = false;
    this.popupContainer.classList.remove('visible');
    this.iconContainer.classList.remove('popup-open');
    
    // Reset positioning to default
    setTimeout(() => {
      this.popupContainer.style.top = 'auto';
      this.popupContainer.style.bottom = '95px';
    }, 300);
  }

  async loadTasks() {
    try {
      // Always load from local storage (works for both guest and cloud modes)
      // The main popup handles cloud sync, content script just reads local cache
      const result = await chrome.storage.local.get(['tasklyTasks']);
      this.tasks = result.tasklyTasks || [];
      
      // Filter for today's tasks only
      const today = new Date().toDateString();
      this.tasks = this.tasks.filter(task => {
        const taskDate = new Date(task.dateCreated).toDateString();
        return taskDate === today;
      });
      
      this.renderTasks();
      this.updateTaskCount();
    } catch (error) {
      console.log('Error loading tasks in content script:', error);
      this.tasks = [];
    }
  }

  async saveTasks() {
    try {
      // Get all tasks from storage first
      const result = await chrome.storage.local.get(['tasklyTasks']);
      const allTasks = result.tasklyTasks || [];
      
      // Update the all tasks array with our current tasks
      const today = new Date().toDateString();
      
      // Remove today's tasks from allTasks
      const otherDaysTasks = allTasks.filter(task => {
        const taskDate = new Date(task.dateCreated).toDateString();
        return taskDate !== today;
      });
      
      // Combine with today's tasks
      const updatedAllTasks = [...otherDaysTasks, ...this.tasks];
      
      // Save to local storage
      await chrome.storage.local.set({ tasklyTasks: updatedAllTasks });
      this.updateTaskCount();
      
      // Also save to historical data with date key for stats
      const todayIso = new Date().toISOString().split('T')[0];
      const historicalKey = `tasklyTasks_${todayIso}`;
      await chrome.storage.local.set({ [historicalKey]: updatedAllTasks });
      
      // If in cloud mode, trigger sync through background script
      if (this.isCloudMode) {
        await this.syncToCloud();
      }
      
      // Notify main popup of changes
      this.notifyMainPopup();
    } catch (error) {
      console.log('Error saving tasks in content script:', error);
    }
  }

  // Sync to cloud database (only in cloud mode)
  async syncToCloud() {
    try {
      if (!this.isCloudMode) return;
      
      // Get all tasks for syncing
      const allTasks = await this.getAllTasks();
      
      // Send message to background script to trigger cloud sync
      const response = await chrome.runtime.sendMessage({ 
        action: 'syncToCloud', 
        tasks: allTasks 
      });
      
      if (response && response.success) {
        console.log('Cloud sync successful:', response.message);
        
        // Immediately trigger popup to reload from cloud
        try {
          await chrome.runtime.sendMessage({ 
            action: 'forcePopupRefresh' 
          });
        } catch (error) {
          // Ignore if popup is not open
        }
      } else if (response) {
        console.warn('Cloud sync response:', response.message || response.error);
      }
    } catch (error) {
      console.log('Error syncing to cloud from content script:', error);
    }
  }

  // Get all tasks for today (not just the filtered ones)
  async getAllTasks() {
    try {
      // Get all tasks from storage, not just the filtered ones
      const result = await chrome.storage.local.get(['tasklyTasks']);
      return result.tasklyTasks || [];
    } catch (error) {
      console.error('Error getting all tasks:', error);
      return this.tasks;
    }
  }

  // Notify the main popup of task changes
  async notifyMainPopup() {
    try {
      // Send message to background script to update badge
      chrome.runtime.sendMessage({ action: 'tasksUpdated' });
      
      // Always set a storage signal for popup to detect changes
      chrome.storage.local.set({ 
        tasklyRefreshSignal: Date.now() 
      });
      
      // If in cloud mode, immediately force popup to refresh from cloud
      if (this.isCloudMode) {
        // Send force refresh message - don't wait for response
        chrome.runtime.sendMessage({ 
          action: 'forcePopupRefresh' 
        });
        
        // Also set a force refresh storage signal for reliability
        chrome.storage.local.set({ 
          forceRefresh: { 
            timestamp: Date.now(),
            source: 'bubble'
          } 
        });
      }
    } catch (error) {
      // Ignore errors if background script isn't available
      console.log('Note: Could not notify popup:', error.message);
    }
  }

  async addTask() {
    const input = this.popupContainer.querySelector('#taskInputPopup');
    const taskText = input.value.trim();
    
    if (taskText) {
      const newTask = {
        id: Date.now(),
        text: taskText,
        completed: false,
        dateCreated: new Date().toISOString()
      };
      
      // Add to local array
      this.tasks.unshift(newTask);
      
      // Get all existing tasks and add the new one
      try {
        const result = await chrome.storage.local.get(['tasklyTasks']);
        const allTasks = result.tasklyTasks || [];
        allTasks.unshift(newTask);
        
        // Save updated tasks
        await chrome.storage.local.set({ tasklyTasks: allTasks });
        
        // Also save to historical data
        const today = new Date().toISOString().split('T')[0];
        const historicalKey = `tasklyTasks_${today}`;
        await chrome.storage.local.set({ [historicalKey]: allTasks });
        
        this.renderTasks();
        input.value = '';
        this.updateTaskCount();
        
        // If in cloud mode, trigger sync
        if (this.isCloudMode) {
          await this.syncToCloud();
          // Small delay to ensure sync completes and popup refreshes
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Notify main popup of changes
        this.notifyMainPopup();
        
        // Add animation to new task
        setTimeout(() => {
          const taskElement = this.popupContainer.querySelector(`[data-task-id="${newTask.id}"]`);
          if (taskElement) {
            taskElement.classList.add('task-added');
          }
        }, 50);
      } catch (error) {
        console.error('Error adding task in content script:', error);
      }
    }
  }

  async toggleTask(taskId) {
    try {
      // Update in local array
      const task = this.tasks.find(t => t.id === taskId);
      if (task) {
        task.completed = !task.completed;
      }
      
      // Update in storage
      const result = await chrome.storage.local.get(['tasklyTasks']);
      const allTasks = result.tasklyTasks || [];
      const taskInStorage = allTasks.find(t => t.id === taskId);
      if (taskInStorage) {
        taskInStorage.completed = !taskInStorage.completed;
        
        await chrome.storage.local.set({ tasklyTasks: allTasks });
        
        // Also update historical data
        const today = new Date().toISOString().split('T')[0];
        const historicalKey = `tasklyTasks_${today}`;
        await chrome.storage.local.set({ [historicalKey]: allTasks });
        
        this.renderTasks();
        this.updateTaskCount();
        
        // If in cloud mode, trigger sync
        if (this.isCloudMode) {
          await this.syncToCloud();
          // Small delay to ensure sync completes and popup refreshes
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        this.notifyMainPopup();
      }
    } catch (error) {
      console.error('Error toggling task in content script:', error);
    }
  }

  async deleteTask(taskId) {
    try {
      // Remove from local array
      this.tasks = this.tasks.filter(t => t.id !== taskId);
      
      // Remove from storage
      const result = await chrome.storage.local.get(['tasklyTasks']);
      const allTasks = result.tasklyTasks || [];
      const updatedTasks = allTasks.filter(t => t.id !== taskId);
      
      await chrome.storage.local.set({ tasklyTasks: updatedTasks });
      
      // Also update historical data
      const today = new Date().toISOString().split('T')[0];
      const historicalKey = `tasklyTasks_${today}`;
      await chrome.storage.local.set({ [historicalKey]: updatedTasks });
      
      this.renderTasks();
      this.updateTaskCount();
      
      // If in cloud mode, trigger sync
      if (this.isCloudMode) {
        await this.syncToCloud();
      }
      
      this.notifyMainPopup();
    } catch (error) {
      console.error('Error deleting task in content script:', error);
    }
  }

  clearCompletedTasks() {
    const completedTasks = this.popupContainer.querySelectorAll('.task-item.completed');
    
    // Add exit animation
    completedTasks.forEach(task => {
      task.classList.add('task-removing');
    });
    
    setTimeout(() => {
      this.tasks = this.tasks.filter(t => !t.completed);
      this.saveTasks();
      this.renderTasks();
    }, 300);
  }

  renderTasks() {
    const tasksList = this.popupContainer.querySelector('#popupTasksList');
    const emptyState = this.popupContainer.querySelector('#popupEmptyState');
    
    // Filter tasks for today
    const today = new Date().toDateString();
    const todayTasks = this.tasks.filter(task => {
      const taskDate = new Date(task.dateCreated).toDateString();
      return taskDate === today;
    });
    
    if (todayTasks.length === 0) {
      tasksList.style.display = 'none';
      emptyState.style.display = 'block';
    } else {
      tasksList.style.display = 'block';
      emptyState.style.display = 'none';
      
      tasksList.innerHTML = todayTasks.map(task => `
        <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
          <div class="task-content" data-task-id="${task.id}">
            <span class="task-checkbox">${task.completed ? '✓' : ''}</span>
            <span class="task-text">${this.escapeHtml(task.text)}</span>
          </div>
          <button class="task-delete" data-task-id="${task.id}">×</button>
        </div>
      `).join('');
      
      // Add event listeners for task interactions
      this.setupTaskEventListeners();
    }
  }

  setupTaskEventListeners() {
    // Remove existing event listeners to prevent duplicates
    const taskContents = this.popupContainer.querySelectorAll('.task-content');
    const deleteButtons = this.popupContainer.querySelectorAll('.task-delete');
    
    // Add click listeners for task toggle
    taskContents.forEach(content => {
      const taskId = parseInt(content.getAttribute('data-task-id'));
      content.addEventListener('click', () => {
        this.toggleTask(taskId);
      });
    });
    
    // Add click listeners for task deletion
    deleteButtons.forEach(button => {
      const taskId = parseInt(button.getAttribute('data-task-id'));
      button.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering task toggle
        this.deleteTask(taskId);
      });
    });
  }

  updateTaskCount() {
    const today = new Date().toDateString();
    const todayTasks = this.tasks.filter(task => {
      const taskDate = new Date(task.dateCreated).toDateString();
      return taskDate === today;
    });
    
    const pendingTasks = todayTasks.filter(task => !task.completed);
    const totalTasks = todayTasks.length;
    
    // Update popup count
    const popupCount = this.popupContainer.querySelector('#popupTaskCount');
    if (popupCount) {
      popupCount.textContent = `${totalTasks} task${totalTasks !== 1 ? 's' : ''}`;
    }
    
    // Update badge
    const badge = this.iconContainer.querySelector('#taskBadge');
    if (badge) {
      if (pendingTasks.length > 0) {
        badge.textContent = pendingTasks.length;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  updateDate() {
    const dateElement = this.popupContainer.querySelector('#popupDate');
    if (dateElement) {
      const today = new Date();
      const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      dateElement.textContent = today.toLocaleDateString('en-US', options);
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize only if not already initialized
if (!window.tasklyFloatingIcon) {
  window.tasklyFloatingIcon = new TasklyFloatingIcon();
}
