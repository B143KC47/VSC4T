/**
 * VSC4T Password Protection Enhancement
 * Provides i18n support, show/hide password toggle, improved UX
 * Works with hexo-blog-encrypt plugin
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
      // Reduced timeout since we rely on hexo-blog-decrypt event
      loadingTimer = setTimeout(() => {
        setLoading(false);
        setMessage(getText('encrypt_wrong_password', 'Incorrect password. Please try again.'), 'error');
        if (input) { input.classList.add('shake'); input.focus(); input.select(); }
        setTimeout(() => { if (input) input.classList.remove('shake'); }, 500);
      }, 3000);
    }
  };

  // Trigger the hexo-blog-encrypt library's decrypt function
  const triggerDecrypt = () => {
    if (!input || !input.value.trim()) {
      setMessage(getText('encrypt_wrong_password', 'Please enter a password.'), 'error');
      if (input) input.focus();
      return;
    }
    setLoading(true);
    setMessage('', null);
    // Dispatch Enter keydown event on the container to trigger hbe.js decrypt
    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true
    });
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
    if (window.hljs) document.querySelectorAll('pre code').forEach((block) => window.hljs.highlightElement(block));
    if (window.mermaid && typeof window.mermaid.init === 'function') window.mermaid.init(undefined, document.querySelectorAll('.mermaid'));
  };

  const handleUnlocked = () => {
    if (unlocked) { styleEncryptAgainButtons(); rerunDecorators(); setLoading(false); return; }
    unlocked = true;
    clearTimeout(loadingTimer);
    setLoading(false);
    container.classList.add('hbe-unlocked');
    styleEncryptAgainButtons();
    rerunDecorators();
  };

  applyI18n();

  // Listen for the hexo-blog-decrypt event from hbe.js library
  window.addEventListener('hexo-blog-decrypt', () => {
    handleUnlocked();
  });

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
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !button?.disabled) {
        e.preventDefault();
        e.stopPropagation(); // Prevent double-handling
        triggerDecrypt();
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
