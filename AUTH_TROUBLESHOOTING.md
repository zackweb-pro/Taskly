# 🔧 Authentication Troubleshooting Guide

## ✅ CSP Issue Fixed!

The Content Security Policy error has been resolved by moving all inline JavaScript from `login.html` to a separate `login.js` file. All authentication functions should now work properly.

---

## 🧪 Testing Steps

### **1. Load the Extension**
```bash
# Make sure you have the latest build
npm run build:clean

# In Chrome:
# 1. Go to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the `dist/` folder
```

### **2. Test Authentication Required Screen**
1. Click the Taskly extension icon
2. Should see welcome screen with "Create Account" and "Sign In" buttons
3. Verify no task interface is shown (auth is mandatory)

### **3. Test Account Creation**
1. Click "Create Account" button
2. New tab should open with signup form
3. Fill in email and password
4. Click "Create Account"
5. Should see success message
6. Tab should close automatically
7. Extension popup should now show task interface

### **4. Test Sign In**
1. Sign out from user menu (👤 icon)
2. Should return to welcome screen
3. Click "Sign In" button
4. New tab opens with login form
5. Enter credentials and sign in
6. Should successfully return to task interface

### **5. Test Forgot Password**
1. From sign-in form, click "Forgot password?"
2. Enter email address
3. Click "Send Reset Link"
4. Should see success message

---

## 🔍 Debugging Tools

### **Chrome DevTools Console**
Open browser console to see debug messages:
- `Login script loaded` - Login page script loaded
- `Sign up form submitted` - Form submission detected
- `Sign up attempt for email: [email]` - Auth request initiated
- `Sign up result: [object]` - Response from Supabase

### **Extension Console**
Right-click extension icon → "Inspect popup" to see popup errors:
- Check for authentication initialization
- Verify Supabase client setup
- Monitor API calls

### **Network Tab**
Monitor network requests to Supabase:
- `POST /auth/v1/signup` - Account creation
- `POST /auth/v1/token` - Sign in
- `POST /auth/v1/recover` - Password reset

---

## 🐛 Common Issues & Solutions

### **Supabase Connection Issues**
**Problem**: "Network error during sign up"
**Solution**: 
1. Check `.env` file has correct credentials
2. Verify Supabase project is active
3. Test API endpoints in browser

### **Email Not Sending**
**Problem**: Password reset emails not received
**Solution**:
1. Check Supabase Auth settings
2. Configure SMTP in Supabase dashboard
3. Verify email templates are enabled

### **Authentication Not Persisting**
**Problem**: User signed out after browser restart
**Solution**:
1. Check Chrome storage permissions
2. Verify session storage in DevTools
3. Check token expiration settings

### **CSP Errors (Should be fixed now)**
**Problem**: "script-src 'self'" errors
**Solution**: ✅ Fixed - All scripts now external

---

## 🔧 Supabase Configuration Checklist

### **1. Authentication Settings**
```
Supabase Dashboard → Authentication → Settings:
✅ Enable email signup
✅ Disable email confirmations (for testing)
✅ Set session timeout (optional)
```

### **2. Email Templates**
```
Authentication → Email Templates:
✅ Confirm signup template
✅ Magic link template  
✅ Password reset template
✅ Email change template
```

### **3. RLS Policies**
```
Database → Tables → [your_table]:
✅ Enable RLS
✅ Add policy for authenticated users
✅ Test policies work correctly
```

---

## 📊 Expected API Responses

### **Successful Signup**
```json
{
  "success": true,
  "user": {
    "id": "uuid-here",
    "email": "user@example.com"
  },
  "needsConfirmation": false
}
```

### **Successful Sign In**
```json
{
  "success": true,
  "user": {
    "id": "uuid-here", 
    "email": "user@example.com"
  }
}
```

### **Error Response**
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

---

## 🎯 Testing Checklist

- [ ] Extension loads without CSP errors
- [ ] Welcome screen appears for unauthenticated users
- [ ] Account creation works and redirects properly
- [ ] Sign in works with existing credentials
- [ ] Forgot password sends reset email
- [ ] User menu shows email after login
- [ ] Sign out returns to welcome screen
- [ ] Authentication persists across browser restarts
- [ ] Tasks sync properly with authenticated user
- [ ] Cross-device login works

---

## 🆘 Still Having Issues?

### **Check These First:**
1. **Environment Variables**: `npm run validate`
2. **Build Process**: `npm run build:clean`
3. **Browser Console**: Look for JavaScript errors
4. **Network Tab**: Monitor API requests
5. **Supabase Logs**: Check authentication logs

### **Debug Authentication Flow:**
```javascript
// In browser console on login page:
console.log('Supabase client:', supabase);
console.log('Auth instance:', tasklyAuth);
console.log('Config:', config.getConfig());
```

### **Test Supabase Directly:**
```javascript
// Test API connection:
fetch('https://your-project.supabase.co/rest/v1/', {
  headers: { 'apikey': 'your-anon-key' }
}).then(r => console.log('Supabase reachable:', r.ok));
```

---

## ✅ Success Indicators

When everything is working correctly, you should see:

1. **Clean Console**: No CSP or authentication errors
2. **Smooth Flow**: Login page opens, form submits, redirects work
3. **Persistent Login**: User stays logged in across sessions
4. **Data Sync**: Tasks save and load from Supabase
5. **Cross-Device**: Can sign in from multiple browsers/devices

**Authentication system is now CSP-compliant and ready for production! 🚀**
