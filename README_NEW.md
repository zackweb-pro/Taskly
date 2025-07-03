# 🌟 Taskly — Smart To-Do List with Cloud Sync

**Taskly** is a powerful Chrome extension that puts your daily tasks at your fingertips — with instant cloud sync across all your devices!

---

## 📌 Features

✅ **Floating Bubble Interface**  
Access your tasks on any website with a single click — without losing focus on what you're doing.

✅ **Instant Cloud Sync**  
Your tasks automatically sync across all your Chrome browsers. Add a task on your laptop, see it on your phone!

✅ **Guest Mode Available**  
Don't want to create an account? Use guest mode for local-only storage.

✅ **Daily Focus**  
See only what matters: **Today's tasks**. Keep your priorities sharp and distractions away.

✅ **Smart Task Management**  
✓ Quick add/edit/delete  
✓ Mark as complete with one click  
✓ Visual progress tracking  
✓ Task statistics and insights  

✅ **Zero Configuration**  
Just install and go! Cloud sync works out of the box.

✅ **Migration Support**  
Start in guest mode, upgrade to cloud sync later — your data comes with you.

---

## 🚀 Getting Started

### Option 1: Install from Chrome Web Store
*[Link will be added once published]*

### Option 2: Install Manually
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" 
4. Click "Load unpacked" and select the extension folder
5. Pin the extension to your toolbar

### First Use
1. Click the Taskly icon in your toolbar
2. Choose **"Create Account"** for cloud sync or **"Continue as Guest"** for local storage
3. Start adding tasks!

---

## 💡 How to Use

### Adding Tasks
- Click the floating bubble on any website
- Type your task and press Enter or click +
- Or use the main popup from the toolbar

### Managing Tasks  
- **Complete**: Click the checkbox next to any task
- **Delete**: Click the × button  
- **Clear Completed**: Use the "Clear Completed" button

### Cloud Sync
- **Automatic**: Tasks sync instantly when you're signed in
- **Cross-device**: Works across all your Chrome browsers
- **Offline Support**: Tasks are cached locally and sync when you're back online

### Guest Mode
- **Local Storage**: All tasks stay on your device
- **No Account Needed**: Start using immediately  
- **Easy Upgrade**: Switch to cloud sync anytime

---

## 🔧 Technical Details

- **Framework**: Vanilla JavaScript (no dependencies!)
- **Storage**: Chrome Storage API + Supabase for cloud sync
- **Authentication**: Built-in user management
- **Permissions**: Minimal — only what's needed for core functionality

---

## 📝 Privacy & Data

- **Your Choice**: Use guest mode for 100% local storage, or cloud sync for convenience
- **Secure**: All cloud data is encrypted and stored securely
- **Minimal**: We only collect what's needed for the app to function
- **Transparent**: No tracking, no ads, no data selling

---

## 🛠️ For Developers

### Building the Extension
```bash
node build.js
```

### Project Structure
```
taskly/
├── manifest.json          # Extension manifest
├── popup.html/js/css       # Main interface
├── content.js/css          # Floating bubble
├── background.js           # Service worker
├── auth.js                 # Authentication
├── supabase.js            # Database client
└── config.js              # Configuration
```

### Tech Stack
- **Frontend**: Vanilla JS, CSS3
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Chrome Storage API + Cloud sync

---

## 🚀 Roadmap

- [ ] Mobile companion app
- [ ] Task categories and tags
- [ ] Recurring tasks
- [ ] Team collaboration
- [ ] Advanced analytics
- [ ] Dark mode
- [ ] Keyboard shortcuts

---

## 📄 License

MIT License - feel free to fork, modify, and distribute!

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 💬 Support

Having issues? Create an issue on GitHub or reach out via email.

---

**Made with ❤️ for productivity enthusiasts everywhere!**
