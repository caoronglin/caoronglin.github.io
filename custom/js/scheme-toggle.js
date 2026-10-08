/**
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