/* JS — 由 scripts/bundle-assets.js 在构建时自动生成，请勿手工编辑。
 * 源文件：source/custom/js/
 * 包含：random-post.js, link-icon.js, back.js, subscribe.js, txmap.js, umami-stats.js, friends-apply.js, scheme-toggle.js, spotlight.js, equipment.js
 */

/* ===== random-post.js ===== */
/**
 * 随机文章跳转
 *
 * v1 主题自带 toRandomPost()，v2 移除了该函数，
 * 导致侧边栏「🎉 抓到你啦」中的「随机文章」入口（url: 'javascript:toRandomPost()'）
 * 点击无响应。这里补回同名函数。
 *
 * 数据来源：搜索索引 /search.json（主题在构建时生成，含全部可索引页面），
 * 过滤掉当前页后随机跳转。这样不依赖站点额外配置，
 * 且与主题的 visibility.searchable 保持一致。
 */

window.toRandomPost = function toRandomPost() {
  fetch('/search.json', { credentials: 'same-origin' })
    .then(function (resp) { return resp.ok ? resp.json() : Promise.reject(resp.status); })
    .then(function (items) {
      if (!Array.isArray(items) || items.length === 0) return;
      var current = location.pathname.replace(/\/index\.html$/, '/').replace(/\.shtml$/, '/');
      var pool = items.filter(function (item) {
        var path = String(item.path || '').replace(/index\.html$/, '');
        return path && path !== current;
      });
      if (pool.length === 0) pool = items;
      var pick = pool[Math.floor(Math.random() * pool.length)];
      if (pick && pick.path) {
        // 站点使用 pretty_urls，索引里的路径已含尾斜杠
        location.href = String(pick.path);
      }
    })
    .catch(function () {
      // 索引不可用时退回站点根路径，不阻断浏览
      location.href = '/';
    });
};

/* ===== link-icon.js ===== */
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

/* ===== back.js ===== */
(() => {
  const CDN_SRC = 'https://cdn.cnortles.top/npm/simplex-noise@2.4.0/simplex-noise.min.js';
  function ensureCanvas() {
    let el = document.getElementById('background-canvas');
    if (!el) {
      el = document.createElement('canvas');
      el.id = 'background-canvas';
      el.style.cssText = 'position:fixed;inset:0;z-index:0;pointer-events:none;';
      document.body.prepend(el);
    }
    return el;
  }

  function init() {
    const canvas = ensureCanvas();
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
  let simplex = null;
  let rafId = null;

  const config = {
    gridSize: 8,
    contourLevels: 12,
    noiseScale: 3
  };

  const colorSchemeMedia = window.matchMedia('(prefers-color-scheme: dark)');

  function isDarkMode() {
    const root = document.documentElement;
    const theme = root.getAttribute('data-theme');
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    return colorSchemeMedia.matches;
  }

  function getStrokeStyle() {
    return isDarkMode() ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
  }

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function generateHeightMap(cols, rows) {
    const map = new Array(rows + 1);
    for (let y = 0; y <= rows; y++) {
      map[y] = new Array(cols + 1);
      for (let x = 0; x <= cols; x++) {
        const nx = x / cols;
        const ny = y / rows;
        map[y][x] = simplex.noise2D(nx * config.noiseScale, ny * config.noiseScale);
      }
    }
    return map;
  }

  function drawSmoothLine(points) {
    if (points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length - 2; i++) {
      const xc = (points[i][0] + points[i + 1][0]) / 2;
      const yc = (points[i][1] + points[i + 1][1]) / 2;
      ctx.quadraticCurveTo(points[i][0], points[i][1], xc, yc);
    }
    const n = points.length;
    ctx.quadraticCurveTo(points[n - 2][0], points[n - 2][1], points[n - 1][0], points[n - 1][1]);
    ctx.stroke();
  }

  function drawContour(level, heightMap, cols, rows, cellSize) {
    ctx.strokeStyle = getStrokeStyle();
    ctx.lineWidth = 1;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const tl = heightMap[y][x];
        const tr = heightMap[y][x + 1];
        const br = heightMap[y + 1][x + 1];
        const bl = heightMap[y + 1][x];

        const sx = x * cellSize;
        const sy = y * cellSize;

        const interpolate = (v1, v2, p1, p2) => {
          const t = (level - v1) / (v2 - v1);
          return [p1[0] + (p2[0] - p1[0]) * t, p1[1] + (p2[1] - p1[1]) * t];
        };

        const points = [];

        if ((tl - level) * (tr - level) < 0) {
          points.push(interpolate(tl, tr, [sx, sy], [sx + cellSize, sy]));
        }
        if ((tr - level) * (br - level) < 0) {
          points.push(interpolate(tr, br, [sx + cellSize, sy], [sx + cellSize, sy + cellSize]));
        }
        if ((br - level) * (bl - level) < 0) {
          points.push(interpolate(br, bl, [sx + cellSize, sy + cellSize], [sx, sy + cellSize]));
        }
        if ((bl - level) * (tl - level) < 0) {
          points.push(interpolate(bl, tl, [sx, sy + cellSize], [sx, sy]));
        }

        if (points.length >= 2) {
          drawSmoothLine(points);
        }
      }
    }
  }

  function render() {
    resizeCanvas();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cols = Math.ceil(canvas.width / config.gridSize);
    const rows = Math.ceil(canvas.height / config.gridSize);
    const cellSize = config.gridSize;

    const heightMap = generateHeightMap(cols, rows);

    for (let i = 0; i < config.contourLevels; i++) {
      const level = -1 + (2 * i) / config.contourLevels;
      drawContour(level, heightMap, cols, rows, cellSize);
    }
  }

  function scheduleRender() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(render);
  }

  function loadSimplex() {
    return new Promise((resolve, reject) => {
      if (window.SimplexNoise) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = CDN_SRC;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

    loadSimplex()
      .then(() => {
        simplex = new window.SimplexNoise();
        scheduleRender();
        window.addEventListener('resize', scheduleRender, { passive: true });

        const observer = new MutationObserver(mutations => {
          if (mutations.some(item => item.attributeName === 'data-theme')) {
            scheduleRender();
          }
        });
        observer.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ['data-theme']
        });

        const onSchemeChange = () => scheduleRender();
        if (typeof colorSchemeMedia.addEventListener === 'function') {
          colorSchemeMedia.addEventListener('change', onSchemeChange);
        } else if (typeof colorSchemeMedia.addListener === 'function') {
          colorSchemeMedia.addListener(onSchemeChange);
        }
      })
      .catch(() => {
        console.warn('[back.js] failed to load simplex-noise');
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/* ===== subscribe.js ===== */
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

/* ===== txmap.js ===== */
(function() {
    'use strict';

    const CONFIG = {
        API_KEY: 'KNFBZ-BQM66-SJWSD-MRR4K-5V3EZ-IZBMF',
        API_URL: 'https://apis.map.qq.com/ws/location/v1/ip',
        CACHE_KEY: 'txmap-location-cache-v1',
        CACHE_TTL: 30 * 60 * 1000,
        CALLBACK_PARAM: 'callback',
        MAX_RETRIES: 6,
        RETRY_DELAY: 1200,
        TIMEOUT: 5000,
        DEFAULT_LOCATION: {
            lng: 108.063431,
            lat: 34.263566
        },
        TARGET_ID: 'welcome-info'
    };

    const state = {
        ipLocation: null,
        lastFetchedAt: 0,
        isFetching: false,
        fetchPromise: null
    };

    const welcomeMessages = {
        countries: {
            '日本': 'よろしく，一起去看樱花吗',
            '美国': 'Let us live in peace!',
            '英国': '想同你一起夜乘伦敦眼',
            '俄罗斯': '干了这瓶伏特加！',
            '法国': 'C\'est La Vie',
            '德国': 'Die Zeit verging im Fluge.',
            '澳大利亚': '一起去大堡礁吧！',
            '加拿大': '拾起一片枫叶赠予你'
        },
        provinces: {
            '北京市': '北——京——欢迎你~~~',
            '天津市': '讲段相声吧。',
            '河北省': '山势巍巍成壁垒，天下雄关。铁马金戈由此向，无限江山。',
            '山西省': '展开坐具长三尺，已占山河五百余。',
            '内蒙古自治区': '天苍苍，野茫茫，风吹草低见牛羊。',
            '辽宁省': '我想吃烤鸡架！',
            '吉林省': '状元阁就是东北烧烤之王。',
            '黑龙江省': '很喜欢哈尔滨大剧院。',
            '上海市': '众所周知，中国只有两个城市。',
            '浙江省': '东风渐绿西湖柳，雁已还人未南归。',
            '安徽省': '蚌埠住了，芜湖起飞。',
            '福建省': '井邑白云间，岩城远带山。',
            '江西省': '落霞与孤鹜齐飞，秋水共长天一色。',
            '山东省': '遥望齐州九点烟，一泓海水杯中泻。',
            '湖北省': '来碗热干面！',
            '湖南省': '74751，长沙斯塔克。',
            '广东省': '老板来两斤福建人。',
            '广西壮族自治区': '桂林山水甲天下。',
            '海南省': '朝观日出逐白浪，夕看云起收霞光。',
            '四川省': '康康川妹子。',
            '贵州省': '茅台，学生，再塞200。',
            '云南省': '玉龙飞舞云缠绕，万仞冰川直耸天。',
            '西藏自治区': '躺在茫茫草原上，仰望蓝天。',
            '陕西省': '来份臊子面加馍。',
            '甘肃省': '羌笛何须怨杨柳，春风不度玉门关。',
            '青海省': '牛肉干和老酸奶都好好吃。',
            '宁夏回族自治区': '大漠孤烟直，长河落日圆。',
            '新疆维吾尔自治区': '驼铃古道丝绸路，胡马犹闻唐汉风。',
            '台湾省': '我在这头，大陆在那头。',
            '香港特别行政区': '永定贼有残留地鬼嚎，迎击光非岁玉。',
            '澳门特别行政区': '性感荷官，在线发牌。'
        },
        cities: {
            '南京市': '这是我挺想去的城市啦。',
            '苏州市': '上有天堂，下有苏杭。',
            '郑州市': '豫州之域，天地之中。',
            '南阳市': '臣本布衣，躬耕于南阳。此南阳非彼南阳！',
            '驻马店市': '峰峰有奇石，石石挟仙气。嵖岈山的花很美哦！',
            '开封市': '刚正不阿包青天。',
            '洛阳市': '洛阳牡丹甲天下。'
        }
    };

    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function getDistance(e1, n1, e2, n2) {
        const R = 6371;
        const { sin, cos, asin, PI, hypot } = Math;

        const getPoint = (e, n) => {
            e *= PI / 180;
            n *= PI / 180;
            return {
                x: cos(n) * cos(e),
                y: cos(n) * sin(e),
                z: sin(n)
            };
        };

        const a = getPoint(e1, n1);
        const b = getPoint(e2, n2);
        const c = hypot(a.x - b.x, a.y - b.y, a.z - b.z);
        return Math.round(asin(c / 2) * 2 * R);
    }

    function getTimeGreeting() {
        const hour = new Date().getHours();

        if (hour >= 5 && hour < 11) return '<span>上午好</span>，一日之计在于晨！';
        if (hour >= 11 && hour < 13) return '<span>中午好</span>，该摸鱼吃午饭了。';
        if (hour >= 13 && hour < 15) return '<span>下午好</span>，懒懒地睡个午觉吧！';
        if (hour >= 15 && hour < 16) return '<span>三点几啦</span>，一起饮茶呀！';
        if (hour >= 16 && hour < 19) return '<span>夕阳无限好！</span>';
        if (hour >= 19 && hour < 24) return '<span>晚上好</span>，夜生活嗨起来！';
        return '夜深了，早点休息，少熬夜。';
    }

    function getLocationDesc(location) {
        const adInfo = location.result.ad_info || {};
        const nation = adInfo.nation || '';
        const province = adInfo.province || '';
        const city = adInfo.city || '';

        if (nation !== '中国') {
            return welcomeMessages.countries[nation] || '带我去你的国家逛逛吧。';
        }

        if (welcomeMessages.cities[city]) {
            return welcomeMessages.cities[city];
        }

        if (province === '江苏省') {
            return welcomeMessages.cities[city] || '散装是必须要散装的。';
        }

        if (province === '河南省') {
            return welcomeMessages.cities[city] || '可否带我品尝河南烩面啦？';
        }

        return welcomeMessages.provinces[province] || '带我去你的城市逛逛吧！';
    }

    function hasWelcomeContainer() {
        return Boolean(document.getElementById(CONFIG.TARGET_ID));
    }

    function createFallbackLocation() {
        return {
            status: -1,
            result: {
                location: { lng: 0, lat: 0 },
                ad_info: { nation: '未知', province: '', city: '', district: '' },
                ip: '0.0.0.0'
            }
        };
    }

    function isValidLocation(data) {
        return Boolean(data && data.result && data.result.location && data.result.ad_info);
    }

    function getCachedLocation() {
        try {
            const raw = localStorage.getItem(CONFIG.CACHE_KEY);
            if (!raw) return null;

            const parsed = JSON.parse(raw);
            if (!parsed || !parsed.data || !parsed.ts) return null;

            if (Date.now() - parsed.ts > CONFIG.CACHE_TTL) {
                localStorage.removeItem(CONFIG.CACHE_KEY);
                return null;
            }

            return parsed;
        } catch (err) {
            return null;
        }
    }

    function setCachedLocation(data) {
        try {
            localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify({
                ts: Date.now(),
                data
            }));
        } catch (err) {
            // localStorage 不可用时静默降级
        }
    }

    function isCacheExpired() {
        if (!state.lastFetchedAt) return true;
        return Date.now() - state.lastFetchedAt > CONFIG.CACHE_TTL;
    }

    function requestLocationByJsonp() {
        return new Promise((resolve, reject) => {
            const callbackName = `__txmap_jsonp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
            const params = new URLSearchParams({
                key: CONFIG.API_KEY,
                output: 'jsonp',
                [CONFIG.CALLBACK_PARAM]: callbackName
            });
            const script = document.createElement('script');
            const timeoutId = setTimeout(() => {
                cleanup();
                reject(new Error('request timeout'));
            }, CONFIG.TIMEOUT);

            function cleanup() {
                clearTimeout(timeoutId);
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
                try {
                    delete window[callbackName];
                } catch (err) {
                    window[callbackName] = undefined;
                }
            }

            window[callbackName] = function(data) {
                cleanup();
                resolve(data);
            };

            script.async = true;
            script.src = `${CONFIG.API_URL}?${params.toString()}`;
            script.onerror = function() {
                cleanup();
                reject(new Error('network error'));
            };

            document.head.appendChild(script);
        });
    }

    async function fetchIpLocation(forceRefresh) {
        if (state.isFetching && state.fetchPromise) {
            return state.fetchPromise;
        }

        if (!forceRefresh && state.ipLocation && !isCacheExpired()) {
            return state.ipLocation;
        }

        state.isFetching = true;
        state.fetchPromise = (async () => {
            for (let retry = 0; retry <= CONFIG.MAX_RETRIES; retry++) {
                try {
                    const response = await requestLocationByJsonp();
                    if (!isValidLocation(response) || Number(response.status) !== 0) {
                        throw new Error('invalid response');
                    }

                    state.ipLocation = response;
                    state.lastFetchedAt = Date.now();
                    setCachedLocation(response);
                    return response;
                } catch (error) {
                    if (retry === CONFIG.MAX_RETRIES) {
                        state.ipLocation = createFallbackLocation();
                        state.lastFetchedAt = Date.now();
                        return state.ipLocation;
                    }

                    const delay = Math.round(CONFIG.RETRY_DELAY * Math.pow(1.35, retry));
                    await wait(delay);
                }
            }

            state.ipLocation = createFallbackLocation();
            state.lastFetchedAt = Date.now();
            return state.ipLocation;
        })();

        try {
            return await state.fetchPromise;
        } finally {
            state.isFetching = false;
            state.fetchPromise = null;
        }
    }

    function renderWelcome() {
        if (!state.ipLocation) return;

        const welcomeInfo = document.getElementById(CONFIG.TARGET_ID);
        if (!welcomeInfo) return;

        const result = state.ipLocation.result || {};
        const adInfo = result.ad_info || {};
        const location = result.location || {};

        const lng = Number(location.lng) || 0;
        const lat = Number(location.lat) || 0;
        const dist = getDistance(CONFIG.DEFAULT_LOCATION.lng, CONFIG.DEFAULT_LOCATION.lat, lng, lat);

        let pos;
        if (adInfo.nation === '中国') {
            pos = `${adInfo.province || ''} ${adInfo.city || ''} ${adInfo.district || ''}`.trim();
        } else {
            pos = adInfo.nation || '未知';
        }

        const ip = result.ip || '0.0.0.0';
        const posDesc = getLocationDesc(state.ipLocation);
        const timeGreeting = getTimeGreeting();

        const html = [
            '<b>',
            '<center>🎉 欢迎信息 🎉</center>',
            '&emsp;&emsp;欢迎来自 <span style="color:var(--theme-color)">',
            escapeHtml(pos),
            '</span> 的小伙伴，',
            timeGreeting,
            '您现在距离站长约 <span style="color:var(--theme-color)">',
            String(dist),
            '</span> 公里，',
            '当前的IP地址为： <span style="color:var(--theme-color)">',
            escapeHtml(ip),
            '</span>， ',
            escapeHtml(posDesc),
            '</b>'
        ].join('');

        if (welcomeInfo.dataset.txmapRendered === html) {
            return;
        }

        welcomeInfo.innerHTML = html;
        welcomeInfo.dataset.txmapRendered = html;
    }

    async function refreshWelcome(forceRefresh) {
        if (!hasWelcomeContainer()) return;

        if (state.ipLocation && !forceRefresh) {
            renderWelcome();
            return;
        }

        await fetchIpLocation(forceRefresh);
        renderWelcome();
    }

    function init() {
        const cached = getCachedLocation();
        if (cached && isValidLocation(cached.data)) {
            state.ipLocation = cached.data;
            state.lastFetchedAt = Number(cached.ts) || 0;
            renderWelcome();
        }

        refreshWelcome(!state.ipLocation || isCacheExpired());
    }

    function onPjaxComplete() {
        refreshWelcome(!state.ipLocation || isCacheExpired());
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }

    document.addEventListener('pjax:complete', onPjaxComplete);
})();

/* ===== umami-stats.js ===== */
(function(){/**
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
})();

/* ===== friends-apply.js ===== */
(function(){/**
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
})();

/* ===== scheme-toggle.js ===== */
(function(){/**
 * 左栏底部常驻的深色 / 浅色切换按钮
 *
 * 主题自带的切换入口在左下角「设置」页里，层级太深。这里在左栏底部
 * system 区加一个常驻按钮，直接调用主题暴露的 window.setColorScheme()，
 * 与设置页共用同一份状态（html[data-theme] + localStorage
 * "Stellar.colorScheme"），两个入口始终一致，不会各切各的。
 */

(function () {
  'use strict'

  const ICON_DARK = // 深色模式下显示月亮：点击切到浅色
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>'
  const ICON_LIGHT = // 浅色模式下显示太阳：点击切到深色
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>'

  // 当前实际生效的配色：显式设置优先，否则跟随系统
  function resolved() {
    const attr = document.documentElement.getAttribute('data-theme')
    if (attr === 'light' || attr === 'dark') return attr
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  function apply(mode) {
    // 主题已挂载时走它的 API，状态与设置页保持同步；
    // 万一 Runtime 还没就绪（扩展被禁用）就自己写属性，功能不至于整个失效。
    if (typeof window.setColorScheme === 'function') {
      window.setColorScheme(mode)
    } else {
      document.documentElement.setAttribute('data-theme', mode)
      try {
        window.localStorage.setItem('Stellar.colorScheme', mode)
      } catch (error) {
        /* 隐私模式下写不进去，忽略即可 */
      }
    }
  }

  function render(btn) {
    const dark = resolved() === 'dark'
    btn.innerHTML = dark ? ICON_LIGHT : ICON_DARK
    btn.setAttribute('title', dark ? '切换到浅色模式' : '切换到深色模式')
    btn.setAttribute('aria-label', dark ? '切换到浅色模式' : '切换到深色模式')
    btn.setAttribute('aria-pressed', String(dark))
  }

  function mount() {
    const host = document.querySelector('.site-region__settings')
    // 左栏被关闭或还没渲染时静默跳过，等下一次导航事件再试
    if (!host) return

    const existing = document.querySelector('.kh-scheme-toggle')
    if (existing) {
      render(existing)
      return
    }

    const btn = document.createElement('button')
    // 沿用设置按钮的类，外观与左栏底部其它项保持一致
    btn.type = 'button'
    btn.className = 'settings-widget kh-scheme-toggle ui-collection__item ui-interactive card-hover'
    btn.addEventListener('click', function (event) {
      event.preventDefault()
      apply(resolved() === 'dark' ? 'light' : 'dark')
      render(btn)
    })
    render(btn)
    host.appendChild(btn)
  }

  function boot() {
    mount()
    // 主题自身切换配色后同步图标（设置页里改，这里跟着变）
    document.addEventListener('stellar:color-scheme-change', function () {
      const btn = document.querySelector('.kh-scheme-toggle')
      if (btn) render(btn)
    })
    // 用户系统主题在未手动指定时变化，也要跟着刷新图标
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = function () {
      const attr = document.documentElement.getAttribute('data-theme')
      if (!attr || attr === 'auto') {
        const btn = document.querySelector('.kh-scheme-toggle')
        if (btn) render(btn)
      }
    }
    if (mq.addEventListener) mq.addEventListener('change', onChange)
    else if (mq.addListener) mq.addListener(onChange)
  }

  // v2 局部导航会替换正文，DOMContentLoaded 不再触发
  document.addEventListener('stellar:navigation-complete', mount)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot)
  } else {
    boot()
  }
})()
})();

/* ===== spotlight.js ===== */
(function(){/**
 * 鼠标跟随光晕
 *
 * 主题自带 card-hover spotlight（features.card_hover.spotlight，
 * 实现见主题的 js/plugins/card-hover.js），只作用于带 ui-interactive
 * 类的元素。equipment 页这类自定义渲染的卡片没有这个类，
 * 这里补一份：把指针在元素内的相对坐标写进 --kh-glow-x / --kh-glow-y，
 * 由 spotlight.css 的 radial-gradient 画出光斑。
 *
 * 实现要点：
 * - 用 pointermove 而非 mousemove，兼容触控笔；
 * - 用 rAF 节流，避免高频事件直接触发样式重算；
 * - 离开元素时清掉坐标，让光斑回到默认中心；
 * - 只在真正支持 hover 的设备上启用，触屏上光斑没有意义。
 */

(function () {
  'use strict'

  var SELECTOR = '.kh-glow'
  var pending = null
  var current = null

  function isHoverCapable() {
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches
  }

  function update(el, ev) {
    var rect = el.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    var x = ((ev.clientX - rect.left) / rect.width) * 100
    var y = ((ev.clientY - rect.top) / rect.height) * 100
    el.style.setProperty('--kh-glow-x', x.toFixed(2) + '%')
    el.style.setProperty('--kh-glow-y', y.toFixed(2) + '%')
  }

  function onMove(ev) {
    var el = current
    if (!el) return
    if (pending) return
    pending = requestAnimationFrame(function () {
      pending = null
      if (current === el) update(el, ev)
    })
  }

  function bind(el) {
    if (el.dataset.glowBound) return
    el.dataset.glowBound = '1'
    el.addEventListener('pointerenter', function (ev) {
      current = el
      update(el, ev)
    })
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', function () {
      if (current === el) current = null
      el.style.removeProperty('--kh-glow-x')
      el.style.removeProperty('--kh-glow-y')
    })
  }

  function scan() {
    if (!isHoverCapable()) return
    document.querySelectorAll(SELECTOR).forEach(bind)
  }

  // v2 局部导航会替换正文，导航完成后要重新扫描
  document.addEventListener('stellar:navigation-complete', scan)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scan)
  } else {
    scan()
  }
})()
})();

/* ===== equipment.js ===== */
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
