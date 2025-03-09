// 专门为搜索页面加载和初始化 highlight.js
(function() {
  // 尝试在DOM加载完成后初始化高亮
  document.addEventListener('DOMContentLoaded', function() {
    initializeHighlight();
  });

  // 定义初始化函数，方便重复调用
  function initializeHighlight() {
    // 如果已经定义了 hljs，直接使用
    if (typeof hljs !== 'undefined') {
      try {
        document.querySelectorAll('pre code').forEach(function(block) {
          hljs.highlightBlock(block);
        });
        console.log('Search page: 使用已加载的 highlight.js 高亮代码');
      } catch (e) {
        console.error('Search page: highlight.js 错误:', e);
      }
    } else {
      console.warn('Search page: highlight.js 未定义，正在动态加载');
      
      // 加载 highlight.js
      var script = document.createElement('script');
      script.src = '//cdn.jsdelivr.net/npm/highlight.js@11.7.0/lib/highlight.min.js';
      script.onload = function() {
        // 加载成功后高亮代码块
        if (typeof hljs !== 'undefined') {
          document.querySelectorAll('pre code').forEach(function(block) {
            hljs.highlightBlock(block);
          });
          console.log('Search page: highlight.js 动态加载成功');
        } else {
          console.error('Search page: highlight.js 加载后仍未定义');
        }
      };
      script.onerror = function() {
        console.error('Search page: highlight.js 加载失败');
      };
      document.head.appendChild(script);
      
      // 同时加载样式
      var style = document.createElement('link');
      style.rel = 'stylesheet';
      style.href = '//cdn.jsdelivr.net/npm/highlight.js@11.7.0/styles/atom-one-dark.min.css';
      document.head.appendChild(style);
    }
  }

  // 设置一个全局函数，供其他脚本调用来触发高亮
  window.initializeHighlight = initializeHighlight;
})();
