// 主应用程序
class FontAwesomeSVGGenerator {
    constructor() {
        // 状态管理
        this.state = {
            selectedIcon: {
                name: 'heart',
                unicode: 'f004',
                style: 'solid',
                className: 'fas fa-heart',
                label: '爱心'
            },
            config: {
                iconColor: '#ffffff',
                bgColor: '#4361ee',
                bgType: 'circle',
                iconSize: 70,
                canvasSize: 100,
                horizontalOffset: 0,
                verticalOffset: 0
            },
            currentCategory: 'all',
            searchQuery: '',
            currentPage: 1,
            iconsPerPage: 100,
            allIcons: [],
            filteredIcons: [],
            isLoading: false
        };

        // 分类定义和颜色
        this.categories = {
            'all': { name: '全部', color: '#667eea', icon: 'fas fa-th' },
            'solid': { name: '实心', color: '#2565f5', icon: 'fas fa-square' },
            'regular': { name: '空心', color: '#f59e0b', icon: 'far fa-square' },
            'brands': { name: '品牌', color: '#dc2626', icon: 'fab fa-font-awesome' }
        };

        // 前缀到分类的映射
        this.prefixToCategory = {
            'fas': 'solid',
            'fa': 'solid',
            'fa-solid': 'solid',
            'far': 'regular',
            'fa-regular': 'regular',
            'fab': 'brands',
            'fa-brands': 'brands'
        };

        // 初始化
        this.init();
    }

    // 初始化应用程序
    init() {
        this.getDOMElements();
        this.setupEventListeners();
        this.loadIcons();
        this.updateUI();
        this.generateSVG();
    }

    // 获取DOM元素
    getDOMElements() {
        // 搜索和过滤
        this.iconSearch = document.getElementById('iconSearch');
        this.clearSearch = document.getElementById('clearSearch');
        this.categoryBtns = document.querySelectorAll('.category-btn');
        this.iconsGrid = document.getElementById('iconsGrid');
        this.searchCount = document.getElementById('searchCount');

        // 分页
        this.pageInfo = document.getElementById('pageInfo');
        this.prevBtns = document.querySelectorAll('.prev-btn');
        this.nextBtns = document.querySelectorAll('.next-btn');

        // 选中图标显示容器
        this.selectedIconPreviewContainer = document.querySelector('.selected-icon-preview');
        this.selectedIconName = document.getElementById('selectedIconName');
        this.selectedIconUnicode = document.getElementById('selectedIconUnicode');
        this.selectedIconStyle = document.getElementById('selectedIconStyle');
        this.selectedIconClass = document.getElementById('selectedIconClass');

        // 配置控件
        this.iconColor = document.getElementById('iconColor');
        this.iconColorValue = document.getElementById('iconColorValue');
        this.bgColor = document.getElementById('bgColor');
        this.bgColorValue = document.getElementById('bgColorValue');
        this.bgType = document.getElementById('bgType');
        this.iconSize = document.getElementById('iconSize');
        this.iconSizeValue = document.getElementById('iconSizeValue');
        this.canvasSize = document.getElementById('canvasSize');
        this.canvasSizeValue = document.getElementById('canvasSizeValue');
        this.horizontalOffset = document.getElementById('horizontalOffset');
        this.horizontalOffsetValue = document.getElementById('horizontalOffsetValue');
        this.verticalOffset = document.getElementById('verticalOffset');
        this.verticalOffsetValue = document.getElementById('verticalOffsetValue');

        // 预览和输出
        this.previewSvg = document.getElementById('previewSvg');
        this.svgCode = document.getElementById('svgCode');

        // 按钮
        this.copySvgBtn = document.getElementById('copySvgBtn');
        this.copyEncodedSvgBtn = document.getElementById('copyEncodedSvgBtn');
        this.updateFaviconBtn = document.getElementById('updateFavicon');
        this.downloadSvgBtn = document.getElementById('downloadSvg');

        // Toast
        this.toast = document.getElementById('toast');
        this.toastMessage = document.getElementById('toastMessage');
    }

    // 加载图标数据 - 参考FontAwesome图标大全.html的方式
    loadIcons() {
        try {
            const namespace = window.___FONT_AWESOME___;
            if (!namespace || !namespace.styles) {
                throw new Error('Font Awesome 未正确加载');
            }

            const extractedIcons = [];

            // 遍历所有样式前缀
            Object.keys(namespace.styles).forEach(prefix => {
                // 只处理我们关心的分类
                if (!this.prefixToCategory[prefix]) {
                    return;
                }

                const styleIcons = namespace.styles[prefix];
                const category = this.prefixToCategory[prefix];

                // 遍历该前缀下的所有图标
                Object.keys(styleIcons).forEach(iconName => {
                    const iconData = styleIcons[iconName];
                    const unicode = iconData[3] || '';

                    extractedIcons.push({
                        name: iconName,
                        prefix: prefix,
                        category: category,
                        unicode: unicode,
                        fullClass: `${prefix} fa-${iconName}`,
                        displayClass: (prefix === 'fa' || prefix === 'fa-solid') ?
                            `fas fa-${iconName}` : `${prefix} fa-${iconName}`
                    });
                });
            });

            // 快速处理图标数据（去重）
            this.processIconsFast(extractedIcons);

        } catch (error) {
            console.error('加载图标数据时出错:', error);
            this.showError('加载图标数据失败，请刷新页面重试');
        }
    }

    // 快速处理图标数据（去重）
    processIconsFast(icons) {
        // 创建一个 Map 用于去重，键为图标名称+分类
        const uniqueIconsMap = new Map();

        // 分类优先级
        const categoryPriority = {
            'solid': ['fas', 'fa', 'fa-solid'],
            'regular': ['far', 'fa-regular'],
            'brands': ['fab', 'fa-brands']
        };

        // 去重：对于相同的图标名称和分类，只保留优先级最高的
        icons.forEach(icon => {
            const key = `${icon.name}-${icon.category}`;

            if (!uniqueIconsMap.has(key)) {
                uniqueIconsMap.set(key, icon);
            } else {
                // 如果已存在，检查优先级
                const existing = uniqueIconsMap.get(key);
                const existingPriority = categoryPriority[icon.category]?.indexOf(existing.prefix) ?? 999;
                const newPriority = categoryPriority[icon.category]?.indexOf(icon.prefix) ?? 999;
                
                if (newPriority < existingPriority) {
                    uniqueIconsMap.set(key, icon);
                }
            }
        });

        // 将 Map 转换回数组并排序
        this.state.allIcons = Array.from(uniqueIconsMap.values());
        this.state.allIcons.sort((a, b) => a.name.localeCompare(b.name));
        this.state.filteredIcons = [...this.state.allIcons];

        // 更新图标计数
        this.updateIconCount();

        // 渲染图标网格
        this.renderIconsGrid();

        this.state.isLoading = false;
    }

    // 更新图标计数显示
    updateIconCount() {
        const total = this.state.filteredIcons.length;
        const start = (this.state.currentPage - 1) * this.state.iconsPerPage + 1;
        const end = Math.min(start + this.state.iconsPerPage - 1, total);

        this.searchCount.textContent = `${start}-${end}/${total}`;
        this.pageInfo.textContent = `第 ${this.state.currentPage} 页`;
    }

    // 渲染图标网格
    renderIconsGrid() {
        const { currentPage, iconsPerPage, filteredIcons } = this.state;

        // 计算当前页的图标范围
        const startIndex = (currentPage - 1) * iconsPerPage;
        const endIndex = Math.min(startIndex + iconsPerPage, filteredIcons.length);
        const currentIcons = filteredIcons.slice(startIndex, endIndex);

        // 清空网格
        this.iconsGrid.innerHTML = '';

        // 如果没有图标
        if (currentIcons.length === 0) {
            this.iconsGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>未找到匹配的图标</h3>
                    <p>尝试其他搜索关键词或分类</p>
                </div>
            `;
            return;
        }

        // 创建图标项
        currentIcons.forEach(icon => {
            const iconElement = this.createIconElement(icon);
            this.iconsGrid.appendChild(iconElement);
        });

        // 更新分页按钮状态
        this.updatePaginationButtons();
    }

    // 创建单个图标元素
    createIconElement(icon) {
        const { selectedIcon } = this.state;
        const isSelected = selectedIcon.name === icon.name && selectedIcon.style === icon.category;
        const categoryColor = this.categories[icon.category].color;

        const iconElement = document.createElement('div');
        iconElement.className = `icon-item ${isSelected ? 'selected' : ''}`;
        iconElement.dataset.name = icon.name;
        iconElement.dataset.style = icon.category;

        iconElement.innerHTML = `
            <div class="icon-display" style="color: ${categoryColor}">
                <i class="${icon.displayClass}"></i>
            </div>
            <div class="icon-item-name">${icon.name}</div>
        `;

        // 点击事件
        iconElement.addEventListener('click', () => {
            this.selectIcon(icon);
        });

        return iconElement;
    }

    // 选择图标
    selectIcon(icon) {
        // 更新状态
        this.state.selectedIcon = {
            name: icon.name,
            unicode: icon.unicode,
            style: icon.category,
            className: icon.displayClass,
            label: icon.name
        };

        // 更新UI
        this.updateSelectedIconDisplay();
        
        // 更新选中状态
        document.querySelectorAll('.icon-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // 添加选中样式到当前图标
        const currentIcon = document.querySelector(`.icon-item[data-name="${icon.name}"][data-style="${icon.category}"]`);
        if (currentIcon) {
            currentIcon.classList.add('selected');
        }

        // 生成SVG
        this.generateSVG();
    }

    // 更新选中图标显示
    updateSelectedIconDisplay() {
        const { selectedIcon } = this.state;
        const categoryColor = this.categories[selectedIcon.style].color;

        // 清空预览容器
        const previewContainer = document.querySelector('.selected-icon-preview');
        previewContainer.innerHTML = '';

        // 创建新的 <i> 元素
        const iconElement = document.createElement('i');
        iconElement.id = 'selectedIconPreview';
        iconElement.className = selectedIcon.className;
        iconElement.style.color = categoryColor;
        iconElement.style.fontSize = '4rem';

        // 添加到预览容器
        previewContainer.appendChild(iconElement);

        // 更新引用
        this.selectedIconPreview = iconElement;

        // 更新信息
        this.selectedIconName.textContent = `fa-${selectedIcon.name}`;
        this.selectedIconUnicode.textContent = selectedIcon.unicode;
        this.selectedIconStyle.textContent = selectedIcon.style;
        this.selectedIconClass.textContent = selectedIcon.className;
    }

    // 更新分页按钮状态
    updatePaginationButtons() {
        const totalPages = Math.ceil(this.state.filteredIcons.length / this.state.iconsPerPage);
        const prevDisabled = this.state.currentPage === 1;
        const nextDisabled = this.state.currentPage === totalPages || totalPages === 0;

        this.prevBtns.forEach(btn => {
            btn.disabled = prevDisabled;
            btn.classList.toggle('disabled', prevDisabled);
        });

        this.nextBtns.forEach(btn => {
            btn.disabled = nextDisabled;
            btn.classList.toggle('disabled', nextDisabled);
        });
    }

    // 导航到指定页面
    navigateToPage(page) {
        const totalPages = Math.ceil(this.state.filteredIcons.length / this.state.iconsPerPage);

        if (page < 1) page = 1;
        if (page > totalPages) page = totalPages;

        if (page !== this.state.currentPage) {
            this.state.currentPage = page;
            this.renderIconsGrid();
            this.updateIconCount();
        }
    }

    // 过滤图标
    filterIcons() {
        const { allIcons, currentCategory, searchQuery } = this.state;

        // 先根据分类过滤
        if (currentCategory === 'all') {
            this.state.filteredIcons = [...allIcons];
        } else {
            this.state.filteredIcons = allIcons.filter(icon => icon.category === currentCategory);
        }

        // 再根据搜索词过滤
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            this.state.filteredIcons = this.state.filteredIcons.filter(icon =>
                icon.name.toLowerCase().includes(query) ||
                icon.displayClass.toLowerCase().includes(query)
            );
        }

        // 重置到第一页
        this.state.currentPage = 1;

        // 重新渲染
        this.renderIconsGrid();
        this.updateIconCount();
    }

    // 生成SVG
    generateSVG() {
        const { selectedIcon, config } = this.state;

        try {
            // 获取图标的SVG路径
            const svgPath = this.getIconSVGPath(selectedIcon.name, selectedIcon.style);

            if (!svgPath) {
                throw new Error('无法获取图标SVG路径');
            }

            // 构建SVG
            let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${config.canvasSize} ${config.canvasSize}">\n`;

            // 添加背景
            if (config.bgType !== 'none') {
                const center = config.canvasSize / 2;
                const size = config.canvasSize * 0.98; // 增大到98%，更接近画布边缘

                switch (config.bgType) {
                    case 'circle':
                        svg += `  <circle cx="${center}" cy="${center}" r="${size / 2}" fill="${config.bgColor}"/>\n`;
                        break;
                    case 'square':
                        const squareSize = size;
                        const squareX = (config.canvasSize - squareSize) / 2;
                        const squareY = (config.canvasSize - squareSize) / 2;
                        svg += `  <rect x="${squareX}" y="${squareY}" width="${squareSize}" height="${squareSize}" fill="${config.bgColor}"/>\n`;
                        break;
                    case 'rounded':
                        const roundedSize = size;
                        const roundedX = (config.canvasSize - roundedSize) / 2;
                        const roundedY = (config.canvasSize - roundedSize) / 2;
                        const radius = roundedSize * 0.15; // 增大圆角比例，保持视觉协调
                        svg += `  <rect x="${roundedX}" y="${roundedY}" width="${roundedSize}" height="${roundedSize}" rx="${radius}" ry="${radius}" fill="${config.bgColor}"/>\n`;
                        break;
                }
            }

            // 计算图标大小和位置（考虑偏移量）
            const iconSize = config.canvasSize * (config.iconSize / 100);
            const scale = iconSize / 512; // Font Awesome图标通常设计在512x512的画布上
            const translateX = (config.canvasSize - 512 * scale) / 2 + config.horizontalOffset;
            const translateY = (config.canvasSize - 512 * scale) / 2 + config.verticalOffset;

            svg += `  <g transform="translate(${translateX}, ${translateY}) scale(${scale})">\n`;
            svg += `    <path d="${svgPath}" fill="${config.iconColor}"/>\n`;
            svg += `  </g>\n`;
            svg += `</svg>`;

            // 更新预览和代码
            this.updatePreview(svg);
            this.svgCode.value = svg;

        } catch (error) {
            console.error('生成SVG失败:', error);
            this.svgCode.value = `// 生成SVG时出错: ${error.message}`;
        }
    }

    // 获取图标SVG路径
    getIconSVGPath(iconName, iconStyle) {
        const namespace = window.___FONT_AWESOME___;
        if (!namespace || !namespace.styles) return null;

        // 根据样式获取正确的前缀
        let prefix;
        switch (iconStyle) {
            case 'solid': prefix = 'fas'; break;
            case 'regular': prefix = 'far'; break;
            case 'brands': prefix = 'fab'; break;
            default: prefix = 'fas';
        }

        // 检查图标是否存在
        if (namespace.styles[prefix] && namespace.styles[prefix][iconName]) {
            const iconData = namespace.styles[prefix][iconName];
            // Font Awesome 6 的SVG路径数据在数组的第四个元素
            return iconData[4] || null;
        }

        // 回退到常见图标的硬编码路径
        return this.getFallbackPath(iconName, iconStyle);
    }

    // 获取回退路径（用于Font Awesome数据加载失败时）
    getFallbackPath(iconName, iconStyle) {
        const fallbackPaths = {
            'heart': {
                'solid': 'M47.6 300.4L228.3 469.1c7.5 7 17.4 10.9 27.7 10.9s20.2-3.9 27.7-10.9L464.4 300.4c30.4-28.3 47.6-68 47.6-109.5v-5.8c0-69.9-50.5-129.5-119.4-141C347 36.5 300.6 51.4 268 84L256 96 244 84c-32.6-32.6-79-47.5-124.6-39.9C50.5 55.6 0 115.2 0 185.1v5.8c0 41.5 17.2 81.2 47.6 109.5z',
                'regular': 'M244 84L255.1 96L267.1 84.02C300.6 51.37 347 36.51 392.6 44.1C461.5 55.58 512 115.2 512 185.1V190.9C512 232.4 494.8 272.1 464.4 300.4L283.7 469.1C276.2 476.1 266.3 480 256 480C245.7 480 235.8 476.1 228.3 469.1L47.59 300.4C17.23 272.1 0 232.4 0 190.9V185.1C0 115.2 50.52 55.58 119.4 44.1C164.1 36.51 211.4 51.37 244 84C243.1 84 244 84.01 244 84zM255.1 163.9L210.1 117.1C188.4 96.28 157.6 86.4 127.3 91.44C81.55 99.07 48 138.7 48 185.1V190.9C48 219.1 59.71 246.1 80.34 265.3L256 429.3L431.7 265.3C452.3 246.1 464 219.1 464 190.9V185.1C464 138.7 430.4 99.07 384.7 91.44C354.4 86.4 323.6 96.28 301.9 117.1L255.1 163.9z'
            },
            'star': {
                'solid': 'M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z',
                'regular': 'M287.9 0c9.2 0 17.6 5.2 21.6 13.5l68.6 141.3 153.2 22.6c9 1.3 16.5 7.6 19.3 16.3s.5 18.1-5.9 24.5L433.6 328.4l26.2 155.6c1.5 9-2.2 18.1-9.7 23.5s-17.3 6-25.3 1.7l-137-73.2L151 509.1c-8.1 4.3-17.9 3.7-25.3-1.7s-11.2-14.5-9.7-23.5l26.2-155.6L31.1 218.2c-6.5-6.4-8.7-15.9-5.9-24.5s10.3-14.9 19.3-16.3l153.2-22.6L266.3 13.5C270.4 5.2 278.7 0 287.9 0zm0 79L235.4 187.2c-3.5 7.1-10.2 12.1-18.1 13.3L99 217.9 184.9 303c5.5 5.5 8.1 13.3 6.8 21L171.4 443.7l105.2-56.2c7.1-3.8 15.6-3.8 22.6 0l105.2 56.2L384.2 324.1c-1.3-7.7 1.2-15.5 6.8-21l85.9-85.1L358.6 200.5c-7.8-1.2-14.6-6.1-18.1-13.3L287.9 79z'
            },
            'rocket': {
                'solid': 'M156.6 384.9L125.7 353.1C117.2 345.5 114.2 333.1 117.1 321.8C120.1 312.9 124.1 301.3 129.8 288H24C15.38 288 7.414 283.4 3.146 275.9C-1.123 268.4-1.042 259.2 3.357 251.8L55.83 163.3C68.79 141.4 92.33 127.1 117.8 127.1H200C202.4 124 204.8 120.3 207.2 116.7C289.1-4.07 411.1-8.142 483.9 5.275C495.6 7.414 504.6 16.43 506.7 28.06C520.1 100.9 516.1 222.9 395.3 304.8C391.8 307.2 387.1 309.6 384 311.1V394.2C384 419.7 370.6 443.2 348.7 456.2L260.2 508.6C252.8 513 243.6 513.1 236.1 508.9C228.6 504.6 224 496.6 224 488V380.8C209.9 385.6 197.6 389.7 188.3 392.7C177.1 396.3 164.9 393.2 156.6 384.9V384.9z'
            }
        };

        if (fallbackPaths[iconName] && fallbackPaths[iconName][iconStyle]) {
            return fallbackPaths[iconName][iconStyle];
        }

        // 如果找不到，返回一个简单的占位符路径
        return 'M256 512c141.4 0 256-114.6 256-256S397.4 0 256 0S0 114.6 0 256S114.6 512 256 512z';
    }

    // 设置事件监听器
    setupEventListeners() {
        // 搜索输入
        this.iconSearch.addEventListener('input', (e) => {
            this.state.searchQuery = e.target.value;
            if (e.target.value) {
                this.clearSearch.classList.add('visible');
            } else {
                this.clearSearch.classList.remove('visible');
            }
            this.filterIcons();
        });

        // 清空搜索
        this.clearSearch.addEventListener('click', () => {
            this.iconSearch.value = '';
            this.state.searchQuery = '';
            this.clearSearch.classList.remove('visible');
            this.filterIcons();
        });

        // 分类过滤
        this.categoryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.categoryBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.state.currentCategory = btn.dataset.category;
                this.filterIcons();
            });
        });

        // 分页按钮
        this.prevBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.navigateToPage(this.state.currentPage - 1);
            });
        });

        this.nextBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.navigateToPage(this.state.currentPage + 1);
            });
        });

        // 键盘左右键翻页
        document.addEventListener('keydown', (e) => {
            // 确保不是在输入框中
            if (e.target.tagName === 'INPUT') return;

            if (e.key === 'ArrowLeft' || e.key === 'Left') {
                e.preventDefault();
                this.navigateToPage(this.state.currentPage - 1);
            } else if (e.key === 'ArrowRight' || e.key === 'Right') {
                e.preventDefault();
                this.navigateToPage(this.state.currentPage + 1);
            }
        });

        // 颜色配置变化
        this.iconColor.addEventListener('input', () => {
            this.state.config.iconColor = this.iconColor.value;
            this.iconColorValue.textContent = this.iconColor.value;

            // 只生成SVG，不更新中间面板的图标颜色
            this.generateSVG();
        });

        this.bgColor.addEventListener('input', () => {
            this.state.config.bgColor = this.bgColor.value;
            this.bgColorValue.textContent = this.bgColor.value;
            this.generateSVG();
        });

        this.bgType.addEventListener('change', () => {
            this.state.config.bgType = this.bgType.value;
            this.generateSVG();
        });

        this.iconSize.addEventListener('input', () => {
            this.state.config.iconSize = parseInt(this.iconSize.value);
            this.iconSizeValue.textContent = `${this.iconSize.value}%`;
            this.generateSVG();
        });

        this.canvasSize.addEventListener('input', () => {
            this.state.config.canvasSize = parseInt(this.canvasSize.value);
            this.canvasSizeValue.textContent = `${this.canvasSize.value}×${this.canvasSize.value}`;
            this.generateSVG();
        });

        // 偏移调整
        this.horizontalOffset.addEventListener('input', () => {
            this.state.config.horizontalOffset = parseInt(this.horizontalOffset.value);
            this.horizontalOffsetValue.textContent = this.horizontalOffset.value;
            this.generateSVG();
        });

        this.verticalOffset.addEventListener('input', () => {
            this.state.config.verticalOffset = parseInt(this.verticalOffset.value);
            this.verticalOffsetValue.textContent = this.verticalOffset.value;
            this.generateSVG();
        });

        // 复制按钮
        this.copySvgBtn.addEventListener('click', () => {
            this.copyToClipboard(this.svgCode.value, 'SVG代码');
        });

        this.copyEncodedSvgBtn.addEventListener('click', () => {
            const svgContent = this.svgCode.value;
            if (!svgContent || svgContent.includes('出错')) {
                this.showToast('SVG尚未生成完成，无法复制');
                return;
            }
            
            // 编码SVG为data URL格式
            const encodedSvg = encodeURIComponent(svgContent)
                .replace(/'/g, '%27')
                .replace(/"/g, '%22');
            
            const faviconLink = `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,${encodedSvg}">`;
            
            this.copyToClipboard(faviconLink, 'Favicon链接');
        });

        // 下载SVG
        this.downloadSvgBtn.addEventListener('click', () => {
            this.downloadSVG();
        });

        // 更新页面图标
        this.updateFaviconBtn.addEventListener('click', () => {
            this.updatePageFavicon();
        });
    }

    // 更新预览
    updatePreview(svg) {
        this.previewSvg.innerHTML = svg;
    }

    // 复制到剪贴板
    copyToClipboard(text, message) {
        navigator.clipboard.writeText(text).then(() => {
            this.showToast(`${message}已复制到剪贴板！`);
        }).catch(err => {
            // 备用方法
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.top = '0';
            textArea.style.left = '0';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();

            try {
                document.execCommand('copy');
                this.showToast(`${message}已复制到剪贴板！`);
            } catch (err) {
                console.error('复制失败:', err);
                this.showToast('复制失败，请手动复制');
            }

            document.body.removeChild(textArea);
        });
    }

    // 下载SVG
    downloadSVG() {
        const svgContent = this.svgCode.value;
        if (!svgContent || svgContent.includes('出错')) {
            this.showToast('SVG尚未生成完成，无法下载');
            return;
        }

        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `icon-${this.state.selectedIcon.name}.svg`;
        document.body.appendChild(a);
        a.click();

        // 清理
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);

        this.showToast(`SVG文件已下载: icon-${this.state.selectedIcon.name}.svg`);
    }

    // 更新页面favicon
    updatePageFavicon() {
        const svgContent = this.svgCode.value;
        if (!svgContent || svgContent.includes('出错')) {
            this.showToast('SVG尚未生成完成，无法更新图标');
            return;
        }

        // 编码SVG
        const encodedSvg = encodeURIComponent(svgContent)
            .replace(/'/g, '%27')
            .replace(/"/g, '%22');

        // 创建新的favicon
        const newFavicon = document.createElement('link');
        newFavicon.rel = 'icon';
        newFavicon.type = 'image/svg+xml';
        newFavicon.href = `data:image/svg+xml,${encodedSvg}`;

        // 移除旧的favicon
        const oldFavicons = document.querySelectorAll('link[rel="icon"]');
        oldFavicons.forEach(favicon => {
            if (!favicon.href.includes('cdnjs.cloudflare.com')) {
                favicon.remove();
            }
        });

        // 添加新的favicon
        document.head.appendChild(newFavicon);

        this.showToast('页面图标已更新！查看浏览器标签页');
    }

    // 显示Toast通知
    showToast(message) {
        this.toastMessage.textContent = message;
        this.toast.classList.add('show');

        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
    }

    // 显示错误
    showError(message) {
        alert(`错误: ${message}`);
    }

    // 更新UI（初始化时调用）
    updateUI() {
        // 设置配置控件的值
        this.iconColor.value = this.state.config.iconColor;
        this.iconColorValue.textContent = this.state.config.iconColor;
        this.bgColor.value = this.state.config.bgColor;
        this.bgColorValue.textContent = this.state.config.bgColor;
        this.bgType.value = this.state.config.bgType;
        this.iconSize.value = this.state.config.iconSize;
        this.iconSizeValue.textContent = `${this.state.config.iconSize}%`;
        this.canvasSize.value = this.state.config.canvasSize;
        this.canvasSizeValue.textContent = `${this.state.config.canvasSize}×${this.state.config.canvasSize}`;
        this.horizontalOffset.value = this.state.config.horizontalOffset;
        this.horizontalOffsetValue.textContent = this.state.config.horizontalOffset;
        this.verticalOffset.value = this.state.config.verticalOffset;
        this.verticalOffsetValue.textContent = this.state.config.verticalOffset;

        // 更新选中图标显示
        this.updateSelectedIconDisplay();
    }
}

// 页面加载完成后初始化应用程序
document.addEventListener('DOMContentLoaded', () => {
    // 创建应用程序实例
    const app = new FontAwesomeSVGGenerator();

    // 将应用程序实例暴露给全局作用域（调试用）
    window.fontAwesomeSVGGenerator = app;
});