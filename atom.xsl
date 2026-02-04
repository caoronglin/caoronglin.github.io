<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:atom="http://www.w3.org/2005/Atom">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes" media-type="text/html; charset=UTF-8"/>
  <xsl:template match="/">
    <xsl:variable name="title">
      <xsl:value-of select="/atom:feed/atom:title"/>
    </xsl:variable>
    <xsl:variable name="description">
      <xsl:value-of select="/atom:feed/atom:subtitle"/>
    </xsl:variable>
    <xsl:variable name="link">
      <xsl:value-of select="/atom:feed/atom:link[@rel='alternate']/@href | /atom:feed/atom:link[not(@rel)]/@href"/>
    </xsl:variable>
    <html lang="zh-CN" class="scroll-smooth">
      <head>
        <meta charset="utf-8"/>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <meta name="referrer" content="unsafe-url"/>
        <meta name="description">
          <xsl:attribute name="content">
            <xsl:value-of select="$description"/>
          </xsl:attribute>
        </meta>
        <meta name="robots" content="index, follow"/>
        <title><xsl:value-of select="$title"/></title>
        <style>
          :root {
            --primary: #1BCDFC;
            --accent: #3DC550;
            --bg: #f5f7fb;
            --bg-strong: #eef2ff;
            --card: #ffffff;
            --card-dark: rgba(17, 24, 39, 0.55);
            --border: #e5e7eb;
            --border-dark: rgba(148, 163, 184, 0.35);
            --text: #0f172a;
            --muted: #4b5563;
            --text-dark: #e5e7eb;
            --muted-dark: #cbd5e1;
            --shadow: 0 18px 45px rgba(15, 23, 42, 0.12), 0 10px 30px rgba(27, 205, 252, 0.08);
            --radius: 18px;
            --gradient: linear-gradient(135deg, rgba(27, 205, 252, 0.16) 0%, rgba(61, 197, 80, 0.18) 100%);
            --glass: rgba(255, 255, 255, 0.8);
            --glass-dark: rgba(17, 24, 39, 0.72);
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            font-family: 'Inter', 'Noto Sans SC', 'PingFang SC', 'Segoe UI', system-ui, -apple-system, sans-serif;
            color: var(--text);
            background: radial-gradient(circle at 18% 18%, rgba(27, 205, 252, 0.08), transparent 32%), radial-gradient(circle at 80% 12%, rgba(61, 197, 80, 0.08), transparent 30%), var(--bg);
            line-height: 1.7;
            -webkit-font-smoothing: antialiased;
            padding: 0;
          }
          body.dark {
            color: var(--text-dark);
            background: radial-gradient(circle at 18% 18%, rgba(27, 205, 252, 0.14), transparent 32%), radial-gradient(circle at 80% 12%, rgba(61, 197, 80, 0.14), transparent 30%), #0b1220;
          }
          main {
            max-width: 980px;
            margin: 0 auto;
            padding: 48px 22px 60px;
          }
          header {
            background: var(--glass);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 28px;
            box-shadow: var(--shadow);
            backdrop-filter: blur(12px);
            margin-bottom: 26px;
          }
          body.dark header {
            background: var(--glass-dark);
            border-color: var(--border-dark);
          }
          h1 {
            margin: 0 0 14px;
            font-size: 26px;
            color: var(--text);
            display: flex;
            align-items: center;
            gap: 10px;
          }
          body.dark h1 { color: var(--text-dark); }
          h1 span.icon {
            width: 34px;
            height: 34px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 10px;
            background: var(--gradient);
            color: var(--primary);
          }
          p { margin: 0 0 12px; color: var(--muted); }
          body.dark p { color: var(--muted-dark); }
          a { color: var(--primary); text-decoration: none; }
          a:hover { color: var(--accent); }
          .subscribe {
            display: inline-flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 8px;
          }
          .subscribe a {
            background: var(--gradient);
            padding: 8px 12px;
            border-radius: 999px;
            color: var(--text);
            border: 1px solid transparent;
            transition: transform 0.2s, box-shadow 0.2s;
          }
          body.dark .subscribe a { color: var(--text-dark); }
          .subscribe a:hover { transform: translateY(-2px); box-shadow: var(--shadow); }
          article {
            background: var(--glass);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            box-shadow: var(--shadow);
            margin-bottom: 18px;
            padding: 18px 22px;
            backdrop-filter: blur(10px);
          }
          body.dark article {
            background: var(--glass-dark);
            border-color: var(--border-dark);
          }
          .collapse-toggle {
            cursor: pointer;
            font-weight: 700;
            color: var(--text);
            background: linear-gradient(90deg, rgba(27, 205, 252, 0.1), rgba(61, 197, 80, 0.08));
            border-radius: 14px;
            padding: 14px 16px;
            transition: background 0.25s ease, transform 0.2s ease;
            display: flex;
            align-items: center;
            gap: 12px;
            border: 1px solid var(--border);
          }
          body.dark .collapse-toggle {
            color: var(--text-dark);
            border-color: var(--border-dark);
            background: linear-gradient(90deg, rgba(27, 205, 252, 0.12), rgba(61, 197, 80, 0.1));
          }
          .collapse-toggle:hover { transform: translateY(-1px); }
          .collapse-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 26px;
            height: 26px;
            border-radius: 8px;
            background: rgba(27, 205, 252, 0.1);
            position: relative;
          }
          .collapse-icon::before, .collapse-icon::after {
            content: '';
            position: absolute;
            background: var(--primary);
            border-radius: 1px;
            transition: transform 0.3s;
          }
          .collapse-icon::before { width: 12px; height: 2px; left: 7px; top: 12px; }
          .collapse-icon::after { width: 2px; height: 12px; left: 12px; top: 7px; }
          .collapse-icon.open::after { transform: scale(0); }
          .collapse-content {
            display: block;
            max-height: 0;
            opacity: 0;
            overflow: hidden;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            padding: 0 6px;
            border-top: 1px solid transparent;
          }
          .collapse-content.show {
            max-height: 2400px;
            opacity: 1;
            padding: 14px 6px 6px;
            border-top: 1px solid var(--border);
          }
          body.dark .collapse-content.show { border-top-color: var(--border-dark); }
          .seo-content { color: var(--muted); }
          body.dark .seo-content { color: var(--muted-dark); }
          time {
            background: rgba(27, 205, 252, 0.12);
            border-radius: 999px;
            padding: 6px 12px;
            font-size: 0.9rem;
            margin: 6px 0 12px;
            display: inline-block;
            color: var(--text);
          }
          body.dark time { color: var(--text-dark); }
          .theme-toggle, .back-to-top {
            background: var(--card);
            border: 1px solid var(--border);
            color: var(--primary);
          }
          body.dark .theme-toggle, body.dark .back-to-top {
            background: var(--card-dark);
            border-color: var(--border-dark);
            color: var(--text-dark);
          }
          .theme-toggle, .back-to-top {
            position: fixed;
            bottom: 1.6rem;
            border-radius: 14px;
            padding: 0.65rem 0.75rem;
            z-index: 100;
            transition: all 0.25s;
            box-shadow: var(--shadow);
          }
          .theme-toggle { right: 1.6rem; }
          .back-to-top { right: 4.4rem; opacity: 0; visibility: hidden; }
          .back-to-top.show { opacity: 1; visibility: visible; }
          .theme-toggle:hover, .back-to-top:hover {
            transform: translateY(-2px);
            background: var(--gradient);
            color: var(--text);
          }
          body.dark .theme-toggle:hover, body.dark .back-to-top:hover { color: var(--text-dark); }
        </style>
      </head>
      <body>
        <!-- 添加主题切换按钮 -->
        <button class="theme-toggle" onclick="toggleTheme()" aria-label="切换主题">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"/>
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
        </button>
        <!-- 添加回到顶部按钮 -->
        <button class="back-to-top" onclick="scrollToTop()" aria-label="回到顶部">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 19V5M5 12l7-7 7 7"/>
          </svg>
        </button>
        <main class="min-w-screen container mx-auto flex min-h-screen max-w-screen-lg flex-col px-4 py-6 md:px-6">
          <header class="space-y-2 pt-2 md:pt-6">
            <a title="{$title}" href="{$link}" target="_blank" rel="noopener noreferrer">
              <h1 class="flex text-2xl">
                <span class="icon-[tabler--rss] mr-2 h-8 w-8"/>
                <span class="lg2:text-3xl from-primary-600 to-accent-400 inline-block bg-gradient-to-r bg-clip-text font-bold text-transparent">
                  <xsl:value-of select="$title" disable-output-escaping="yes"/>
                </span>
              </h1>
            </a>
            <p class="text-body pt-2 text-lg py-4">
              <xsl:value-of select="$description" disable-output-escaping="yes"/>
            </p>
            <p class="text-caption text-sm">
              This RSS feed for the
              <a class="link intent-neutral variant-animated !text-caption font-bold" title="{$title}" href="{$link}" target="_blank" rel="noopener noreferrer">
                <xsl:value-of select="$title"/>
              </a>
              website.
            </p>
            <p class="text-body text-sm hidden" id="subscribe-links">
              订阅这个 RSS 源:
              <a class="link intent-neutral variant-animated font-bold" title="Feedly" data-href="https://feedly.com/i/subscription/feed/" target="_blank" rel="noopener noreferrer">Feedly</a>,
              <a class="link intent-neutral variant-animated font-bold" title="Inoreader" data-href="https://www.inoreader.com/feed/" target="_blank" rel="noopener noreferrer">Inoreader</a>,
              <a class="link intent-neutral variant-animated font-bold" title="Newsblur" data-href="https://www.newsblur.com/?url=" target="_blank" rel="noopener noreferrer">Newsblur</a>,
              <a class="link intent-neutral variant-animated font-bold" title="Follow" data-href="follow://add?url=" rel="noopener noreferrer">Follow</a>,
              <a class="link intent-neutral variant-animated font-bold" title="RSS Reader" data-href="feed:" data-raw="true" rel="noopener noreferrer">RSS Reader</a>
              或
              <a class="link intent-neutral variant-animated font-bold" title="{$title} 's feed source" data-href="" data-raw="true" rel="noopener noreferrer">查看源代码</a>.
            </p>
            <script>
              document.addEventListener('DOMContentLoaded', function () {
                document.querySelectorAll('a[data-href]').forEach(function (a) {
                  const url = new URL(location.href)
                  const feed = url.searchParams.get('url') || location.href
                  const raw = a.getAttribute('data-raw')
                  if (raw) {
                    a.href = a.getAttribute('data-href') + feed
                  } else {
                    a.href = a.getAttribute('data-href') + encodeURIComponent(feed)
                  }
                })
                document.getElementById('subscribe-links').classList.remove('hidden')
              })
            </script>
          </header>
          <hr class="my-6"/>
          <section class="flex-1 space-y-6 p-1 md:p-4">
            <xsl:choose>
              <xsl:when test="/atom:feed/atom:entry">
                <xsl:for-each select="/atom:feed/atom:entry">
                  <article class="article-card">
                    <div class="article-content">
                      <xsl:if test="atom:title">
                        <h2 class="text-title cursor-pointer text-lg font-semibold collapse-toggle" 
                            onclick="toggleCollapse(this)"
                            onkeydown="handleKeydown(event, this)"
                            role="button"
                            tabindex="0"
                            aria-expanded="false"
                            aria-controls="content-{position()}">
                          <span class="collapse-icon" aria-hidden="true"></span>
                          <xsl:value-of select="atom:title" disable-output-escaping="yes"/>
                        </h2>
                      </xsl:if>
                      <xsl:if test="atom:updated">
                        <time datetime="{atom:updated}">
                          <xsl:value-of select="atom:updated"/>
                        </time>
                      </xsl:if>
                      <!-- SEO 友好的内容版本 -->
                      <div class="seo-content">
                        <xsl:choose>
                          <xsl:when test="atom:content">
                            <xsl:value-of select="atom:content" disable-output-escaping="yes"/>
                          </xsl:when>
                          <xsl:when test="atom:summary">
                            <xsl:value-of select="atom:summary" disable-output-escaping="yes"/>
                          </xsl:when>
                        </xsl:choose>
                      </div>
                      <div id="content-{position()}" class="collapse-content text-body px-4 py-2" role="region">
                        <p class="my-2">
                          <xsl:choose>
                            <xsl:when test="atom:content">
                              <xsl:value-of select="atom:content" disable-output-escaping="yes"/>
                            </xsl:when>
                            <xsl:when test="atom:summary">
                              <xsl:value-of select="atom:summary" disable-output-escaping="yes"/>
                            </xsl:when>
                          </xsl:choose>
                        </p>
                        <xsl:if test="atom:link[@rel='alternate']/@href">
                          <a class="link variant-animated intent-neutral font-bold" href="{atom:link[@rel='alternate']/@href}" target="_blank" rel="noopener noreferrer">
                            阅读更多
                          </a>
                        </xsl:if>
                      </div>
                    </div>
                  </article>
                </xsl:for-each>
                <script>
                  function toggleCollapse(element) {
                    const content = element.nextElementSibling.nextElementSibling.nextElementSibling;
                    const icon = element.querySelector('.collapse-icon');
                    const isExpanded = element.getAttribute('aria-expanded') === 'true';
                    
                    element.setAttribute('aria-expanded', !isExpanded);
                    content.classList.toggle('show');
                    icon.classList.toggle('open');
                  }
                  
                  function handleKeydown(event, element) {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      toggleCollapse(element);
                    }
                  }
                  
                  // 初始化逻辑：默认全部收起
                  document.addEventListener('DOMContentLoaded', function () {
                    const articles = document.querySelectorAll('article');
                    articles.forEach(function (article) {
                      const toggle = article.querySelector('.collapse-toggle');
                      const content = article.querySelector('.collapse-content');
                      const icon = article.querySelector('.collapse-icon');
                      
                      // 设置默认收起状态
                      toggle.setAttribute('aria-expanded', 'false');
                      content.classList.remove('show');
                      icon.classList.remove('open');
                    });
                  });
                </script>
              </xsl:when>
            </xsl:choose>
          </section>
        </main>
        <script>
          function toggleTheme() {
            document.body.classList.toggle('dark');
            localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
          }
          function scrollToTop() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
          function toggleBackToTop() {
            const backToTop = document.querySelector('.back-to-top');
            if (window.scrollY > 200) {
              backToTop.classList.add('show');
            } else {
              backToTop.classList.remove('show');
            }
          }
          window.addEventListener('scroll', toggleBackToTop);
          document.addEventListener('DOMContentLoaded', function() {
            const savedTheme = localStorage.getItem('theme') || 'dark';
            if (savedTheme === 'dark') {
              document.body.classList.add('dark');
            } else {
              document.body.classList.remove('dark');
            }
            // ...existing code...
          });
        </script>
        <!-- ...existing code... -->
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
                      event.preventDefault();
                      toggleCollapse(element);
                    }
                  }
                  
                  // 初始化逻辑：默认全部收起
                  document.addEventListener('DOMContentLoaded', function () {
                    const articles = document.querySelectorAll('article');
                    articles.forEach(function (article) {
                      const toggle = article.querySelector('.collapse-toggle');
                      const content = article.querySelector('.collapse-content');
                      const icon = article.querySelector('.collapse-icon');
                      
                      // 设置默认收起状态
                      toggle.setAttribute('aria-expanded', 'false');
                      content.classList.remove('show');
                      icon.classList.remove('open');
                    });
                  });
                </script>
              </xsl:when>
            </xsl:choose>
          </section>
        </main>
        <script>
          // 添加主题切换功能
          function toggleTheme() {
            const root = document.documentElement;
            const isDark = root.classList.contains('dark');
            root.classList.toggle('dark');
            localStorage.setItem('theme', isDark ? 'light' : 'dark');
          }

          // 回到顶部功能
          function scrollToTop() {
            window.scrollTo({
              top: 0,
              behavior: 'smooth'
            });
          }

          // 控制按钮显示/隐藏
          function toggleBackToTop() {
            const backToTop = document.querySelector('.back-to-top');
            if (window.scrollY > 200) {
              backToTop.classList.add('show');
            } else {
              backToTop.classList.remove('show');
            }
          }

          // 监听滚动事件
          window.addEventListener('scroll', toggleBackToTop);
          
          // 初始化主题
          document.addEventListener('DOMContentLoaded', function() {
            const savedTheme = localStorage.getItem('theme') || 'dark';
            if (savedTheme === 'light') {
              document.documentElement.classList.remove('dark');
            }
            // ...existing code...
          });
        </script>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
