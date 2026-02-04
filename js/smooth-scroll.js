/**
 * 滑动阻尼效果 - Stellar 主题优化版
 * 实现平滑的滚动缓冲效果
 * 仅在桌面端启用，移动端使用原生滚动
 */
(function() {
  'use strict';

  // 仅在桌面端启用 (屏幕宽度 >= 768px)
  function isDesktop() {
    return window.innerWidth >= 768;
  }

  function initSmoothScroll() {
    // 移动端检测
    if (!isDesktop()) {
      document.body.style.scrollBehavior = 'smooth';
      return;
    }

    // 查找主内容容器 - Stellar 主题通常使用这些结构
    const mainContent = document.querySelector('#main') ||
                        document.querySelector('.main-content') ||
                        document.querySelector('main') ||
                        document.body;

    // 如果已经初始化过，不再重复初始化
    if (document.querySelector('.smooth-scroll-view')) {
      return;
    }

    // 创建视图容器
    const viewbox = document.createElement('div');
    viewbox.className = 'smooth-scroll-view';

    // 包装现有内容
    const children = Array.from(document.body.children);
    const toWrap = children.filter(el => !el.matches('script, style, link, meta'));

    if (toWrap.length > 0) {
      // 创建滚动容器
      const scrollbox = document.createElement('div');
      scrollbox.className = 'smooth-scroll-box';

      // 将内容移动到滚动容器中
      toWrap.forEach(el => scrollbox.appendChild(el));

      // 设置结构
      viewbox.appendChild(scrollbox);
      document.body.appendChild(viewbox);

      // 启用平滑滚动类
      document.body.classList.add('smooth-scroll-enabled');

      // 设置 body 高度为内容高度
      function resizeBody() {
        const height = scrollbox.offsetHeight;
        document.body.style.height = `${height}px`;
      }

      // 使用 requestAnimationFrame 优化滚动性能
      let currentScrollY = 0;
      let targetScrollY = 0;

      function handleScroll() {
        targetScrollY = window.scrollY || document.documentElement.scrollTop;
      }

      function animate() {
        // 缓动算法：当前位置 += (目标位置 - 当前位置) * 缓动系数
        const easing = 0.1; // 调整此值改变缓冲效果，越小越平滑
        const diff = targetScrollY - currentScrollY;

        if (Math.abs(diff) > 0.1) {
          currentScrollY += diff * easing;
          scrollbox.style.transform = `translate3d(0, ${-currentScrollY}px, 0)`;
        }

        requestAnimationFrame(animate);
      }

      // 初始化
      function init() {
        resizeBody();
        currentScrollY = targetScrollY = window.scrollY || document.documentElement.scrollTop;
        scrollbox.style.transform = `translate3d(0, ${-currentScrollY}px, 0)`;
        animate();
      }

      // 监听事件
      window.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('load', init);
      window.addEventListener('resize', () => {
        if (isDesktop()) {
          resizeBody();
        }
      });

      // 初始调用
      init();
    }
  }

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSmoothScroll);
  } else {
    initSmoothScroll();
  }

  // 监听窗口大小变化，在移动端和桌面端之间切换
  let lastWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    const currentWidth = window.innerWidth;
    // 从桌面端切换到移动端或反之
    if ((lastWidth >= 768 && currentWidth < 768) ||
        (lastWidth < 768 && currentWidth >= 768)) {
      // 重新加载页面以应用正确的滚动模式
      location.reload();
    }
    lastWidth = currentWidth;
  });
})();
