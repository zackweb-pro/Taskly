// Taskly Popup JavaScript with Dual Storage System
class TasklyPopup {
  constructor() {
    this.tasks = [];
    this.userId = null;
    this.isOnline = navigator.onLine;
    this.isGuestMode = false;
    this.isCloudMode = false;
    this.init();
  }

  async init() {
    // Check user mode (guest vs authenticated)
    const userMode = await this.checkUserMode();
    
    if (userMode === 'none') {
      // Show authentication options
      this.showAuthenticationOptions();
      return;
    } else if (userMode === 'guest') {
      // Guest mode - local storage only
      this.isGuestMode = true;
      this.isCloudMode = false;
      await this.initGuestMode();
    } else if (userMode === 'authenticated') {
      // Cloud mode - authenticated user
      this.isGuestMode = false;
      this.isCloudMode = true;
      this.userId = tasklyAuth.getUserId();
      await this.initCloudMode();
    }

    // Common initialization
    await this.loadTasks();
    this.setupEventListeners();
    this.updateDisplay();
    this.displayCurrentDate();
    this.updateUserInterface();
    
    // Set up online/offline sync (only for cloud mode)
    if (this.isCloudMode) {
      this.setupNetworkListeners();
      if (this.isOnline) {
        this.syncWithCloud();
      }
    }

    // Check for pending cloud sync from content script
    await this.handlePendingCloudSync();
    
    // Set up listener for refresh signals from content script
    this.setupRefreshListener();
    
    // Check for pending refresh signals immediately
    await this.checkPendingRefreshSignals();
  }

  async checkUserMode() {
    try {
      // Check if user chose guest mode
      const guestMode = await chrome.storage.local.get(['tasklyGuestMode']);
      if (guestMode.tasklyGuestMode === true) {
        return 'guest';
      }

      // Check if user is authenticated
      if (tasklyAuth) {
        await new Promise(resolve => {
          if (tasklyAuth.currentUser !== null || tasklyAuth.isAuthenticated === false) {
            resolve();
          } else {
            setTimeout(resolve, 500);
          }
        });

        if (tasklyAuth.isLoggedIn()) {
          return 'authenticated';
        }
      }

      // No mode chosen yet
      return 'none';
    } catch (error) {
      console.error('Error checking user mode:', error);
      return 'none';
    }
  }

  async initGuestMode() {
    console.log('Initializing guest mode');
    // Set guest mode flag
    await chrome.storage.local.set({ tasklyGuestMode: true });
  }

  async initCloudMode() {
    console.log('Initializing cloud mode');
    
    // Check if Supabase is properly configured
    if (!window.supabase) {
      console.warn('Supabase client not available - falling back to guest mode');
      this.isCloudMode = false;
      this.isGuestMode = true;
      await chrome.storage.local.set({ tasklyGuestMode: true });
      return;
    }
    
    // Clear guest mode flag and ensure user exists in database
    await chrome.storage.local.remove(['tasklyGuestMode']);
    if (this.isOnline) {
      try {
        await this.ensureUserExists();
      } catch (error) {
        console.warn('Failed to connect to Supabase - falling back to guest mode:', error);
        this.isCloudMode = false;
        this.isGuestMode = true;
        await chrome.storage.local.set({ tasklyGuestMode: true });
      }
    }
  }

  // Handle pending cloud sync from background script
  async handlePendingCloudSync() {
    try {
      const result = await chrome.storage.local.get(['pendingCloudSync']);
      if (result.pendingCloudSync) {
        const { tasks, timestamp } = result.pendingCloudSync;
        
        // Only process if the sync request is recent (within 5 minutes)
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          console.log('Processing pending cloud sync from content script');
          await this.syncTasksToCloud(tasks);
        }
        
        // Clear the pending sync
        await chrome.storage.local.remove(['pendingCloudSync']);
      }
    } catch (error) {
      console.error('Error handling pending cloud sync:', error);
    }
  }

  // Sync specific tasks to cloud (for background script usage)
  async syncTasksToCloud(tasks) {
    if (!this.isCloudMode || !this.isOnline) {
      console.warn('Skipping cloud sync - not in cloud mode or offline');
      return { success: false, message: 'Not in cloud mode or offline' };
    }

    try {
      // Ensure supabase client is available
      if (!window.supabase) {
        // Try to initialize it
        if (window.initializeSupabase) {
          window.initializeSupabase();
        }
        if (!window.supabase) {
          console.warn('Supabase client not available - check configuration');
          return { success: false, message: 'Supabase not configured' };
        }
      }

      // Get current user
      const { data: { user }, error: userError } = await window.supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Get current tasks from database
      const { data: dbTasks, error: fetchError } = await window.supabase
        .from('taskly_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error(`Failed to fetch tasks: ${fetchError.message}`);
      }

      // Create a map of existing tasks by task_id for quick lookup (not id)
      const dbTaskMap = new Map();
      (dbTasks || []).forEach(task => {
        dbTaskMap.set(task.task_id, task);
      });

      // Process tasks for sync
      const tasksToInsert = [];
      const tasksToUpdate = [];

      for (const task of tasks) {
        const dbTask = dbTaskMap.get(task.id); // Use task.id to match task_id in db
        
        if (!dbTask) {
          // New task - insert it with proper mapping for taskly_tasks table
          const taskDate = new Date(task.dateCreated).toISOString().split('T')[0]; // Get YYYY-MM-DD format
          tasksToInsert.push({
            user_id: user.id,
            task_id: task.id, // Map to task_id column
            text: task.text, // Use text field as it exists in taskly_tasks
            completed: task.completed || false,
            date_created: task.dateCreated,
            task_date: taskDate // Required field in your schema
          });
        } else {
          // Check if task needs updating
          const needsUpdate = 
            task.text !== dbTask.text ||
            task.completed !== dbTask.completed;
          
          if (needsUpdate) {
            tasksToUpdate.push({
              task_id: task.id,
              text: task.text,
              completed: task.completed || false,
              date_created: task.dateCreated
            });
          }
        }
      }

      // Perform batch operations
      let insertCount = 0;
      let updateCount = 0;

      // Insert new tasks
      if (tasksToInsert.length > 0) {
        const { error } = await window.supabase
          .from('taskly_tasks')
          .insert(tasksToInsert);
        
        if (error) {
          throw new Error(`Failed to insert tasks: ${error.message}`);
        }
        insertCount = tasksToInsert.length;
      }

      // Update existing tasks
      for (const taskUpdate of tasksToUpdate) {
        const { error } = await window.supabase
          .from('taskly_tasks')
          .update(taskUpdate)
          .eq('task_id', taskUpdate.task_id) // Use task_id instead of id
          .eq('user_id', user.id);
        
        if (error) {
          console.error(`Failed to update task ${taskUpdate.id}:`, error);
        } else {
          updateCount++;
        }
      }

      console.log(`Cloud sync completed: ${insertCount} inserted, ${updateCount} updated`);
      return {
        success: true,
        inserted: insertCount,
        updated: updateCount
      };

    } catch (error) {
      console.error('Error syncing tasks to cloud:', error);
      throw error;
    }
  }

  // Set up listener for refresh signals from content script  
  setupRefreshListener() {
    // Listen for storage changes that signal a refresh is needed
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local') {
        // Handle refresh signals
        if (changes.tasklyRefreshSignal) {
          console.log('Refresh signal received from content script');
          this.loadTasks();
        }
        
        // Handle force refresh (immediate cloud reload)
        if (changes.forceRefresh && this.isCloudMode) {
          console.log('Force refresh signal received - reloading from cloud');
          this.loadTasksFromCloud();
        }
      }
    });

    // Listen for messages from background script AND content script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('Popup received message:', message);
      
      if (message.action === 'refreshPopupData') {
        console.log('Refresh message received - reloading tasks');
        this.loadTasks();
        sendResponse({ success: true });
      } else if (message.action === 'forcePopupRefresh') {
        console.log('Force refresh message received - reloading from cloud immediately');
        if (this.isCloudMode) {
          this.loadTasksFromCloud().then(() => {
            sendResponse({ success: true });
          }).catch(error => {
            console.error('Error in force refresh:', error);
            sendResponse({ success: false, error: error.message });
          });
        } else {
          this.loadTasks();
          sendResponse({ success: true });
        }
        return true; // Keep message channel open for async response
      }
    });
  }

  // Check for pending refresh signals when popup opens
  async checkPendingRefreshSignals() {
    try {
      const result = await chrome.storage.local.get(['tasklyRefreshSignal', 'forceRefresh']);
      
      // Check for refresh signal from content script
      if (result.tasklyRefreshSignal) {
        console.log('Found pending refresh signal - reloading tasks');
        await this.loadTasks();
        // Clear the signal
        await chrome.storage.local.remove(['tasklyRefreshSignal']);
      }
      
      // Check for force refresh (cloud reload)
      if (result.forceRefresh && this.isCloudMode) {
        console.log('Found pending force refresh signal - reloading from cloud');
        await this.loadTasksFromCloud();
        // Clear the signal
        await chrome.storage.local.remove(['forceRefresh']);
      }
    } catch (error) {
      console.error('Error checking pending refresh signals:', error);
    }
  }

  showAuthenticationOptions() {
    // Hide main interface
    document.getElementById('mainView').style.display = 'none';
    document.getElementById('statsView').style.display = 'none';
    
    // Show authentication screen
    const authScreen = document.getElementById('authRequiredScreen');
    authScreen.classList.remove('hidden');
    
    // Setup event listeners for auth options
    document.getElementById('continueAsGuestBtn').addEventListener('click', async () => {
      await this.selectGuestMode();
    });
    
    document.getElementById('createAccountBtn').addEventListener('click', () => {
      this.openLoginPage('signup');
    });
    
    document.getElementById('signInExistingBtn').addEventListener('click', () => {
      this.openLoginPage('signin');
    });
  }

  async selectGuestMode() {
    // Set guest mode
    this.isGuestMode = true;
    this.isCloudMode = false;
    await this.initGuestMode();
    
    // Hide auth screen and show main interface
    document.getElementById('authRequiredScreen').classList.add('hidden');
    document.getElementById('mainView').style.display = 'block';
    
    // Initialize the rest of the app
    await this.loadTasks();
    this.setupEventListeners();
    this.updateDisplay();
    this.displayCurrentDate();
    this.updateUserInterface();
  }

  openLoginPage(mode = 'signin') {
    // Open login page in new tab
    const loginUrl = chrome.runtime.getURL('login.html') + (mode === 'signup' ? '#signup' : '#signin');
    chrome.tabs.create({ url: loginUrl });
    window.close();
  }

  updateUserInterface() {
    // Update user menu based on mode
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userMenuDropdown = document.getElementById('userMenuDropdown');
    const userInfo = document.getElementById('userInfo');
    const guestInfo = document.getElementById('guestInfo');
    const userEmail = document.getElementById('userEmail');
    const signOutBtn = document.getElementById('signOutBtn');
    const upgradeToCloudBtn = document.getElementById('upgradeToCloudBtn');

    // Add user status indicator
    this.addUserStatusIndicator();

    if (this.isGuestMode) {
      // Guest mode - show guest info
      if (userMenuBtn) userMenuBtn.style.display = 'block';
      if (userMenuDropdown) userMenuDropdown.style.display = 'block';
      if (userInfo) userInfo.classList.add('hidden');
      if (guestInfo) guestInfo.classList.remove('hidden');
      
      // Add upgrade to cloud functionality
      if (upgradeToCloudBtn) {
        upgradeToCloudBtn.addEventListener('click', () => {
          this.upgradeToCloud();
        });
      }
    } else if (this.isCloudMode) {
      // Cloud mode - show authenticated user info
      if (userMenuBtn) userMenuBtn.style.display = 'block';
      if (userMenuDropdown) userMenuDropdown.style.display = 'block';
      if (userInfo) userInfo.classList.remove('hidden');
      if (guestInfo) guestInfo.classList.add('hidden');
      if (userEmail) userEmail.textContent = tasklyAuth.getUserEmail();
    }
  }

  upgradeToCloud() {
    // Show upgrade options
    const upgradeHtml = `
      <div class="upgrade-overlay">
        <div class="upgrade-content">
          <h3>Upgrade to Cloud Sync</h3>
          <p>Save your tasks to the cloud and sync across all your devices.</p>
          <div class="data-migration-info">
            <div class="info-item">
              <span class="info-icon">📤</span>
              <span>Your existing tasks will be backed up to the cloud</span>
            </div>
            <div class="info-item">
              <span class="info-icon">🔄</span>
              <span>Future tasks will sync automatically</span>
            </div>
          </div>
          <div class="upgrade-options">
            <button id="upgradeSignInBtn" class="btn-primary">Sign In to Existing Account</button>
            <button id="upgradeCreateBtn" class="btn-secondary">Create New Account</button>
            <button id="upgradeCancelBtn" class="btn-cancel">Cancel</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', upgradeHtml);
    
    // Add event listeners
    document.getElementById('upgradeSignInBtn').addEventListener('click', () => {
      this.openLoginPage('signin');
    });
    
    document.getElementById('upgradeCreateBtn').addEventListener('click', () => {
      this.openLoginPage('signup');
    });
    
    document.getElementById('upgradeCancelBtn').addEventListener('click', () => {
      document.querySelector('.upgrade-overlay').remove();
    });
  }

  // Handle successful authentication when upgrading from guest mode
  async handleSuccessfulAuth(userId) {
    if (this.isGuestMode) {
      // User was in guest mode, now authenticated - migrate data
      const migration = new TasklyMigration();
      
      try {
        migration.showMigrationProgress('Migrating your tasks to the cloud...');
        
        const result = await migration.migrateGuestToCloud(userId);
        
        if (result.success) {
          migration.showMigrationProgress(`Successfully migrated ${result.migratedCount} tasks!`);
          
          // Switch to cloud mode
          this.isGuestMode = false;
          this.isCloudMode = true;
          this.userId = userId;
          
          setTimeout(() => {
            migration.hideMigrationProgress();
            // Reload tasks from cloud
            this.loadTasks();
            this.updateUserInterface();
          }, 2000);
        } else {
          migration.hideMigrationProgress();
          console.error('Migration failed:', result.error);
          // Continue anyway, user can manually re-enter tasks
        }
        
      } catch (error) {
        migration.hideMigrationProgress();
        console.error('Migration error:', error);
      }
    }
  }

  addUserStatusIndicator() {
    // Remove existing indicator
    const existingIndicator = document.querySelector('.user-status');
    if (existingIndicator) {
      existingIndicator.remove();
    }

    // Add new status indicator
    const header = document.querySelector('.taskly-header');
    const statusIndicator = document.createElement('div');
    statusIndicator.className = `user-status ${this.isGuestMode ? 'guest' : 'cloud'}`;
    
    if (this.isGuestMode) {
      statusIndicator.innerHTML = `
        <div class="user-status-icon"></div>
        <span>Guest Mode</span>
      `;
    } else {
      statusIndicator.innerHTML = `
        <div class="user-status-icon"></div>
        <span>Cloud Sync</span>
      `;
    }
    
    header.appendChild(statusIndicator);
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

    // Stats toggle
    const statsToggleBtn = document.getElementById('statsToggleBtn');
    statsToggleBtn.addEventListener('click', () => this.toggleStatsView());

    // Year selector
    const yearSelector = document.getElementById('yearSelector');
    yearSelector.addEventListener('change', () => this.onYearChange());

    // User menu
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userMenuDropdown = document.getElementById('userMenuDropdown');
    
    if (userMenuBtn && userMenuDropdown) {
      userMenuBtn.addEventListener('click', () => {
        userMenuDropdown.classList.toggle('hidden');
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!userMenuBtn.contains(e.target) && !userMenuDropdown.contains(e.target)) {
          userMenuDropdown.classList.add('hidden');
        }
      });

      // Sign out button
      const signOutBtn = document.getElementById('signOutBtn');
      if (signOutBtn) {
        signOutBtn.addEventListener('click', async () => {
          await this.handleSignOut();
        });
      }
    }

    // Focus on input when popup opens
    taskInput.focus();
  }

  async handleSignOut() {
    try {
      if (this.isCloudMode) {
        await tasklyAuth.signOut();
      }
      
      // Clear guest mode flag as well
      await chrome.storage.local.remove(['tasklyGuestMode']);
      
      // Reload the popup to show auth required screen
      window.location.reload();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      if (this.isCloudMode) {
        this.syncWithCloud();
      }
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  async syncWithCloud() {
    if (!this.isCloudMode || !this.isOnline) return;
    
    try {
      // Sync today's tasks
      await this.syncTodaysTasks();
      
      // Show sync status briefly
      this.showSyncStatus('✓ Synced');
    } catch (error) {
      console.error('Sync failed:', error);
      this.showSyncStatus('⚠ Sync failed');
    }
  }

  showSyncStatus(message) {
    // You can implement a small sync indicator in the UI
    console.log(message);
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
      const today = new Date().toISOString().split('T')[0];
      
      if (this.isCloudMode && this.isOnline) {
        // Cloud mode - try to load from Supabase first
        try {
          await this.ensureUserExists();
          const cloudTasks = await window.supabase.select('taskly_tasks', {
            eq: { user_id: this.userId, task_date: today },
            order: 'created_at.desc'
          });
          
          this.tasks = cloudTasks.map(task => ({
            id: task.task_id,
            text: task.text,
            completed: task.completed,
            dateCreated: task.date_created
          }));
          
          // Also save to local storage as backup
          await this.saveTasksLocal();
          return;
        } catch (error) {
          console.error('Failed to load from cloud, using local storage:', error);
        }
      }
      
      // Guest mode or fallback - load from local storage
      const result = await chrome.storage.local.get(['tasklyTasks']);
      this.tasks = result.tasklyTasks || [];
      
      // Filter tasks for today only
      const todayStr = new Date().toDateString();
      this.tasks = this.tasks.filter(task => 
        new Date(task.dateCreated).toDateString() === todayStr
      );
    } catch (error) {
      console.error('Error loading tasks:', error);
      this.tasks = [];
    }
  }

  async ensureUserExists() {
    try {
      // Check if user exists in database
      const existingUsers = await window.supabase.select('taskly_users', {
        eq: { user_id: this.userId }
      });
      
      if (existingUsers.length === 0) {
        // Create user record
        await window.supabase.insert('taskly_users', {
          user_id: this.userId
        });
      }
    } catch (error) {
      console.error('Error ensuring user exists:', error);
    }
  }

  async saveTasks() {
    try {
      // Always save to local storage first
      await this.saveTasksLocal();
      
      // If cloud mode and online, sync to cloud
      if (this.isCloudMode && this.isOnline) {
        await this.syncTodaysTasks();
      }
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  }

  async saveTasksLocal() {
    try {
      // Save current day tasks to local storage
      await chrome.storage.local.set({ tasklyTasks: this.tasks });
      
      // Also save to historical data with date key for local stats
      const today = new Date().toISOString().split('T')[0];
      const historicalKey = `tasklyTasks_${today}`;
      await chrome.storage.local.set({ [historicalKey]: this.tasks });
    } catch (error) {
      console.error('Error saving tasks locally:', error);
    }
  }

  async syncTodaysTasks() {
    if (!this.isCloudMode || !this.isOnline) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get existing tasks from cloud for today
      const existingTasks = await window.supabase.select('taskly_tasks', {
        eq: { user_id: this.userId, task_date: today }
      });
      
      // Create a map of existing cloud tasks by task_id
      const cloudTasksMap = new Map(existingTasks.map(task => [task.task_id, task]));
      
      // Process each local task
      for (const task of this.tasks) {
        const cloudTask = cloudTasksMap.get(task.id);
        
        if (cloudTask) {
          // Update existing task if different
          if (cloudTask.text !== task.text || cloudTask.completed !== task.completed) {
            await window.supabase.update('taskly_tasks', 
              {
                text: task.text,
                completed: task.completed,
                date_created: task.dateCreated
              },
              {
                eq: { user_id: this.userId, task_id: task.id, task_date: today }
              }
            );
          }
          cloudTasksMap.delete(task.id); // Mark as processed
        } else {
          // Insert new task
          await window.supabase.insert('taskly_tasks', {
            user_id: this.userId,
            task_id: task.id,
            text: task.text,
            completed: task.completed,
            date_created: task.dateCreated,
            task_date: today
          });
        }
      }
      
      // Delete tasks that exist in cloud but not locally (were deleted locally)
      for (const [taskId] of cloudTasksMap) {
        await window.supabase.delete('taskly_tasks', {
          eq: { user_id: this.userId, task_id: taskId, task_date: today }
        });
      }
      
    } catch (error) {
      console.error('Error syncing with cloud:', error);
      throw error;
    }
  }

  // Force load tasks from cloud (bypasses local storage)
  async loadTasksFromCloud() {
    if (!this.isCloudMode || !this.isOnline) {
      console.log('Cloud reload not possible - not in cloud mode or offline');
      return;
    }

    try {
      console.log('Force loading tasks from cloud...');
      const today = new Date().toISOString().split('T')[0];
      
      await this.ensureUserExists();
      const cloudTasks = await window.supabase.select('taskly_tasks', {
        eq: { user_id: this.userId, task_date: today },
        order: 'created_at.desc'
      });
      
      this.tasks = cloudTasks.map(task => ({
        id: task.task_id,
        text: task.text,
        completed: task.completed,
        dateCreated: task.date_created
      }));
      
      // Update local storage with fresh cloud data
      await this.saveTasksLocal();
      
      // Update UI
      this.updateDisplay();
      
      console.log('Successfully loaded fresh data from cloud');
    } catch (error) {
      console.error('Failed to force load from cloud:', error);
      // Fall back to regular loadTasks
      this.loadTasks();
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

  // Stats functionality
  toggleStatsView() {
    const mainView = document.getElementById('mainView');
    const statsView = document.getElementById('statsView');
    const statsToggleBtn = document.getElementById('statsToggleBtn');
    
    if (statsView.classList.contains('active')) {
      // Switch to main view
      statsView.classList.remove('active');
      mainView.classList.remove('hidden');
      statsToggleBtn.innerHTML = '📊 Stats';
    } else {
      // Switch to stats view
      mainView.classList.add('hidden');
      statsView.classList.add('active');
      statsView.classList.add('view-transition');
      statsToggleBtn.innerHTML = '📝 Tasks';
      this.generateStatsView();
    }
  }

  async generateStatsView() {
    try {
      let allData = {};
      
      if (this.isCloudMode && this.isOnline) {
        // Cloud mode - try to get data from Supabase first
        try {
          await this.ensureUserExists();
          
          // Get all tasks for this user
          const cloudTasks = await window.supabase.select('taskly_tasks', {
            eq: { user_id: this.userId },
            order: 'task_date.desc'
          });
          
          // Group tasks by date
          cloudTasks.forEach(task => {
            const dateStr = task.task_date;
            if (!allData[dateStr]) {
              allData[dateStr] = [];
            }
            allData[dateStr].push({
              id: task.task_id,
              text: task.text,
              completed: task.completed,
              dateCreated: task.date_created
            });
          });
          
        } catch (error) {
          console.error('Failed to load stats from cloud, using local data:', error);
          allData = await this.getLocalHistoricalData();
        }
      } else {
        // Guest mode or offline - use local data only
        allData = await this.getLocalHistoricalData();
      }

      this.populateYearSelector(allData);
      this.updateStatsOverview(allData);
      this.generateContributionHeatmap(allData);
    } catch (error) {
      console.error('Error generating stats:', error);
    }
  }

  async getLocalHistoricalData() {
    try {
      // Get all historical data from local storage (fallback)
      const result = await chrome.storage.local.get(null);
      const allData = {};
      
      // Parse all stored data to extract daily task completion
      Object.keys(result).forEach(key => {
        if (key.startsWith('tasklyTasks_')) {
          const date = key.replace('tasklyTasks_', '');
          allData[date] = result[key] || [];
        } else if (key === 'tasklyTasks') {
          // Current day tasks
          const today = new Date().toISOString().split('T')[0];
          allData[today] = result[key] || [];
        }
      });
      
      return allData;
    } catch (error) {
      console.error('Error getting local historical data:', error);
      return {};
    }
  }

populateYearSelector(allData) {
  const yearSelector = document.getElementById('yearSelector');
  const years = new Set();
  
  // Get all years from data
  Object.keys(allData).forEach(dateStr => {
    if (dateStr && dateStr.includes('-')) {
      const year = parseInt(dateStr.split('-')[0]);
      if (!isNaN(year) && year >= 2020 && year <= 2030) { // Reasonable year range
        years.add(year);
      }
    }
  });
  
  // Add current year if not present
  const currentYear = new Date().getFullYear();
  years.add(currentYear);
  
  // Sort years in descending order
  const sortedYears = Array.from(years).sort((a, b) => b - a);
  
  // Store current selection to preserve it
  const currentSelection = yearSelector.value;
  
  // Clear and populate selector
  yearSelector.innerHTML = '';
  
  // Add "Last 365 days" option
  const lastYearOption = document.createElement('option');
  lastYearOption.value = 'last365';
  lastYearOption.textContent = 'Last 365 days';
  yearSelector.appendChild(lastYearOption);
  
  // Add year options
  sortedYears.forEach(year => {
    const option = document.createElement('option');
    option.value = year.toString();
    option.textContent = year.toString();
    yearSelector.appendChild(option);
  });
  
  // Restore selection or default to "Last 365 days"
  if (currentSelection && [...yearSelector.options].some(opt => opt.value === currentSelection)) {
    yearSelector.value = currentSelection;
  } else {
    yearSelector.value = 'last365';
  }
}

  onYearChange() {
    this.generateStatsView();
  }

  updateStatsOverview(allData) {
    const yearSelector = document.getElementById('yearSelector');
    const selectedYear = yearSelector.value;
    
    let filteredData = allData;
    
    // Filter data based on selected year
    if (selectedYear !== 'last365') {
      const year = parseInt(selectedYear);
      filteredData = {};
      Object.keys(allData).forEach(dateStr => {
        const date = new Date(dateStr);
        if (date.getFullYear() === year) {
          filteredData[dateStr] = allData[dateStr];
        }
      });
    } else {
      // Filter to last 365 days
      const today = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(today.getFullYear() - 1);
      oneYearAgo.setDate(today.getDate() + 1);
      
      filteredData = {};
      Object.keys(allData).forEach(dateStr => {
        const date = new Date(dateStr);
        if (date >= oneYearAgo && date <= today) {
          filteredData[dateStr] = allData[dateStr];
        }
      });
    }

    let totalTasks = 0;
    let completedTasks = 0;
    
    Object.values(filteredData).forEach(dayTasks => {
      totalTasks += dayTasks.length;
      completedTasks += dayTasks.filter(task => task.completed).length;
    });

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    document.getElementById('totalTasks').textContent = totalTasks;
    document.getElementById('completedTasks').textContent = completedTasks;
    document.getElementById('completionRate').textContent = completionRate + '%';

    // Calculate streak and best day using filtered data
    const { currentStreak, bestDay } = this.calculateStreakAndBestDay(filteredData);
    document.getElementById('currentStreak').textContent = `${currentStreak} day streak`;
    document.getElementById('bestDay').textContent = `${bestDay} best day`;
  }

  calculateStreakAndBestDay(allData) {
    const dates = Object.keys(allData).sort().reverse();
    let currentStreak = 0;
    let bestDay = 0;
    
    // Calculate current streak
    const today = new Date().toISOString().split('T')[0];
    let checkDate = new Date();
    
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const dayTasks = allData[dateStr] || [];
      const completedCount = dayTasks.filter(task => task.completed).length;
      
      if (completedCount > 0) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
      
      // Don't check beyond 365 days
      if (currentStreak > 365) break;
    }

    // Calculate best day
    Object.values(allData).forEach(dayTasks => {
      const completed = dayTasks.filter(task => task.completed).length;
      if (completed > bestDay) bestDay = completed;
    });

    return { currentStreak, bestDay };
  }

generateContributionHeatmap(allData) {
  const grid = document.getElementById('contributionGrid');
  const monthLabels = document.getElementById('monthLabels');
  const tooltip = document.getElementById('contributionTooltip');
  const yearSelector = document.getElementById('yearSelector');
  const heatmapPeriod = document.getElementById('heatmapPeriod');
  
  // Clear existing content
  grid.innerHTML = '';
  monthLabels.innerHTML = '';
  
  const selectedYear = yearSelector.value;
  let startDate, endDate;
  
  if (selectedYear === 'last365') {
    // Last 365 days from today
    endDate = new Date();
    startDate = new Date();
    startDate.setDate(endDate.getDate() - 364); // 365 days including today
    heatmapPeriod.textContent = 'Last 365 days';
  } else {
    // Specific year - show full calendar year
    const year = parseInt(selectedYear);
    startDate = new Date(year, 0, 1); // January 1st
    endDate = new Date(year, 11, 31); // December 31st
    heatmapPeriod.textContent = `Year ${year}`;
  }
  
  // Find the Sunday before or on the start date (GitHub style)
  const gridStartDate = new Date(startDate);
  const startDayOfWeek = gridStartDate.getDay();
  gridStartDate.setDate(gridStartDate.getDate() - startDayOfWeek);
  
  // Find the Saturday after or on the end date
  const gridEndDate = new Date(endDate);
  const endDayOfWeek = gridEndDate.getDay();
  gridEndDate.setDate(gridEndDate.getDate() + (6 - endDayOfWeek));
  
  // Calculate total weeks
  const totalDays = Math.ceil((gridEndDate - gridStartDate) / (1000 * 60 * 60 * 24)) + 1;
  const totalWeeks = Math.ceil(totalDays / 7);
  
  // Set up the grid
  grid.style.gridTemplateColumns = `repeat(${totalWeeks}, 1fr)`;
  grid.style.gridTemplateRows = 'repeat(7, 1fr)';
  monthLabels.style.gridTemplateColumns = `repeat(${totalWeeks}, 1fr)`;
  
  // Generate month labels
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Track month changes and position labels correctly
  let lastMonth = -1;
  const monthPositions = [];
  
  for (let week = 0; week < totalWeeks; week++) {
    const weekStartDate = new Date(gridStartDate);
    weekStartDate.setDate(gridStartDate.getDate() + (week * 7));
    
    // Only consider weeks that intersect with our actual date range
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekStartDate.getDate() + 6);
    
    if (weekEndDate >= startDate && weekStartDate <= endDate) {
      // Find the first day of this week that's in our range
      let representativeDate = new Date(Math.max(weekStartDate, startDate));
      const currentMonth = representativeDate.getMonth();
      
      if (currentMonth !== lastMonth && week >= 2) { // Don't show month for first 2 weeks if they're partial
        monthPositions.push({ week, month: currentMonth });
        lastMonth = currentMonth;
      }
    }
  }
  
  // Create month label elements
  for (let week = 0; week < totalWeeks; week++) {
    const monthDiv = document.createElement('div');
    monthDiv.style.gridColumn = week + 1;
    monthDiv.className = 'month-label';
    
    // Check if this week should have a month label
    const monthPosition = monthPositions.find(pos => pos.week === week);
    if (monthPosition) {
      monthDiv.textContent = months[monthPosition.month];
      monthDiv.style.fontWeight = '600';
      monthDiv.style.fontSize = '12px';
      monthDiv.style.color = '#666';
    }
    
    monthLabels.appendChild(monthDiv);
  }
  
  // Generate the contribution grid
  // Create array to hold all days
  const allDays = [];
  
  for (let week = 0; week < totalWeeks; week++) {
    for (let day = 0; day < 7; day++) {
      const currentDate = new Date(gridStartDate);
      currentDate.setDate(gridStartDate.getDate() + (week * 7) + day);
      
      const dayElement = document.createElement('div');
      dayElement.className = 'contribution-day';
      
      // Check if this day is within our actual date range
      if (currentDate >= startDate && currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayTasks = allData[dateStr] || [];
        const completedCount = dayTasks.filter(task => task.completed).length;
        
        // Determine contribution level (0-4 for better visual distinction)
        let level = 0;
        if (completedCount >= 1) level = 1;
        if (completedCount >= 3) level = 2;
        if (completedCount >= 5) level = 3;
        if (completedCount >= 8) level = 4;
        
        dayElement.setAttribute('data-level', level);
        dayElement.setAttribute('data-date', dateStr);
        dayElement.setAttribute('data-count', completedCount);
        
        // Add tooltip functionality
        dayElement.addEventListener('mouseenter', (e) => {
          const count = e.target.getAttribute('data-count');
          const date = new Date(e.target.getAttribute('data-date'));
          const formattedDate = date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric',
            year: 'numeric'
          });
          
          const taskText = count === '1' ? 'task' : 'tasks';
          tooltip.innerHTML = `<strong>${count} ${taskText} completed</strong><br>${formattedDate}`;
          tooltip.classList.add('visible');
          
          // Position tooltip
          const rect = e.target.getBoundingClientRect();
          
          // Position tooltip relative to viewport since it's now fixed
          const left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2);
          const top = rect.top - tooltip.offsetHeight - 8;
          
          // Keep tooltip within viewport bounds
          const adjustedLeft = Math.max(8, Math.min(left, window.innerWidth - tooltip.offsetWidth - 8));
          const adjustedTop = Math.max(8, top);
          
          tooltip.style.left = adjustedLeft + 'px';
          tooltip.style.top = adjustedTop + 'px';
        });
        
        dayElement.addEventListener('mouseleave', () => {
          tooltip.classList.remove('visible');
        });
        
      } else {
        // Day is outside our range - make it invisible but keep the space
        dayElement.style.opacity = '0';
        dayElement.style.pointerEvents = 'none';
      }
      
      // Set grid position (column-major order: week first, then day)
      dayElement.style.gridColumn = week + 1;
      dayElement.style.gridRow = day + 1;
      
      grid.appendChild(dayElement);
    }
  }

  // Update legend to match our levels (0-4)
  const legendDays = document.querySelectorAll('.legend-day');
  legendDays.forEach((day, index) => {
    day.setAttribute('data-level', index);
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
