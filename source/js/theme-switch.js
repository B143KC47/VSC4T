/**
 * VSC4T Theme Auto Switch
 * 自动主题切换功能
 */

(function() {
  'use strict';

  // 主题切换配置
  const themeConfig = window.HEXO_CONFIG && window.HEXO_CONFIG.theme_switch || null;

  // 如果没有配置或未启用，直接返回
  if (!themeConfig || !themeConfig.enabled) {
    return;
  }

  // 时间转换为分钟数
  function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(num => parseInt(num));
    return hours * 60 + minutes;
  }

  // 获取当前时间的分钟数
  function getCurrentMinutes() {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }

  // 判断当前应该使用的主题
  function getAutoTheme() {
    const currentMinutes = getCurrentMinutes();
    const lightStartMinutes = timeToMinutes(themeConfig.light_start || '06:00');
    const lightEndMinutes = timeToMinutes(themeConfig.light_end || '18:00');

    // 判断是否在浅色主题时间范围内
    if (lightStartMinutes <= lightEndMinutes) {
      // 正常情况：开始时间 < 结束时间
      return (currentMinutes >= lightStartMinutes && currentMinutes < lightEndMinutes) ? 'white' : 'dark';
    } else {
      // 跨天情况：如 22:00 - 06:00
      return (currentMinutes >= lightStartMinutes || currentMinutes < lightEndMinutes) ? 'white' : 'dark';
    }
  }

  // 切换主题
  function switchTheme(theme) {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');

    if (currentTheme !== theme) {
      html.setAttribute('data-theme', theme);

      // 保存自动切换的主题到 localStorage
      localStorage.setItem('vsc4t-auto-theme', theme);

      // 触发自定义事件，用于通知其他组件主题已改变
      window.dispatchEvent(new CustomEvent('theme-changed', {
        detail: {
          theme: theme,
          auto: true
        }
      }));
    }
  }

  // 检查并应用主题
  function checkAndApplyTheme() {
    // 检查是否有用户手动设置的主题偏好
    const userPreference = localStorage.getItem('vsc4t-user-theme');

    if (userPreference) {
      // 如果有用户偏好，优先使用用户选择
      switchTheme(userPreference);
    } else {
      // 否则使用自动切换
      const autoTheme = getAutoTheme();
      switchTheme(autoTheme);
    }
  }

  // 初始化
  function init() {
    // 立即检查并应用主题
    checkAndApplyTheme();

    // 每分钟检查一次是否需要切换主题
    setInterval(checkAndApplyTheme, 60 * 1000);

    // 监听页面可见性变化，当页面重新可见时检查主题
    document.addEventListener('visibilitychange', function() {
      if (!document.hidden) {
        checkAndApplyTheme();
      }
    });

    // 监听手动主题切换（如果有主题切换按钮）
    window.addEventListener('manual-theme-switch', function(e) {
      const theme = e.detail.theme;

      // 保存用户偏好
      localStorage.setItem('vsc4t-user-theme', theme);

      // 立即应用主题
      switchTheme(theme);
    });

    // 提供清除用户偏好的方法，恢复自动切换
    window.clearThemePreference = function() {
      localStorage.removeItem('vsc4t-user-theme');
      checkAndApplyTheme();
      console.log('Theme preference cleared. Auto switching resumed.');
    };
  }

  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();