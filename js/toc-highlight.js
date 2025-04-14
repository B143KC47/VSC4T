document.addEventListener('DOMContentLoaded', function() {
    // 获取元素的绝对位置
    function getOffsetTop(element) {
        let offsetTop = 0;
        while(element) {
            offsetTop += element.offsetTop;
            element = element.offsetParent;
        }
        return offsetTop;
    }
    
    // 计算顶部导航栏的高度，用于调整滚动偏移量
    function getHeaderHeight() {
        const header = document.querySelector('header') || document.querySelector('.vs-nav');
        return header ? header.offsetHeight : 60; // 如果没有找到头部元素，默认使用60px
    }    // 更新目录激活状态
    function updateTocActive() {
        const tocLinks = document.querySelectorAll('.toc-link');
        const headings = document.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]');
        let activeLink = null;
        
        const scrollPosition = window.scrollY + getHeaderHeight() + 10; // 添加头部高度和一点额外偏移
        
        // 找到当前滚动位置对应的标题
        let currentHeading = null;
        for(const heading of headings) {
            if(getOffsetTop(heading) <= scrollPosition) {
                currentHeading = heading;
            } else {
                break;
            }
        }

        // 移除所有激活状态
        tocLinks.forEach(link => {
            link.classList.remove('active');
        });

        // 添加新的激活状态
        if(currentHeading) {
            // 查找对应的目录链接，通过遍历而非选择器
            tocLinks.forEach(link => {
                const href = link.getAttribute('href');
                const linkTargetId = href.startsWith('#') ? href.slice(1) : href;
                
                // 使用 decodeURIComponent 解码 URL 编码的标识符
                try {
                    const decodedId = decodeURIComponent(linkTargetId);
                    if (decodedId === currentHeading.id || linkTargetId === currentHeading.id) {
                        link.classList.add('active');
                        activeLink = link;
                    }
                } catch (e) {
                    console.error("解码TOC链接时出错:", e);
                }
            });
        }
    }    // 初始化TOC点击事件
    function initTocEvents() {
        const tocLinks = document.querySelectorAll('.toc-link');
        
        // 平滑滚动到目标位置
        tocLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // 获取目标ID，支持带#号和不带#号的href
                const href = link.getAttribute('href');
                const targetId = href.startsWith('#') ? href.slice(1) : href;
                
                try {
                    // 解码URL编码的ID
                    const decodedId = decodeURIComponent(targetId);
                    
                    // 尝试使用解码后的ID查找元素
                    let targetElement = document.getElementById(decodedId);
                    
                    // 如果找不到，尝试使用原始ID查找
                    if (!targetElement) {
                        targetElement = document.getElementById(targetId);
                    }
                    
                    // 如果仍然找不到，尝试查找具有相同文本内容的标题
                    if (!targetElement) {
                        const allHeadings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
                        for (const heading of allHeadings) {
                            if (heading.textContent.trim() === decodedId) {
                                targetElement = heading;
                                break;
                            }
                        }
                    }
                    
                    if(targetElement) {
                        // 计算滚动位置，考虑头部高度
                        const headerHeight = getHeaderHeight();
                        window.scrollTo({
                            top: getOffsetTop(targetElement) - headerHeight - 10,
                            behavior: 'smooth'
                        });
                        
                        // 更新 URL，但不触发页面跳转
                        history.pushState(null, null, href); // 使用原始href保持URL编码的一致性
                        
                        // 设置焦点到目标元素，提高可访问性
                        targetElement.setAttribute('tabindex', '-1');
                        targetElement.focus({preventScroll: true});
                    }
                } catch (e) {
                    console.error("处理TOC链接时出错:", e);
                }
            });
        });
    }
    
    // 添加滚动事件监听
    function addScrollListener() {
        window.addEventListener('scroll', () => {
            requestAnimationFrame(updateTocActive);
        });
    }

    // 处理动态加载的内容
    function handleDynamicContent() {
        // 使用MutationObserver监听文档变化，处理可能的动态内容
        const observer = new MutationObserver(() => {
            initTocEvents(); // 重新绑定事件
            updateTocActive(); // 重新计算激活状态
        });
        
        // 监控文章内容区域变化
        const contentArea = document.querySelector('.post-content') || document.querySelector('article');
        if (contentArea) {
            observer.observe(contentArea, { childList: true, subtree: true });
        }
    }
    
    // 初始化所有功能
    function init() {
        initTocEvents();
        addScrollListener();
        updateTocActive();
        handleDynamicContent();
        
        // 浏览器后退前进时，重新计算激活状态
        window.addEventListener('popstate', updateTocActive);
        
        // 页面大小变化时，重新计算偏移量和激活状态
        window.addEventListener('resize', () => {
            requestAnimationFrame(updateTocActive);
        });
    }
    
    // 启动初始化
    init();
});