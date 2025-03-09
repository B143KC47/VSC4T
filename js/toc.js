/* TOC (Table of Contents) 功能 */
document.addEventListener('DOMContentLoaded', function() {
  // 获取需要创建目录的区域
  const tocContainer = document.querySelector('.section-content');
  if (!tocContainer) return;

  // 获取文章内容区域中的所有标题
  const contentArea = document.querySelector('.post-body');
  if (!contentArea) return;

  const headings = contentArea.querySelectorAll('h1, h2, h3, h4, h5, h6');
  if (!headings.length) return;

  // 创建目录列表
  const tocList = document.createElement('ul');
  tocList.className = 'toc-list';

  let currentLevel = 0;
  let currentList = tocList;
  const listStack = [tocList];

  headings.forEach((heading) => {
    // 获取标题级别
    const level = parseInt(heading.tagName.substring(1));
    
    // 确保标题有id，如果没有，则生成一个
    if (!heading.id) {
      heading.id = heading.textContent.toLowerCase()
                   .replace(/\s+/g, '-')
                   .replace(/[^\w-]/g, '');
    }
    
    // 处理目录层级
    if (level > currentLevel) {
      // 创建新的子列表
      const newList = document.createElement('ul');
      if (currentList.lastChild) {
        currentList.lastChild.appendChild(newList);
        listStack.push(newList);
        currentList = newList;
      }
    } else if (level < currentLevel) {
      // 回到上一级
      for (let i = 0; i < currentLevel - level; i++) {
        if (listStack.length > 1) { // 确保不移除根列表
          listStack.pop();
        }
      }
      currentList = listStack[listStack.length - 1];
    }
    
    // 创建目录项
    const listItem = document.createElement('li');
    const link = document.createElement('a');
    link.href = '#' + heading.id;
    link.textContent = heading.textContent;
    link.addEventListener('click', function(e) {
      e.preventDefault();
      document.querySelector('#' + heading.id).scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    });
    
    listItem.appendChild(link);
    currentList.appendChild(listItem);
    currentLevel = level;
  });
  
  // 将生成的目录添加到容器
  tocContainer.appendChild(tocList);
});
