# 🌟 Taskly — Your Daily To-Do, Always Within Reach

**Taskly** is a sleek and lightweight Chrome extension that keeps your daily tasks just a click away — no matter where you are on the web. Now with **cloud storage** powered by Supabase, your tasks sync across all your devices and are never lost.

---

## 📌 Features

✅ **Cloud Storage**  
Your tasks are securely stored in the cloud using Supabase. Access them from any device and never lose your data.

✅ **Offline Support**  
Works offline with automatic sync when you're back online. Local storage backup ensures nothing is lost.

✅ **Daily Focus**  
See only what matters: **Today's tasks**. Keep your priorities sharp and distractions away.

✅ **Status Tracking**  
Mark tasks as _done_ or _pending_ with one tap. Visual cues help you track your progress at a glance.

✅ **Statistics**  
Track your productivity with daily statistics showing completed vs total tasks.

✅ **Clean & Minimal UI**  
Designed for simplicity and speed — no clutter, no noise.

✅ **Secure Configuration**  
All sensitive credentials are managed securely with environment variables and build-time replacement.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- A Supabase account and project

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/taskly.git
cd taskly
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Supabase
1. Create a new project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Run the SQL schema from `supabase_schema.sql` in your Supabase SQL editor
4. See `SUPABASE_SETUP.md` for detailed setup instructions

### 4. Configure Environment Variables
Create a `.env` file in the project root:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Development
For development, load the extension directly:
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select this project folder

### 6. Production Build
For production deployment:
```bash
npm run build
```
This creates a `dist/` folder with all placeholders replaced by actual environment variables.

### 7. Package for Distribution
```bash
npm run package
```
This creates a `taskly-extension.zip` file ready for Chrome Web Store upload.

---

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Instructions for development mode |
| `npm run build` | Build production version with environment variables |
| `npm run build:clean` | Clean build directory and rebuild |
| `npm run package` | Create distributable ZIP file |
| `npm run validate` | Validate environment variables |

---

## 🏗️ Project Structure

```
taskly/
├── .env                 # Environment variables (not in git)
├── .env.example         # Environment variables template
├── build.js             # Production build script
├── config.js            # Configuration management
├── supabase.js          # Supabase client setup
├── popup.html           # Extension popup UI
├── popup.js             # Main application logic
├── popup.css            # Styles
├── manifest.json        # Extension manifest
├── background.js        # Background script (if needed)
├── supabase_schema.sql  # Database schema
├── SUPABASE_SETUP.md    # Supabase setup guide
├── package.json         # Node.js dependencies and scripts
└── dist/               # Production build output (generated)
```

---

## 🔒 Security Features

### Environment Variable Management
- All sensitive credentials are stored in `.env` file (never committed to git)
- Production builds use placeholder replacement for secure deployment
- Build-time environment variable injection prevents credential exposure

### Supabase Security
- Row Level Security (RLS) policies protect user data
- User authentication ensures data isolation
- Secure API key management with anon key limitations

### Chrome Extension Security
- Minimal permissions requested
- Content Security Policy (CSP) compliant
- Secure credential handling without exposure in source code

---

## 🌐 Browser Compatibility

- **Chrome**: Fully supported (Manifest V3)
- **Edge**: Compatible (Chromium-based)
- **Firefox**: Not yet supported (different extension API)

---

## 🔧 Development

### Local Development
1. Make sure you have your `.env` file configured
2. Load the extension in Chrome using "Load unpacked"
3. Make changes to source files
4. Reload the extension in `chrome://extensions/`

### Testing
- Test with and without internet connection to verify offline functionality
- Test with multiple Chrome profiles to verify user isolation
- Test extension reload to ensure data persistence

### Adding Features
1. Update the UI in `popup.html` and `popup.css`
2. Add logic in `popup.js`
3. Update Supabase schema if needed (`supabase_schema.sql`)
4. Test thoroughly in development mode
5. Build and test production version

---

## 📦 Deployment

### Chrome Web Store
1. Run `npm run package` to create the ZIP file
2. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
3. Upload the ZIP file
4. Fill in store listing information
5. Submit for review

### Environment Variables for Production
Set these in your build environment:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `BUILD_VERSION` (optional): Version number for the build

---

## 🐛 Troubleshooting

### Common Issues

**Extension not loading:**
- Check that all icon files exist (icon16.png, icon48.png, icon128.png)
- Verify manifest.json is valid JSON
- Check browser console for errors

**Supabase connection issues:**
- Verify `.env` file has correct credentials
- Check Supabase project is active
- Verify RLS policies are set up correctly

**Build failures:**
- Ensure Node.js is installed (v14+)
- Run `npm install` to install dependencies
- Check that all environment variables are set

**Data not syncing:**
- Check internet connection
- Verify Supabase credentials
- Check browser console for network errors

### Debug Mode
Enable debug logging by setting `DEBUG=true` in your environment variables.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Commit: `git commit -m "Add feature"`
6. Push: `git push origin feature-name`
7. Open a pull request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) for the backend infrastructure
- [Chrome Extensions API](https://developer.chrome.com/docs/extensions/) for the platform
- The open-source community for inspiration and tools

---

## 📞 Support

- 🐛 [Report Issues](https://github.com/your-username/taskly/issues)
- 📧 [Email Support](mailto:support@yourapp.com)
- 💬 [Discussions](https://github.com/your-username/taskly/discussions)

---

**Made with ❤️ for productivity enthusiasts**
