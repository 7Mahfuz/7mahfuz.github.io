/**
 * Theme Controller - 3-Way Theme Switcher (Light / Dark / Cyberpunk)
 * Al-Amin Mahfuzur Rahman | Senior Software Engineer Portfolio & Arcade
 */

(function () {
  'use strict';

  const THEMES = ['light', 'dark', 'cyber'];

  const THEME_CONFIG = {
    light: {
      icon: 'fa-sun',
      color: '#f59e0b',
      label: 'Light',
      metaColor: '#f8fafc'
    },
    dark: {
      icon: 'fa-moon',
      color: '#60a5fa',
      label: 'Dark',
      metaColor: '#090d16'
    },
    cyber: {
      icon: 'fa-bolt',
      color: '#00f5ff',
      label: 'Cyber',
      metaColor: '#050811'
    }
  };

  class ThemeManager {
    constructor() {
      this.currentTheme = this.getStoredTheme();
      this.initDOM();
      this.applyTheme(this.currentTheme, false);
      this.bindEvents();
    }

    getStoredTheme() {
      try {
        const stored = localStorage.getItem('portfolio_theme');
        if (stored && THEMES.includes(stored)) {
          return stored;
        }
      } catch (e) {}

      // Fallback: check attribute or system preference
      const attr = document.documentElement.getAttribute('data-theme');
      if (attr && THEMES.includes(attr)) return attr;

      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    initDOM() {
      this.wrap = document.querySelector('.theme-switcher-wrap');
      this.toggleBtn = document.getElementById('theme-toggle-btn');
      this.iconEl = document.getElementById('theme-icon');
      this.labelEl = document.getElementById('theme-label');
      this.menuEl = document.getElementById('theme-menu');
      this.optBtns = document.querySelectorAll('.theme-opt-btn');
      this.metaThemeColor = document.querySelector('meta[name="theme-color"]');
    }

    applyTheme(theme, save = true) {
      if (!THEMES.includes(theme)) theme = 'light';
      this.currentTheme = theme;

      // 1. Update HTML data-attribute
      document.documentElement.setAttribute('data-theme', theme);

      // 2. Update Meta theme-color
      if (this.metaThemeColor && THEME_CONFIG[theme]) {
        this.metaThemeColor.setAttribute('content', THEME_CONFIG[theme].metaColor);
      }

      // 3. Update Widget UI
      if (this.iconEl && THEME_CONFIG[theme]) {
        this.iconEl.className = `fas ${THEME_CONFIG[theme].icon}`;
        this.iconEl.style.color = THEME_CONFIG[theme].color;
      }

      if (this.labelEl && THEME_CONFIG[theme]) {
        this.labelEl.textContent = THEME_CONFIG[theme].label;
      }

      if (this.toggleBtn && THEME_CONFIG[theme]) {
        this.toggleBtn.title = `Current Theme: ${THEME_CONFIG[theme].label} (Click to cycle)`;
      }

      // 4. Update Dropdown Checkmarks
      if (this.optBtns) {
        this.optBtns.forEach((btn) => {
          if (btn.getAttribute('data-theme') === theme) {
            btn.classList.add('active');
          } else {
            btn.classList.remove('active');
          }
        });
      }

      // 5. Persist to localStorage
      if (save) {
        try {
          localStorage.setItem('portfolio_theme', theme);
        } catch (e) {}
      }

      // 6. Dispatch Global Event for 3D Scenes
      window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
    }

    cycleTheme() {
      const currentIndex = THEMES.indexOf(this.currentTheme);
      const nextIndex = (currentIndex + 1) % THEMES.length;
      this.applyTheme(THEMES[nextIndex], true);
    }

    bindEvents() {
      if (this.toggleBtn) {
        this.toggleBtn.addEventListener('click', (e) => {
          // If clicked specifically on the arrow or dropdown trigger, toggle dropdown
          if (e.target.closest('.theme-arrow')) {
            e.stopPropagation();
            if (this.wrap) this.wrap.classList.toggle('open');
          } else {
            // Direct cycle click
            this.cycleTheme();
          }
        });
      }

      // Dropdown Options Click
      if (this.optBtns) {
        this.optBtns.forEach((btn) => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const targetTheme = btn.getAttribute('data-theme');
            if (targetTheme) {
              this.applyTheme(targetTheme, true);
              if (this.wrap) this.wrap.classList.remove('open');
            }
          });
        });
      }

      // Close dropdown on outside click
      document.addEventListener('click', (e) => {
        if (this.wrap && !this.wrap.contains(e.target)) {
          this.wrap.classList.remove('open');
        }
      });

      // Close on Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.wrap) {
          this.wrap.classList.remove('open');
        }
      });
    }
  }

  // Self-initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.themeManager = new ThemeManager();
    });
  } else {
    window.themeManager = new ThemeManager();
  }
})();
