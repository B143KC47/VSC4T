document.addEventListener('DOMContentLoaded', function() {
    // 增强代码块功能
    enhanceCodeBlocks();
    
    // 添加复制按钮
    addCopyButtons();
    
    // 处理Python代码的特殊缩进
    fixPythonIndentation();
    
    // 添加代码块横向滚动指示
    addScrollIndicators();
    
    // 美化普通代码块
    enhancePlainCodeBlocks();
});

// 美化普通代码块
function enhancePlainCodeBlocks() {
    // 选择所有不在figure.highlight内的代码块
    const plainCodeBlocks = document.querySelectorAll('pre:not(.line-numbers-pre):not(.code-content)');
    
    plainCodeBlocks.forEach(pre => {
        // 避免重复处理
        if (pre.classList.contains('enhanced')) return;
        
        // 检查是否需要横向滚动
        if (pre.scrollWidth > pre.clientWidth) {
            pre.classList.add('scrollable');
        }
        
        // 添加滚动事件
        pre.addEventListener('scroll', function() {
            if (this.scrollLeft > 0) {
                this.classList.add('scrolled');
            } else {
                this.classList.remove('scrolled');
            }
        });
        
        // 标记为已增强
        pre.classList.add('enhanced');
    });
}

// 增强代码块功能
function enhanceCodeBlocks() {
    const codeBlocks = document.querySelectorAll('figure.highlight');
    
    codeBlocks.forEach(block => {
        // 检测代码语言
        const langClass = Array.from(block.classList).find(cls => cls !== 'highlight');
        const language = langClass ? langClass.replace('language-', '') : 'code';
        
        // 获取代码块内的表格元素
        const table = block.querySelector('table');
        if (!table) return;
        
        // 获取行号内容
        const gutter = table.querySelector('.gutter pre');
        const gutterLines = gutter ? Array.from(gutter.querySelectorAll('.line')).map(line => line.textContent) : [];
        
        // 获取代码内容
        const code = table.querySelector('.code pre code');
        const codeContent = code ? code.innerHTML : '';
        
        // 创建外部容器来包裹标题栏和代码块
        const container = document.createElement('div');
        container.className = 'code-block-container';        // 创建代码块头部
        const header = document.createElement('div');
        header.className = 'code-header';
        
        // 创建左侧区域（包含语言标签）
        const headerLeft = document.createElement('div');
        headerLeft.className = 'code-header-left';
        
        // 创建右侧区域（可放置操作按钮）
        const headerRight = document.createElement('div');
        headerRight.className = 'code-header-right';
        
        // 创建语言标签
        const langLabel = document.createElement('span');
        langLabel.className = `code-language language-${language.toLowerCase()}`;
        langLabel.textContent = language;
        
        // 如果没有检测到特定语言，添加默认类
        if (language === 'code') {
            langLabel.classList.add('language-default');
        }
        
        // 组装头部结构
        headerLeft.appendChild(langLabel);
        header.appendChild(headerLeft);
        header.appendChild(headerRight);
          // 创建行号区域 - 直接使用pre元素
        const lineNumbersPre = document.createElement('pre');
        lineNumbersPre.className = 'line-numbers-pre';        // 创建与代码行数完全对应的结构
        gutterLines.forEach((lineNum) => {
            const lineDiv = document.createElement('div');
            lineDiv.className = 'line-num';
            lineDiv.textContent = lineNum;
            lineDiv.style.height = '1.5em'; // 确保每行高度一致
            lineNumbersPre.appendChild(lineDiv);
        });
        
        // 创建代码内容区域 - 修改这部分，使用正确的结构
        const codePre = document.createElement('pre');
        codePre.className = `code-content hljs ${language}`;
        codePre.innerHTML = codeContent;
        
        // 创建包含两个pre的容器
        const codeBlockWrapper = document.createElement('div');
        codeBlockWrapper.className = 'code-pre-wrapper';
        codeBlockWrapper.appendChild(lineNumbersPre);
        codeBlockWrapper.appendChild(codePre);
        
        // 组装结构
        container.appendChild(header);
        container.appendChild(codeBlockWrapper);
        
        // 替换原始代码块
        const parent = block.parentNode;
        parent.insertBefore(container, block);
        parent.removeChild(block);
        
        // 标记为可滚动
        if (codePre.scrollWidth > codePre.clientWidth) {
            codeBlockWrapper.classList.add('scrollable');
        }
        
        // 同步滚动
        codePre.addEventListener('scroll', function() {
            lineNumbersPre.scrollTop = this.scrollTop;
        });
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