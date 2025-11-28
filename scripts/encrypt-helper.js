/**
 * VSC4T Theme Helper for hexo-blog-encrypt
 * Forces the use of the theme's custom template to match the Shadcn UI style.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const applyCustomEncryptTemplate = () => {
  const siteEncrypt = hexo.config.encrypt;
  const themeEncrypt = hexo.theme.config.encrypt;

  // Exit early if no encrypt config is defined.
  if (!siteEncrypt && !themeEncrypt) return;

  // Always prefer site config but fall back to theme defaults.
  hexo.config.encrypt = Object.assign({}, themeEncrypt || {}, siteEncrypt || {});

  const libDir = path.join(hexo.base_dir, 'node_modules/hexo-blog-encrypt/lib');
  const customThemeName = 'vsc4t';
  const customThemePath = path.join(libDir, `hbe.${customThemeName}.html`);

  const customTemplate = `
<div id="hexo-blog-encrypt" class="hbe-card" data-wpm="{{hbeWrongPassMessage}}" data-whm="{{hbeWrongHashMessage}}">
  <script id="hbeData" type="hbeData" data-hmacdigest="{{hbeHmacDigest}}">{{hbeEncryptedData}}</script>
  <div class="hbe-header">
    <div class="hbe-header-left">
      <div class="hbe-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
      </div>
      <div class="hbe-header-copy">
        <p class="hbe-badge" data-i18n="encrypt_badge">Protected</p>
        <h3 class="hbe-title" data-i18n="encrypt_title">Protected Content</h3>
        <p class="hbe-description" data-i18n="encrypt_description">Enter the password to unlock this article. The password will be saved locally until you choose to re-encrypt.</p>
      </div>
    </div>
  </div>
  <div class="hbe-content-wrapper">
    <label class="hbe-label" for="hbePass" data-i18n="encrypt_label">Password</label>
    <div class="hbe-input-container">
      <div class="hbe-input-wrapper">
        <input type="password" id="hbePass" class="hbe-input" placeholder="{{hbeMessage}}" autocomplete="off" aria-describedby="hbe-hint hbe-message" />
        <button type="button" id="hbe-toggle-password" class="hbe-toggle-password" aria-label="Show password" title="Show password">
          <svg class="hbe-eye-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          <svg class="hbe-eye-off-icon" style="display:none" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
        </button>
      </div>
      <button id="hbe-button" class="hbe-button" type="button">
        <span data-i18n="encrypt_button">Unlock</span>
        <svg class="hbe-arrow" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        <svg class="hbe-spinner" style="display:none" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
      </button>
    </div>
    <p class="hbe-hint" id="hbe-hint" data-i18n="encrypt_hint">Press Enter to submit. Password will be remembered on this page.</p>
    <div id="hbe-message" class="hbe-message" role="status" aria-live="polite"></div>
  </div>
  <div class="hbe-actions" id="hbe-actions">
    <div class="hbe-success-note">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>
      <span data-i18n="encrypt_unlocked_note">Content unlocked. You can re-encrypt at any time.</span>
    </div>
    <button id="hbe-encrypt-again" class="hbe-ghost-button" type="button" data-i18n="encrypt_again">Re-encrypt</button>
  </div>
</div>
  `;

  if (!fs.existsSync(libDir)) {
    hexo.log.warn('VSC4T: hexo-blog-encrypt is not installed, skipping custom template injection.');
    return;
  }

  try {
    fs.writeFileSync(customThemePath, customTemplate.trim(), 'utf8');
    hexo.config.encrypt.theme = customThemeName;
    delete hexo.config.encrypt.template; // avoid deprecated config warning
    hexo.log.info(`VSC4T: Applied custom hexo-blog-encrypt theme "${customThemeName}".`);
  } catch (err) {
    hexo.log.warn(`VSC4T: Failed to apply custom hexo-blog-encrypt template (${err.message}).`);
  }
};

// Need the template in place before posts are rendered.
hexo.extend.filter.register('after_init', applyCustomEncryptTemplate);
