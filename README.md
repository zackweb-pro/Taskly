# 🌟 Taskly — Your Daily To-Do, Always Within Reach

**Taskly** is a sleek and lightweight Chrome extension that keeps your daily tasks just a click away — no matter where you are on the web.

---

## 📌 Features

✅ **Persistent Popup**  
Taskly lives on every page you visit. Tap the floating icon to instantly access your to-do list — without losing focus.

✅ **Daily Focus**  
See only what matters: **Today’s tasks**. Keep your priorities sharp and distractions away.

✅ **Status Tracking**  
Mark tasks as _done_ or _pending_ with one tap. Visual cues help you track your progress at a glance.

✅ **Clean & Minimal UI**  
Designed for simplicity and speed — no clutter, no noise.

✅ **Auto-Save**  
Your tasks are saved automatically using Chrome Storage. No sign-in, no hassle.

---

## 🚀 Getting Started

### 1. Clone or Download the Repo
```bash
git clone https://github.com/your-username/taskly.git
```

### 2. Set Up Icons
The extension needs PNG icon files. You can create them using any of these methods:

**Option A: Use the HTML Generator**
1. Open `generate-icons.html` in your browser
2. Right-click and save each generated icon to the `icons/` folder

**Option B: Convert SVG to PNG**
1. Use an online converter to convert the SVG files in `icons/` to PNG
2. Convert: `icon16.svg` → `icon16.png`, `icon32.svg` → `icon32.png`, etc.

**Option C: Use Provided Script**
```bash
python create_icons.py
```

### 3. Load the Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the Taskly folder
5. The extension should now appear in your extensions list

### 4. Start Using Taskly
- Click the Taskly icon in your browser toolbar to open the popup
- Or look for the floating icon on any webpage (appears after 1 second)
- Add tasks, mark them complete, and stay organized!

---

## 🎯 How It Works

**Daily Reset**  
Tasks are automatically filtered to show only today's items. Yesterday's tasks won't clutter your view.

**Floating Icon**  
Every webpage gets a subtle floating icon in the bottom-right corner. Click it to instantly access your tasks.

**Smart Storage**  
Uses Chrome's local storage API - your data stays private and synced across Chrome sessions.

**Badge Counter**  
The extension icon shows a badge with your pending task count.

---

## 📁 Project Structure

```
taskly/
├── manifest.json          # Extension configuration
├── popup.html            # Main popup interface
├── popup.css             # Popup styling
├── popup.js              # Popup functionality
├── content.js            # Floating icon script
├── content.css           # Floating icon styles
├── background.js         # Background service worker
├── icons/                # Extension icons
│   ├── icon16.png        # 16x16 toolbar icon
│   ├── icon32.png        # 32x32 favicon
│   ├── icon48.png        # 48x48 extension page
│   └── icon128.png       # 128x128 store listing
├── generate-icons.html   # Icon generator tool
└── README.md            # This file
```

---

## 🔧 Technical Details

**Manifest V3**  
Built with the latest Chrome Extension Manifest V3 for future compatibility.

**Permissions**  
- `storage`: Save tasks locally
- `activeTab`: Insert floating icon on current page

**Content Security Policy**  
Follows Chrome's strict CSP requirements with no inline scripts.

---

## 🚀 Features in Detail

### Persistent Popup
- **Smart Positioning**: Popup appears near the extension icon
- **Focus Management**: Input field auto-focuses for quick task entry
- **Responsive Design**: Works well at different popup sizes

### Daily Focus
- **Date Display**: Shows current date prominently
- **Automatic Filtering**: Only today's tasks are visible
- **Task Counter**: Live count of total and pending tasks

### Status Tracking
- **One-Click Toggle**: Click anywhere on task to mark complete
- **Visual Feedback**: Completed tasks are dimmed and crossed out
- **Batch Operations**: Clear all completed tasks with one button

### Clean & Minimal UI
- **Modern Design**: Gradient backgrounds and smooth animations
- **Accessible**: Proper contrast and focus states
- **Mobile-Ready**: Responsive design works on all screen sizes

### Auto-Save
- **Instant Sync**: Tasks save immediately when added or modified
- **Persistent Storage**: Data survives browser restarts
- **No Account Needed**: Everything stored locally for privacy

---

## 🎨 Customization

You can easily customize Taskly by modifying:

- **Colors**: Edit the CSS gradient values in `popup.css` and `content.css`
- **Icon Position**: Change the floating icon location in `content.css`
- **Task Limit**: Modify the input `maxlength` in `popup.html`
- **Animations**: Adjust transition timings in the CSS files

---

## 🐛 Troubleshooting

**Extension Won't Load**
- Make sure all PNG icon files exist in the `icons/` folder
- Check that `manifest.json` is valid JSON
- Reload the extension in `chrome://extensions/`

**Floating Icon Not Appearing**
- Check if the page allows content scripts (some sites block them)
- Try refreshing the page after loading the extension
- Icon won't appear on `chrome://` or extension pages

**Tasks Not Saving**
- Make sure the extension has storage permissions
- Check for JavaScript errors in the popup developer tools
- Try reloading the extension

---

## 📈 Future Enhancements

- [ ] **Categories**: Organize tasks into different categories
- [ ] **Due Dates**: Set specific times for task completion
- [ ] **Sync**: Optional cloud sync between devices
- [ ] **Themes**: Multiple color schemes
- [ ] **Keyboard Shortcuts**: Quick access hotkeys
- [ ] **Task History**: View previously completed tasks
- [ ] **Export**: Backup tasks to file

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit with clear messages: `git commit -m "Add feature description"`
5. Push and create a pull request

---

## 📝 License

MIT License - feel free to use, modify, and distribute.

---

## 💡 Tips for Daily Use

- **Morning Setup**: Add your daily tasks first thing in the morning
- **Quick Access**: Use the floating icon instead of switching tabs
- **End of Day**: Clear completed tasks to start fresh tomorrow
- **Focus Mode**: Keep only 3-5 high-priority tasks visible

**Made with ❤️ for productivity enthusiasts**
