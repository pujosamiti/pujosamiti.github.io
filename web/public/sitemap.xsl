<?xml version="1.0" encoding="UTF-8"?>
<!--
  Makes /sitemap.xml readable in a browser — the samiti's palette, one row per
  page. Search engines read the XML itself and ignore this stylesheet.
-->
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
  exclude-result-prefixes="s image">
  <xsl:output method="html" encoding="UTF-8" indent="yes" doctype-system="about:legacy-compat"/>
  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <meta name="robots" content="noindex, follow"/>
        <title>Sitemap · Durga Puja Magarpatta City Pune</title>
        <style>
          :root { --tant: #E8E4DD; --kash: #FAF8F4; --jaba: #C40039; --ink: #2B1A10; --muted: #6B5340; --line: #DCD5CA; --sharat: #2A6493; }
          * { box-sizing: border-box; }
          body { margin: 0; background: var(--tant); color: var(--ink); font: 15px/1.5 -apple-system, "Segoe UI", "Hind Siliguri", sans-serif; }
          header { background: var(--jaba); color: #fff; padding: 22px 16px 18px; }
          header div, main { max-width: 960px; margin: 0 auto; }
          h1 { margin: 0; font: 700 24px/1.2 Georgia, "Noto Serif Bengali", serif; }
          header p { margin: 4px 0 0; opacity: .88; font-size: 13.5px; }
          main { padding: 18px 16px 48px; }
          .note { color: var(--muted); font-size: 13.5px; margin: 0 0 14px; }
          .wrap { overflow-x: auto; background: var(--kash); border: 1px solid var(--line); border-radius: 12px; }
          table { border-collapse: collapse; width: 100%; min-width: 640px; }
          th, td { text-align: left; padding: 9px 14px; border-top: 1px solid var(--line); vertical-align: top; font-size: 14px; }
          thead th { border-top: none; font-size: 11.5px; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); }
          td.n { font-variant-numeric: tabular-nums; white-space: nowrap; color: var(--muted); }
          a { color: var(--sharat); text-decoration: none; word-break: break-all; }
          a:hover { text-decoration: underline; }
          .img { color: var(--muted); font-size: 12.5px; }
        </style>
      </head>
      <body>
        <header>
          <div>
            <h1>পুজো সমিতি · Sitemap</h1>
            <p>Durga Puja, Magarpatta City, Pune — <xsl:value-of select="count(s:urlset/s:url)"/> public pages</p>
          </div>
        </header>
        <main>
          <p class="note">This is the list search engines read. Last modified is the date the page itself last changed.</p>
          <div class="wrap">
            <table>
              <thead>
                <tr><th>Page</th><th>Last modified</th><th>Frequency</th><th>Priority</th><th>Image</th></tr>
              </thead>
              <tbody>
                <xsl:for-each select="s:urlset/s:url">
                  <tr>
                    <td><a href="{s:loc}"><xsl:value-of select="s:loc"/></a></td>
                    <td class="n"><xsl:value-of select="s:lastmod"/></td>
                    <td class="n"><xsl:value-of select="s:changefreq"/></td>
                    <td class="n"><xsl:value-of select="s:priority"/></td>
                    <td class="img">
                      <xsl:choose>
                        <xsl:when test="image:image"><a href="{image:image/image:loc}">view</a></xsl:when>
                        <xsl:otherwise>—</xsl:otherwise>
                      </xsl:choose>
                    </td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>
          </div>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
