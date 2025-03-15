document.addEventListener('DOMContentLoaded', function() {
    const tocLinks = document.querySelectorAll('.toc-link');
    const headings = document.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]');
    let activeLink = null;

    // 获取元素的绝对位置
    function getOffsetTop(element) {
        let offsetTop = 0;
        while(element) {
            offsetTop += element.offsetTop;
            element = element.offsetParent;
        }
        return offsetTop;
    }

    // 更新目录激活状态
    function updateTocActive() {
        const scrollPosition = window.scrollY + 100; // 添加偏移量以提前激活
        
        // 找到当前滚动位置对应的标题
        let currentHeading = null;
        for(const heading of headings) {
            if(getOffsetTop(heading) <= scrollPosition) {
                currentHeading = heading;
            } else {
                break;
            }
        }

        // 移除之前的激活状态
        if(activeLink) {
            activeLink.classList.remove('active');
        }

        // 添加新的激活状态
        if(currentHeading) {
            const newActiveLink = document.querySelector(`.toc-link[href="#${currentHeading.id}"]`);
            if(newActiveLink) {
                newActiveLink.classList.add('active');
                activeLink = newActiveLink;
            }
        }
    }

    // 平滑滚动到目标位置
    tocLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').slice(1);
            const targetElement = document.getElementById(targetId);
            if(targetElement) {
                window.scrollTo({
                    top: getOffsetTop(targetElement) - 60,
                    behavior: 'smooth'
                });
            }
        });
    });

    // 监听滚动事件
    window.addEventListener('scroll', () => {
        requestAnimationFrame(updateTocActive);
    });

    // 初始化激活状态
    updateTocActive();
});