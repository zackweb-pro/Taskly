// Taskly Content Script - Floating Icon and Popup
class TasklyFloatingIcon {
  constructor() {
    this.isVisible = false;
    this.isPopupOpen = false;
    this.tasks = [];
    this.createFloatingIcon();
    this.createFloatingPopup();
    this.setupEventListeners();
    this.loadTasks();
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
    this.iconContainer.addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePopup();
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

  togglePopup() {
    if (this.isPopupOpen) {
      this.closePopup();
    } else {
      this.openPopup();
    }
  }

  openPopup() {
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
    
    // Load and render tasks
    this.loadTasks();
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
      // Load tasks from local storage (works for both guest and cloud modes)
      const result = await chrome.storage.local.get(['tasklyTasks']);
      this.tasks = result.tasklyTasks || [];
      this.renderTasks();
      this.updateTaskCount();
    } catch (error) {
      console.log('Error loading tasks:', error);
      this.tasks = [];
    }
  }

  async saveTasks() {
    try {
      await chrome.storage.local.set({ tasklyTasks: this.tasks });
      this.updateTaskCount();
    } catch (error) {
      console.log('Error saving tasks:', error);
    }
  }

  addTask() {
    const input = this.popupContainer.querySelector('#taskInputPopup');
    const taskText = input.value.trim();
    
    if (taskText) {
      const newTask = {
        id: Date.now(),
        text: taskText,
        completed: false,
        dateCreated: new Date().toISOString()
      };
      
      this.tasks.unshift(newTask);
      this.saveTasks();
      this.renderTasks();
      input.value = '';
      
      // Add animation to new task
      setTimeout(() => {
        const taskElement = this.popupContainer.querySelector(`[data-task-id="${newTask.id}"]`);
        if (taskElement) {
          taskElement.classList.add('task-added');
        }
      }, 50);
    }
  }

  toggleTask(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      this.saveTasks();
      this.renderTasks();
    }
  }

  deleteTask(taskId) {
    this.tasks = this.tasks.filter(t => t.id !== taskId);
    this.saveTasks();
    this.renderTasks();
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
