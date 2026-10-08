/**
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