// Login page JavaScript for Taskly Chrome Extension
console.log('Login script loaded');

// DOM elements
let signInForm, signUpForm, forgotPasswordForm, statusMessage;

// Initialize DOM elements when page loads
function initializeDOMElements() {
    signInForm = document.getElementById('signInForm');
    signUpForm = document.getElementById('signUpForm');
    forgotPasswordForm = document.getElementById('forgotPasswordForm');
    statusMessage = document.getElementById('statusMessage');
}

// Check URL hash on load
function checkInitialMode() {
    const hash = window.location.hash.substring(1);
    if (hash === 'signup') {
        showForm('signUp');
    } else {
        showForm('signIn');
    }
}

// Form switching functions
function setupFormSwitching() {
    document.getElementById('showSignUp').addEventListener('click', (e) => {
        e.preventDefault();
        showForm('signUp');
    });

    document.getElementById('showSignIn').addEventListener('click', (e) => {
        e.preventDefault();
        showForm('signIn');
    });

    document.getElementById('showForgotPassword').addEventListener('click', (e) => {
        e.preventDefault();
        showForm('forgotPassword');
    });

    document.getElementById('backToSignIn').addEventListener('click', (e) => {
        e.preventDefault();
        showForm('signIn');
    });
}

function showForm(formType) {
    // Hide all forms
    signInForm.classList.add('hidden');
    signUpForm.classList.add('hidden');
    forgotPasswordForm.classList.add('hidden');
    hideStatus();

    // Show selected form
    switch(formType) {
        case 'signUp':
            signUpForm.classList.remove('hidden');
            break;
        case 'forgotPassword':
            forgotPasswordForm.classList.remove('hidden');
            break;
        default:
            signInForm.classList.remove('hidden');
    }
}

// Status message functions
function showStatus(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    statusMessage.classList.remove('hidden');
}

function hideStatus() {
    statusMessage.classList.add('hidden');
}

// Sign In handler
async function handleSignIn(e) {
    e.preventDefault();
    console.log('Sign in form submitted');
    
    const email = document.getElementById('signInEmail').value;
    const password = document.getElementById('signInPassword').value;
    
    console.log('Sign in attempt for email:', email);

    showStatus('Signing in...', 'info');
    
    try {
        const result = await tasklyAuth.signIn(email, password);
        console.log('Sign in result:', result);
        
        if (result.success) {
            // Clear any guest mode settings when signing in
            await chrome.storage.local.remove(['tasklyGuestMode']);
            
            showStatus('Sign in successful! Redirecting...', 'success');
            // Use chrome.tabs.update to redirect to extension popup
            setTimeout(async () => {
                try {
                    // Try to close current tab and open extension
                    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
                    await chrome.tabs.remove(tab.id);
                    // Open the extension popup in a new tab temporarily
                    await chrome.tabs.create({url: chrome.runtime.getURL('popup.html')});
                } catch (error) {
                    console.log('Could not redirect automatically, please close this tab and click the extension icon');
                    showStatus('Please close this tab and click the Taskly extension icon', 'success');
                }
            }, 1500);
        } else {
            showStatus(result.error, 'error');
        }
    } catch (error) {
        console.error('Sign in error:', error);
        showStatus('Error signing in: ' + error.message, 'error');
    }
}

// Sign Up handler
async function handleSignUp(e) {
    e.preventDefault();
    console.log('Sign up form submitted');
    
    const email = document.getElementById('signUpEmail').value;
    const password = document.getElementById('signUpPassword').value;
    const confirmPassword = document.getElementById('signUpPasswordConfirm').value;

    console.log('Sign up attempt for email:', email);

    if (password !== confirmPassword) {
        showStatus('Passwords do not match', 'error');
        return;
    }

    if (password.length < 6) {
        showStatus('Password must be at least 6 characters', 'error');
        return;
    }

    showStatus('Creating account...', 'info');
    
    try {
        const result = await tasklyAuth.signUp(email, password);
        console.log('Sign up result:', result);
        
        if (result.success) {
            // Clear any guest mode settings when signing up
            await chrome.storage.local.remove(['tasklyGuestMode']);
            
            if (result.needsConfirmation) {
                showStatus('Account created! Please sign in with your credentials.', 'success');
                // Switch to sign in form
                setTimeout(() => {
                    showForm('signIn');
                    document.getElementById('signInEmail').value = email;
                }, 1500);
            } else {
                showStatus('Account created and signed in! Redirecting...', 'success');
                setTimeout(async () => {
                    try {
                        // Try to close current tab and open extension
                        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
                        await chrome.tabs.remove(tab.id);
                        // Open the extension popup in a new tab temporarily
                        await chrome.tabs.create({url: chrome.runtime.getURL('popup.html')});
                    } catch (error) {
                        console.log('Could not redirect automatically, please close this tab and click the extension icon');
                        showStatus('Please close this tab and click the Taskly extension icon', 'success');
                    }
                }, 1500);
            }
        } else {
            showStatus(result.error, 'error');
        }
    } catch (error) {
        console.error('Sign up error:', error);
        showStatus('Error creating account: ' + error.message, 'error');
    }
}

// Forgot Password handler
async function handleForgotPassword(e) {
    e.preventDefault();
    console.log('Forgot password form submitted');
    
    const email = document.getElementById('resetEmail').value;
    console.log('Password reset requested for email:', email);

    showStatus('Sending reset email...', 'info');
    
    try {
        const result = await tasklyAuth.resetPassword(email);
        console.log('Password reset result:', result);
        
        if (result.success) {
            showStatus('Password reset email sent! Check your inbox.', 'success');
        } else {
            showStatus(result.message || 'Error sending reset email', 'error');
        }
    } catch (error) {
        console.error('Password reset error:', error);
        showStatus('Error sending reset email: ' + error.message, 'error');
    }
}

// Setup form event listeners
function setupFormHandlers() {
    signInForm.addEventListener('submit', handleSignIn);
    signUpForm.addEventListener('submit', handleSignUp);
    forgotPasswordForm.addEventListener('submit', handleForgotPassword);
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Login page loaded');
    
    // Initialize DOM elements
    initializeDOMElements();
    
    // Setup form switching
    setupFormSwitching();
    
    // Setup form handlers
    setupFormHandlers();
    
    // Initialize Supabase if not already done
    if (!supabase) {
        console.log('Initializing Supabase...');
        initializeSupabase();
    }
    
    // Wait for auth to initialize
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check if user is already logged in
    if (tasklyAuth && tasklyAuth.isLoggedIn()) {
        showStatus('You are already signed in! Redirecting...', 'success');
        setTimeout(() => {
            window.close();
        }, 1000);
        return;
    }

    // Check URL hash for initial mode
    checkInitialMode();
    console.log('Login page initialization complete');
});
