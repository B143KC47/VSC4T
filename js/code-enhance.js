document.addEventListener('DOMContentLoaded', function() {
    // 初始化mermaid
    if (typeof mermaid !== 'undefined') {
        mermaid.initialize({
            startOnLoad: false,
            theme: 'dark',
            securityLevel: 'loose',
            fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace'
        });
    }
    
    // 增强代码块功能（已包含添加复制按钮）
    enhanceCodeBlocks();
    
    // 注释掉重复的复制按钮添加功能，避免功能重叠
    // addCopyButtons();
    
    // 处理Python代码的特殊缩进
    fixPythonIndentation();
    
    // 添加代码块横向滚动指示
    addScrollIndicators();
    
    // 美化普通代码块
    enhancePlainCodeBlocks();

    // 渲染mermaid图表
    renderMermaidDiagrams();
    
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
        
        // 添加复制按钮 - 确保按钮不会与"code"标签重叠
        if (!pre.querySelector('.copy-button')) {
            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-button';
            copyBtn.title = '复制代码';
            copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
            
            // 添加复制功能
            copyBtn.addEventListener('click', function() {
                const code = pre.textContent;
                navigator.clipboard.writeText(code).then(() => {
                    // 复制成功反馈 - 只改变图标
                    this.innerHTML = '<i class="fas fa-check"></i>';
                    this.classList.add('copied');
                    
                    // 2秒后恢复
                    setTimeout(() => {
                        this.innerHTML = '<i class="fas fa-copy"></i>';
                        this.classList.remove('copied');
                    }, 2000);
                }).catch(err => {
                    console.error('复制失败:', err);
                });
            });
            
            // 将按钮添加到代码块中
            pre.appendChild(copyBtn);
        }
        
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
        
        // 创建外部容器来包裹标题栏 and 代码块
        const container = document.createElement('div');
        container.className = 'code-block-container';

        // 创建代码块头部
        const header = document.createElement('div');
        header.className = 'code-header';
        
        // 创建左侧区域（包含语言标签）
        const headerLeft = document.createElement('div');
        headerLeft.className = 'code-header-left';

        // 创建右侧区域（可放置操作按钮）
        const headerRight = document.createElement('div');
        headerRight.className = 'code-header-right';

        // 创建折叠/展开按钮
        const toggleButton = document.createElement('button');
        toggleButton.className = 'code-header-button toggle-btn';
        toggleButton.title = '折叠/展开代码块';
        toggleButton.innerHTML = '<i class="fas fa-chevron-down"></i>';
        headerRight.appendChild(toggleButton);
        
        // 创建复制按钮 (无文字提示)
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-btn';
        copyButton.title = '复制代码';
        copyButton.innerHTML = '<i class="fas fa-copy"></i>';
        
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

        // 创建代码内容区域
        const codePre = document.createElement('pre');
        codePre.className = `code-content hljs ${language}`;
        
        // 解析代码内容并与行号合并
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = codeContent;
        const lines = tempDiv.querySelectorAll('.line');
        
        if (lines.length > 0) {
            lines.forEach((line, index) => {
                const lineRow = document.createElement('div');
                lineRow.className = 'code-line';
                
                const lineNum = document.createElement('div');
                lineNum.className = 'line-num';
                lineNum.textContent = gutterLines[index] || (index + 1);
                
                const lineCode = document.createElement('div');
                lineCode.className = 'line-code';
                lineCode.innerHTML = line.innerHTML;
                
                lineRow.appendChild(lineNum);
                lineRow.appendChild(lineCode);
                codePre.appendChild(lineRow);
            });
        } else {
            // 如果没有 .line 标签，尝试按换行符分割
            const rawLines = codeContent.split(/\n|<br\s*\/?>/i);
            if (rawLines.length > 0) {
                rawLines.forEach((lineHtml, index) => {
                    if (index === rawLines.length - 1 && lineHtml === '') return;
                    const lineRow = document.createElement('div');
                    lineRow.className = 'code-line';
                    
                    const lineNum = document.createElement('div');
                    lineNum.className = 'line-num';
                    lineNum.textContent = gutterLines[index] || (index + 1);
                    
                    const lineCode = document.createElement('div');
                    lineCode.className = 'line-code';
                    lineCode.innerHTML = lineHtml || ' ';
                    
                    lineRow.appendChild(lineNum);
                    lineRow.appendChild(lineCode);
                    codePre.appendChild(lineRow);
                });
            } else {
                codePre.innerHTML = codeContent;
            }
        }

        // 创建包含代码内容的容器
        const codeBlockWrapper = document.createElement('div');
        codeBlockWrapper.className = 'code-pre-wrapper';
        codeBlockWrapper.appendChild(codePre);
        
        // 将复制按钮添加到code-pre-wrapper中
        codeBlockWrapper.appendChild(copyButton);

        // 检测代码行数并应用相应样式
        const lineCount = gutterLines.length || lines.length;
        if (lineCount < 4) {
            codeBlockWrapper.classList.add('few-lines');
            codeBlockWrapper.classList.add(`line-count-${lineCount}`);
        }
          
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
        
        // 处理折叠/展开功能
        const toggleBtn = header.querySelector('.toggle-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', function() {
                codeBlockWrapper.classList.toggle('collapsed');
                const icon = this.querySelector('i');
                if (codeBlockWrapper.classList.contains('collapsed')) {
                    icon.className = 'fas fa-chevron-right';
                } else {
                    icon.className = 'fas fa-chevron-down';
                }
            });
        }

        // 处理复制功能
        copyButton.addEventListener('click', function() {
            // 获取代码内容 (排除行号)
            const codeLines = codePre.querySelectorAll('.line-code');
            const codeText = Array.from(codeLines).map(l => l.textContent).join('\n');
            
            // 复制到剪贴板
            navigator.clipboard.writeText(codeText).then(() => {
                this.innerHTML = '<i class="fas fa-check"></i>';
                this.classList.add('copied');
                
                setTimeout(() => {
                    this.innerHTML = '<i class="fas fa-copy"></i>';
                    this.classList.remove('copied');
                }, 2000);
            }).catch(err => {
                console.error('无法复制代码:', err);
            });
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
// 渲染mermaid图表
function renderMermaidDiagrams() {
    // 检查mermaid是否可用
    if (typeof mermaid === 'undefined') {
        console.warn('Mermaid library not loaded');
        return;
    }
    
    // 查找所有mermaid代码块
    const mermaidBlocks = document.querySelectorAll('pre.mermaid');
    
    if (mermaidBlocks.length === 0) {
        return; // 没有找到mermaid代码块
    }
    
    // 处理每个mermaid代码块
    mermaidBlocks.forEach((codeBlock, index) => {
        // 获取父元素
        const preElement = codeBlock.previousElementSibling;
        if (!preElement) return;
        
        // 避免重复处理
        if (preElement.classList.contains('mermaid-processed')) return;
        
        // 获取mermaid代码
        const mermaidCode = codeBlock.textContent;
        if (!mermaidCode.trim()) return;
        
        // 创建新的div用于渲染mermaid图表
        const mermaidContainer = document.createElement('div');
        mermaidContainer.className = 'mermaid-diagram';
        mermaidContainer.style.textAlign = 'center';
        mermaidContainer.style.margin = '20px 0';
        mermaidContainer.style.cursor = 'pointer';
        
        // 创建唯一ID
        const mermaidId = `mermaid-diagram-${index}`;
        mermaidContainer.id = mermaidId;
        
        // 将mermaid代码放入容器
        mermaidContainer.textContent = mermaidCode;
        
        const parentElement = preElement.parentElement;
        if (parentElement) {
            // 渲染mermaid图表
            try {
                mermaid.render(mermaidId, mermaidCode).then(result => {
                    codeBlock.innerHTML = '';
                    mermaidContainer.innerHTML = result.svg;
                    codeBlock.appendChild(mermaidContainer);
                    // 添加放大功能
                    mermaidContainer.addEventListener('click', function() {
                        enlargeDiagram(this);
                    });
                }).catch(error => {
                console.error('Mermaid rendering error:', error);
                // 恢复原始代码块
                mermaidContainer.innerHTML = `<pre><code class="mermaid">${mermaidCode}</code></pre>`;
                mermaidContainer.classList.add('mermaid-error');
                });
            } catch (error) {
                console.error('Mermaid rendering error:', error);
                // 恢复原始代码块
                mermaidContainer.innerHTML = `<pre><code class="mermaid">${mermaidCode}</code></pre>`;
                mermaidContainer.classList.add('mermaid-error');
            }
        }
        
        // 标记为已处理
        preElement.classList.add('mermaid-processed');
    });
}

// 放大图表的函数
function enlargeDiagram(diagramElement) {
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '1000';

    const enlargedDiagram = diagramElement.cloneNode(true);
    enlargedDiagram.style.width = 'auto';
    enlargedDiagram.style.height = 'auto';
    enlargedDiagram.style.objectFit = 'contain';
    enlargedDiagram.style.transition = 'all 0.3s ease';
    enlargedDiagram.style.cursor = 'zoom-out';

    modal.appendChild(enlargedDiagram);

    // Function to adjust the size of the diagram
    const adjustSize = () => {
        const aspectRatio = enlargedDiagram.offsetWidth / enlargedDiagram.offsetHeight;
        const windowRatio = window.innerWidth / window.innerHeight;

        // console.log(, enlargedDiagram.firstChild.style.maxHeight);
        console.log(enlargedDiagram.firstChild.style.maxWidth);

        if (enlargedDiagram.firstChild.style.maxWidth) {
            enlargedDiagram.firstChild.style.width = '95vw';
            enlargedDiagram.firstChild.style.height = 'auto';
        } else {
            enlargedDiagram.firstChild.style.width = 'auto';
            enlargedDiagram.firstChild.style.height = '95vh';
        }
    };

    // Adjust size initially and on window resize
    adjustSize();
    window.addEventListener('resize', adjustSize);

    modal.addEventListener('click', function() {
        document.body.removeChild(modal);
        window.removeEventListener('resize', adjustSize);
    });

    document.body.appendChild(modal);
}

// Expose functions globally for password-protect.js to call after decryption
window.enhanceCodeBlocks = enhanceCodeBlocks;
window.enhancePlainCodeBlocks = enhancePlainCodeBlocks;
window.addScrollIndicators = addScrollIndicators;
window.renderMermaidDiagrams = renderMermaidDiagrams;
window.fixPythonIndentation = fixPythonIndentation;
