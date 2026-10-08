/**
 * Hexo Mirror Sync Service Worker
 * 专为 Hexo 网站设计的多镜像同步 Service Worker
 */

const CACHE_NAME = 'hexo-mirror-v1';
const STATIC_CACHE = 'hexo-static-v1';

// 镜像配置 - 可从外部配置覆盖
const MIRROR_CONFIG = {
  mirrors: [
    { id: 'primary', name: '主站', url: 'https://blog.cnortles.top', priority: 0, weight: 100 },
    // 用户可以在此添加更多镜像
  ],
  healthCheckInterval: 30000,
  cacheMaxAge: 7 * 24 * 60 * 60 * 1000, // 7天
};

// 需要缓存的 Hexo 静态资源
const STATIC_ASSETS = [
  /\.css$/,
  /\.js$/,
  /\.png$/,
  /\.jpg$/,
  /\.jpeg$/,
  /\.gif$/,
  /\.svg$/,
  /\.woff$/,
  /\.woff2$/,
  /\.ttf$/,
  /\.eot$/,
];

// 初始化 IndexedDB
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('HexoMirrorDB', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('mirrors')) {
        db.createObjectStore('mirrors', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('cache')) {
        const cacheStore = db.createObjectStore('cache', { keyPath: 'url' });
        cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      if (!db.objectStoreNames.contains('logs')) {
        const logStore = db.createObjectStore('logs', { keyPath: 'id', autoIncrement: true });
        logStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

// 健康检查
async function checkMirrorHealth(mirror) {
  try {
    const start = performance.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${mirror.url}/favicon.ico`, {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    return {
      healthy: true,
      responseTime: Math.round(performance.now() - start),
    };
  } catch (e) {
    return { healthy: false, responseTime: -1 };
  }
}

// 选择最佳镜像
async function selectMirror() {
  const db = await initDB();
  const tx = db.transaction('mirrors', 'readonly');
  const store = tx.objectStore('mirrors');
  const mirrors = await store.getAll();
  
  if (mirrors.length === 0) return MIRROR_CONFIG.mirrors[0];
  
  // 按优先级排序
  mirrors.sort((a, b) => a.priority - b.priority);
  
  // 找到第一个健康的镜像
  for (const mirror of mirrors) {
    if (!mirror.enabled) continue;
    const health = await checkMirrorHealth(mirror);
    if (health.healthy) {
      mirror.responseTime = health.responseTime;
      mirror.healthStatus = health.responseTime < 500 ? 'healthy' : 'degraded';
      return mirror;
    }
    mirror.healthStatus = 'unhealthy';
  }
  
  // 如果没有健康的，返回第一个
  return mirrors[0];
}

// 重写 URL 使用镜像
function rewriteUrl(url, mirror) {
  try {
    const urlObj = new URL(url);
    const mirrorObj = new URL(mirror.url);
    mirrorObj.pathname = urlObj.pathname;
    mirrorObj.search = urlObj.search;
    mirrorObj.hash = urlObj.hash;
    return mirrorObj.toString();
  } catch (e) {
    return url;
  }
}

// Service Worker 安装
self.addEventListener('install', (e) => {
  console.log('[HexoMirror] Service Worker installing...');
  self.skipWaiting();
});

// Service Worker 激活
self.addEventListener('activate', (e) => {
  console.log('[HexoMirror] Service Worker activating...');
  e.waitUntil(self.clients.claim());
});

// 请求拦截
self.addEventListener('fetch', (e) => {
  const { request } = e;
  
  // 只处理 GET 请求
  if (request.method !== 'GET') return;
  
  // 跳过控制面板请求
  if (request.url.includes('/mirror-panel')) return;
  
  // 跳过非 HTTP/HTTPS
  if (!request.url.startsWith('http')) return;
  
  const isStatic = STATIC_ASSETS.some(pattern => pattern.test(request.url));
  
  e.respondWith(
    (async () => {
      try {
        // 1. 先尝试缓存
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(request);
        
        if (cached) {
          // 检查缓存是否过期
          const cachedDate = cached.headers.get('sw-cached-date');
          if (cachedDate) {
            const age = Date.now() - parseInt(cachedDate);
            if (age < MIRROR_CONFIG.cacheMaxAge) {
              return cached;
            }
          }
        }
        
        // 2. 选择最佳镜像并请求
        const mirror = await selectMirror();
        const mirrorUrl = rewriteUrl(request.url, mirror);
        
        const response = await fetch(mirrorUrl, {
          mode: request.mode,
          credentials: request.credentials,
          redirect: request.redirect,
        });
        
        if (response.ok) {
          // 3. 更新缓存
          const responseToCache = response.clone();
          const headers = new Headers(responseToCache.headers);
          headers.set('sw-cached-date', Date.now().toString());
          
          const modifiedResponse = new Response(responseToCache.body, {
            status: responseToCache.status,
            statusText: responseToCache.statusText,
            headers,
          });
          
          await cache.put(request, modifiedResponse);
          
          // 记录日志
          await log('fetch', `Fetched from ${mirror.name}`, { 
            url: request.url, 
            mirror: mirror.id,
            responseTime: mirror.responseTime 
          });
        }
        
        return response;
      } catch (error) {
        console.error('[HexoMirror] Fetch failed:', error);
        
        // 4. 返回缓存（如果有）
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(request);
        if (cached) return cached;
        
        // 5. 离线页面
        return new Response(
          `<!DOCTYPE html>
          <html>
          <head><title>Offline</title></head>
          <body style="text-align:center;padding:50px;font-family:sans-serif;">
            <h1>离线模式</h1>
            <p>当前处于离线状态，请检查网络连接。</p>
            <button onclick="location.reload()">重试</button>
          </body>
          </html>`,
          { 
            status: 503, 
            headers: { 'Content-Type': 'text/html' }
          }
        );
      }
    })()
  );
});

// 记录日志
async function log(type, message, details = {}) {
  try {
    const db = await initDB();
    const tx = db.transaction('logs', 'readwrite');
    const store = tx.objectStore('logs');
    await store.add({
      timestamp: Date.now(),
      type,
      message,
      details,
    });
  } catch (e) {
    console.error('[HexoMirror] Log failed:', e);
  }
}

// 消息处理 - 与控制面板通信
self.addEventListener('message', (e) => {
  const { data, ports } = e;
  const port = ports?.[0];
  
  switch (data.type) {
    case 'GET_MIRRORS':
      getMirrors().then(mirrors => {
        port?.postMessage({ type: 'MIRRORS_DATA', mirrors });
      });
      break;
      
    case 'ADD_MIRROR':
      addMirror(data.mirror).then(() => {
        port?.postMessage({ type: 'MIRROR_ADDED', mirror: data.mirror });
      });
      break;
      
    case 'UPDATE_MIRROR':
      updateMirror(data.mirror).then(() => {
        port?.postMessage({ type: 'MIRROR_UPDATED', mirror: data.mirror });
      });
      break;
      
    case 'DELETE_MIRROR':
      deleteMirror(data.mirrorId).then(() => {
        port?.postMessage({ type: 'MIRROR_DELETED', mirrorId: data.mirrorId });
      });
      break;
      
    case 'GET_LOGS':
      getLogs(data.limit || 100).then(logs => {
        port?.postMessage({ type: 'LOGS_DATA', logs });
      });
      break;
      
    case 'RUN_HEALTH_CHECK':
      runHealthChecks().then(results => {
        port?.postMessage({ type: 'HEALTH_CHECK_COMPLETE', results });
      });
      break;
      
    case 'CLEAR_CACHE':
      caches.delete(CACHE_NAME).then(() => {
        port?.postMessage({ type: 'CACHE_CLEARED' });
      });
      break;
  }
});

// 数据库操作
async function getMirrors() {
  const db = await initDB();
  const tx = db.transaction('mirrors', 'readonly');
  const store = tx.objectStore('mirrors');
  return store.getAll();
}

async function addMirror(mirror) {
  const db = await initDB();
  const tx = db.transaction('mirrors', 'readwrite');
  const store = tx.objectStore('mirrors');
  mirror.id = mirror.id || `mirror-${Date.now()}`;
  mirror.enabled = true;
  mirror.healthStatus = 'unknown';
  await store.add(mirror);
}

async function updateMirror(mirror) {
  const db = await initDB();
  const tx = db.transaction('mirrors', 'readwrite');
  const store = tx.objectStore('mirrors');
  await store.put(mirror);
}

async function deleteMirror(mirrorId) {
  const db = await initDB();
  const tx = db.transaction('mirrors', 'readwrite');
  const store = tx.objectStore('mirrors');
  await store.delete(mirrorId);
}

async function getLogs(limit = 100) {
  const db = await initDB();
  const tx = db.transaction('logs', 'readonly');
  const store = tx.objectStore('logs');
  const index = store.index('timestamp');
  
  return new Promise((resolve) => {
    const logs = [];
    const request = index.openCursor(null, 'prev');
    request.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor && logs.length < limit) {
        logs.push(cursor.value);
        cursor.continue();
      } else {
        resolve(logs);
      }
    };
  });
}

async function runHealthChecks() {
  const mirrors = await getMirrors();
  const results = [];
  
  for (const mirror of mirrors) {
    const health = await checkMirrorHealth(mirror);
    mirror.healthStatus = health.healthy ? 
      (health.responseTime < 500 ? 'healthy' : 'degraded') : 
      'unhealthy';
    mirror.responseTime = health.responseTime;
    mirror.lastCheck = Date.now();
    await updateMirror(mirror);
    results.push({ mirror, health });
  }
  
  return results;
}
