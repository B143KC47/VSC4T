/**
 * VSC4T Password Protection Enhancement
 * Provides i18n support, show/hide password toggle, improved UX
 * Works with hexo-blog-encrypt plugin
 * 
 * FEATURES:
 * - Correct event dispatching for hbe.js integration
 * - Proper integration with hbe.js decrypt flow
 * - Enhanced user experience with better feedback
 * - i18n support for multi-language blogs
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
  // Dispatch event directly on the container (mainElement) where hbe.js listens
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
    
    // hbe.js listens on the container (mainElement) for keydown events with keyCode === 13
    // Create a proper KeyboardEvent and dispatch directly on the container
    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: false,      // Don't bubble - dispatch directly on container
      cancelable: true,
      composed: false,
      isComposing: false   // Explicitly set to avoid triggering on wrong condition
    });
    
    // Dispatch directly on the container where hbe.js listens
    container.dispatchEvent(enterEvent);
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
    // Re-run code enhancement to apply VSC4T theme styling to decrypted code blocks
    if (typeof window.enhanceCodeBlocks === 'function') {
      window.enhanceCodeBlocks();
    }
    if (typeof window.enhancePlainCodeBlocks === 'function') {
      window.enhancePlainCodeBlocks();
    }
    if (typeof window.addScrollIndicators === 'function') {
      window.addScrollIndicators();
    }
    if (typeof window.renderMermaidDiagrams === 'function') {
      window.renderMermaidDiagrams();
    }
    // Fallback: if code-enhance.js functions are not exposed globally, try hljs
    if (window.hljs) {
      document.querySelectorAll('pre code:not(.hljs)').forEach((block) => window.hljs.highlightElement(block));
    }
    if (window.mermaid && typeof window.mermaid.init === 'function') {
      window.mermaid.init(undefined, document.querySelectorAll('.mermaid:not([data-processed])'));
    }
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

  // Handle Enter key on input - let native keydown bubble to hbe.js
  // We just set our loading state, hbe.js will handle the actual decryption
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !button?.disabled && !isProcessing) {
        // For native Enter key presses (e.isTrusted === true),
        // hbe.js will receive the event via bubbling
        // We just need to set our loading state
        if (!e.isTrusted) return; // Ignore synthetic events
        
        isProcessing = true;
        setLoading(true);
        setMessage('', null);
        
        // Don't prevent default or stop propagation - let hbe.js handle it
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
