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
