// Migration utilities for Taskly extension
// Helps users transition between guest and cloud modes

class TasklyMigration {
  constructor() {
    this.isOnline = navigator.onLine;
  }

  // Migrate from guest mode to cloud mode
  async migrateGuestToCloud(userId) {
    try {
      console.log('Starting migration from guest to cloud mode...');
      
      // Get all local tasks
      const result = await chrome.storage.local.get(null);
      const tasksToMigrate = [];
      
      // Collect all task data
      Object.keys(result).forEach(key => {
        if (key === 'tasklyTasks') {
          // Current tasks
          const tasks = result[key] || [];
          tasks.forEach(task => {
            const taskDate = new Date(task.dateCreated).toISOString().split('T')[0];
            tasksToMigrate.push({
              user_id: userId,
              task_id: task.id,
              text: task.text,
              completed: task.completed,
              date_created: task.dateCreated,
              task_date: taskDate
            });
          });
        } else if (key.startsWith('tasklyTasks_')) {
          // Historical tasks
          const dateStr = key.replace('tasklyTasks_', '');
          const tasks = result[key] || [];
          tasks.forEach(task => {
            tasksToMigrate.push({
              user_id: userId,
              task_id: task.id,
              text: task.text,
              completed: task.completed,
              date_created: task.dateCreated,
              task_date: dateStr
            });
          });
        }
      });

      // Remove duplicates (in case same task exists in both current and historical)
      const uniqueTasks = [];
      const seenTaskIds = new Set();
      
      tasksToMigrate.forEach(task => {
        const key = `${task.task_id}-${task.task_date}`;
        if (!seenTaskIds.has(key)) {
          seenTaskIds.add(key);
          uniqueTasks.push(task);
        }
      });

      console.log(`Found ${uniqueTasks.length} unique tasks to migrate`);

      // Upload to Supabase in batches
      const batchSize = 50;
      let migratedCount = 0;
      
      for (let i = 0; i < uniqueTasks.length; i += batchSize) {
        const batch = uniqueTasks.slice(i, i + batchSize);
        
        try {
          // Insert batch
          for (const task of batch) {
            await supabase.insert('taskly_tasks', task);
            migratedCount++;
          }
          
          console.log(`Migrated batch ${Math.floor(i/batchSize) + 1}, total: ${migratedCount}`);
        } catch (error) {
          console.error('Error migrating batch:', error);
          // Continue with next batch
        }
      }

      // Clear guest mode flag
      await chrome.storage.local.remove(['tasklyGuestMode']);
      
      console.log(`Migration completed! Migrated ${migratedCount} tasks to cloud.`);
      return { success: true, migratedCount };
      
    } catch (error) {
      console.error('Migration failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Backup cloud data to local storage before switching to guest mode
  async backupCloudToLocal(userId) {
    try {
      console.log('Backing up cloud data to local storage...');
      
      if (!this.isOnline) {
        throw new Error('Cannot backup cloud data while offline');
      }

      // Get all cloud tasks
      const cloudTasks = await supabase.select('taskly_tasks', {
        eq: { user_id: userId },
        order: 'task_date.desc'
      });

      // Group by date
      const tasksByDate = {};
      cloudTasks.forEach(task => {
        const dateStr = task.task_date;
        if (!tasksByDate[dateStr]) {
          tasksByDate[dateStr] = [];
        }
        tasksByDate[dateStr].push({
          id: task.task_id,
          text: task.text,
          completed: task.completed,
          dateCreated: task.date_created
        });
      });

      // Save to local storage
      const today = new Date().toISOString().split('T')[0];
      for (const [dateStr, tasks] of Object.entries(tasksByDate)) {
        if (dateStr === today) {
          // Save today's tasks as current tasks
          await chrome.storage.local.set({ tasklyTasks: tasks });
        }
        // Save all tasks with date keys for historical data
        await chrome.storage.local.set({ [`tasklyTasks_${dateStr}`]: tasks });
      }

      console.log(`Backed up ${cloudTasks.length} tasks from cloud to local storage`);
      return { success: true, backedUpCount: cloudTasks.length };
      
    } catch (error) {
      console.error('Backup failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Show migration progress to user
  showMigrationProgress(message, progress = null) {
    // Create or update progress indicator
    let progressElement = document.getElementById('migrationProgress');
    
    if (!progressElement) {
      progressElement = document.createElement('div');
      progressElement.id = 'migrationProgress';
      progressElement.className = 'migration-progress';
      progressElement.innerHTML = `
        <div class="migration-content">
          <div class="migration-spinner"></div>
          <div class="migration-message"></div>
          <div class="migration-bar" style="display: none;">
            <div class="migration-bar-fill"></div>
          </div>
        </div>
      `;
      document.body.appendChild(progressElement);
    }

    const messageEl = progressElement.querySelector('.migration-message');
    const barEl = progressElement.querySelector('.migration-bar');
    const fillEl = progressElement.querySelector('.migration-bar-fill');

    messageEl.textContent = message;

    if (progress !== null) {
      barEl.style.display = 'block';
      fillEl.style.width = `${progress}%`;
    }
  }

  hideMigrationProgress() {
    const progressElement = document.getElementById('migrationProgress');
    if (progressElement) {
      progressElement.remove();
    }
  }
}

// Make it available globally
if (typeof window !== 'undefined') {
  window.TasklyMigration = TasklyMigration;
}
