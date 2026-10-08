/**
 * 正文外链追加「↗」图标（Stellar v2）
 *
 * 迁移说明（2026-10-05，由 v1 版本改写）：
 * 1. v1 脚本只在 DOMContentLoaded 跑一次。v2 默认开启
 *    features.partial_navigation，同集合页面切换时只替换正文，
 *    DOMContentLoaded 不会再次触发，图标会丢失。
 *    因此改为监听主题派发的 stellar:navigation-complete 事件。
 * 2. 注入前先打标记，保证幂等，避免重复追加图标。
 * 3. 去掉全部 console.log（v1 版本每次加载都会刷屏）。
 * 4. v1 的跳过名单里 tag-plugin.users-wrap / sites-wrap / ghcard /
 *    tag-plugin.link / tag-plugin.colorful.note 均已不在 v2 使用，
 *    social-wrap 仍用于左下角社交区，予以保留。
 */

(function () {
  'use strict';

  var MARK = 'data-ext-icon';
  var SVG =
    '<svg class="ext-icon" width=".7em" height=".7em" viewBox="0 0 21 21" ' +
    'xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' +
    '<path d="m13 3l3.293 3.293l-7 7l1.414 1.414l7-7L21 11V3z" fill="currentColor" />' +
    '<path d="M19 19H5V5h7l-2-2H5c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2h14c1.103 0 2-.897 2-2v-5l-2-2v7z" fill="currentColor" />' +
    '</svg>';

  // 主题正文容器与页脚容器：v2 的类名与 v1 一致
  var SCOPE = 'article.md-text.content a, footer.page-footer.footnote a';
  // 不处理的容器：左下角社交区等主题组件自己的链接
  var SKIP = ['social-wrap', 'ui-collection', 'widget-wrapper'];

  function decorate() {
    var links = document.querySelectorAll(SCOPE);
    for (var i = 0; i < links.length; i++) {
      var link = links[i];

      if (link.hasAttribute(MARK)) continue;

      var skipped = false;
      for (var s = 0; s < SKIP.length; s++) {
        if (link.closest('.' + SKIP[s])) { skipped = true; break; }
      }
      if (skipped) continue;

      var href = link.getAttribute('href');
      if (!href || !(href.indexOf('http') === 0 || href.charAt(0) === '/')) continue;

      var span = document.createElement('span');
      span.className = 'ext-icon-wrap';
      span.style.whiteSpace = 'nowrap';
      span.innerHTML = SVG;

      link.appendChild(span);
      link.setAttribute(MARK, '');
    }
  }

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  ready(decorate);
  // v2 局部导航完成后再跑一次
  document.addEventListener('stellar:navigation-complete', decorate);
})();
