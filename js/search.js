/**
 * Search functionality for VSC4T theme
 * Provides code editor style search experience
 */

let searchData = [];
let searchIndex = null;

// Initialize search when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('vs-search-input');
  const searchResults = document.getElementById('vs-search-results');
  const searchContainer = document.getElementById('vs-search-container');
  const searchCounter = document.getElementById('vs-search-counter');
  const searchClearBtn = document.getElementById('vs-search-clear');
  
  // Filter checkboxes
  const searchTitles = document.getElementById('search-titles');
  const searchContent = document.getElementById('search-content');
  const searchTags = document.getElementById('search-tags');
  
  if (!searchInput || !searchResults) return;

  // Get translations
  const noResultsText = window.HEXO_CONFIG ? (window.HEXO_CONFIG.search_no_results || 'No results found for') : 'No results found for';
  const resultText = window.HEXO_CONFIG ? (window.HEXO_CONFIG.search_result || 'result') : 'result';
  const resultsText = window.HEXO_CONFIG ? (window.HEXO_CONFIG.search_results || 'results') : 'results';
  const loadingErrorText = window.HEXO_CONFIG ? (window.HEXO_CONFIG.search_error || 'Error loading search data') : 'Error loading search data';

  // Recent searches storage
  let recentSearches = [];
  try {
    const stored = localStorage.getItem('vs-recent-searches');
    if (stored) {
      recentSearches = JSON.parse(stored);
      updateRecentSearches();
    }
  } catch (e) {
    console.error('Error loading recent searches:', e);
  }

  // Get the correct root path for search.json
  let rootPath = '/';
  if (window.VSC4T_SEARCH && window.VSC4T_SEARCH.root) {
    rootPath = window.VSC4T_SEARCH.root;
  } else if (window.HEXO_CONFIG && window.HEXO_CONFIG.root) {
    rootPath = window.HEXO_CONFIG.root;
  }
  
  // Ensure the root path has a trailing slash
  if (!rootPath.endsWith('/')) {
    rootPath += '/';
  }
  
  const searchJsonPath = `${rootPath}search.json`;
  console.log('[VSC4T] Loading search index from:', searchJsonPath);

  // Show loading state
  searchResults.innerHTML = `<div class="vs-search-loading">
    <i class="fas fa-spinner fa-spin"></i>
    <span>Loading search data...</span>
  </div>`;

  // Load search data
  fetch(searchJsonPath)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('[VSC4T] Search index loaded successfully, entries:', data.length);
      searchData = data;
      initSearch();
      // Clear loading state and prepare for search
      clearResults();
    })
    .catch(error => {
      console.error('Error loading search data:', error, 'Path:', searchJsonPath);
      searchResults.innerHTML = `<div class="vs-no-results">
        <i class="fas fa-exclamation-circle"></i>
        <span>${loadingErrorText}</span>
        <div class="vs-error-details">
          Check that search.json is being generated correctly.<br>
          Path: ${searchJsonPath}<br>
          Error: ${error.message}
        </div>
      </div>`;
    });

  // Initialize search functionality
  function initSearch() {
    // Listen for input in search box
    searchInput.addEventListener('input', performSearch);
    
    // Clear search
    if (searchClearBtn) {
      searchClearBtn.addEventListener('click', clearSearch);
    }
    
    // Handle keyboard navigation
    searchInput.addEventListener('keydown', navigateResults);
    
    // Filter changes
    if (searchTitles) searchTitles.addEventListener('change', performSearch);
    if (searchContent) searchContent.addEventListener('change', performSearch);
    if (searchTags) searchTags.addEventListener('change', performSearch);
  }
  
  // Perform search
  function performSearch() {
    const query = searchInput.value.trim().toLowerCase();
    
    if (!query) {
      clearResults();
      return;
    }
    
    // Get filter options
    const filterTitle = searchTitles ? searchTitles.checked : true;
    const filterContent = searchContent ? searchContent.checked : true;
    const filterTags = searchTags ? searchTags.checked : true;
    
    const results = searchData.filter(item => {
      let match = false;
      
      // Match title
      if (filterTitle && item.title && item.title.toLowerCase().includes(query)) {
        match = true;
      }
      
      // Match content
      if (!match && filterContent && item.content && item.content.toLowerCase().includes(query)) {
        match = true;
      }
      
      // Match tags or categories
      if (!match && filterTags) {
        if (item.tags && item.tags.some(tag => tag.toLowerCase().includes(query))) {
          match = true;
        }
        
        if (!match && item.categories && item.categories.some(cat => cat.toLowerCase().includes(query))) {
          match = true;
        }
      }
      
      return match;
    });
    
    displayResults(results, query);
    updateSearchCounter(results.length);
    
    // Save to recent searches (only if results found)
    if (results.length > 0) {
      saveRecentSearch(query);
    }
  }

  // Save a query to recent searches
  function saveRecentSearch(query) {
    // Only save if it's not already in the list
    if (!recentSearches.includes(query) && query.length >= 2) {
      recentSearches.unshift(query); // Add to beginning
      recentSearches = recentSearches.slice(0, 5); // Keep only 5 most recent
      
      // Store in localStorage
      try {
        localStorage.setItem('vs-recent-searches', JSON.stringify(recentSearches));
      } catch (e) {
        console.error('Error saving recent searches:', e);
      }
      
      // Update UI
      updateRecentSearches();
    }
  }
  
  // Update the recent searches UI
  function updateRecentSearches() {
    const recentSearchesList = document.getElementById('recent-searches');
    if (!recentSearchesList) return;
    
    recentSearchesList.innerHTML = '';
    
    if (recentSearches.length === 0) {
      recentSearchesList.innerHTML = '<div class="recent-search-empty">No recent searches</div>';
      return;
    }
    
    recentSearches.forEach(query => {
      const searchItem = document.createElement('div');
      searchItem.className = 'recent-search-item';
      searchItem.innerHTML = `<i class="fas fa-history"></i> ${escapeHTML(query)}`;
      searchItem.addEventListener('click', () => {
        if (searchInput) {
          searchInput.value = query;
          searchInput.focus();
          performSearch();
        }
      });
      
      recentSearchesList.appendChild(searchItem);
    });
  }
  
  // Display search results
  function displayResults(results, query) {
    searchResults.innerHTML = '';
    
    if (results.length === 0) {
      searchResults.innerHTML = `<div class="vs-no-results">
        <i class="fas fa-search"></i>
        <span>${noResultsText} "${escapeHTML(query)}"</span>
      </div>`;
      return;
    }
    
    results.forEach((item, index) => {
      const resultItem = document.createElement('div');
      resultItem.className = 'vs-result-item';
      resultItem.dataset.index = index;
      
      // Highlight matched text
      let titleHtml = highlightText(item.title || '', query);
      let contentPreview = getContentPreview(item.content || '', query, 150);
      let contentHtml = highlightText(contentPreview, query);
      
      // Create file icon based on categories or default
      let fileIcon = 'fa-file-code';
      if (item.categories && item.categories.length > 0) {
        const category = item.categories[0].toLowerCase();
        if (category.includes('javascript') || category.includes('js')) {
          fileIcon = 'fa-file-code js-icon';
        } else if (category.includes('css') || category.includes('style')) {
          fileIcon = 'fa-file-code css-icon';
        } else if (category.includes('html')) {
          fileIcon = 'fa-file-code html-icon';
        } else if (category.includes('markdown') || category.includes('md')) {
          fileIcon = 'fa-file-alt md-icon';
        }
      }
      
      resultItem.innerHTML = `
        <a href="${item.url}" class="vs-result-link">
          <div class="vs-result-header">
            <i class="fas ${fileIcon}"></i>
            <span class="vs-result-title">${titleHtml}</span>
          </div>
          <div class="vs-result-preview">${contentHtml}</div>
          <div class="vs-result-meta">
            <span class="vs-result-date">
              <i class="fas fa-calendar-alt"></i> 
              ${item.date || ''}
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
    
    // Add active state to first result
    if (searchResults.children.length > 0) {
      searchResults.children[0].classList.add('active');
    }
  }
  
  // Navigate search results with keyboard
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
  
  // Ensure the active element is visible in the scrollable container
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
  
  // Clear search results
  function clearResults() {
    searchResults.innerHTML = '';
    updateSearchCounter(0);
  }
  
  // Clear search input and results
  function clearSearch() {
    searchInput.value = '';
    clearResults();
    searchInput.focus();
  }
  
  // Update search counter
  function updateSearchCounter(count) {
    if (searchCounter) {
      searchCounter.textContent = count > 0 ? 
        `${count} ${count === 1 ? resultText : resultsText}` : 
        '0 ' + resultsText;
    }
  }
  
  // Helper: Get content preview with context around the query
  function getContentPreview(content, query, maxLength) {
    if (!content) return '';
    
    const lowerContent = content.toLowerCase();
    const index = lowerContent.indexOf(query.toLowerCase());
    
    if (index === -1) {
      // Return beginning of content if query not found
      return content.length > maxLength ? 
        content.substring(0, maxLength) + '...' : 
        content;
    }
    
    // Calculate start and end points for preview with context
    const contextLength = Math.floor((maxLength - query.length) / 2);
    let start = Math.max(0, index - contextLength);
    let end = Math.min(content.length, index + query.length + contextLength);
    
    // Adjust if we have room to show more context
    if (start > 0 && end < content.length) {
      // Preview is somewhere in the middle
    } else if (start === 0) {
      // Beginning of content, show more at the end
      end = Math.min(content.length, maxLength);
    } else {
      // End of content, show more at the beginning
      start = Math.max(0, content.length - maxLength);
    }
    
    let preview = content.substring(start, end);
    
    // Add ellipsis if needed
    if (start > 0) preview = '...' + preview;
    if (end < content.length) preview = preview + '...';
    
    return preview;
  }
  
  // Highlight query text in content
  function highlightText(text, query) {
    if (!text) return '';
    if (!query) return escapeHTML(text);
    
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    let result = '';
    let lastIndex = 0;
    let index = lowerText.indexOf(lowerQuery);
    
    while (index !== -1) {
      // Add text before match
      result += escapeHTML(text.substring(lastIndex, index));
      // Add highlighted match
      result += `<span class="vs-highlight">${escapeHTML(text.substring(index, index + query.length))}</span>`;
      
      lastIndex = index + query.length;
      index = lowerText.indexOf(lowerQuery, lastIndex);
    }
    
    // Add remaining text
    result += escapeHTML(text.substring(lastIndex));
    
    return result;
  }
  
  // Escape HTML special characters
  function escapeHTML(text) {
    if (typeof text !== 'string') return '';
    return text.replace(/[&<>"']/g, match => {
      switch (match) {
        case '&': return '&amp;';
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        case "'": return '&#39;';
      }
    });
  }
});