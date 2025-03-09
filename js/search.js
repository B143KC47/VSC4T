(function() {
  document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('vs-search-input');
    const searchResults = document.getElementById('vs-search-results');
    const searchClearBtn = document.getElementById('vs-search-clear');
    const searchCounter = document.getElementById('vs-search-counter');
    
    if (!searchInput || !searchResults) return;
    
    let searchData = [];
    let recentSearches = [];
    
    // 从本地存储获取最近搜索
    const storedSearches = localStorage.getItem('vs-recent-searches');
    if (storedSearches) {
      try {
        recentSearches = JSON.parse(storedSearches);
        updateRecentSearches();
      } catch (e) {
        console.error('Failed to parse recent searches:', e);
      }
    }
    
    // 获取根路径 - 适应 GitHub Pages
    function getBasePath() {
      // 尝试从 <base> 标签获取
      const baseTag = document.querySelector('base');
      if (baseTag && baseTag.href) {
        return new URL(baseTag.href).pathname;
      }
      
      // 尝试从配置获取
      if (window.HEXO_CONFIG && window.HEXO_CONFIG.root) {
        return window.HEXO_CONFIG.root;
      }
      
      // 从当前页面路径推断
      const pathSegments = window.location.pathname.split('/');
      let basePath = '/';
      
      // 对于 GitHub Pages，格式通常是 /{username}/{repo-name}/
      if (window.location.hostname.includes('github.io')) {
        // 尝试从路径中提取项目名
        if (pathSegments.length > 1) {
          basePath = '/' + pathSegments[1] + '/';
        }
      }
      
      return basePath;
    }
    
    // 构建搜索路径
    function buildSearchPath() {
      const basePath = getBasePath().replace(/\/+$/, ''); // 移除末尾斜杠
      console.log('Base path detected:', basePath);
      
      // 推断搜索 JSON 的位置
      const searchPath = `${basePath}/search.json`;
      console.log('Loading search data from:', searchPath);
      return searchPath;
    }
    
    // 加载搜索数据
    function loadSearchData() {
      const searchPath = buildSearchPath();
      const searchStatusEl = document.querySelector('.vs-search-status');
      
      if (searchStatusEl) {
        searchStatusEl.innerHTML = `<span class="vs-search-loading">
          <i class="fas fa-spinner fa-spin"></i> ${getTranslation('search_loading', 'Loading...')}
        </span>`;
      }
      
      // 添加时间戳防止缓存问题
      const cacheBuster = `?_=${new Date().getTime()}`;
      
      fetch(searchPath + cacheBuster)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          searchData = data;
          console.log(`Loaded ${data.length} search items`);
          if (searchStatusEl) {
            searchStatusEl.innerHTML = `<span id="vs-search-counter">0 ${getTranslation('search_results', 'results')}</span>`;
          }
        })
        .catch(error => {
          console.error('Error loading search data:', error, 'from path:', searchPath);
          // 详细的错误信息帮助调试
          searchResults.innerHTML = `<div class="vs-no-results">
            <i class="fas fa-exclamation-circle"></i>
            <span>${getTranslation('search_error', 'Error loading search data')}: ${error.message}</span>
            <small>Path: ${searchPath}</small>
          </div>`;
        });
    }
    
    // 获取翻译文本
    function getTranslation(key, fallback) {
      if (window.HEXO_CONFIG && window.HEXO_CONFIG[key]) {
        return window.HEXO_CONFIG[key];
      }
      return fallback;
    }
    
    // 初始化搜索功能
    function initSearch() {
      if (searchClearBtn) {
        searchClearBtn.addEventListener('click', function() {
          searchInput.value = '';
          searchResults.innerHTML = '';
          searchInput.focus();
          if (searchCounter) searchCounter.textContent = `0 ${getTranslation('search_results', 'results')}`;
        });
      }
      
      // 搜索输入事件
      searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        
        if (!query) {
          searchResults.innerHTML = '';
          if (searchCounter) searchCounter.textContent = `0 ${getTranslation('search_results', 'results')}`;
          return;
        }
        
        performSearch(query);
      });
      
      // 键盘导航
      searchInput.addEventListener('keydown', function(e) {
        navigateResults(e);
      });
      
      // 加载搜索数据
      loadSearchData();
    }
    
    function performSearch(query) {
      if (!searchData || !searchData.length) {
        searchResults.innerHTML = `<div class="vs-no-results">
          <i class="fas fa-circle-notch fa-spin"></i>
          <span>${getTranslation('search_loading', 'Loading search data...')}</span>
        </div>`;
        return;
      }
      
      const lowerQuery = query.toLowerCase();
      
      // 检查过滤器设置
      const searchInTitle = document.getElementById('search-titles') ? 
        document.getElementById('search-titles').checked : true;
        
      const searchInContent = document.getElementById('search-content') ?
        document.getElementById('search-content').checked : true;
        
      const searchInTags = document.getElementById('search-tags') ?
        document.getElementById('search-tags').checked : true;
      
      // 根据过滤器筛选结果
      const results = searchData.filter(item => {
        // 标题搜索
        if (searchInTitle && item.title && 
            item.title.toLowerCase().includes(lowerQuery)) {
          return true;
        }
        
        // 内容搜索
        if (searchInContent && item.content && 
            item.content.toLowerCase().includes(lowerQuery)) {
          return true;
        }
        
        // 标签搜索
        if (searchInTags && item.tags && 
            item.tags.some(tag => toLowerCase().includes(lowerQuery))) {
          return true;
        }
        
        // 分类搜索
        if (item.categories && 
            item.categories.some(cat => cat.toLowerCase().includes(lowerQuery))) {
          return true;
        }
        
        return false;
      });
      
      renderResults(results, query);
      
      // 保存到最近搜索
      saveToRecentSearches(query);
    }
    
    function saveToRecentSearches(query) {
      if (query.length < 2) return; // 忽略太短的查询
      
      // 添加到最近搜索数组
      const index = recentSearches.indexOf(query);
      if (index > -1) {
        recentSearches.splice(index, 1); // 移除现有项
      }
      
      recentSearches.unshift(query); // 添加到开头
      
      // 限制数量
      if (recentSearches.length > 5) {
        recentSearches = recentSearches.slice(0, 5);
      }
      
      // 保存到本地存储
      try {
        localStorage.setItem('vs-recent-searches', JSON.stringify(recentSearches));
        updateRecentSearches();
      } catch (e) {
        console.error('Failed to save recent searches:', e);
      }
    }
    
    function updateRecentSearches() {
      const recentSearchesEl = document.getElementById('recent-searches');
      if (!recentSearchesEl) return;
      
      if (recentSearches.length === 0) {
        recentSearchesEl.innerHTML = `<div class="no-recent-searches">
          ${getTranslation('no_recent_searches', 'No recent searches')}
        </div>`;
        return;
      }
      
      recentSearchesEl.innerHTML = '';
      
      // 创建最近搜索列表
      recentSearches.forEach(term => {
        const itemEl = document.createElement('div');
        itemEl.className = 'recent-search-item';
        itemEl.innerHTML = `
          <i class="fas fa-history"></i>
          <span>${escapeHTML(term)}</span>
        `;
        
        // 点击加载搜索
        itemEl.addEventListener('click', () => {
          searchInput.value = term;
          searchInput.focus();
          const event = new Event('input');
          searchInput.dispatchEvent(event);
        });
        
        recentSearchesEl.appendChild(itemEl);
      });
    }
    
    function renderResults(results, query) {
      searchResults.innerHTML = '';
      
      if (results.length === 0) {
        searchResults.innerHTML = `<div class="vs-no-results">
          <i class="fas fa-search"></i>
          <span>${getTranslation('search_no_results', 'No results found for')} "${escapeHTML(query)}"</span>
        </div>`;
        
        if (searchCounter) {
          searchCounter.textContent = `0 ${getTranslation('search_results', 'results')}`;
        }
        return;
      }
      
      if (searchCounter) {
        const resultsText = results.length === 1 ? 
          getTranslation('search_result', 'result') : 
          getTranslation('search_results', 'results');
        searchCounter.textContent = `${results.length} ${resultsText}`;
      }
      
      results.forEach((item, index) => {
        const resultItem = document.createElement('div');
        resultItem.className = 'vs-result-item';
        resultItem.dataset.index = index;
        
        // 高亮匹配文本
        let titleHtml = highlightText(item.title, query);
        let contentPreview = getContentPreview(item.content, query, 150);
        let contentHtml = highlightText(contentPreview, query);
        
        resultItem.innerHTML = `
          <a href="${item.url}" class="vs-result-link">
            <div class="vs-result-header">
              <i class="fas fa-file-alt"></i>
              <span class="vs-result-title">${titleHtml}</span>
            </div>
            <div class="vs-result-preview">${contentHtml}</div>
            <div class="vs-result-meta">
              <span class="vs-result-date">
                <i class="fas fa-calendar-alt"></i> 
                ${item.date}
              </span>
              ${item.tags && item.tags.length ? 
                `<span class="vs-result-tags">
                  <i class="fas fa-tags"></i> 
                  ${item.tags.join(', ')}
                </span>` : ''}
            </div>
          </a>
        `;
        
        searchResults.appendChild(resultItem);
      });
      
      // 给第一个结果添加高亮
      if (searchResults.children.length > 0) {
        searchResults.children[0].classList.add('active');
      }
    }
    
    function navigateResults(e) {
      if (!searchResults.children.length || !['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) {
        return;
      }
      
      const activeItem = searchResults.querySelector('.vs-result-item.active');
      let activeIndex = activeItem ? parseInt(activeItem.dataset.index) : -1;
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (activeIndex < searchResults.children.length - 1) {
            if (activeItem) activeItem.classList.remove('active');
            searchResults.children[activeIndex + 1].classList.add('active');
            ensureVisible(searchResults.children[activeIndex + 1]);
          }
          break;
          
        case 'ArrowUp':
          e.preventDefault();
          if (activeIndex > 0) {
            activeItem.classList.remove('active');
            searchResults.children[activeIndex - 1].classList.add('active');
            ensureVisible(searchResults.children[activeIndex - 1]);
          }
          break;
          
        case 'Enter':
          e.preventDefault();
          if (activeItem) {
            const link = activeItem.querySelector('.vs-result-link');
            if (link) window.location.href = link.href;
          }
          break;
      }
    }
    
    function ensureVisible(element) {
      const container = searchResults;
      const containerTop = container.scrollTop;
      const containerBottom = containerTop + container.clientHeight;
      const elementTop = element.offsetTop;
      const elementBottom = elementTop + element.clientHeight;
      
      if (elementTop < containerTop) {
        container.scrollTop = elementTop;
      } else if (elementBottom > containerBottom) {
        container.scrollTop = elementBottom - container.clientHeight;
      }
    }
    
    function getContentPreview(content, query, maxLength) {
      if (!content) return '';
      
      const lowerContent = content.toLowerCase();
      const lowerQuery = query.toLowerCase();
      const index = lowerContent.indexOf(lowerQuery);
      
      if (index === -1) {
        return content.length > maxLength ? content.slice(0, maxLength) + '...' : content;
      }
      
      let start = Math.max(0, index - Math.floor((maxLength - query.length) / 2));
      let end = Math.min(content.length, start + maxLength);
      
      // 如果结尾有更多空间，调整开始位置
      if (end < content.length) {
        start = Math.max(0, end - maxLength);
      }
      
      let preview = content.slice(start, end);
      if (start > 0) preview = '...' + preview;
      if (end < content.length) preview += '...';
      
      return preview;
    }
    
    function highlightText(text, query) {
      if (!text) return '';
      
      const lowerText = text.toLowerCase();
      const lowerQuery = query.toLowerCase();
      
      let result = '';
      let lastIndex = 0;
      let index = lowerText.indexOf(lowerQuery);
      
      while (index !== -1) {
        // 添加匹配前的文本
        result += escapeHTML(text.slice(lastIndex, index));
        // 添加高亮匹配
        result += `<span class="vs-highlight">${escapeHTML(text.slice(index, index + query.length))}</span>`;
        
        lastIndex = index + query.length;
        index = lowerText.indexOf(lowerQuery, lastIndex);
      }
      
      // 添加剩余文本
      result += escapeHTML(text.slice(lastIndex));
      
      return result;
    }
    
    function escapeHTML(text) {
      return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }
    
    // 初始化搜索
    initSearch();
  });
})();