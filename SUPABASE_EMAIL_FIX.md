# Supabase Configuration for Chrome Extension

## ⚠️ ACTION REQUIRED: Disable Email Confirmation

Your extension is still waiting for verification because Supabase is configured to require email confirmation. You need to change this setting.

### **Step 1: Go to Supabase Dashboard**

1. Open your browser and go to: **https://app.supabase.com**
2. Click on your **Taskly project**
3. In the left sidebar, click **"Authentication"**
4. Click **"Settings"** (under Authentication)

### **Step 2: Disable Email Confirmation**

1. Scroll down to find the **"User Signups"** section
2. Look for **"Enable email confirmations"** checkbox
3. **UNCHECK this box** ✅ → ❌
4. Click **"Save"** button at the bottom

### **Step 3: Test Immediately**

After saving the setting:
1. Go back to your extension
2. Try creating a new account
3. It should work instantly without any email verification

---

## Visual Guide:

```
Supabase Dashboard → Authentication → Settings

[User Signups Section]
☐ Enable email confirmations  ← UNCHECK THIS
☑ Allow new users to sign up
☑ Enable phone confirmations   ← Leave as is

[Save Button] ← CLICK THIS
```

---

## Current Problem:

- ❌ Supabase: Email confirmation is **ENABLED**
- ✅ Your Code: Ready for instant signup
- 🔄 **You need to sync these settings**

## After the Fix:

- ✅ Users sign up instantly
- ✅ No email verification needed
- ✅ Extension works immediately
- ✅ Better user experience

---

## **If you can't find the setting:**

1. Make sure you're in the correct project
2. Check you have admin access
3. Look for "Auth" or "Authentication" in the sidebar
4. The setting might be called "Confirm email" or "Email verification"

**Once you disable this setting, your extension will work perfectly!** 🚀
