document.addEventListener('DOMContentLoaded', function() {
  const tocLinks = document.querySelectorAll('.toc-link');
  const headings = document.querySelectorAll('.vscode-markdown h1, .vscode-markdown h2, .vscode-markdown h3, .vscode-markdown h4, .vscode-markdown h5, .vscode-markdown h6');
  const tocContainer = document.querySelector('.vs-toc');
  let activeLink = null;
  let ticking = false;
  let isMouseOver = false;

  // 防抖函数
  function debounce(func, wait) {
    let timeout;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }

  // 平滑滚动到目标位置
  function scrollToTarget(target, offset = 80) {
    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });
  }

  // 添加点击事件
  tocLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').slice(1);
      const target = document.getElementById(targetId);
      if (target) {
        scrollToTarget(target);
        history.pushState(null, null, `#${targetId}`);
      }
    });
  });

  // 目录容器鼠标事件
  if (tocContainer) {
    tocContainer.addEventListener('mouseenter', () => {
      isMouseOver = true;
    });

    tocContainer.addEventListener('mouseleave', () => {
      isMouseOver = false;
    });
  }

  // 更新活动目录项
  function updateActiveLink() {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        let current = '';
        const scrollPos = window.pageYOffset;
        
        // 查找当前可见的标题
        headings.forEach(heading => {
          const sectionTop = heading.offsetTop - 100;
          if (scrollPos >= sectionTop) {
            current = heading.getAttribute('id');
          }
        });

        // 更新活动状态
        if (activeLink) {
          activeLink.classList.remove('active');
        }

        if (current) {
          activeLink = document.querySelector(`.toc-link[href="#${current}"]`);
          if (activeLink) {
            activeLink.classList.add('active');

            // 如果目录容器没有被鼠标悬停，则自动滚动
            if (!isMouseOver) {
              const container = document.querySelector('.toc-content');
              if (container) {
                const linkRect = activeLink.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                
                if (linkRect.bottom > containerRect.bottom || linkRect.top < containerRect.top) {
                  activeLink.scrollIntoView({
                    block: 'center',
                    behavior: 'smooth'
                  });
                }
              }
            }
          }
        }

        ticking = false;
      });

      ticking = true;
    }
  }

  // 监听滚动事件
  window.addEventListener('scroll', debounce(updateActiveLink, 100));

  // 初始化时检查URL hash并滚动到对应位置
  if (window.location.hash) {
    const targetId = window.location.hash.slice(1);
    const target = document.getElementById(targetId);
    if (target) {
      setTimeout(() => {
        scrollToTarget(target);
      }, 100);
    }
  }
});