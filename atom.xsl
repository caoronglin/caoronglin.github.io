<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:atom="http://www.w3.org/2005/Atom">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes" media-type="text/html; charset=UTF-8"/>
  <xsl:template match="/">
    <xsl:variable name="title" select="/atom:feed/atom:title"/>
    <xsl:variable name="subtitle" select="/atom:feed/atom:subtitle"/>
    <xsl:variable name="link" select="/atom:feed/atom:link[@rel='alternate']/@href | /atom:feed/atom:link[not(@rel)]/@href"/>
    <html lang="zh-CN">
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <title><xsl:value-of select="$title"/> · RSS</title>
        <link rel="alternate" type="application/atom+xml" href="{$link}"/>
        <style>
          :root {
            --theme: hsl(88 76% 40%);
            --accent: hsl(14 100% 57%);
            --theme-bg: hsl(212 16% 98%);
            --card-bg: rgba(255,255,255,0.72);
            --card-border: rgba(210,220,235,0.5);
            --text: hsl(0 0% 20%);
            --muted: hsl(215 10% 45%);
            --shadow: 0 4px 24px rgba(0,0,0,0.06);
            --radius: 24px;
            --radius-sm: 16px;
            --nav-glass-bg: linear-gradient(135deg, rgba(255,255,255,0.85), rgba(245,248,252,0.8));
          }
          @media (prefers-color-scheme: dark) {
            :root {
              --theme-bg: hsl(222 24% 12%);
              --card-bg: rgba(24,28,40,0.78);
              --card-border: rgba(148,163,184,0.12);
              --text: hsl(0 0% 92%);
              --muted: hsl(215 16% 60%);
              --shadow: 0 4px 24px rgba(0,0,0,0.25);
              --nav-glass-bg: linear-gradient(135deg, rgba(20,24,36,0.9), rgba(24,28,40,0.85));
            }
          }
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: "HarmonyOS_Regular", "LXGW WenKai", system-ui, "Microsoft Yahei", -apple-system, sans-serif;
            color: var(--text); background: var(--theme-bg); line-height: 1.7; min-height: 100vh;
            background-attachment: fixed;
          }
          body::before {
            content: ''; position: fixed; inset: 0; z-index: -1;
            background: radial-gradient(ellipse 60% 50% at 50% -20%, hsla(88, 76%, 40%, 0.06), transparent),
                        radial-gradient(ellipse 40% 40% at 80% 80%, hsla(14, 100%, 57%, 0.04), transparent);
          }

          /* 毛玻璃导航 */
          .nav-glass {
            position: sticky; top: 0; z-index: 100;
            background: var(--nav-glass-bg);
            backdrop-filter: blur(16px) saturate(180%);
            -webkit-backdrop-filter: blur(16px) saturate(180%);
            border-bottom: 1px solid var(--card-border);
            padding: 0 20px;
          }
          .nav-inner { max-width: 840px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; height: 56px; }
          .nav-logo { font-size: 1.1rem; font-weight: 700; color: var(--theme); text-decoration: none; display: flex; align-items: center; gap: 8px; }
          .nav-logo::before { content: ''; width: 28px; height: 28px; border-radius: 8px; background: linear-gradient(135deg, var(--theme), var(--accent)); opacity: 0.9; }
          .nav-links { display: flex; gap: 4px; }
          .nav-link { padding: 6px 14px; border-radius: 20px; font-size: 13px; color: var(--muted); text-decoration: none; transition: all .2s; border: 1px solid transparent; }
          .nav-link:hover { color: var(--theme); background: color-mix(in srgb, var(--theme) 8%, transparent); }

          main { max-width: 840px; margin: 0 auto; padding: 32px 20px; }

          /* 头部卡片 */
          .hero {
            position: relative; overflow: hidden;
            background: var(--card-bg);
            backdrop-filter: blur(14px) saturate(160%);
            -webkit-backdrop-filter: blur(14px) saturate(160%);
            border: 1px solid var(--card-border);
            border-radius: var(--radius); padding: 36px 32px;
            box-shadow: var(--shadow); margin-bottom: 28px;
          }
          .hero::after {
            content: ''; position: absolute; top: -40%; right: -15%;
            width: 260px; height: 260px; border-radius: 50%;
            background: radial-gradient(circle, hsla(88, 76%, 40%, 0.08), transparent 70%);
            pointer-events: none;
          }
          .hero h1 { font-size: 1.5rem; font-weight: 800; margin-bottom: 6px; position: relative; z-index: 1; }
          .hero p { color: var(--muted); font-size: 14px; position: relative; z-index: 1; }
          .hero-meta { display: flex; gap: 16px; margin-top: 16px; position: relative; z-index: 1; flex-wrap: wrap; }
          .hero-meta a {
            display: inline-flex; align-items: center; gap: 5px;
            padding: 6px 16px; border-radius: 20px;
            border: 1px solid var(--card-border); font-size: 13px;
            color: var(--muted); text-decoration: none; transition: all .2s;
            background: rgba(255,255,255,0.4); backdrop-filter: blur(6px);
          }
          .hero-meta a:hover { color: #fff; background: var(--theme); border-color: var(--theme); transform: translateY(-1px); }

          /* 文章列表 */
          .entries { display: flex; flex-direction: column; gap: 12px; }
          .entry {
            background: var(--card-bg);
            backdrop-filter: blur(10px) saturate(140%);
            -webkit-backdrop-filter: blur(10px) saturate(140%);
            border: 1px solid var(--card-border);
            border-radius: var(--radius-sm); overflow: hidden;
            box-shadow: var(--shadow); transition: all .25s;
          }
          .entry:hover { border-color: color-mix(in srgb, var(--theme) 30%, transparent); transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.08); }

          .entry-btn {
            width: 100%; border: none; background: transparent;
            padding: 18px 24px; display: flex; align-items: center;
            justify-content: space-between; cursor: pointer;
            text-align: left; color: inherit; font-family: inherit;
            font-size: inherit;
          }
          .entry-btn:focus-visible { outline: 2px solid var(--theme); outline-offset: -2px; border-radius: var(--radius-sm); }
          .entry-title { font-size: 1rem; font-weight: 600; flex: 1; margin-right: 12px; line-height: 1.4; }
          .entry-date { font-size: 12px; color: var(--muted); white-space: nowrap; }

          .entry-arrow {
            width: 26px; height: 26px; display: flex; align-items: center;
            justify-content: center; border-radius: 50%; flex-shrink: 0;
            background: color-mix(in srgb, var(--theme) 8%, transparent);
            color: var(--theme); transition: all .3s;
            margin-left: 12px;
          }
          .entry.open .entry-arrow { transform: rotate(180deg); background: var(--theme); color: #fff; }

          .entry-content {
            max-height: 0; overflow: hidden;
            transition: max-height .4s cubic-bezier(0, 1, 0, 1), padding .4s;
          }
          .entry.open .entry-content {
            max-height: 600px;
            transition: max-height .5s cubic-bezier(0.4, 0, 0.2, 1), padding .4s;
            overflow-y: auto;
          }
          .entry-body {
            padding: 0 24px 20px;
            font-size: 15px; color: var(--text);
            border-top: 1px solid var(--card-border);
          }
          .entry-body img { max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0; }
          .entry-body a { color: var(--theme); text-decoration: underline; word-break: break-all; }
          .entry-footer { padding: 12px 24px 20px; display: flex; gap: 10px; }
          .entry-footer a {
            padding: 7px 18px; border-radius: 20px; border: 1px solid var(--card-border);
            font-size: 13px; color: var(--muted); text-decoration: none; transition: all .2s;
          }
          .entry-footer a:hover { color: #fff; background: var(--theme); border-color: var(--theme); }

          footer { text-align: center; padding: 40px 20px; color: var(--muted); font-size: 13px; }
          footer a { color: var(--theme); text-decoration: none; }

          @media (max-width: 640px) {
            .nav-glass { padding: 0 12px; }
            .nav-inner { height: 50px; }
            .nav-logo { font-size: 1rem; }
            .hero { padding: 28px 20px; border-radius: var(--radius-sm); }
            .hero h1 { font-size: 1.25rem; }
            .entry-btn { padding: 14px 18px; }
            .entry-body { padding: 0 18px 16px; }
            .entry-footer { padding: 10px 18px 16px; }
          }
        </style>
      </head>
      <body>
        <!-- 毛玻璃导航 -->
        <nav class="nav-glass">
          <div class="nav-inner">
            <a href="{$link}" class="nav-logo"><xsl:value-of select="$title"/></a>
            <div class="nav-links">
              <a href="{$link}" class="nav-link">返回博客</a>
            </div>
          </div>
        </nav>

        <main>
          <!-- 头部 -->
          <div class="hero">
            <h1><xsl:value-of select="$title"/> · RSS 订阅</h1>
            <p><xsl:value-of select="$subtitle" disable-output-escaping="yes"/></p>
            <div class="hero-meta" id="subscribe-links">
              <a data-href="feed:"><xsl:text>📡 本地阅读器</xsl:text></a>
              <a data-href="https://feedly.com/i/subscription/feed/"><xsl:text>Feedly</xsl:text></a>
              <a data-href="https://www.inoreader.com/feed/"><xsl:text>Inoreader</xsl:text></a>
            </div>
          </div>

          <!-- 文章列表 -->
          <div class="entries">
            <xsl:for-each select="/atom:feed/atom:entry">
              <div class="entry">
                <button class="entry-btn" onclick="this.parentElement.classList.toggle('open')">
                  <div>
                    <div class="entry-title"><xsl:value-of select="atom:title" disable-output-escaping="yes"/></div>
                    <xsl:if test="atom:summary">
                      <div style="font-size:13px;color:var(--muted);margin-top:4px;">
                        <xsl:value-of select="string-length(atom:summary) &gt; 0" />
                      </div>
                    </xsl:if>
                  </div>
                  <div style="display:flex;align-items:center;gap:8px;">
                    <span class="entry-date"><xsl:value-of select="substring(atom:published, 1, 10)"/></span>
                    <span class="entry-arrow">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M6 9l6 6 6-6"/></svg>
                    </span>
                  </div>
                </button>
                <div class="entry-content">
                  <div class="entry-body">
                    <xsl:choose>
                      <xsl:when test="atom:content">
                        <xsl:value-of select="atom:content" disable-output-escaping="yes"/>
                      </xsl:when>
                      <xsl:otherwise>
                        <xsl:value-of select="atom:summary" disable-output-escaping="yes"/>
                      </xsl:otherwise>
                    </xsl:choose>
                  </div>
                  <div class="entry-footer">
                    <a href="{atom:link[@rel='alternate']/@href}" target="_blank">阅读原文 →</a>
                  </div>
                </div>
              </div>
            </xsl:for-each>
          </div>
        </main>

        <footer>
          Generated by <a href="{$link}" target="_blank"><xsl:value-of select="$title"/></a> · Powered by Hexo &amp; Stellar
        </footer>

        <script>
          document.querySelectorAll('#subscribe-links a').forEach(function(a) {
            var base = a.getAttribute('data-href');
            a.href = base + encodeURIComponent(location.href);
          });
        </script>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
