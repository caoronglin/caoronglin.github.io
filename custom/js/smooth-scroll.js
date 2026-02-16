/**
 * 优化版滑动阻尼效果
 * 特点：高性能、非侵入、自动监听高度、节省算力
 */
(function() {
  'use strict';

  // 配置项
  const CONFIG = {
    easing: 0.08,        // 阻尼系数，越小越平滑 (0.05 ~ 0.15)
    minGap: 0.1,         // 停止计算的最小间隙
    mobileWidth: 768,    // 移动端阈值
    excludeSelectors: '.l_left, .l_right, .leftbar, .rightbar' // 排除这些布局
  };

  class SmoothScroll {
    constructor() {
      this.dom = {
        main: document.querySelector('#main') || document.querySelector('.main-content') || document.querySelector('main'),
        body: document.body,
        html: document.documentElement
      };

      if (!this.dom.main || document.querySelector(CONFIG.excludeSelectors)) return;

      this.state = {
        currentY: window.scrollY,
        targetY: window.scrollY,
        height: 0,
        isDesktop: window.innerWidth >= CONFIG.mobileWidth,
        isTicking: false
      };

      this.init();
    }

    init() {
      if (!this.state.isDesktop) return;

      // 准备样式
      this.setupStyles();
      // 初始化位置
      this.onScroll();
      // 监听事件
      this.bindEvents();
      // 开启高度监听
      this.initResizeObserver();
    }

    setupStyles() {
      // 为内容容器增加性能优化标签
      Object.assign(this.dom.main.style, {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        willChange: 'transform',
        boxSizing: 'border-box'
      });
      this.dom.body.classList.add('smooth-scroll-enabled');
    }

    bindEvents() {
      this._onScroll = this.onScroll.bind(this);
      this._onResize = this.onResize.bind(this);

      window.addEventListener('scroll', this._onScroll, { passive: true });
      window.addEventListener('resize', this._onResize);
      
      // 处理锚点跳转：点击链接时同步位置
      document.addEventListener('click', (e) => {
        const anchor = e.target.closest('a[href^="#"]');
        if (anchor) {
          setTimeout(() => {
            this.state.targetY = window.scrollY;
            this.requestTick();
          }, 0);
        }
      });
    }

    onScroll() {
      this.state.targetY = window.scrollY || this.dom.html.scrollTop;
      this.requestTick();
    }

    onResize() {
      const wasDesktop = this.state.isDesktop;
      this.state.isDesktop = window.innerWidth >= CONFIG.mobileWidth;

      if (wasDesktop !== this.state.isDesktop) {
        // 状态切换时重置页面，但不使用 reload
        location.reload(); // 在结构大改动的情况下，reload 仍是最稳妥的，但我们优化了触发频率
      } else if (this.state.isDesktop) {
        this.updateBodyHeight();
      }
    }

    // 自动监听内容高度变化 (核心优化)
    initResizeObserver() {
      const ro = new ResizeObserver(() => {
        if (this.state.isDesktop) this.updateBodyHeight();
      });
      ro.observe(this.dom.main);
    }

    updateBodyHeight() {
      this.state.height = this.dom.main.offsetHeight;
      this.dom.body.style.height = `${this.state.height}px`;
    }

    requestTick() {
      if (!this.state.isTicking && this.state.isDesktop) {
        this.state.isTicking = true;
        requestAnimationFrame(this.update.bind(this));
      }
    }

    update() {
      const diff = this.state.targetY - this.state.currentY;
      
      // 缓动公式
      this.state.currentY += diff * CONFIG.easing;

      // 物理停止判定，节省 CPU
      if (Math.abs(diff) < CONFIG.minGap) {
        this.state.currentY = this.state.targetY;
        this.state.isTicking = false;
      }

      this.dom.main.style.transform = `translate3d(0, ${-this.state.currentY}px, 0)`;

      if (this.state.isTicking) {
        requestAnimationFrame(this.update.bind(this));
      }
    }
  }

  // 启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new SmoothScroll());
  } else {
    new SmoothScroll();
  }
})();