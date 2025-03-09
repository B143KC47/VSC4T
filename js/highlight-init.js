/**
 * 全局代码高亮初始化
 * 确保在所有页面中正确加载和应用highlight.js
 */
(function() {
  // 判断highlight.js是否已加载
  function isHighlightJsLoaded() {
    return typeof hljs !== 'undefined';
  }

  // 尝试高亮页面上的所有代码块
  function highlightCodeBlocks() {
    try {
      if (isHighlightJsLoaded()) {
        document.querySelectorAll('pre code').forEach(function(block) {
          hljs.highlightBlock(block);
        });
        console.log('代码高亮应用成功');
      } else {
        loadHighlightJs();
      }
    } catch (e) {
      console.error('代码高亮失败:', e);
    }
  }

  // 动态加载highlight.js
  function loadHighlightJs() {
    console.log('动态加载highlight.js...');
    
    // 加载脚本
    var script = document.createElement('script');
    script.src = '//cdn.jsdelivr.net/npm/highlight.js@11.7.0/lib/highlight.min.js';
    script.onload = function() {
      console.log('highlight.js加载成功');
      highlightCodeBlocks();
    };
    script.onerror = function() {
      console.error('highlight.js加载失败');
    };
    document.head.appendChild(script);
    
    // 加载样式
    if (!document.querySelector('link[href*="highlight.js"]')) {
      var style = document.createElement('link');
      style.rel = 'stylesheet';
      style.href = '//cdn.jsdelivr.net/npm/highlight.js@11.7.0/styles/atom-one-dark.min.css';
      document.head.appendChild(style);
    }
  }

  // DOM加载完成后初始化
  document.addEventListener('DOMContentLoaded', function() {
    if (isHighlightJsLoaded()) {
      highlightCodeBlocks();
    } else {
      loadHighlightJs();
    }
  });

  // 暴露全局函数，允许其他脚本手动触发高亮
  window.applyCodeHighlight = highlightCodeBlocks;
})();
