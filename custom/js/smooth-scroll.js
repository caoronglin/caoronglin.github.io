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
        isTicking: false
      };

      this.enabled = false;
      this.rafId = null;
      this.resizeObserver = null;
      this._update = this.update.bind(this);

      this.init();
    }

    init() {
      // 监听事件
      this.bindEvents();
      // 开启高度监听
      this.initResizeObserver();
      // 按视口启停
      this.syncViewportState();
    }

    isDesktop() {
      return window.innerWidth >= CONFIG.mobileWidth;
    }

    syncViewportState() {
      if (this.isDesktop()) {
        this.enable();
      } else {
        this.disable();
      }
    }

    enable() {
      if (this.enabled) {
        this.updateBodyHeight();
        this.onScroll();
        return;
      }

      this.enabled = true;
      this.state.currentY = window.scrollY || this.dom.html.scrollTop;
      this.state.targetY = this.state.currentY;
      this.setupStyles();
      this.updateBodyHeight();
      this.requestTick();
    }

    disable() {
      if (!this.enabled) return;

      this.enabled = false;
      this.cancelTick();
      this.dom.main.style.transform = '';
      this.dom.main.style.position = '';
      this.dom.main.style.top = '';
      this.dom.main.style.left = '';
      this.dom.main.style.width = '';
      this.dom.main.style.willChange = '';
      this.dom.main.style.boxSizing = '';
      this.dom.body.style.height = '';
      this.dom.body.classList.remove('smooth-scroll-enabled');
      this.state.isTicking = false;
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
      this._onPjax = this.onPjaxComplete.bind(this);
      this._onClick = this.onAnchorClick.bind(this);

      window.addEventListener('scroll', this._onScroll, { passive: true });
      window.addEventListener('resize', this._onResize);
      document.addEventListener('click', this._onClick);
      document.addEventListener('pjax:complete', this._onPjax);
    }

    onAnchorClick(e) {
      if (!this.enabled) return;
      const anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;

      setTimeout(() => {
        this.state.targetY = window.scrollY || this.dom.html.scrollTop;
        this.requestTick();
      }, 0);
    }

    onPjaxComplete() {
      if (!this.enabled) return;

      requestAnimationFrame(() => {
        this.updateBodyHeight();
        this.onScroll();
      });
    }

    onScroll() {
      if (!this.enabled) return;
      this.state.targetY = window.scrollY || this.dom.html.scrollTop;
      this.requestTick();
    }

    onResize() {
      this.syncViewportState();
      if (this.enabled) this.updateBodyHeight();
    }

    // 自动监听内容高度变化 (核心优化)
    initResizeObserver() {
      if (typeof ResizeObserver !== 'function') return;

      this.resizeObserver = new ResizeObserver(() => {
        if (this.enabled) this.updateBodyHeight();
      });
      this.resizeObserver.observe(this.dom.main);
    }

    updateBodyHeight() {
      this.state.height = this.dom.main.offsetHeight;
      this.dom.body.style.height = `${this.state.height}px`;
    }

    requestTick() {
      if (!this.enabled || this.state.isTicking) return;

      this.state.isTicking = true;
      this.rafId = requestAnimationFrame(this._update);
    }

    cancelTick() {
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    }

    update() {
      if (!this.enabled) {
        this.state.isTicking = false;
        return;
      }

      const diff = this.state.targetY - this.state.currentY;

      // 缓动公式
      this.state.currentY += diff * CONFIG.easing;

      // 物理停止判定，节省 CPU
      if (Math.abs(diff) < CONFIG.minGap) {
        this.state.currentY = this.state.targetY;
      }

      this.dom.main.style.transform = `translate3d(0, ${-this.state.currentY}px, 0)`;

      if (Math.abs(diff) < CONFIG.minGap) {
        this.state.isTicking = false;
        this.rafId = null;
      } else {
        this.rafId = requestAnimationFrame(this._update);
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