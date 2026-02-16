/**
 * 文章订阅页脚本
 * 适配 Stellar 主题
 * 参考：https://meuicat.com/posts/4b1ada04.html
 */

(function() {
  'use strict';

  const subscribe = {
    toggleForm: function() {
      const submitBox = document.querySelector('.submit-box');
      if (!submitBox) return;

      if (submitBox.classList.contains('display')) {
        submitBox.classList.remove('display');
      } else {
        submitBox.classList.add('display');
      }
    }
  };

  // 导出到全局
  window.subscribe = subscribe;

  // 初始化邮件订阅按钮
  function initSubscribeButtons() {
    const mailButtons = document.querySelectorAll('.rss-plan-mail');
    mailButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        subscribe.toggleForm();
      });
    });
  }

  // 初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSubscribeButtons);
  } else {
    initSubscribeButtons();
  }

})();
