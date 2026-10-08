/**
 * 前端友链申请表单（Stellar v2）
 *
 * 提交路径：访客填表 → GitHub App OAuth（隐式流）→ 浏览器直接调用
 *           POST /repos/{owner}/{repo}/issues
 *        → 落入 caoronglin/friends 的 Issue → 现有 Actions 流水线
 *          （reachability-checker / feed-posts-parser）→ output/v2/data.json
 *        → 站点 {% friends %} 自动展示
 *
 * 为什么用 GitHub App 而不是 OAuth App：
 *   GitHub 已在 2020 年移除 OAuth App 的隐式流（response_type=token），
 *   token 交换必须携带 client_secret，而浏览器直连 GitHub token 端点会被
 *   CORS 拦截。GitHub App 的 user-to-server 流仍会把 token 直接放在
 *   URL fragment 中返回，因此可以做到零后端。
 *
 * 未配置 GITHUB_APP_CLIENT_ID 时自动降级为「预填 Issue 表单」，
 * 直接跳转 GitHub 自带的 Issue 创建页（带检查清单与 JSON 模板），
 * 无需任何注册即可使用。
 *
 * 配置来源：_config.stellar.yml 的 friends_submit，由 scripts/friends-submit.js
 * 写入 /friends-submit-config.js；凭据（client_id / 回调地址）不进仓库。
 */

(function () {
  'use strict';

  const CONF = window.FRIENDS_SUBMIT || {};
  const ROOT_ID = 'friends-apply-form';

  // 与 caoronglin/friends 的 .github/ISSUE_TEMPLATE/template_friend.yaml 保持一致
  function buildIssueBody(f) {
    const payload = {
      title: f.title,
      url: f.url,
      icon: f.icon,
      snapshot: f.snapshot || '',
      description: f.description,
      feed: f.feed || ''
    };
    return [
      '### 检查清单',
      '',
      '- [x] 合法的、非营利性、无商业广告、无木马植入。',
      '- [x] 承诺不会对友链进行高频次爬取。',
      '- [x] 有实质性原创内容的 HTTPS 站点，发布过至少 10 篇原创文章。',
      '- [x] 有独立域名，非免费域名。',
      '- [x] 博客已持续运行至少 3 年。',
      '- [ ] 先友后链：与博主有至少 1 年的双向有效互动。',
      '',
      '### 友链信息',
      '',
      '```json',
      JSON.stringify(payload, null, 2),
      '```',
      '',
      '<!-- 由博客前端提交，生成时间：' + new Date().toISOString() + ' -->'
    ].join('\n');
  }

  function buildPrefillUrl(f) {
    const params = new URLSearchParams({
      title: '添加友联',
      body: buildIssueBody(f),
      labels: CONF.labels || '待审核'
    });
    return `https://github.com/${CONF.repo}/issues/new?${params.toString()}`;
  }

  // ---------- token 存取 ----------
  const TOKEN_KEY = 'friends_submit_token';

  function readToken() {
    // OAuth 隐式流把 token 放在 URL fragment
    if (location.hash.startsWith('#access_token=')) {
      const raw = new URLSearchParams(location.hash.slice(1));
      const token = raw.get('access_token');
      if (token) {
        try { localStorage.setItem(TOKEN_KEY, token); } catch (e) { /* 隐私模式 */ }
        history.replaceState(null, '', location.pathname + location.search);
        return token;
      }
    }
    try { return localStorage.getItem(TOKEN_KEY); } catch (e) { return null; }
  }

  function dropToken() {
    try { localStorage.removeItem(TOKEN_KEY); } catch (e) { /* noop */ }
  }

  function authorize() {
    const params = new URLSearchParams({
      client_id: CONF.clientId,
      redirect_uri: CONF.redirectUri || location.origin + location.pathname,
      response_type: 'token',
      scope: 'public_repo'
    });
    location.href = `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  async function submitViaApi(token, f) {
    const resp = await fetch(`https://api.github.com/repos/${CONF.repo}/issues`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title: '添加友联', body: buildIssueBody(f), labels: [CONF.label || '待审核'] })
    });
    if (resp.status === 401) { dropToken(); throw new Error('GitHub 授权已失效，请重新登录'); }
    if (resp.status === 422) throw new Error('提交被拒绝：该 Issue 可能已存在');
    if (!resp.ok) throw new Error(`GitHub 返回 ${resp.status}`);
    return resp.json();
  }

  // ---------- 表单 ----------
  function el(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  const FIELDS = [
    { name: 'title', label: '站点名称', placeholder: 'Aurora', required: true },
    { name: 'url', label: '站点地址', placeholder: 'https://example.com', required: true },
    { name: 'icon', label: '头像 / 图标 URL', placeholder: 'https://…/avatar.png', required: true },
    { name: 'description', label: '一句话简介', placeholder: '记录点什么', required: true },
    { name: 'feed', label: '订阅地址（可选）', placeholder: 'https://example.com/atom.xml', required: false },
    { name: 'snapshot', label: '站点截图（可选）', placeholder: 'https://…/shot.png', required: false }
  ];

  function buildForm(root) {
    const form = el(`<form class="fs-form" novalidate></form>`);
    form.appendChild(el(`<p class="fs-tip">填写后提交到本站的友链仓库 Issue，通过审核后会自动出现在友链页。请先在对方站点添加本站友链。</p>`));
    for (const f of FIELDS) {
      form.appendChild(el(
        `<label class="fs-field">
           <span class="fs-label">${f.label}${f.required ? '<i>*</i>' : ''}</span>
           <input name="${f.name}" type="${f.name === 'url' || f.name === 'icon' || f.name === 'feed' || f.name === 'snapshot' ? 'url' : 'text'}"
                  placeholder="${f.placeholder}" ${f.required ? 'required' : ''}>
         </label>`));
    }
    const actions = el(`<div class="fs-actions"></div>`);
    const btn = el(`<button type="submit" class="fs-submit">提交申请</button>`);
    actions.appendChild(btn);
    actions.appendChild(el(`<button type="button" class="fs-alt fs-login">用 GitHub 登录后直接提交</button>`));
    form.appendChild(actions);
    form.appendChild(el(`<p class="fs-msg" role="status"></p>`));
    root.appendChild(form);

    const msg = form.querySelector('.fs-msg');
    const setMsg = (text, kind) => { msg.textContent = text; msg.className = 'fs-msg' + (kind ? ' ' + kind : ''); };

    function collect() {
      const data = {};
      for (const f of FIELDS) {
        const v = (form.querySelector(`[name="${f.name}"]`).value || '').trim();
        if (f.required && !v) { setMsg(`请填写「${f.label}」`, 'error'); form.querySelector(`[name="${f.name}"]`).focus(); return null; }
        data[f.name] = v;
      }
      if (!/^https?:\/\/[^\s]+$/i.test(data.url)) { setMsg('站点地址必须是 http(s) 开头的完整 URL', 'error'); return null; }
      return data;
    }

    form.querySelector('.fs-login').addEventListener('click', () => {
      const data = collect();
      if (!data) return;
      try { sessionStorage.setItem('friends_submit_draft', JSON.stringify(data)); } catch (e) { /* noop */ }
      authorize();
    });

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const data = collect();
      if (!data) return;

      // 已登录：直接调 API
      const token = readToken();
      if (token) {
        btn.disabled = true; btn.textContent = '提交中…';
        try {
          const issue = await submitViaApi(token, data);
          setMsg(`已提交 #${issue.number}，等待审核通过后即可展示。`, 'ok');
          form.reset();
          return;
        } catch (err) {
          setMsg(err.message, 'error');
          btn.disabled = false; btn.textContent = '提交申请';
          return;
        }
      }

      // 未登录：降级为 GitHub 预填 Issue 表单（零注册可用）
      window.open(buildPrefillUrl(data), '_blank', 'noopener');
      setMsg('已在新标签页打开 GitHub 的 Issue 表单，粘贴提交即可（若想站内一键提交，请用 GitHub 登录）。', 'info');
    });

    // OAuth 回跳后自动继续提交
    const draft = (() => { try { return JSON.parse(sessionStorage.getItem('friends_submit_draft') || 'null'); } catch (e) { return null; } })();
    if (draft && readToken()) {
      try { sessionStorage.removeItem('friends_submit_draft'); } catch (e) { /* noop */ }
      form.querySelector('.fs-submit').click();
    }
  }

  function boot() {
    const root = document.getElementById(ROOT_ID);
    if (!root || root.dataset.bound) return;
    root.dataset.bound = '1';
    if (!CONF.repo) { root.innerHTML = '<p class="fs-msg error">未配置友链仓库地址</p>'; return; }
    if (!CONF.clientId) {
      root.querySelector('.fs-login')?.remove();
    }
    buildForm(root);
  }

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  }

  ready(boot);
  document.addEventListener('stellar:navigation-complete', boot);
})();
