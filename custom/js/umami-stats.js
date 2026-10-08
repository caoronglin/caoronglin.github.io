/**
 * Umami 访问统计侧边栏组件
 *
 * 数据来源：Umami Cloud API v1（https://docs.umami.is/docs/api）
 *   GET /api/websites/:websiteId/stats?period=today      -> { views, visitors, ... }
 *   GET /api/websites/:websiteId                          -> { pageviews, visitors, ... }
 *
 * 管理 Token 与 API 反代地址由构建时注入的 window.UMAMI_STATS 传入，
 * 凭据不进仓库：构建前设置环境变量 UMAMI_STATS_TOKEN / UMAMI_STATS_API，
 * 由 scripts/umami-stats.js 写进 public/umami-stats-config.js。
 * 两者都缺失时组件静默降级为占位符。
 *
 * 容器由 source/_data/widgets.yml 的 umami 组件输出（layout: markdown，
 * 走 marked 渲染，原始 HTML 直出）。
 *
 * 若未配置 token 或接口不可用，组件保持占位符并静默失败，不阻塞页面。
 */

(function () {
  'use strict';

  const WEBSITE_ID = '2e6d48d5-2833-45d6-9dcf-320cd7e63e9f';
  const CONF = window.UMAMI_STATS || {};
  const TOKEN = CONF.token || '';
  const API = CONF.api || '/umami-api';
  const ENABLED = CONF.enabled !== false && !!(CONF.api || TOKEN);

  function fill(root, key, value) {
    const el = root.querySelector(`[data-stat="${key}"]`);
    if (el && value != null) el.textContent = String(value);
  }

  async function request(path) {
    const url = `${API}${path}`;
    const headers = TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {};
    const resp = await fetch(url, { headers });
    if (!resp.ok) throw new Error(`umami: ${resp.status}`);
    return resp.json();
  }

  async function render(root) {
    if (root.dataset.bound) return;
    if (!ENABLED) return;
    root.dataset.bound = '1';
    try {
      const [today, total] = await Promise.all([
        request(`/api/websites/${WEBSITE_ID}/stats?period=today`),
        request(`/api/websites/${WEBSITE_ID}`)
      ]);
      fill(root, 'views', today.views);
      fill(root, 'visitors', today.visitors);
      fill(root, 'pageviews', total.pageviews);
      fill(root, 'visitors-total', total.visitors);
    } catch (error) {
      // 静默失败：保留 '-' 占位
      console.debug('[umami-stats]', error.message);
    }
  }

  function boot() {
    document.querySelectorAll('.umami-stats').forEach(render);
    // v2 局部导航会替换侧栏内容，导航完成后重新拉取
    document.addEventListener('stellar:navigation-complete', function () {
      document.querySelectorAll('.umami-stats').forEach(function (el) {
        el.dataset.bound = '';
        render(el);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
