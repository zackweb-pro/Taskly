# 🚀 Taskly Deployment Guide

This guide covers how to build, test, and deploy the Taskly Chrome extension for production.

## 🔧 Prerequisites

- Node.js (v14 or higher)
- Supabase account and project configured
- Environment variables set in `.env` file

## 📋 Pre-Deployment Checklist

### 1. Environment Setup
- [ ] `.env` file exists with correct Supabase credentials
- [ ] Supabase database schema is applied (`supabase_schema.sql`)
- [ ] RLS policies are configured and tested
- [ ] Extension tested in development mode

### 2. Code Validation
- [ ] All features working correctly
- [ ] No console errors in development
- [ ] Offline functionality tested
- [ ] Cross-device sync verified

## 🏗️ Build Process

### Development Build
For local testing with environment variables:
```bash
# Validate environment variables
npm run validate

# Test extension in development mode
# Load the source directory in Chrome directly
```

### Production Build
Creates a production-ready version with credentials properly embedded:
```bash
# Clean build (optional)
npm run build:clean

# Build production version
npm run build
```

This will:
- ✅ Validate all required environment variables
- ✅ Create `dist/` directory
- ✅ Copy all necessary files
- ✅ Replace placeholders with actual credentials
- ✅ Remove development keys from manifest
- ✅ Prepare files for distribution

### Package for Distribution
Creates a ZIP file ready for Chrome Web Store:
```bash
npm run package
```

This creates `taskly-extension.zip` containing the entire extension.

## 🧪 Testing Production Build

### 1. Load in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist/` folder
5. Test all functionality

### 2. Verification Steps
- [ ] Extension loads without errors
- [ ] Can create/edit/delete tasks
- [ ] Tasks sync to Supabase
- [ ] Offline mode works
- [ ] Statistics update correctly
- [ ] No sensitive data in console logs

## 📦 Chrome Web Store Deployment

### 1. Prepare Store Assets
Before uploading, prepare these assets:

**Required:**
- Extension ZIP file (`taskly-extension.zip`)
- Store icon (128x128 PNG)
- Screenshots (1280x800 or 640x400 PNG)
- Detailed description
- Privacy policy URL

**Recommended:**
- Promotional images
- Video demo
- Localized descriptions

### 2. Upload to Chrome Web Store

1. **Go to Developer Dashboard**
   - Visit [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
   - Sign in with your Google account

2. **Create New Item**
   - Click "Add new item"
   - Upload `taskly-extension.zip`
   - Pay the one-time $5 developer fee (if first app)

3. **Fill Store Listing**
   ```
   Name: Taskly - Daily Task Manager
   Summary: Your daily to-do list with cloud sync, always within reach
   Category: Productivity
   Language: English (or your preferred language)
   ```

4. **Add Screenshots and Description**
   - Upload at least 1 screenshot
   - Write compelling description highlighting cloud sync
   - Include privacy policy link

5. **Set Privacy Settings**
   - Declare data usage (tasks are stored in Supabase)
   - Explain cloud storage benefits
   - Link to privacy policy

6. **Submit for Review**
   - Review all information
   - Submit for Google's review process
   - Wait for approval (typically 1-3 business days)

## 🔒 Security Considerations

### Production Security Checklist
- [ ] No hardcoded credentials in source code
- [ ] Environment variables properly replaced at build time
- [ ] Supabase RLS policies restrict data access
- [ ] Extension requests minimal permissions
- [ ] No sensitive data logged to console

### Credential Management
```bash
# Environment variables should be set in your build environment
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"
export BUILD_VERSION="1.0.0"  # Optional

# Run build
npm run build
```

### Supabase Security
- Use anon key (never the service key)
- Enable RLS on all tables
- Test policies with different users
- Monitor usage in Supabase dashboard

## 🚨 Troubleshooting

### Build Issues

**"Missing required environment variables"**
- Verify `.env` file exists
- Check variable names match exactly
- Ensure no extra spaces around values

**"Build directory not created"**
- Check file permissions
- Ensure Node.js has write access
- Try running as administrator (Windows)

### Extension Issues

**Extension won't load**
- Check `dist/manifest.json` is valid
- Verify all referenced files exist
- Look for errors in Chrome's extension console

**Supabase connection fails**
- Verify credentials in built `config.js`
- Check Supabase project is active
- Test API endpoints directly

### Chrome Web Store Issues

**Upload rejected**
- Ensure ZIP contains all required files
- Check manifest version format
- Verify permissions are necessary

**Review rejection**
- Address specific feedback from Google
- Update description if needed
- Resubmit with changes

## 📊 Post-Deployment

### Monitor Extension
- Track user feedback in Chrome Web Store
- Monitor Supabase usage and costs
- Watch for error reports

### Updates
```bash
# For updates, increment version and rebuild
BUILD_VERSION=1.0.1 npm run build
npm run package
```

### Analytics (Optional)
Consider adding:
- Usage analytics (with user consent)
- Error reporting
- Performance monitoring

## 🆘 Support & Maintenance

### Regular Tasks
- [ ] Monitor Supabase usage and costs
- [ ] Review user feedback and ratings
- [ ] Update dependencies regularly
- [ ] Test with Chrome updates

### Emergency Procedures
- Keep rollback plan ready
- Monitor extension status in dashboard
- Have support contact information ready

---

## 📞 Need Help?

- 📖 [Full documentation](./README.md)
- 🐛 [Report issues](https://github.com/your-username/taskly/issues)
- 💬 [Community discussions](https://github.com/your-username/taskly/discussions)

**Good luck with your deployment! 🚀**
