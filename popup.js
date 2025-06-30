// Taskly Popup JavaScript
class TasklyPopup {
  constructor() {
    this.tasks = [];
    this.init();
  }

  async init() {
    await this.loadTasks();
    this.setupEventListeners();
    this.updateDisplay();
    this.displayCurrentDate();
  }

  setupEventListeners() {
    // Add task button and Enter key
    const addBtn = document.getElementById('addTaskBtn');
    const taskInput = document.getElementById('taskInput');
    
    addBtn.addEventListener('click', () => this.addTask());
    taskInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addTask();
      }
    });

    // Clear completed tasks
    const clearBtn = document.getElementById('clearCompletedBtn');
    clearBtn.addEventListener('click', () => this.clearCompletedTasks());

    // Focus on input when popup opens
    taskInput.focus();
  }

  displayCurrentDate() {
    const dateElement = document.getElementById('currentDate');
    const today = new Date();
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    dateElement.textContent = today.toLocaleDateString('en-US', options);
  }

  async loadTasks() {
    try {
      const result = await chrome.storage.local.get(['tasklyTasks']);
      this.tasks = result.tasklyTasks || [];
      
      // Filter tasks for today only
      const today = new Date().toDateString();
      this.tasks = this.tasks.filter(task => 
        new Date(task.dateCreated).toDateString() === today
      );
    } catch (error) {
      console.error('Error loading tasks:', error);
      this.tasks = [];
    }
  }

  async saveTasks() {
    try {
      await chrome.storage.local.set({ tasklyTasks: this.tasks });
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  }

  addTask() {
    const input = document.getElementById('taskInput');
    const text = input.value.trim();
    
    if (!text) return;

    const task = {
      id: Date.now(),
      text: text,
      completed: false,
      dateCreated: new Date().toISOString()
    };

    this.tasks.unshift(task); // Add to beginning
    input.value = '';
    
    this.saveTasks();
    this.updateDisplay();
  }

  toggleTask(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      this.saveTasks();
      this.updateDisplay();
    }
  }

  deleteTask(taskId) {
    this.tasks = this.tasks.filter(t => t.id !== taskId);
    this.saveTasks();
    this.updateDisplay();
  }

  clearCompletedTasks() {
    this.tasks = this.tasks.filter(t => !t.completed);
    this.saveTasks();
    this.updateDisplay();
  }

  updateDisplay() {
    const tasksList = document.getElementById('tasksList');
    const emptyState = document.getElementById('emptyState');
    const taskCount = document.getElementById('taskCount');
    const clearBtn = document.getElementById('clearCompletedBtn');

    // Update task count
    const pendingCount = this.tasks.filter(t => !t.completed).length;
    const totalCount = this.tasks.length;
    taskCount.textContent = totalCount === 0 ? '0 tasks' : 
      totalCount === 1 ? '1 task' : `${totalCount} tasks`;

    // Show/hide empty state
    if (this.tasks.length === 0) {
      emptyState.classList.add('visible');
      tasksList.innerHTML = '';
      clearBtn.disabled = true;
      return;
    } else {
      emptyState.classList.remove('visible');
    }

    // Enable/disable clear button
    const hasCompleted = this.tasks.some(t => t.completed);
    clearBtn.disabled = !hasCompleted;

    // Render tasks
    tasksList.innerHTML = this.tasks.map(task => `
      <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
        <div class="task-checkbox ${task.completed ? 'checked' : ''}" data-task-id="${task.id}"></div>
        <div class="task-text" data-task-id="${task.id}">${this.escapeHtml(task.text)}</div>
        <button class="task-delete" data-task-id="${task.id}" title="Delete task">×</button>
      </div>
    `).join('');
    
    // Add event listeners for task interactions
    this.setupTaskEventListeners();
  }

  setupTaskEventListeners() {
    const tasksList = document.getElementById('tasksList');
    
    // Remove existing event listeners by cloning and replacing the node
    const newTasksList = tasksList.cloneNode(true);
    tasksList.parentNode.replaceChild(newTasksList, tasksList);
    
    // Add event delegation for task interactions
    newTasksList.addEventListener('click', (e) => {
      const taskId = parseInt(e.target.getAttribute('data-task-id'));
      
      if (e.target.classList.contains('task-checkbox') || e.target.classList.contains('task-text')) {
        // Toggle task completion
        this.toggleTask(taskId);
      } else if (e.target.classList.contains('task-delete')) {
        // Delete task
        e.stopPropagation();
        this.deleteTask(taskId);
      }
    });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize the popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.taskly = new TasklyPopup();
});
