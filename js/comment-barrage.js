/**
 * 评论弹幕脚本
 * 适配 Stellar 主题
 * 参考：https://meuicat.com/posts/f3d69673.html
 */

(function() {
  'use strict';

  let commentInterval = null;
  let box = [];
  let hoverBarrage = false;
  let index = 0;

  // 简化版时间格式化
  function changeTime(time, short = false) {
    const date = new Date(time);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (short) {
      if (days === 0) return '今天';
      if (days === 1) return '昨天';
      if (days < 7) return days + '天前';
      return date.toLocaleDateString();
    }
    return date.toLocaleString();
  }

  // 获取评论数据
  async function fetchComments() {
    const twikooEnvId = typeof twikoo !== 'undefined' ? twikoo.options.envId : null;
    if (!twikooEnvId) {
      console.warn('Twikoo not configured');
      return [];
    }

    try {
      const res = await fetch(`https://twikoo.cnortles.top/`, {
        method: "POST",
        body: JSON.stringify({
          "event": "",
          "accessToken": "",
          "includeReply": true,
          "pageSize": 100
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      return data.data || [];
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      return [];
    }
  }

  // 创建弹幕项
  function createBarrageItem(comment) {
    const time = changeTime(new Date(comment.created).toISOString(), true);
    const barrages = document.createElement('div');
    barrages.className = 'comment-barrage-item';
    barrages.innerHTML = `
      <div class="barrageHead">
        <img class="barrageAvatar" src="${comment.avatar}" />
        <div class="barrageNick">${comment.nick}</div>
        <div class="barrageTime">${time}</div>
        <a class="barrageClose" href="javascript:void(0)">
          <i class="fas fa-times"></i>
        </a>
      </div>
      <a class="barrageContent" href="${comment.url || '#'}" target="_blank">
        <p>${comment.commentText.trim()}</p>
      </a>
    `;

    // 关闭按钮事件
    barrages.querySelector('.barrageClose').addEventListener('click', function() {
      removeBarrage(barrages);
    });

    return barrages;
  }

  // 移除弹幕
  function removeBarrage(element) {
    if (!element) return;
    element.className = 'comment-barrage-item out';
    setTimeout(() => {
      const barrage = document.getElementById('comment-barrage');
      if (barrage && barrage.contains(element)) {
        barrage.removeChild(element);
      }
    }, 600);
  }

  // 滚动控制
  function scrollBarrage() {
    const barrage = document.getElementById('comment-barrage');
    if (!barrage) return;

    const scrollResidue = (window.scrollY + document.documentElement.clientHeight) >=
      (document.getElementById("post-comment") || document.getElementById("footer")).offsetTop;
    barrage.classList.toggle('show', !scrollResidue);
  }

  // 初始化弹幕
  async function initBarrage() {
    const barrage = document.getElementById('comment-barrage');
    if (!barrage) return;

    // 检查是否关闭
    const isOff = localStorage.getItem('comment-barrage') === 'off';
    if (isOff) return;

    // 获取评论数据
    const data = await fetchComments();
    if (!data.length) return;

    // 鼠标事件
    barrage.addEventListener('mouseenter', () => hoverBarrage = true);
    barrage.addEventListener('mouseleave', () => hoverBarrage = false);

    // 滚动事件
    window.addEventListener('scroll', scrollBarrage, { passive: true });

    // 定时显示弹幕
    clearInterval(commentInterval);
    commentInterval = setInterval(() => {
      if (box.length >= 1 && !hoverBarrage) {
        removeBarrage(box.shift());
      }
      if (!hoverBarrage) {
        const item = createBarrageItem(data[index]);
        box.push(item);
        barrage.appendChild(item);
        index = (index + 1) % data.length;
      }
    }, 5000);
  }

  // 关闭弹幕
  function closeBarrage() {
    const barrage = document.getElementById('comment-barrage');
    if (!barrage) return;

    const remove = () => {
      barrage.innerHTML = '';
      barrage.className = 'show';
    };

    clearInterval(commentInterval);
    box.forEach(item => removeBarrage(item));
    box = [];
    remove();
  }

  // 切换弹幕
  function toggleBarrage() {
    const current = localStorage.getItem('comment-barrage');
    if (current === 'off') {
      localStorage.removeItem('comment-barrage');
      initBarrage();
    } else {
      localStorage.setItem('comment-barrage', 'off');
      closeBarrage();
    }
  }

  // 导出到全局
  window.commentBarrage = {
    toggle: toggleBarrage,
    close: closeBarrage
  };

  // 初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBarrage);
  } else {
    initBarrage();
  }

})();
