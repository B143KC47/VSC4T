document.addEventListener('DOMContentLoaded', function() {
  // 获取所有分类标题
  const categoryHeaders = document.querySelectorAll('.category-header');
  
  // 为每个分类标题添加点击事件
  categoryHeaders.forEach(header => {
    // 获取分类名称作为唯一标识符
    const categoryName = header.querySelector('.category-link h2').textContent.trim();
    const storageKey = `category-${categoryName}-collapsed`;
    
    // 恢复保存的折叠状态
    const savedState = localStorage.getItem(storageKey);
    if (savedState === 'false') {
      // 如果保存的状态是展开的
      header.classList.remove('collapsed');
      const content = header.nextElementSibling;
      content.classList.remove('collapsed');
    }
    
    header.addEventListener('click', function(e) {
      // 阻止链接的默认点击行为
      if (e.target.tagName === 'A' || e.target.closest('a')) {
        return; // 如果点击的是链接，则不进行折叠/展开操作
      }
      
      // 切换当前分类标题的折叠状态
      this.classList.toggle('collapsed');
      
      // 获取与当前标题关联的内容部分
      const content = this.nextElementSibling;
      
      // 切换内容部分的折叠状态
      content.classList.toggle('collapsed');
      
      // 保存当前折叠状态到本地存储
      localStorage.setItem(storageKey, this.classList.contains('collapsed'));
    });
  });
});
