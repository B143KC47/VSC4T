document.addEventListener('DOMContentLoaded', function() {
  // 为所有section header添加点击事件
  const sectionHeaders = document.querySelectorAll('.section-header');
  
  sectionHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const content = header.nextElementSibling;
      const icon = header.querySelector('i');
      
      // 切换折叠状态
      header.classList.toggle('collapsed');
      content.classList.toggle('collapsed');
      
      // 本地存储折叠状态
      const sectionId = header.textContent.trim();
      localStorage.setItem(`section-${sectionId}`, header.classList.contains('collapsed'));
    });
    
    // 恢复保存的折叠状态
    const sectionId = header.textContent.trim();
    const isCollapsed = localStorage.getItem(`section-${sectionId}`) === 'true';
    
    if (isCollapsed) {
      header.classList.add('collapsed');
      header.nextElementSibling.classList.add('collapsed');
    }
  });
  
  // 标签hover效果
  const tagItems = document.querySelectorAll('.tag-item');
  
  tagItems.forEach(tag => {
    tag.addEventListener('mouseenter', () => {
      const icon = tag.querySelector('i');
      icon.classList.add('fa-bounce');
    });
    
    tag.addEventListener('mouseleave', () => {
      const icon = tag.querySelector('i');
      icon.classList.remove('fa-bounce');
    });
  });
});
