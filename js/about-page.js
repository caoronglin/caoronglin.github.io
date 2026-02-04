/**
 * HEO风格关于页面交互脚本
 * 适配 Stellar 主题
 */

(function() {
  'use strict';

  // 页面加载完成后初始化
  function initAboutPage() {
    if (!document.querySelector('.about-page')) {
      return;
    }

    // 滚动触发动画
    initScrollAnimations();

    // 统计数字动画
    initCountAnimation();

    // 打字机效果
    initTypewriter();

    // 3D倾斜效果
    init3DTilt();
  }

  // 滚动触发动画
  function initScrollAnimations() {
    const revealElements = document.querySelectorAll('.reveal');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => observer.observe(el));
  }

  // 统计数字动画
  function initCountAnimation() {
    const statNumbers = document.querySelectorAll('.stat-number[data-count]');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = entry.target;
          const count = parseInt(target.getAttribute('data-count'));
          animateCount(target, count);
          observer.unobserve(target);
        }
      });
    }, { threshold: 0.5 });

    statNumbers.forEach(el => observer.observe(el));
  }

  function animateCount(element, target) {
    const duration = 2000;
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        element.textContent = formatNumber(target);
        clearInterval(timer);
      } else {
        element.textContent = formatNumber(Math.floor(current));
      }
    }, 16);
  }

  function formatNumber(num) {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + 'w';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  }

  // 打字机效果
  function initTypewriter() {
    const mottoElement = document.querySelector('.about-motto');
    if (!mottoElement || !mottoElement.getAttribute('data-text')) {
      return;
    }

    const text = mottoElement.getAttribute('data-text');
    const delay = parseInt(mottoElement.getAttribute('data-delay')) || 100;

    let index = 0;
    mottoElement.textContent = '';

    function type() {
      if (index < text.length) {
        mottoElement.textContent += text.charAt(index);
        index++;
        setTimeout(type, delay);
      }
    }

    // 延迟启动
    setTimeout(type, 500);
  }

  // 3D倾斜效果
  function init3DTilt() {
    const cards = document.querySelectorAll('.info-card, .stat-item');

    cards.forEach(card => {
      card.addEventListener('mousemove', handleMouseMove);
      card.addEventListener('mouseleave', handleMouseLeave);
    });

    function handleMouseMove(e) {
      const card = e.currentTarget;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = (y - centerY) / 10;
      const rotateY = (centerX - x) / 10;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    }

    function handleMouseLeave(e) {
      e.currentTarget.style.transform = '';
    }
  }

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAboutPage);
  } else {
    initAboutPage();
  }
})();
