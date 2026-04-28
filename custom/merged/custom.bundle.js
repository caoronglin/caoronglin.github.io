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
})();(function() {
    'use strict';

    const LINK_SELECTORS = 'article.md-text.content a, footer.page-footer.footnote a';
    const ICON_CLASS = 'ext-link-icon';
    const SKIP_PARENTS = [
        '.tag-plugin.users-wrap',
        '.tag-plugin.sites-wrap',
        '.tag-plugin.ghcard',
        '.tag-plugin.link.dis-select',
        '.tag-plugin.colorful.note',
        '.social-wrap.dis-select'
    ];

    const ICON_SVG = '<svg width=".7em" height=".7em" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg"><path d="m13 3l3.293 3.293l-7 7l1.414 1.414l7-7L21 11V3z" fill="currentColor" /><path d="M19 19H5V5h7l-2-2H5c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2h14c1.103 0 2-.897 2-2v-5l-2-2v7z" fill="currentColor"></path></svg>';

    function isSkippableLink(link) {
        if (SKIP_PARENTS.some(selector => link.closest(selector))) {
            return true;
        }

        const href = link.getAttribute('href') || '';
        if (!href) {
            return true;
        }

        if (
            href.startsWith('#') ||
            href.startsWith('javascript:') ||
            href.startsWith('mailto:') ||
            href.startsWith('tel:')
        ) {
            return true;
        }

        return !(href.startsWith('http') || href.startsWith('/'));
    }

    function appendLinkIcon(link) {
        if (link.querySelector('.' + ICON_CLASS)) {
            return;
        }

        const span = document.createElement('span');
        span.className = ICON_CLASS;
        span.style.whiteSpace = 'nowrap';
        span.setAttribute('aria-hidden', 'true');
        span.innerHTML = ICON_SVG;

        link.appendChild(document.createTextNode(' '));
        link.appendChild(span);
    }

    function decorateLinks() {
        const links = document.querySelectorAll(LINK_SELECTORS);
        links.forEach(link => {
            if (!isSkippableLink(link)) {
                appendLinkIcon(link);
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', decorateLinks, { once: true });
    } else {
        decorateLinks();
    }

    document.addEventListener('pjax:complete', decorateLinks);
})();/**
 * 优化版滑动阻尼效果
 * 特点：高性能、非侵入、自动监听高度、节省算力
 */
(function() {
  'use strict';

  // 配置项
  const CONFIG = {
    easing: 0.08,        // 阻尼系数，越小越平滑 (0.05 ~ 0.15)
    minGap: 0.1,         // 停止计算的最小间隙
    mobileWidth: 768,    // 移动端阈值
    excludeSelectors: '.l_left, .l_right, .leftbar, .rightbar' // 排除这些布局
  };

  class SmoothScroll {
    constructor() {
      this.dom = {
        main: document.querySelector('#main') || document.querySelector('.main-content') || document.querySelector('main'),
        body: document.body,
        html: document.documentElement
      };

      if (!this.dom.main || document.querySelector(CONFIG.excludeSelectors)) return;

      this.state = {
        currentY: window.scrollY,
        targetY: window.scrollY,
        height: 0,
        isTicking: false
      };

      this.enabled = false;
      this.rafId = null;
      this.resizeObserver = null;
      this._update = this.update.bind(this);

      this.init();
    }

    init() {
      // 监听事件
      this.bindEvents();
      // 开启高度监听
      this.initResizeObserver();
      // 按视口启停
      this.syncViewportState();
    }

    isDesktop() {
      return window.innerWidth >= CONFIG.mobileWidth;
    }

    syncViewportState() {
      if (this.isDesktop()) {
        this.enable();
      } else {
        this.disable();
      }
    }

    enable() {
      if (this.enabled) {
        this.updateBodyHeight();
        this.onScroll();
        return;
      }

      this.enabled = true;
      this.state.currentY = window.scrollY || this.dom.html.scrollTop;
      this.state.targetY = this.state.currentY;
      this.setupStyles();
      this.updateBodyHeight();
      this.requestTick();
    }

    disable() {
      if (!this.enabled) return;

      this.enabled = false;
      this.cancelTick();
      this.dom.main.style.transform = '';
      this.dom.main.style.position = '';
      this.dom.main.style.top = '';
      this.dom.main.style.left = '';
      this.dom.main.style.width = '';
      this.dom.main.style.willChange = '';
      this.dom.main.style.boxSizing = '';
      this.dom.body.style.height = '';
      this.dom.body.classList.remove('smooth-scroll-enabled');
      this.state.isTicking = false;
    }

    setupStyles() {
      // 为内容容器增加性能优化标签
      Object.assign(this.dom.main.style, {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        willChange: 'transform',
        boxSizing: 'border-box'
      });
      this.dom.body.classList.add('smooth-scroll-enabled');
    }

    bindEvents() {
      this._onScroll = this.onScroll.bind(this);
      this._onResize = this.onResize.bind(this);
      this._onPjax = this.onPjaxComplete.bind(this);
      this._onClick = this.onAnchorClick.bind(this);

      window.addEventListener('scroll', this._onScroll, { passive: true });
      window.addEventListener('resize', this._onResize);
      document.addEventListener('click', this._onClick);
      document.addEventListener('pjax:complete', this._onPjax);
    }

    onAnchorClick(e) {
      if (!this.enabled) return;
      const anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;

      setTimeout(() => {
        this.state.targetY = window.scrollY || this.dom.html.scrollTop;
        this.requestTick();
      }, 0);
    }

    onPjaxComplete() {
      if (!this.enabled) return;

      requestAnimationFrame(() => {
        this.updateBodyHeight();
        this.onScroll();
      });
    }

    onScroll() {
      if (!this.enabled) return;
      this.state.targetY = window.scrollY || this.dom.html.scrollTop;
      this.requestTick();
    }

    onResize() {
      this.syncViewportState();
      if (this.enabled) this.updateBodyHeight();
    }

    // 自动监听内容高度变化 (核心优化)
    initResizeObserver() {
      if (typeof ResizeObserver !== 'function') return;

      this.resizeObserver = new ResizeObserver(() => {
        if (this.enabled) this.updateBodyHeight();
      });
      this.resizeObserver.observe(this.dom.main);
    }

    updateBodyHeight() {
      this.state.height = this.dom.main.offsetHeight;
      this.dom.body.style.height = `${this.state.height}px`;
    }

    requestTick() {
      if (!this.enabled || this.state.isTicking) return;

      this.state.isTicking = true;
      this.rafId = requestAnimationFrame(this._update);
    }

    cancelTick() {
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    }

    update() {
      if (!this.enabled) {
        this.state.isTicking = false;
        return;
      }

      const diff = this.state.targetY - this.state.currentY;

      // 缓动公式
      this.state.currentY += diff * CONFIG.easing;

      // 物理停止判定，节省 CPU
      if (Math.abs(diff) < CONFIG.minGap) {
        this.state.currentY = this.state.targetY;
      }

      this.dom.main.style.transform = `translate3d(0, ${-this.state.currentY}px, 0)`;

      if (Math.abs(diff) < CONFIG.minGap) {
        this.state.isTicking = false;
        this.rafId = null;
      } else {
        this.rafId = requestAnimationFrame(this._update);
      }
    }
  }

  // 启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new SmoothScroll());
  } else {
    new SmoothScroll();
  }
})();/**
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

