/**
 * 好物推荐页脚本
 * 适配 Stellar 主题
 * 参考：https://meuicat.com/posts/34ccdb7.html
 */

(function() {
  'use strict';

  const equipment = {
    replaceAll: function(e, n, t) {
      return e.split(n).join(t);
    },

    commentText: function(e) {
      if (e == "undefined" || e == "null") e = "好棒！";
      const inputs = ["#wl-edit", ".el-textarea__inner"];

      for (let i = 0; i < inputs.length; i++) {
        let el = document.querySelector(inputs[i]);
        if (el != null) {
          el.dispatchEvent(new Event('input', {
            bubble: true,
            cancelable: true
          }));

          const o = equipment.replaceAll(e, "\n", "\n> ");
          el.value = "> " + o + "\n\n";
          el.focus();
          el.setSelectionRange(-1, -1);

          // 滚动到评论区
          const commentSection = document.querySelector("#post-comment");
          if (commentSection) {
            window.scrollTo({
              top: commentSection.offsetTop - 80,
              behavior: 'smooth'
            });
          }
        }
      }
    }
  };

  // 导出到全局
  window.equipment = equipment;

  // 初始化评论按钮
  function initCommentButtons() {
    const commentButtons = document.querySelectorAll('.equipment-comment');
    commentButtons.forEach(button => {
      button.addEventListener('click', function() {
        const text = this.getAttribute('data-text') || '好棒！';
        equipment.commentText(text);
      });
    });
  }

  // 初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCommentButtons);
  } else {
    initCommentButtons();
  }

})();
