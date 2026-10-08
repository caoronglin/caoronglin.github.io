/**
 * 音乐页播放器（替代 HeoMusic）
 *
 * 原 HeoMusic 是给 Volantis 写的，放进 Stellar 后布局大面积重叠
 * （歌词、列表、控制条糊在一起），且它依赖的 meting-api PHP 目录
 * 在 GitHub Pages 上根本跑不起来。这里改成一个自建的轻量播放器：
 * 只依赖浏览器原生 <audio>，歌单仍走同一个 meting-api 接口。
 *
 * 设计取舍：
 * - 颜色全部走 Stellar 的 CSS 变量（--card / --text / --accent），
 *   深浅色自动适配，不写死色值；
 * - 列表 400+ 首，DOM 全量渲染即可（实测无卡顿），但加搜索框否则没法找歌；
 * - 局部导航（pjax）会替换正文，所以每次导航完成都要重新绑定。
 */

(function () {
  'use strict'

  var API = 'https://music.zhheo.com/meting-api/?server=tencent&type=playlist&id=7274050897'
  var root = document.getElementById('mp')

  if (!root) return

  var el = {
    cover: root.querySelector('.mp__cover img'),
    title: root.querySelector('.mp__title'),
    artist: root.querySelector('.mp__artist'),
    seek: root.querySelector('.mp__seek'),
    seekFill: root.querySelector('.mp__seek-fill'),
    cur: root.querySelector('.mp__cur'),
    dur: root.querySelector('.mp__dur'),
    toggle: root.querySelector('[data-act="toggle"]'),
    prev: root.querySelector('[data-act="prev"]'),
    next: root.querySelector('[data-act="next"]'),
    vol: root.querySelector('.mp__vol-range'),
    search: root.querySelector('.mp__search'),
    list: root.querySelector('.mp__list'),
    count: root.querySelector('.mp__count'),
    status: root.querySelector('.mp__status'),
    audio: root.querySelector('.mp__audio')
  }

  var ICON = {
    play: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M8 5.14v13.72a1 1 0 0 0 1.54.84l10.1-6.86a1 1 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M7 4h3.5v16H7zM13.5 4H17v16h-3.5z"/></svg>',
    prev: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M7 5h2v14H7zM19 5.5v13a.5.5 0 0 1-.79.4l-9-6.5a.5.5 0 0 1 0-.8l9-6.5a.5.5 0 0 1 .79.4z"/></svg>',
    next: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M15 5h2v14h-2zM5 5.5v13a.5.5 0 0 0 .79.4l9-6.5a.5.5 0 0 0 0-.8l-9-6.5A.5.5 0 0 0 5 5.5z"/></svg>'
  }

  var tracks = []
  var view = []      // 当前可见（搜索过滤后）的下标集合
  var index = -1
  var loading = false

  function fmt(sec) {
    if (!isFinite(sec) || sec < 0) return '00:00'
    var m = Math.floor(sec / 60)
    var s = Math.floor(sec % 60)
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s
  }

  function setStatus(text) {
    if (el.status) el.status.textContent = text || ''
  }

  function renderList() {
    if (!el.list) return
    var html = ''
    for (var i = 0; i < view.length; i++) {
      var t = view[i]
      var active = t === index ? ' is-active' : ''
      html += '<li class="mp__row' + active + '" data-i="' + t + '">' +
        '<span class="mp__row-n">' + (i + 1) + '</span>' +
        '<span class="mp__row-t">' + escapeHtml(tracks[t].name) + '</span>' +
        '<span class="mp__row-a">' + escapeHtml(tracks[t].artist) + '</span>' +
        '</li>'
    }
    el.list.innerHTML = html || '<li class="mp__empty">没有匹配的歌曲</li>'
    if (el.count) {
      el.count.textContent = view.length === tracks.length
        ? tracks.length + ' 首'
        : view.length + ' / ' + tracks.length + ' 首'
    }
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  function applyFilter(kw) {
    kw = (kw || '').trim().toLowerCase()
    if (!kw) {
      view = tracks.map(function (_, i) { return i })
    } else {
      view = []
      for (var i = 0; i < tracks.length; i++) {
        var t = tracks[i]
        if (String(t.name).toLowerCase().indexOf(kw) >= 0 ||
            String(t.artist).toLowerCase().indexOf(kw) >= 0) {
          view.push(i)
        }
      }
    }
    renderList()
  }

  function show(i) {
    if (i < 0 || i >= tracks.length) return
    index = i
    var t = tracks[i]
    el.title.textContent = t.name
    el.artist.textContent = t.artist
    if (el.cover) {
      el.cover.src = t.pic
      el.cover.alt = t.name + ' 封面'
    }
    el.audio.src = t.url
    el.audio.play().then(function () {
      el.toggle.innerHTML = ICON.pause
      setStatus('')
    }).catch(function (err) {
      // 自动播放被浏览器策略拦截是常见情况，给出可读的提示而不是静默失败
      el.toggle.innerHTML = ICON.play
      setStatus('点击播放按钮开始播放' + (err && err.name === 'NotAllowedError' ? '（浏览器拦截了自动播放）' : ''))
    })
    renderList()
    highlight()
  }

  function highlight() {
    if (!el.list) return
    var rows = el.list.querySelectorAll('.mp__row')
    for (var i = 0; i < rows.length; i++) {
      var isActive = Number(rows[i].getAttribute('data-i')) === index
      rows[i].classList.toggle('is-active', isActive)
    }
  }

  function toggle() {
    if (index < 0) {
      if (tracks.length) show(0)
      return
    }
    if (el.audio.paused) {
      el.audio.play().catch(function () { setStatus('播放失败，请重试') })
    } else {
      el.audio.pause()
    }
  }

  function step(d) {
    if (!tracks.length) return
    var base = index < 0 ? 0 : index
    show((base + d + tracks.length) % tracks.length)
  }

  function seekTo(ratio) {
    if (!el.audio.duration) return
    var d = el.audio.duration
    var t = Math.max(0, Math.min(1, ratio)) * d
    if (isFinite(t)) el.audio.currentTime = t
  }

  function load() {
    if (loading || tracks.length) return
    loading = true
    setStatus('正在加载歌单…')
    fetch(API)
      .then(function (r) { return r.json() })
      .then(function (data) {
        tracks = Array.isArray(data) ? data : []
        loading = false
        applyFilter('')
        setStatus(tracks.length ? '' : '歌单为空')
        if (tracks.length && index < 0) show(0)
      })
      .catch(function (err) {
        loading = false
        setStatus('歌单加载失败：' + (err && err.message ? err.message : '网络错误'))
      })
  }

  function bind() {
    if (root.getAttribute('data-bound') === '1') return
    root.setAttribute('data-bound', '1')

    el.toggle.addEventListener('click', toggle)
    el.prev.addEventListener('click', function () { step(-1) })
    el.next.addEventListener('click', function () { step(1) })

    if (el.audio) {
      el.audio.addEventListener('timeupdate', function () {
        var d = el.audio.duration
        var c = el.audio.currentTime
        if (isFinite(d) && d > 0) {
          if (el.seek) el.seek.value = String(c / d)
          if (el.seekFill) el.seekFill.style.width = (c / d * 100).toFixed(2) + '%'
        }
        if (el.cur) el.cur.textContent = fmt(c)
      })
      el.audio.addEventListener('loadedmetadata', function () {
        if (el.dur) el.dur.textContent = fmt(el.audio.duration)
      })
      el.audio.addEventListener('play', function () { el.toggle.innerHTML = ICON.pause })
      el.audio.addEventListener('pause', function () { el.toggle.innerHTML = ICON.play })
      el.audio.addEventListener('ended', function () { step(1) })
      el.audio.addEventListener('error', function () {
        setStatus('这一首加载失败，已跳到下一首')
        setTimeout(function () { step(1) }, 600)
      })
      el.audio.volume = 0.8
    }

    if (el.seek) {
      var onSeek = function () { seekTo(Number(el.seek.value)) }
      el.seek.addEventListener('input', onSeek)
      el.seek.addEventListener('change', onSeek)
    }

    if (el.vol) {
      el.vol.value = String(el.audio ? el.audio.volume : 0.8)
      el.vol.addEventListener('input', function () {
        if (el.audio) el.audio.volume = Number(el.vol.value)
      })
    }

    if (el.search) {
      el.search.addEventListener('input', function () { applyFilter(el.search.value) })
    }

    if (el.list) {
      el.list.addEventListener('click', function (ev) {
        var row = ev.target.closest('.mp__row')
        if (row) show(Number(row.getAttribute('data-i')))
      })
    }

    // 空格键播放/暂停（不在输入框里时）
    document.addEventListener('keydown', function (ev) {
      if (ev.code !== 'Space') return
      var tag = (ev.target && ev.target.tagName || '').toLowerCase()
      if (tag === 'input' || tag === 'textarea') return
      ev.preventDefault()
      toggle()
    })
  }

  // pjax / 局部导航会替换正文，需要重新绑定
  function init() {
    var r = document.getElementById('mp')
    if (!r || r.getAttribute('data-inited') === '1') return
    r.setAttribute('data-inited', '1')
    root = r
    el = {
      cover: r.querySelector('.mp__cover img'),
      title: r.querySelector('.mp__title'),
      artist: r.querySelector('.mp__artist'),
      seek: r.querySelector('.mp__seek'),
      seekFill: r.querySelector('.mp__seek-fill'),
      cur: r.querySelector('.mp__cur'),
      dur: r.querySelector('.mp__dur'),
      toggle: r.querySelector('[data-act="toggle"]'),
      prev: r.querySelector('[data-act="prev"]'),
      next: r.querySelector('[data-act="next"]'),
      vol: r.querySelector('.mp__vol-range'),
      search: r.querySelector('.mp__search'),
      list: r.querySelector('.mp__list'),
      count: r.querySelector('.mp__count'),
      status: r.querySelector('.mp__status'),
      audio: r.querySelector('.mp__audio')
    }
    // 关键控件缺任何一个就放弃初始化：局部导航可能把播放器 DOM 换成
    // 别的结构，此时继续绑定会在 null 上抛错，反而影响后续页面。
    if (!el.toggle || !el.prev || !el.next || !el.audio || !el.list) return
    if (el.toggle) el.toggle.innerHTML = ICON.play
    bind()
    load()
  }

  document.addEventListener('stellar:navigation-complete', init)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()