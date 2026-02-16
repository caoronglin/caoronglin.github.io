<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:atom="http://www.w3.org/2005/Atom">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes" media-type="text/html; charset=UTF-8"/>
  <xsl:template match="/">
    <xsl:variable name="title" select="/atom:feed/atom:title"/>
    <xsl:variable name="description" select="/atom:feed/atom:subtitle"/>
    <xsl:variable name="link" select="/atom:feed/atom:link[@rel='alternate']/@href | /atom:feed/atom:link[not(@rel)]/@href"/>
    <html lang="zh-CN" class="scroll-smooth">
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <meta name="referrer" content="unsafe-url"/>
        <meta name="description" content="{$description}"/>
        <title><xsl:value-of select="$title"/></title>
        <style>
          :root {
            --primary: #1BCDFC; --primary-dark: #0EA5E9; --accent: #3DC550; --accent-dark: #10B981;
            --bg: #f8fafc; --bg-strong: #f1f5f9; --card: #ffffff; --card-dark: rgba(15, 23, 42, 0.9);
            --border: #e2e8f0; --border-dark: rgba(148, 163, 184, 0.15);
            --text: #0f172a; --text-muted: #475569; --text-dark: #f1f5f9; --muted-dark: #cbd5e1;
            --shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
            --radius: 16px; --radius-sm: 12px;
            --gradient-solid: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
            --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            color: var(--text); background: var(--bg); line-height: 1.6;
            transition: background-color 0.3s ease; min-height: 100vh;
          }
          body.dark { color: var(--text-dark); background: #0f172a; }
          main { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
          
          header {
            background: var(--card); border: 1px solid var(--border); border-radius: var(--radius);
            padding: 30px; box-shadow: var(--shadow); margin-bottom: 30px;
          }
          body.dark header { background: var(--card-dark); border-color: var(--border-dark); }
          
          h1 { font-size: 28px; display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
          .header-title { background: var(--gradient-solid); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800; }
          
          .subscribe { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border); }
          .subscribe a { 
            padding: 6px 14px; border-radius: 20px; border: 1px solid var(--border); 
            font-size: 13px; color: var(--text-muted); text-decoration: none; transition: var(--transition);
          }
          .subscribe a:hover { background: var(--gradient-solid); color: white; border-color: transparent; transform: translateY(-2px); }
          body.dark .subscribe a { color: var(--muted-dark); border-color: var(--border-dark); }

          article { margin-bottom: 16px; border-radius: var(--radius-sm); overflow: hidden; border: 1px solid var(--border); background: var(--card); transition: var(--transition); }
          body.dark article { background: var(--card-dark); border-color: var(--border-dark); }
          article:hover { border-color: var(--primary); transform: translateY(-2px); box-shadow: var(--shadow); }

          .collapse-toggle {
            width: 100%; border: none; background: transparent; padding: 16px 20px;
            display: flex; align-items: center; justify-content: space-between;
            cursor: pointer; text-align: left; color: inherit; font-family: inherit;
          }
          .collapse-title { font-size: 17px; font-weight: 600; flex: 1; margin-right: 15px; }
          
          .collapse-icon {
            width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;
            border-radius: 50%; background: var(--bg-strong); color: var(--primary); transition: var(--transition);
          }
          body.dark .collapse-icon { background: rgba(255,255,255,0.05); }
          .open .collapse-icon { transform: rotate(180deg); background: var(--primary); color: white; }

          .collapse-content {
            max-height: 0; overflow: hidden; transition: all 0.4s cubic-bezier(0, 1, 0, 1);
            background: rgba(0,0,0,0.01);
          }
          .collapse-content.show { max-height: 10000px; transition: all 0.4s cubic-bezier(1, 0, 1, 0); padding: 0 20px 20px; border-top: 1px solid var(--border); }
          body.dark .collapse-content.show { border-top-color: var(--border-dark); }

          /* 文章内样式 */
          .content-body { font-size: 15px; color: inherit; margin-top: 15px; }
          .content-body img { max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0; }
          .content-body a { color: var(--primary); text-decoration: underline; }
          time { font-size: 12px; color: var(--text-muted); display: block; margin-top: 4px; }
          
          .theme-toggle, .back-to-top {
            position: fixed; right: 20px; width: 44px; height: 44px;
            border-radius: 12px; border: 1px solid var(--border);
            background: var(--card); color: var(--primary); cursor: pointer;
            display: flex; align-items: center; justify-content: center; z-index: 100; transition: var(--transition);
          }
          .theme-toggle { bottom: 80px; }
          .back-to-top { bottom: 20px; opacity: 0; pointer-events: none; }
          .back-to-top.show { opacity: 1; pointer-events: auto; }
          body.dark .theme-toggle, body.dark .back-to-top { background: var(--card-dark); border-color: var(--border-dark); }
          
          .hidden { display: none !important; }
        </style>
      </head>
      <body>
        <button class="theme-toggle" onclick="toggleTheme()" aria-label="切换主题">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
        </button>
        <button class="back-to-top" onclick="scrollToTop()" aria-label="回到顶部">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 19V5M5 12l7-7 7 7"/>
          </svg>
        </button>

        <main>
          <header>
            <a href="{$link}" target="_blank" style="text-decoration:none">
              <h1>
                <span class="header-title"><xsl:value-of select="$title"/></span>
              </h1>
            </a>
            <p><xsl:value-of select="$description" disable-output-escaping="yes"/></p>
            
            <div class="subscribe" id="subscribe-links">
              <a data-href="https://feedly.com/i/subscription/feed/">Feedly</a>
              <a data-href="https://www.inoreader.com/feed/">Inoreader</a>
              <a data-href="follow://add?url=">Follow</a>
              <a data-href="feed:" data-raw="true">RSS Reader</a>
            </div>
          </header>

          <section>
            <xsl:for-each select="/atom:feed/atom:entry">
              <article>
                <button class="collapse-toggle" onclick="toggleCollapse(this)">
                  <div style="flex:1">
                    <span class="collapse-title"><xsl:value-of select="atom:title" disable-output-escaping="yes"/></span>
                    <time><xsl:value-of select="substring(atom:updated, 1, 10)"/></time>
                  </div>
                  <span class="collapse-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </span>
                </button>
                <div class="collapse-content">
                  <div class="content-body">
                    <xsl:choose>
                      <xsl:when test="atom:content">
                        <xsl:value-of select="atom:content" disable-output-escaping="yes"/>
                      </xsl:when>
                      <xsl:otherwise>
                        <xsl:value-of select="atom:summary" disable-output-escaping="yes"/>
                      </xsl:otherwise>
                    </xsl:choose>
                  </div>
                  <div style="margin-top:20px">
                    <a href="{atom:link[@rel='alternate']/@href}" target="_blank" class="read-more">查看原文 →</a>
                  </div>
                </div>
              </article>
            </xsl:for-each>
          </section>
        </main>

        <script>
          function toggleCollapse(btn) {
            const content = btn.nextElementSibling;
            const isOpening = !btn.classList.contains('open');
            
            // 关闭其他已打开的 (可选)
            // document.querySelectorAll('.collapse-toggle.open').forEach(el => {
            //   if(el !== btn) { el.classList.remove('open'); el.nextElementSibling.classList.remove('show'); }
            // });

            btn.classList.toggle('open');
            content.classList.toggle('show');
            
            if (isOpening) {
              setTimeout(() => {
                btn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }, 300);
            }
          }

          function toggleTheme() {
            const isDark = document.body.classList.toggle('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
          }

          function scrollToTop() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }

          document.addEventListener('DOMContentLoaded', () => {
            // 主题初始化
            if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') &amp;&amp; window.matchMedia('(prefers-color-scheme: dark)').matches)) {
              document.body.classList.add('dark');
            }

            // 订阅链接处理
            const feedUrl = location.href;
            document.querySelectorAll('#subscribe-links a').forEach(a => {
              const base = a.getAttribute('data-href');
              const raw = a.getAttribute('data-raw');
              a.href = raw ? base + feedUrl : base + encodeURIComponent(feedUrl);
            });

            // 回到顶部按钮控制
            window.addEventListener('scroll', () => {
              document.querySelector('.back-to-top').classList.toggle('show', window.scrollY > 400);
            });
          });
        </script>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>