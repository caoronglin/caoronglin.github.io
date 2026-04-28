/**
 * 文章订阅页脚本
 * 适配 Stellar 主题
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

  window.subscribe = subscribe;

  function initSubscribeButtons() {
    const mailButtons = document.querySelectorAll('.rss-plan-mail');
    mailButtons.forEach(button => {
      // 避免重复绑定
      if (button.dataset.bound) return;
      button.dataset.bound = "true";
      button.addEventListener('click', function(e) {
        e.preventDefault();
        subscribe.toggleForm();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSubscribeButtons);
  } else {
    initSubscribeButtons();
  }
  
  // PJAX 兼容
  document.addEventListener('pjax:complete', initSubscribeButtons);

})();
