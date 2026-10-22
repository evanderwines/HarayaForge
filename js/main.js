/**
 * HarayaForge — Core Client Interactivity
 *
 * Modules:
 *   1. Mobile Navigation (Hamburger toggle, keyboard Escape close, ARIA states)
 *   2. Video Visibility Observer (IntersectionObserver to pause off-screen video)
 *   3. Continuous Loop Safety Net (Ensures seamless video loop playback across browsers)
 *   4. Sticky Header Glassmorphism & Active Link Scrollspy (Luminous frosted state & animated underline indicator)
 */
(function () {
  'use strict';

  /* ==========================================================================
     1. Mobile Navigation
     ========================================================================== */
  var navMenu = document.getElementById('nav');
  var burgerButton = document.getElementById('bg');

  if (navMenu && burgerButton) {
    burgerButton.onclick = function () {
      var isOpen = navMenu.classList.toggle('open');
      burgerButton.setAttribute('aria-expanded', String(isOpen));
    };

    // Close mobile nav when a link is clicked
    var navLinks = navMenu.querySelectorAll('a');
    for (var i = 0; i < navLinks.length; i++) {
      navLinks[i].addEventListener('click', function () {
        navMenu.classList.remove('open');
        burgerButton.setAttribute('aria-expanded', 'false');
      });
    }

    window.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        navMenu.classList.remove('open');
        burgerButton.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ==========================================================================
     2. Video Visibility & Loop Safety Net
     ========================================================================== */
  var videoElement = document.querySelector('video');

  if (videoElement) {
    // Keep playing only while visible on screen (conserves resources)
    new IntersectionObserver(
      function (entries) {
        if (entries[0].isIntersecting) {
          videoElement.play().catch(function () { });
        } else {
          videoElement.pause();
        }
      },
      { threshold: 0.1 }
    ).observe(videoElement);

    // Loop safety net: guarantee seamless loop even if native loop event stalls
    videoElement.addEventListener('ended', function () {
      videoElement.currentTime = 0;
      videoElement.play().catch(function () { });
    });
  }

  /* ==========================================================================
     3. Sticky Header Glassmorphism & Sliding Indicator Scrollspy
     ========================================================================== */
  var header = document.querySelector('header');
  var navMenu = document.getElementById('nav');
  var navIndicator = navMenu ? navMenu.querySelector('.nav-indicator') : null;
  var desktopNavLinks = navMenu ? navMenu.querySelectorAll('ul li:not(.m) a') : [];
  var homeLink = navMenu ? (navMenu.querySelector('a[href="#home"]') || navMenu.querySelector('a[href="#"]')) : null;
  var servicesLink = navMenu ? navMenu.querySelector('a[href="#services"]') : null;
  var servicesSection = document.getElementById('services');
  var homeSection = document.getElementById('home');

  // Calculates and smoothly positions the sliding underline indicator beneath a target link
  function updateIndicator(targetLink) {
    if (!navIndicator || !targetLink || window.innerWidth <= 900) return;
    var navRect = navMenu.getBoundingClientRect();
    var linkRect = targetLink.getBoundingClientRect();

    var left = linkRect.left - navRect.left;
    var width = linkRect.width;

    if (width > 0) {
      navIndicator.style.transform = 'translateX(' + Math.round(left) + 'px)';
      navIndicator.style.width = Math.round(width) + 'px';
      navIndicator.style.opacity = '1';
    }
  }

  // Updates the active state (.on) across desktop navigation items and repositions the sliding indicator
  function setActiveLink(activeLink) {
    if (!activeLink) return;
    for (var i = 0; i < desktopNavLinks.length; i++) {
      if (desktopNavLinks[i] === activeLink) {
        desktopNavLinks[i].classList.add('on');
      } else {
        desktopNavLinks[i].classList.remove('on');
      }
    }
    updateIndicator(activeLink);
  }

  // Sticky cover-reveal depth effect (JS RAF fallback when CSS scroll-driven animations are unavailable)
  var heroContainer = homeSection;
  var heroContent = heroContainer ? heroContainer.querySelector('.hero-pinned-content') : null;
  var heroOverlay = heroContainer ? heroContainer.querySelector('.hero-depth-overlay') : null;
  var isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cssScrollDrivenSupported = false;

  if (window.CSS && typeof window.CSS.supports === 'function') {
    cssScrollDrivenSupported = window.CSS.supports('animation-timeline: scroll()');
  }

  var MIN_SCALE = 0.96;
  var MAX_DIM = 0.35;

  function updateHeroDepth(scrollY) {
    if (isReducedMotion || cssScrollDrivenSupported || !heroContent || !heroOverlay) return;
    var viewportHeight = window.innerHeight || 1;
    var progress = Math.min(Math.max(scrollY / viewportHeight, 0), 1);

    var currentScale = 1 - progress * (1 - MIN_SCALE);
    var currentOpacity = progress * MAX_DIM;

    heroContent.style.setProperty('--hero-scale', currentScale.toFixed(4));
    heroOverlay.style.setProperty('--hero-overlay', currentOpacity.toFixed(4));
  }

  // Scroll handler: controls header frosted glass effect, section scrollspy, and sticky hero depth
  function onScroll() {
    var scrollY = window.pageYOffset || document.documentElement.scrollTop;

    // Toggle header frosted glassmorphism state with subtle threshold
    if (header) {
      if (scrollY > 30) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }

    // Scrollspy for active nav link across Home, Services, Process, About, Contact
    var triggerPoint = Math.min(window.innerHeight * 0.45, 320);
    var activeTargetLink = homeLink;

    var sectionsToCheck = [
      { link: navMenu ? navMenu.querySelector('a[href="#contact"]') : null, el: document.getElementById('contact') },
      { link: navMenu ? navMenu.querySelector('a[href="#about"]') : null, el: document.getElementById('about') },
      { link: navMenu ? navMenu.querySelector('a[href="#process"]') : null, el: document.getElementById('process') },
      { link: servicesLink, el: servicesSection }
    ];

    for (var s = 0; s < sectionsToCheck.length; s++) {
      var item = sectionsToCheck[s];
      if (item.el && item.link) {
        var rect = item.el.getBoundingClientRect();
        if (rect.top <= triggerPoint && rect.bottom >= 100) {
          activeTargetLink = item.link;
          break;
        }
      }
    }

    if (activeTargetLink && !activeTargetLink.classList.contains('on')) {
      setActiveLink(activeTargetLink);
    }

    // Depth scale and dark overlay on sticky hero
    updateHeroDepth(scrollY);
  }

  // Optional: reveal Services heading with subtle fade-up once about 60% in view
  var servicesHeader = document.querySelector('.services-header');
  if (servicesHeader) {
    if ('IntersectionObserver' in window && !isReducedMotion) {
      var headerObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            headerObserver.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.25,
        rootMargin: '0px 0px -10% 0px'
      });
      headerObserver.observe(servicesHeader);
    } else {
      servicesHeader.classList.add('in-view');
    }
  }

  // Interactive Hover: Sliding indicator glides to hovered item, returns to active section on mouse leave
  for (var i = 0; i < desktopNavLinks.length; i++) {
    (function (link) {
      link.addEventListener('mouseenter', function () {
        if (window.innerWidth > 900) {
          updateIndicator(link);
        }
      });
    })(desktopNavLinks[i]);
  }

  if (navMenu) {
    navMenu.addEventListener('mouseleave', function () {
      if (window.innerWidth > 900) {
        var currentActive = navMenu.querySelector('a.on');
        if (currentActive) {
          updateIndicator(currentActive);
        }
      }
    });
  }

  // Smooth click scroll handling with header offset
  for (var j = 0; j < desktopNavLinks.length; j++) {
    (function (link) {
      link.addEventListener('click', function (e) {
        var href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          var targetEl = (href === '#' || href === '#home') ? (homeSection || document.body) : document.querySelector(href);
          if (targetEl) {
            e.preventDefault();
            setActiveLink(link);
            targetEl.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    })(desktopNavLinks[j]);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () {
    var activeLink = navMenu ? navMenu.querySelector('a.on') : null;
    if (activeLink) {
      updateIndicator(activeLink);
    }
  });

  // Ensure exact width and alignment after web fonts and assets finish loading
  window.addEventListener('load', function () {
    var activeLink = navMenu ? navMenu.querySelector('a.on') : null;
    if (activeLink) {
      updateIndicator(activeLink);
    }
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      var activeLink = navMenu ? navMenu.querySelector('a.on') : null;
      if (activeLink) {
        updateIndicator(activeLink);
      }
    });
  }

  // Initial positioning
  onScroll();
  setTimeout(function () {
    var activeLink = navMenu ? navMenu.querySelector('a.on') : null;
    if (activeLink) {
      updateIndicator(activeLink);
    }
  }, 100);

  /* ==========================================================================
     4. Dynamic Cursor-Triggered Pixelated Particle Trail Animation
     (Exclusively appears on cursor movement; idle background is pure clean white)
     ========================================================================== */
  function setupParticleCanvas(canvasId, containerId) {
    var dotCanvas = document.getElementById(canvasId);
    var container = document.getElementById(containerId);
    if (!dotCanvas || !container) return;

    var ctx = dotCanvas.getContext('2d');
    if (!ctx) return;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var width = 0;
    var height = 0;
    var particles = [];
    var isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var animRunning = false;
    var lastPointer = { x: null, y: null, time: 0 };

    function resizeCanvas() {
      var rect = container.getBoundingClientRect();
      width = Math.round(rect.width);
      height = Math.round(rect.height);

      dotCanvas.width = Math.round(width * dpr);
      dotCanvas.height = Math.round(height * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }

    // Spawns an organic cluster of pixelated circular dots and rings along the cursor trajectory
    function spawnParticles(currentX, currentY, prevX, prevY) {
      if (isReducedMotion) return;

      var dx = currentX - prevX;
      var dy = currentY - prevY;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1.5) return;

      var angle = Math.atan2(dy, dx);
      var perpAngle = angle + Math.PI / 2;
      var speed = Math.min(dist, 60);

      // Density scaled to movement speed (smooth brush coverage)
      var count = Math.min(Math.floor(dist * 0.45) + 3, 14);

      for (var i = 0; i < count; i++) {
        var t = Math.random();
        var baseX = prevX + dx * t;
        var baseY = prevY + dy * t;

        // Perpendicular wave-like dispersion (inspired by reference image's organic envelope)
        var spreadWidth = 14 + speed * 0.75;
        var spreadOffset = (Math.pow(Math.random(), 1.4) * 2 - 1) * spreadWidth;
        var normDist = Math.abs(spreadOffset) / Math.max(1, spreadWidth);

        // Discrete pixelated grid quantization for authentic halftone/pixel aesthetic
        var rawX = baseX + Math.cos(perpAngle) * spreadOffset + (Math.random() - 0.5) * 6;
        var rawY = baseY + Math.sin(perpAngle) * spreadOffset + (Math.random() - 0.5) * 6;
        var gridSnap = 4; // subtle pixel snap
        var px = Math.round(rawX / gridSnap) * gridSnap;
        var py = Math.round(rawY / gridSnap) * gridSnap;

        // Center core particles are vibrant HarayaForge orange; outer particles are subtle gray
        var isCore = normDist < 0.45;
        var isMid = normDist >= 0.45 && normDist < 0.72;

        // Reference image features distinctive hollow rings (~12% chance)
        var isRing = Math.random() < 0.12;

        var maxRadius;
        var r, g, b, alpha;

        if (isCore) {
          // HarayaForge Signature Flame: #FF7A12 to #F72703
          maxRadius = isRing ? (3.5 + Math.random() * 1.5) : (2.4 + Math.random() * 1.4);
          var isRed = Math.random() < 0.5;
          r = isRed ? 247 : 255;
          g = isRed ? 39 : 122;
          b = isRed ? 3 : 18;
          alpha = 0.88 + Math.random() * 0.12;
        } else if (isMid) {
          // Warm amber transition: #FFA033
          maxRadius = isRing ? (3.0 + Math.random() * 1.2) : (1.8 + Math.random() * 1.2);
          r = 255;
          g = Math.round(120 + Math.random() * 45);
          b = 40;
          alpha = 0.70 + Math.random() * 0.2;
        } else {
          // Elegant tech gray: rgba(148, 163, 184)
          maxRadius = isRing ? (2.8 + Math.random() * 1.0) : (1.2 + Math.random() * 1.0);
          r = 148;
          g = 163;
          b = 184;
          alpha = 0.45 + Math.random() * 0.3;
        }

        // Subtle velocity drift
        var driftSpeed = 0.25 + Math.random() * 0.6;
        var driftAngle = perpAngle + (Math.random() - 0.5) * 1.2;

        particles.push({
          x: px,
          y: py,
          vx: Math.cos(driftAngle) * driftSpeed * (spreadOffset > 0 ? 1 : -1) + dx * 0.04,
          vy: Math.sin(driftAngle) * driftSpeed * (spreadOffset > 0 ? 1 : -1) + dy * 0.04,
          maxRadius: maxRadius,
          radius: 0.1,
          isRing: isRing,
          r: r,
          g: g,
          b: b,
          targetAlpha: alpha,
          life: 1.0,
          decay: 0.018 + Math.random() * 0.018, // ~0.9s to 1.3s fading lifespan
          glow: isCore && !isRing
        });
      }

      // Cap maximum particle count for high-performance 60fps
      if (particles.length > 280) {
        particles.splice(0, particles.length - 280);
      }

      if (!animRunning) {
        animRunning = true;
        requestAnimationFrame(render);
      }
    }

    function handlePointerMove(clientX, clientY) {
      var rect = dotCanvas.getBoundingClientRect();
      if (
        clientY >= rect.top &&
        clientY <= rect.bottom &&
        clientX >= rect.left &&
        clientX <= rect.right
      ) {
        var posX = clientX - rect.left;
        var posY = clientY - rect.top;

        if (lastPointer.x !== null && lastPointer.y !== null) {
          spawnParticles(posX, posY, lastPointer.x, lastPointer.y);
        }

        lastPointer.x = posX;
        lastPointer.y = posY;
        lastPointer.time = performance.now();
      } else {
        lastPointer.x = null;
        lastPointer.y = null;
      }
    }

    window.addEventListener('pointermove', function (e) {
      handlePointerMove(e.clientX, e.clientY);
    }, { passive: true });

    window.addEventListener('pointerdown', function (e) {
      handlePointerMove(e.clientX, e.clientY);
    }, { passive: true });

    window.addEventListener('pointerup', function () {
      lastPointer.x = null;
      lastPointer.y = null;
    }, { passive: true });

    window.addEventListener('pointercancel', function () {
      lastPointer.x = null;
      lastPointer.y = null;
    }, { passive: true });

    container.addEventListener('pointerleave', function () {
      lastPointer.x = null;
      lastPointer.y = null;
    });

    function render() {
      if (particles.length === 0) {
        ctx.clearRect(0, 0, width, height);
        animRunning = false;
        return; // Stop animation loop when idle (0% CPU usage)
      }

      ctx.clearRect(0, 0, width, height);

      for (var i = particles.length - 1; i >= 0; i--) {
        var p = particles[i];

        // Particle physics update
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.life -= p.decay;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        // Dynamic scale: fast bloom at birth, gradual shrink at death
        var scaleProgress = 1 - p.life;
        var currentRadius;
        if (scaleProgress < 0.2) {
          currentRadius = p.maxRadius * (scaleProgress / 0.2);
        } else {
          currentRadius = p.maxRadius * Math.pow(p.life, 0.65);
        }

        var currentAlpha = Math.min(1, p.life * 1.5) * p.targetAlpha;
        var color = 'rgba(' + p.r + ',' + p.g + ',' + p.b + ',' + currentAlpha.toFixed(2) + ')';

        ctx.save();
        if (p.glow && currentAlpha > 0.4) {
          ctx.shadowColor = 'rgba(247, 39, 3, ' + (currentAlpha * 0.4).toFixed(2) + ')';
          ctx.shadowBlur = 8;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, currentRadius), 0, Math.PI * 2);

        if (p.isRing) {
          ctx.lineWidth = 1.3;
          ctx.strokeStyle = color;
          ctx.stroke();
        } else {
          ctx.fillStyle = color;
          ctx.fill();
        }
        ctx.restore();
      }

      requestAnimationFrame(render);
    }

    var resizeTimeout = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resizeCanvas, 150);
    }, { passive: true });

    window.addEventListener('load', resizeCanvas);

    if (typeof ResizeObserver !== 'undefined' && container) {
      try {
        var ro = new ResizeObserver(function () {
          resizeCanvas();
        });
        ro.observe(container);
      } catch (err) {
        // Fallback already handled by window resize & load
      }
    }

    resizeCanvas();
  }

  // Initialize for both Hero section and Services section
  setupParticleCanvas('dot-wave-canvas', 'home');
  setupParticleCanvas('services-dot-canvas', 'services');
})();

