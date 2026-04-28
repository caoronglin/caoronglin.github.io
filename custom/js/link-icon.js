(function() {
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
})();