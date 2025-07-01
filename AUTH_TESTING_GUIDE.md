# 🔧 Taskly Authentication Testing & Troubleshooting Guide

## 🚀 Testing the Authentication System

### **Step 1: Load the Extension**
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `c:\Users\zackweb\Desktop\Taskly\dist` folder
5. Extension should appear in your extensions list

### **Step 2: Test First-Time Experience**
1. Click the Taskly extension icon in your browser toolbar
2. You should see the **authentication required screen** with:
   - Welcome message explaining benefits
   - "Create Account" button (blue)
   - "Sign In" button (gray outline)
   - Three benefit items with icons

### **Step 3: Test Account Creation**
1. Click "Create Account" button
2. New tab should open with login.html
3. Sign-up form should be visible
4. Enter test email and password
5. Check browser console (F12) for debug messages
6. Should see "Sign up form submitted" and response logs

### **Step 4: Test Sign In**
1. From login page, click "Already have an account? Sign in"
2. Sign-in form should appear
3. Enter credentials and submit
4. Check console for "Sign in form submitted" and response

### **Step 5: Test Forgot Password**
1. From sign-in form, click "Forgot password?"
2. Password reset form should appear
3. Enter email and submit
4. Check console for "Forgot password form submitted"

---

## 🔍 Debugging Common Issues

### **Issue: Extension Shows Regular Interface Instead of Auth Required**
**Cause**: User might already be "logged in" from previous testing
**Solution**:
```javascript
// Open browser console and run:
chrome.storage.local.clear();
// Then reload the extension
```

### **Issue: "Supabase client not initialized" Error**
**Cause**: Config or Supabase not loaded properly
**Solution**:
1. Check browser console for config errors
2. Verify `.env` file has correct credentials
3. Ensure build process completed successfully

### **Issue: "Network error" on Authentication**
**Cause**: Supabase URL or API key incorrect
**Solution**:
1. Verify Supabase project URL in `.env`
2. Check Supabase project is active
3. Verify API key is the "anon public" key, not service key

### **Issue: Forms Not Submitting**
**Cause**: JavaScript errors or event listeners not attached
**Solution**:
1. Open browser console (F12)
2. Look for JavaScript errors
3. Check that debug messages appear when clicking buttons

---

## 🛠️ Manual Testing Checklist

### **Authentication Flow**
- [ ] Extension shows auth required screen on first load
- [ ] "Create Account" button opens login page in new tab
- [ ] "Sign In" button opens login page in new tab
- [ ] Login page shows correct form based on URL hash
- [ ] Form validation works (password length, email format)
- [ ] Console shows debug messages for all form submissions

### **API Communication**
- [ ] No CORS errors in console
- [ ] Supabase endpoints return proper responses
- [ ] Authentication tokens are stored in Chrome storage
- [ ] Error messages are user-friendly

### **User Experience**
- [ ] Forms are visually appealing and responsive
- [ ] Loading states show during API calls
- [ ] Success/error messages are clear
- [ ] Page closes automatically after successful auth

---

## 📋 Debug Console Commands

### **Check Authentication Status**
```javascript
// Check if user is logged in
console.log('Auth status:', tasklyAuth.isLoggedIn());
console.log('Current user:', tasklyAuth.currentUser);
```

### **Check Stored Session**
```javascript
// View stored session data
chrome.storage.local.get(['tasklySession'], (result) => {
    console.log('Stored session:', result.tasklySession);
});
```

### **Clear All Data**
```javascript
// Reset everything for fresh testing
chrome.storage.local.clear();
console.log('Storage cleared - reload extension');
```

### **Test Supabase Connection**
```javascript
// Test basic Supabase connectivity
fetch('https://mksxrwldbhknicbbmssz.supabase.co/rest/v1/', {
    headers: { 'apikey': 'your-anon-key' }
}).then(r => console.log('Supabase connection:', r.status));
```

---

## 🔧 Supabase Configuration Checklist

### **Authentication Settings**
1. Go to Supabase Dashboard → Authentication → Settings
2. **Enable email confirmations** (optional for testing)
3. **Configure site URL** to your extension's URL
4. **Set up email templates** for signup/reset

### **Database Setup**
1. Ensure all tables exist (`taskly_users`, `taskly_tasks`, `taskly_daily_stats`)
2. **Row Level Security (RLS) is enabled** on all tables
3. **Proper RLS policies** are in place
4. **Triggers are active** for updated_at fields

### **API Keys**
1. Use **anon/public key** (not service key)
2. **Project URL** matches exactly in `.env`
3. **No extra slashes** in URLs

---

## 🚨 Common Error Messages & Solutions

### **"Invalid API key"**
- Check your Supabase anon key is correct
- Ensure no extra spaces in `.env` file
- Verify project URL matches your Supabase project

### **"Email not confirmed"**
- Check Supabase auth settings
- Look for confirmation email
- Disable email confirmation for testing

### **"Row Level Security" errors**
- Check RLS policies in Supabase
- Ensure policies allow INSERT/SELECT for authenticated users
- Verify user_id column exists and is properly referenced

### **"CORS" errors**
- Add extension host permissions to manifest.json
- Check Supabase CORS settings
- Verify you're using the correct auth endpoints

---

## 📞 Testing Workflow

### **Quick Test Sequence:**
1. **Clear storage**: `chrome.storage.local.clear()`
2. **Reload extension**: Right-click → Reload
3. **Open extension**: Click icon, should show auth screen
4. **Try signup**: Click "Create Account", fill form, submit
5. **Check console**: Look for debug messages and responses
6. **Check storage**: Verify session data is saved
7. **Test persistence**: Close/reopen extension

### **If Issues Persist:**
1. Check all console error messages
2. Verify Supabase project is active and accessible
3. Test API endpoints directly in browser
4. Ensure all files were built correctly in `dist/` folder
5. Try with a different email address

---

## ✅ Success Indicators

When everything works correctly, you should see:
- **Auth required screen** on first load
- **Login forms** working smoothly
- **Console debug messages** showing API responses
- **Session storage** containing JWT tokens
- **Automatic redirect** after successful auth
- **Persistent login** across browser sessions

**The authentication system is now fully implemented and ready for testing!** 🎉
