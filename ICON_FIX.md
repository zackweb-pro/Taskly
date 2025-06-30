# Quick Icon Fix Guide

## Problem
Extension icons are not loading in Chrome, likely due to:
1. Extension needs to be reloaded after build
2. Icon files might be corrupted or same size
3. Path issues in manifest.json

## Solutions

### Solution 1: Reload Extension (Try this first)
1. Go to `chrome://extensions/`
2. Find Taskly extension
3. Click the reload button (🔄)
4. Check if icon appears

### Solution 2: Generate New Icons
1. Open `generate-icons.html` in browser
2. Click each canvas to download proper sized icons
3. Replace files in `icons/` folder
4. Run `npm run build`
5. Reload extension in Chrome

### Solution 3: Verify File Paths
The build script should create this structure:
```
dist/
  icons/
    icon16.png
    icon32.png  
    icon48.png
    icon128.png
  manifest.json (referencing icons/icon*.png)
```

### Solution 4: Debug the Issue
1. Open Chrome DevTools
2. Go to Extensions tab
3. Look for any error messages about missing files
4. Check if icon paths in manifest.json are correct

## Current Status
✅ Build script copies icons correctly
✅ Manifest.json has correct paths
✅ Icon files exist in dist/icons/
❓ Icons may need to be reloaded in Chrome

## Next Steps
1. Try Solution 1 (reload extension)
2. If that fails, try Solution 2 (new icons)
3. Check Chrome DevTools for specific errors
