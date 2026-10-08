/**
 * 好物推荐页渲染脚本
 *
 * 背景（2026-10-05）：
 * 渲染逻辑在提交 164e943「Complete merge from origin/main」中被误删，
 * 导致 /equipment/ 只剩一个空 <div class="equipment-page">。
 * 同批被删的 equipment.js 只处理「评论按钮」交互（见文件末尾），
 * 真正把 source/_data/equipment.yml 渲染成 DOM 的那段代码已不在任何提交中。
 *
 * 本文件按 equipment.css 中保留完整的 DOM 契约重写渲染部分，
 * CSS 与数据文件均未改动，页面外观与原设计一致：
 *   .equipment-page            容器
 *     > h2                     分类标题
 *     .equipment-desc          分类说明
 *     .equipment               网格容器
 *       .equipment-box         单个卡片
 *         img
 *         .equipment-content
 *           .equipment-name
 *           .equipment-custom
 *           .equipment-opinion
 *           .equipment-box-more
 *             a                 详情链接
 *             .equipment-comment   「写评论」按钮
 *
 * 依据：https://meuicat.com/posts/34ccdb7.html
 */

(function () {
  'use strict';

  const DATA_URL = '/equipment.json';
  const COMMENT_INPUT = '#artalk_editor .artalk-editor-input, #twikoo .el-textarea__inner, .tk-input';

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
  }

  function renderGroup(group) {
    const list = Array.isArray(group.equipment_list) ? group.equipment_list : [];
    const cards = list.map(item => `
      <div class="equipment-box kh-glow">
        ${item.image ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy" onerror="this.classList.add('is-broken');this.removeAttribute('src')">` : ''}
        <div class="equipment-content">
          <div class="equipment-name">${escapeHtml(item.name)}</div>
          ${item.custom ? `<div class="equipment-custom">${escapeHtml(item.custom)}</div>` : ''}
          ${item.opinion ? `<div class="equipment-opinion">${escapeHtml(item.opinion)}</div>` : ''}
          <div class="equipment-box-more">
            <a href="${escapeHtml(item.details_flink)}" target="_blank" rel="noopener noreferrer">详情 →</a>
            <span class="equipment-comment" data-text="/${item.name}/ 这款好物我用着不错，标记一下！">✎ 写评论</span>
          </div>
        </div>
      </div>`).join('');

    return `
      <section class="equipment-group">
        <h2>${escapeHtml(group.class_name)}</h2>
        ${group.class_desc ? `<div class="equipment-desc">${escapeHtml(group.class_desc)}</div>` : ''}
        <div class="equipment">${cards}</div>
      </section>`;
  }

  function render(data) {
    const groups = Array.isArray(data) ? data : [];
    const root = document.querySelector('.equipment-page');
    if (!root || groups.length === 0) return;
    root.innerHTML = groups.map(renderGroup).join('');
    initCommentButtons();
  }

  function fetchData() {
    if (window.__equipmentData) {
      render(window.__equipmentData);
      return;
    }
    fetch(DATA_URL, { credentials: 'same-origin' })
      .then(resp => resp.ok ? resp.json() : Promise.reject(new Error(String(resp.status))))
      .then(render)
      .catch(() => {
        const root = document.querySelector('.equipment-page');
        if (root) root.innerHTML = '<div class="equipment-desc">好物数据加载失败。</div>';
      });
  }

  // 「写评论」：把模板文案填进评论区输入框并滚动过去
  function commentText(text) {
    const el = document.querySelector(COMMENT_INPUT);
    if (!el) return;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.value = text;
    el.focus();
    const section = document.querySelector('#artalk, #twikoo, .tk-field, #comments');
    if (section) {
      window.scrollTo({ top: section.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
    }
  }

  function initCommentButtons() {
    document.querySelectorAll('.equipment-comment').forEach(button => {
      if (button.dataset.bound) return;
      button.dataset.bound = '1';
      button.addEventListener('click', function () {
        commentText(this.getAttribute('data-text') || '好棒！');
      });
    });
  }

  function boot() {
    fetchData();
    // v2 的 partial_navigation 会替换正文，局部导航后需重新渲染
    document.addEventListener('stellar:navigation-complete', fetchData);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  window.equipment = { commentText, initCommentButtons, render };
})();
