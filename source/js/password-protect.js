/**
 * VSC4T Password Protection Enhancement
 * Provides i18n support, show/hide password toggle, improved UX
 */
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('hexo-blog-encrypt');
  if (!container) return;

  const i18n = window.HEXO_CONFIG || {};
  const getText = (key, fallback) => i18n[key] || fallback;

  const input = document.getElementById('hbe-password') || document.getElementById('hbePass');
  const button = document.getElementById('hbe-button');
  const message = document.getElementById('hbe-message');
  const content = document.getElementById('hbe-content');
  const actions = document.getElementById('hbe-actions');
  const reEncrypt = document.getElementById('hbe-encrypt-again');
  const togglePassword = document.getElementById('hbe-toggle-password');
  const label = button ? button.querySelector('span[data-i18n="encrypt_button"]') || button.querySelector('span') : null;
  const arrow = button ? button.querySelector('.hbe-arrow') : null;
  const spinner = button ? button.querySelector('.hbe-spinner') : null;

  const storageKey = 'hbe-pass-' + window.location.pathname;
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
      loadingTimer = setTimeout(() => {
        setLoading(false);
        setMessage(getText('encrypt_wrong_password', 'Incorrect password. Please try again.'), 'error');
      }, 8000);
    }
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
    setLoading(false);
    if (input && input.value) localStorage.setItem(storageKey, input.value);
    if (actions) { actions.style.display = 'flex'; actions.classList.add('hbe-fade-in'); }
    container.classList.add('hbe-unlocked');
    styleEncryptAgainButtons();
    rerunDecorators();
    setMessage(getText('encrypt_success', 'Unlocked! Click "Re-encrypt" to clear local password.'), 'success');
  };

  const clearPassword = (shouldReload = false) => {
    localStorage.removeItem(storageKey);
    unlocked = false;
    setLoading(false);
    if (actions) actions.style.display = 'none';
    container.classList.remove('hbe-unlocked');
    if (input) { input.value = ''; input.type = 'password'; passwordVisible = false; input.focus(); }
    setMessage('', null);
    if (shouldReload) window.location.reload();
  };

  applyI18n();

  const savedPass = localStorage.getItem(storageKey);
  if (savedPass && input && button) {
    input.value = savedPass;
    setTimeout(() => { setLoading(true); button.click(); }, 100);
  } else if (input) {
    setTimeout(() => input.focus(), 200);
  }

  if (content) {
    const observer = new MutationObserver((mutations) => {
      const isVisible = content.style.display !== 'none';
      const hasAddedNodes = mutations.some((m) => m.addedNodes && m.addedNodes.length > 0);
      if (isVisible || hasAddedNodes) handleUnlocked();
    });
    observer.observe(content, { attributes: true, childList: true });
  }

  const containerObserver = new MutationObserver((mutations) => {
    if (mutations.some((m) => Array.from(m.addedNodes || []).some((n) => n.tagName === 'BUTTON'))) handleUnlocked();
  });
  containerObserver.observe(container, { childList: true, subtree: true });

  if (message) {
    const observer = new MutationObserver(() => {
      if (message.classList.contains('hbe-success')) return;
      const msgText = message.innerText ? message.innerText.trim() : '';
      if (msgText) {
        setLoading(false);
        if (input) { input.classList.add('shake'); input.focus(); input.select(); }
        message.classList.add('hbe-error');
        localStorage.removeItem(storageKey);
        setTimeout(() => { if (input) input.classList.remove('shake'); }, 500);
      }
    });
    observer.observe(message, { childList: true, characterData: true, subtree: true });
  }

  if (input) {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && button && !button.disabled) {
        e.preventDefault();
        setLoading(true);
        button.click();
      }
    });
  }

  if (button) {
    button.addEventListener('click', () => {
      setMessage('', null);
      if (input && !input.value.trim()) {
        setMessage(getText('encrypt_wrong_password', 'Please enter a password.'), 'error');
        input.focus();
        return;
      }
      setLoading(true);
    });
  }

  if (togglePassword) {
    togglePassword.addEventListener('click', (e) => {
      e.preventDefault();
      togglePasswordVisibility();
    });
  }

  if (reEncrypt) {
    reEncrypt.addEventListener('click', () => clearPassword(true));
  }
});
