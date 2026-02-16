/**
 * ZYDark - Controllable Dark Mode for Stellar Theme
 * Source: https://blog.thatcoder.cn/Stellar可控夜间模式/
 */

(function() {
    'use strict';

    /**
     * Monitor system theme changes
     */
    var OSTheme = window.matchMedia('(prefers-color-scheme: dark)');

    OSTheme.addListener(function(e) {
        if (window.localStorage.getItem('ZYI_Theme_Mode') === 'Moss') {
            ThemeChange('Moss');
        }
    });

    /**
     * Change blog theme
     * @param {string} theme - 'light' for light mode, 'dark' for dark mode, 'Moss' for auto
     */
    function ThemeChange(theme) {
        var htmlElement = document.querySelector("html");
        var footerLinks = document.querySelectorAll("#start > aside > footer > div > a");

        // Find theme toggle buttons by their icon IDs
        var moonBtn = null;
        var sunBtn = null;
        var aiBtn = null;

        // Find buttons with specific icon IDs
        for (var i = 0; i < footerLinks.length; i++) {
            var img = footerLinks[i].querySelector("img[id^='Theme']");
            if (img) {
                if (img.id === 'ThemeM') moonBtn = footerLinks[i];
                if (img.id === 'ThemeL') sunBtn = footerLinks[i];
                if (img.id === 'ThemeAI') aiBtn = footerLinks[i];
            }
        }

        // Apply theme
        if (theme === 'light' || (theme === 'Moss' && !OSTheme.matches)) {
            htmlElement.id = "ZYLight";
            if (moonBtn) moonBtn.style.filter = 'grayscale(100%)';
            if (sunBtn) sunBtn.style.filter = 'grayscale(0%)';
        } else {
            htmlElement.id = "ZYDark";
            if (moonBtn) moonBtn.style.filter = 'grayscale(0%)';
            if (sunBtn) sunBtn.style.filter = 'grayscale(100%)';
        }

        // Handle AI button (auto mode)
        if (aiBtn) {
            if (theme === 'Moss') {
                aiBtn.style.filter = 'grayscale(0%)';
            } else {
                aiBtn.style.filter = 'grayscale(100%)';
            }
        }

        // Save preference
        window.localStorage.setItem('ZYI_Theme_Mode', theme);
        console.log('Theme changed to:', theme);
    }

    /**
     * Initialize blog theme on page load
     */
    function initTheme() {
        var savedTheme = window.localStorage.getItem('ZYI_Theme_Mode');
        switch (savedTheme) {
            case 'light':
                ThemeChange('light');
                break;
            case 'dark':
                ThemeChange('dark');
                break;
            default:
                ThemeChange('Moss');
        }
    }

    /**
     * Setup theme toggle button click handlers
     */
    function setupThemeButtons() {
        var footerLinks = document.querySelectorAll("#start > aside > footer > div > a");

        for (var i = 0; i < footerLinks.length; i++) {
            var img = footerLinks[i].querySelector("img[id^='Theme']");
            if (img) {
                // Use closure to capture button type
                (function(button, type) {
                    button.addEventListener('click', function(e) {
                        e.preventDefault();
                        ThemeChange(type);
                    });
                })(footerLinks[i], img.id.replace('Theme', ''));
            }
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            initTheme();
            setupThemeButtons();
        });
    } else {
        initTheme();
        setupThemeButtons();
    }

    // Export for global access
    window.ThemeChange = ThemeChange;

})();
