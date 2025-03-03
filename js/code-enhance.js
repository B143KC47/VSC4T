document.addEventListener('DOMContentLoaded', function() {
    // 增强代码块功能
    enhanceCodeBlocks();
    
    // 添加复制按钮
    addCopyButtons();
    
    // 处理Python代码的特殊缩进
    fixPythonIndentation();
    
    // 添加代码块横向滚动指示
    addScrollIndicators();
});

// 增强代码块功能
function enhanceCodeBlocks() {
    const codeBlocks = document.querySelectorAll('figure.highlight');
    
    codeBlocks.forEach(block => {
        // 检测代码语言
        const langClass = Array.from(block.classList).find(cls => cls !== 'highlight');
        const language = langClass ? langClass.replace('language-', '') : 'code';
        
        // 添加语言标签
        if (!block.querySelector('.code-header')) {
            const header = document.createElement('div');
            header.className = 'code-header';
            
            const langLabel = document.createElement('span');
            langLabel.className = 'code-language';
            langLabel.textContent = language;
            
            header.appendChild(langLabel);
            block.insertBefore(header, block.firstChild);
        }
        
        // 标记为可滚动
        if (block.scrollWidth > block.clientWidth) {
            block.classList.add('scrollable');
        }
    });
}

// 添加复制按钮
function addCopyButtons() {
    const codeBlocks = document.querySelectorAll('figure.highlight');
    
    codeBlocks.forEach(block => {
        if (!block.querySelector('.copy-btn')) {
            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-btn';
            copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
            copyBtn.title = '复制';
            
            copyBtn.addEventListener('click', function() {
                const code = block.querySelector('code').textContent;
                navigator.clipboard.writeText(code).then(() => {
                    // 复制成功反馈
                    copyBtn.innerHTML = '<i class="fas fa-check"></i>';
                    copyBtn.classList.add('copied');
                    
                    setTimeout(() => {
                        copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
                        copyBtn.classList.remove('copied');
                    }, 2000);
                });
            });
            
            block.appendChild(copyBtn);
        }
    });
}

// 修复Python代码的缩进问题
function fixPythonIndentation() {
    const pythonBlocks = document.querySelectorAll('.language-python code, .python code');
    
    pythonBlocks.forEach(codeElement => {
        // 确保使用等宽字体
        codeElement.style.fontFamily = "'JetBrains Mono', 'Consolas', monospace";
        
        // 确保tab宽度一致
        codeElement.style.tabSize = "4";
        codeElement.style.MozTabSize = "4";
        codeElement.style.OTabSize = "4";
        
        // 保持原始格式
        codeElement.style.whiteSpace = "pre";
    });
}

// 添加滚动指示器
function addScrollIndicators() {
    const codeBlocks = document.querySelectorAll('figure.highlight');
    
    codeBlocks.forEach(block => {
        // 检测是否需要横向滚动
        const checkScrollable = () => {
            if (block.scrollWidth > block.clientWidth) {
                block.classList.add('scrollable');
            } else {
                block.classList.remove('scrollable');
            }
        };
        
        // 初始检查
        checkScrollable();
        
        // 窗口大小改变时重新检查
        window.addEventListener('resize', checkScrollable);
        
        // 滚动时的视觉反馈
        block.addEventListener('scroll', function() {
            if (this.scrollLeft > 0) {
                this.classList.add('scrolled');
            } else {
                this.classList.remove('scrolled');
            }
        });
    });
} 