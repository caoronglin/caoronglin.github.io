/**
 * Hexo Mirror Sync Status Panel v3
 * 只读展示 - 镜像站点由 mirror-sw.js 内置配置管理
 */
(function() {
  'use strict';

  let mirrors = [], logs = [], swRegistration = null;

  async function init() {
    const app = document.getElementById('mirror-panel-app');
    if (!app) return;
    await registerSW();
    render(app);
    await loadData();
    setInterval(loadData, 30000);
  }

  async function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    try {
      swRegistration = await navigator.serviceWorker.register('/sw/mirror-sw.js');
    } catch (err) {
      console.error('[MirrorPanel] SW failed:', err);
    }
  }

  function sendToSW(type, data = {}) {
    return new Promise((resolve) => {
      if (!swRegistration?.active) { resolve(null); return; }
      const channel = new MessageChannel();
      channel.port1.onmessage = (e) => resolve(e.data);
      swRegistration.active.postMessage({ type, ...data }, [channel.port2]);
    });
  }

  async function loadData() {
    const m = await sendToSW('GET_MIRRORS');
    if (m?.mirrors) { mirrors = m.mirrors; updateMirrors(); }
    const l = await sendToSW('GET_LOGS', { limit: 30 });
    if (l?.logs) { logs = l.logs; updateLogs(); }
    updateStats();
  }

  function render(container) {
    container.innerHTML = `
      <div class="mp-wrap">
        <div class="mp-toolbar">
          <div class="mp-toolbar-title">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
            <span>镜像节点状态</span>
          </div>
          <div class="mp-toolbar-actions">
            <button class="mp-btn mp-btn-ghost" onclick="mirrorPanel.runHealthCheck()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              健康检查
            </button>
            <button class="mp-btn mp-btn-ghost" onclick="mirrorPanel.clearCache()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
              清除缓存
            </button>
          </div>
        </div>

        <div class="mp-stats" id="stats-grid"></div>

        <div class="mp-section">
          <div class="mp-table-wrap">
            <table class="mp-table">
              <thead>
                <tr>
                  <th>节点</th>
                  <th>地址</th>
                  <th class="mp-col-center">状态</th>
                  <th class="mp-col-center">响应时间</th>
                </tr>
              </thead>
              <tbody id="mirrors-tbody"></tbody>
            </table>
          </div>
        </div>

        <div class="mp-section">
          <div class="mp-section-header">
            <h3>请求日志</h3>
            <button class="mp-btn mp-btn-ghost mp-btn-sm" onclick="mirrorPanel.clearLogs()">清除</button>
          </div>
          <div class="mp-logs" id="logs-container"></div>
        </div>
      </div>
    `;

    window.mirrorPanel = { runHealthCheck, clearCache, clearLogs };
    injectStyles();
  }

  function injectStyles() {
    if (document.getElementById('mp-styles')) return;
    const s = document.createElement('style');
    s.id = 'mp-styles';
    s.textContent = `
      .mp-wrap { --mp-primary: var(--theme-color, hsl(88 76% 40%)); }
      .mp-wrap * { box-sizing: border-box; }

      .mp-toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; padding: 20px 24px; background: var(--card-bg); border-radius: 14px; box-shadow: var(--shadow); border: 1px solid var(--border-color); }
      .mp-toolbar-title { display: flex; align-items: center; gap: 10px; font-size: 1.1rem; font-weight: 600; color: var(--text-color); }
      .mp-toolbar-title svg { color: var(--mp-primary); }
      .mp-toolbar-actions { display: flex; gap: 8px; }

      .mp-btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 18px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; border: none; transition: all .2s; font-family: inherit; white-space: nowrap; }
      .mp-btn-ghost { background: transparent; color: var(--text-color); border: 1px solid var(--border-color); }
      .mp-btn-ghost:hover { background: var(--theme-bg); }
      .mp-btn-sm { padding: 5px 12px; font-size: 13px; }

      .mp-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 16px; margin-bottom: 24px; }
      .mp-stat { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px 18px; position: relative; overflow: hidden; }
      .mp-stat::before { content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%; }
      .mp-stat--total::before { background: var(--mp-primary); }
      .mp-stat--healthy::before { background: #10b981; }
      .mp-stat--degraded::before { background: #f59e0b; }
      .mp-stat--unhealthy::before { background: #ef4444; }
      .mp-stat-num { font-size: 32px; font-weight: 700; line-height: 1; margin-bottom: 2px; }
      .mp-stat--total .mp-stat-num { color: var(--mp-primary); }
      .mp-stat--healthy .mp-stat-num { color: #10b981; }
      .mp-stat--degraded .mp-stat-num { color: #f59e0b; }
      .mp-stat--unhealthy .mp-stat-num { color: #ef4444; }
      .mp-stat-label { font-size: 12px; color: var(--text-muted); }

      .mp-section { margin-bottom: 24px; }
      .mp-section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
      .mp-section-header h3 { font-size: 1rem; font-weight: 600; margin: 0; }

      .mp-table-wrap { background: var(--card-bg); border-radius: 14px; border: 1px solid var(--border-color); overflow: hidden; box-shadow: var(--shadow); }
      .mp-table { width: 100%; border-collapse: collapse; }
      .mp-table th { text-align: left; padding: 12px 16px; font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: .5px; background: var(--theme-bg); border-bottom: 1px solid var(--border-color); }
      .mp-table td { padding: 14px 16px; border-bottom: 1px solid var(--border-color); font-size: 14px; }
      .mp-table tr:last-child td { border-bottom: none; }
      .mp-table tr:hover td { background: color-mix(in srgb, var(--theme-bg) 60%, transparent); }
      .mp-table tr.mp-off td { opacity: .45; }
      .mp-col-center { text-align: center !important; }
      .mp-url { font-family: 'Fira Mono', Menlo, monospace; font-size: 12px; color: var(--text-muted); word-break: break-all; }

      .mp-badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
      .mp-badge::before { content: ''; width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
      .mp-badge-healthy { background: rgba(16,185,129,.1); color: #059669; } .mp-badge-healthy::before { background: #10b981; }
      .mp-badge-degraded { background: rgba(245,158,11,.1); color: #d97706; } .mp-badge-degraded::before { background: #f59e0b; }
      .mp-badge-unhealthy { background: rgba(239,68,68,.1); color: #dc2626; } .mp-badge-unhealthy::before { background: #ef4444; }
      .mp-badge-unknown { background: rgba(107,114,128,.1); color: #6b7280; } .mp-badge-unknown::before { background: #9ca3af; }

      .mp-logs { background: var(--card-bg); border-radius: 14px; border: 1px solid var(--border-color); overflow: hidden; max-height: 320px; overflow-y: auto; box-shadow: var(--shadow); }
      .mp-log-item { display: flex; gap: 12px; padding: 10px 16px; border-bottom: 1px solid var(--border-color); font-size: 13px; align-items: center; }
      .mp-log-item:last-child { border-bottom: none; }
      .mp-log-time { color: var(--text-muted); font-family: 'Fira Mono', monospace; font-size: 11px; flex-shrink: 0; width: 70px; }
      .mp-log-type { font-weight: 600; font-size: 11px; flex-shrink: 0; width: 80px; text-transform: uppercase; letter-spacing: .3px; }
      .mp-log-msg { color: var(--text-color); flex: 1; }
      .mp-logs-empty { padding: 40px; text-align: center; color: var(--text-muted); }

      .mp-toast { position: fixed; top: 24px; right: 24px; padding: 12px 18px; border-radius: 10px; color: #fff; font-weight: 500; font-size: 14px; z-index: 20000; animation: mpRight .3s ease; box-shadow: 0 4px 16px rgba(0,0,0,.15); }
      .mp-toast--success { background: #059669; }
      @keyframes mpRight { from { opacity: 0; transform: translateX(100%); } to { opacity: 1; transform: translateX(0); } }

      @media (max-width: 640px) {
        .mp-toolbar { flex-direction: column; align-items: flex-start; }
        .mp-stats { grid-template-columns: repeat(2, 1fr); }
        .mp-table thead { display: none; }
        .mp-table tbody tr { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 12px; padding: 14px; }
        .mp-table tbody td { padding: 4px 0; border: none; }
        .mp-table tbody td:first-child { grid-column: span 2; }
      }
    `;
    document.head.appendChild(s);
  }

  function updateStats() {
    const healthy = mirrors.filter(m => m.healthStatus === 'healthy' && m.enabled !== false).length;
    const degraded = mirrors.filter(m => m.healthStatus === 'degraded').length;
    const unhealthy = mirrors.filter(m => m.healthStatus === 'unhealthy').length;
    const total = mirrors.filter(m => m.enabled !== false).length;
    const grid = document.getElementById('stats-grid');
    if (!grid) return;
    grid.innerHTML = `
      <div class="mp-stat mp-stat--total"><div class="mp-stat-num">${total}</div><div class="mp-stat-label">可用镜像</div></div>
      <div class="mp-stat mp-stat--healthy"><div class="mp-stat-num">${healthy}</div><div class="mp-stat-label">健康</div></div>
      <div class="mp-stat mp-stat--degraded"><div class="mp-stat-num">${degraded}</div><div class="mp-stat-label">降级</div></div>
      <div class="mp-stat mp-stat--unhealthy"><div class="mp-stat-num">${unhealthy}</div><div class="mp-stat-label">故障</div></div>
    `;
  }

  function updateMirrors() {
    const tbody = document.getElementById('mirrors-tbody');
    if (!tbody) return;
    if (mirrors.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:40px;color:var(--text-muted);">暂无镜像节点数据</td></tr>';
      return;
    }
    tbody.innerHTML = mirrors.map(m => `
      <tr class="${m.enabled === false ? 'mp-off' : ''}">
        <td><strong>${esc(m.name)}</strong>${m.enabled === false ? ' <span style="color:var(--text-muted);font-size:12px;">(已停用)</span>' : ''}</td>
        <td><span class="mp-url">${esc(m.url)}</span></td>
        <td class="mp-col-center"><span class="mp-badge mp-badge-${m.healthStatus || 'unknown'}">${statusText(m.healthStatus)}</span></td>
        <td class="mp-col-center">${m.responseTime > 0 ? m.responseTime + 'ms' : '<span style="color:var(--text-muted)">—</span>'}</td>
      </tr>
    `).join('');
  }

  function updateLogs() {
    const c = document.getElementById('logs-container');
    if (!c) return;
    if (logs.length === 0) {
      c.innerHTML = '<div class="mp-logs-empty">暂无日志记录</div>';
      return;
    }
    c.innerHTML = logs.map(l => `
      <div class="mp-log-item">
        <span class="mp-log-time">${fmtTime(l.timestamp)}</span>
        <span class="mp-log-type" style="color:${logColor(l.type)}">${l.type}</span>
        <span class="mp-log-msg">${esc(l.message)}</span>
      </div>
    `).join('');
  }

  async function runHealthCheck() {
    toast('正在健康检查...');
    await sendToSW('RUN_HEALTH_CHECK');
    await loadData();
    toast('健康检查完成');
  }

  async function clearCache() {
    await sendToSW('CLEAR_CACHE');
    toast('缓存已清除');
  }

  function clearLogs() { logs = []; updateLogs(); }

  function esc(t) { const d = document.createElement('div'); d.textContent = t ?? ''; return d.innerHTML; }
  function fmtTime(ts) { return new Date(ts).toLocaleTimeString('zh-CN', { hour:'2-digit', minute:'2-digit', second:'2-digit' }); }
  function statusText(s) { return { healthy:'健康', degraded:'降级', unhealthy:'故障', unknown:'未知' }[s] || s; }
  function logColor(t) { return { fetch:'#6366f1', health_check:'#10b981', error:'#ef4444', sync:'#8b5cf6' }[t] || '#94a3b8'; }

  function toast(msg) {
    const el = document.createElement('div');
    el.className = 'mp-toast mp-toast--success';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .2s'; setTimeout(() => el.remove(), 200); }, 2200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
