/**
 * VSC4T Password Protection Enhancement
 * Provides i18n support, show/hide password toggle, improved UX
 * Works with hexo-blog-encrypt plugin
 * 
 * FIXES:
 * - Correct event dispatching to avoid redirect issues
 * - Proper integration with hbe.js decrypt flow
 * - Enhanced user experience with better feedback
 */
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('hexo-blog-encrypt');
  if (!container) return;

  const i18n = window.HEXO_CONFIG || {};
  const getText = (key, fallback) => i18n[key] || fallback;

  const input = document.getElementById('hbe-password') || document.getElementById('hbePass');
  const button = document.getElementById('hbe-button');
  const message = document.getElementById('hbe-message');
  const reEncrypt = document.getElementById('hbe-encrypt-again');
  const togglePassword = document.getElementById('hbe-toggle-password');
  const label = button ? button.querySelector('span[data-i18n="encrypt_button"]') || button.querySelector('span') : null;
  const arrow = button ? button.querySelector('.hbe-arrow') : null;
  const spinner = button ? button.querySelector('.hbe-spinner') : null;

  let unlocked = false;
  let loadingTimer = null;
  let passwordVisible = false;
  let isProcessing = false; // Prevent double submission

  const applyI18n = () => {
    container.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n;
      const translation = getText(key, null);
      if (translation) el.textContent = translation;
    });
    if (input) {
      const placeholder = getText('encrypt_placeholder', null);
      if (placeholder) input.placeholder = placeholder;
    }
  };

  const setMessage = (text, mode) => {
    if (!message) return;
    message.textContent = text || '';
    message.classList.remove('hbe-error', 'hbe-success', 'hbe-fade-in');
    if (mode === 'error') message.classList.add('hbe-error', 'hbe-fade-in');
    else if (mode === 'success') message.classList.add('hbe-success', 'hbe-fade-in');
  };

  const setLoading = (isLoading) => {
    if (!button) return;
    button.disabled = isLoading;
    button.classList.toggle('loading', isLoading);
    if (label) {
      label.textContent = isLoading ? getText('encrypt_button_loading', 'Unlocking...') : getText('encrypt_button', 'Unlock');
    }
    if (arrow) arrow.style.display = isLoading ? 'none' : '';
    if (spinner) spinner.style.display = isLoading ? 'inline' : 'none';
    clearTimeout(loadingTimer);
    if (isLoading) {
      // Timeout for error handling - if decrypt doesn't respond
      loadingTimer = setTimeout(() => {
        isProcessing = false;
        setLoading(false);
        setMessage(getText('encrypt_wrong_password', 'Incorrect password. Please try again.'), 'error');
        if (input) { input.classList.add('shake'); input.focus(); input.select(); }
        setTimeout(() => { if (input) input.classList.remove('shake'); }, 500);
      }, 5000);
    }
  };

  // Trigger the hexo-blog-encrypt library's decrypt function
  // FIX: Use the input element to dispatch event, ensuring proper event flow
  const triggerDecrypt = () => {
    if (isProcessing) return; // Prevent double submission
    
    if (!input || !input.value.trim()) {
      setMessage(getText('encrypt_wrong_password', 'Please enter a password.'), 'error');
      if (input) input.focus();
      return;
    }
    
    isProcessing = true;
    setLoading(true);
    setMessage('', null);
    
    // FIX: hbe.js listens on the container (mainElement) for keydown events
    // and reads password from document.getElementById('hbePass').value
    // We need to dispatch the event on the container, but ensure the input has the value
    // The key fix is to let the event bubble up naturally from the input
    
    // Create a proper KeyboardEvent and dispatch it on the input
    // This will bubble up to the container where hbe.js listens
    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: true,       // Must bubble to reach container listener
      cancelable: true,
      composed: true       // Cross shadow DOM boundary if any
    });
    
    // Dispatch on input - it will bubble up to container
    input.dispatchEvent(enterEvent);
  };

  const togglePasswordVisibility = () => {
    if (!input || !togglePassword) return;
    passwordVisible = !passwordVisible;
    input.type = passwordVisible ? 'text' : 'password';
    const eyeIcon = togglePassword.querySelector('.hbe-eye-icon');
    const eyeOffIcon = togglePassword.querySelector('.hbe-eye-off-icon');
    if (eyeIcon) eyeIcon.style.display = passwordVisible ? 'none' : '';
    if (eyeOffIcon) eyeOffIcon.style.display = passwordVisible ? '' : 'none';
    togglePassword.setAttribute('aria-label', passwordVisible ? getText('encrypt_hide_password', 'Hide password') : getText('encrypt_show_password', 'Show password'));
    togglePassword.setAttribute('title', togglePassword.getAttribute('aria-label'));
    input.focus();
  };

  const styleEncryptAgainButtons = () => {
    const candidates = Array.from(container.querySelectorAll('button')).filter((btn) => {
      if (btn.id === 'hbe-button' || btn.id === 'hbe-encrypt-again' || btn.id === 'hbe-toggle-password') return false;
      if (btn.dataset.vscStyled === 'true') return false;
      return btn.textContent && btn.textContent.trim().toLowerCase().includes('encrypt again');
    });
    candidates.forEach((btn) => {
      btn.dataset.vscStyled = 'true';
      btn.classList.add('hbe-ghost-button', 'hbe-hide-btn', 'hbe-floating');
      btn.innerHTML = '<span>' + getText('encrypt_again', 'Re-encrypt') + '</span><svg class="hbe-arrow" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>';
    });
  };

  const rerunDecorators = () => {
    if (window.hljs) document.querySelectorAll('pre code').forEach((block) => window.hljs.highlightElement(block));
    if (window.mermaid && typeof window.mermaid.init === 'function') window.mermaid.init(undefined, document.querySelectorAll('.mermaid'));
  };

  const handleUnlocked = () => {
    if (unlocked) { styleEncryptAgainButtons(); rerunDecorators(); setLoading(false); return; }
    unlocked = true;
    isProcessing = false;
    clearTimeout(loadingTimer);
    setLoading(false);
    container.classList.add('hbe-unlocked');
    setMessage(getText('encrypt_success', 'Content unlocked successfully!'), 'success');
    styleEncryptAgainButtons();
    rerunDecorators();
    
    // Smooth scroll to content after unlock
    setTimeout(() => {
      const contentStart = container.querySelector('div:not(.hbe-card):not(.hbe-header):not(.hbe-content-wrapper):not(.hbe-actions)');
      if (contentStart) {
        contentStart.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 300);
  };

  applyI18n();

  // Listen for the hexo-blog-decrypt event from hbe.js library
  window.addEventListener('hexo-blog-decrypt', () => {
    handleUnlocked();
  });

  // Also listen for wrong password alert - hbe.js uses native alert()
  // We intercept it to provide better UX
  const originalAlert = window.alert;
  window.alert = function(msg) {
    // Check if this is a wrong password message from hbe.js
    const wrongPassMsg = container.dataset['wpm'] || 'invalid password';
    const wrongHashMsg = container.dataset['whm'] || 'cannot be verified';
    
    if (msg && (msg.toLowerCase().includes('password') || 
                msg.toLowerCase().includes(wrongPassMsg.toLowerCase()) ||
                msg.toLowerCase().includes(wrongHashMsg.toLowerCase()))) {
      // It's a password error - show our custom message instead
      isProcessing = false;
      clearTimeout(loadingTimer);
      setLoading(false);
      setMessage(getText('encrypt_wrong_password', msg), 'error');
      if (input) { 
        input.classList.add('shake'); 
        input.focus(); 
        input.select(); 
      }
      setTimeout(() => { if (input) input.classList.remove('shake'); }, 500);
      return; // Don't show native alert
    }
    
    // For other alerts, use original
    originalAlert.call(window, msg);
  };

  // Auto-decrypt if hbe.js stored password in localStorage (uses different key format)
  // hbe.js uses 'hexo-blog-encrypt:#/path' format
  if (input) {
    setTimeout(() => input.focus(), 200);
  }

  // Watch for container changes that indicate successful decryption
  // hbe.js replaces container innerHTML on success
  const containerObserver = new MutationObserver((mutations) => {
    // Check if the container content was replaced (decryption successful)
    const hasNewContent = mutations.some((m) => {
      if (m.type === 'childList' && m.addedNodes.length > 0) {
        // hbe.js adds a button with 'Encrypt again' text after decryption
        return Array.from(m.addedNodes).some((n) =>
          n.nodeType === 1 && (n.tagName === 'BUTTON' || n.classList?.contains('hbe-button'))
        );
      }
      return false;
    });
    if (hasNewContent) handleUnlocked();
  });
  containerObserver.observe(container, { childList: true, subtree: true });

  // Handle Enter key on input - trigger decrypt
  // FIX: Only handle our custom button click, let native keydown bubble for hbe.js
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !button?.disabled && !isProcessing) {
        // Don't prevent default - let the event bubble to hbe.js
        // But set our loading state
        if (!e.isTrusted) return; // Ignore synthetic events from our triggerDecrypt
        
        isProcessing = true;
        setLoading(true);
        setMessage('', null);
      }
    });
  }

  // Handle button click - trigger decrypt
  if (button) {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      triggerDecrypt();
    });
  }

  if (togglePassword) {
    togglePassword.addEventListener('click', (e) => {
      e.preventDefault();
      togglePasswordVisibility();
    });
  }

  if (reEncrypt) {
    reEncrypt.addEventListener('click', () => window.location.reload());
  }
});
