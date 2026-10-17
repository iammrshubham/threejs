/* ============================================
   ALEX RIVERA — PREMIUM PORTFOLIO
   app.js — Interactions, Three.js, Animations
   ============================================ */

(function () {
  'use strict';

  // ---------- State ----------
  const state = {
    isLoaded: false,
    isMobile: window.innerWidth < 768,
    isReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    scrollY: 0,
    scrollVelocity: 0,
    lastScrollY: 0,
    mouseX: 0,
    mouseY: 0,
    targetMouseX: 0,
    targetMouseY: 0,
    cursorX: 0,
    cursorY: 0,
    cursorRingX: 0,
    cursorRingY: 0,
  };
// ---------- Sound System ----------
const Sound = {
  ctx: null,
  enabled: localStorage.getItem('soundEnabled') !== 'false',
  unlocked: false,
  lastPlayed: {},
  volume: 0.35,

  init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      this.enabled = false;
    }
  },

  unlock() {
    if (this.unlocked || !this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.unlocked = true;
  },

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('soundEnabled', this.enabled);
    const btn = document.getElementById('sound-toggle');
    if (btn) {
      btn.classList.toggle('is-muted', !this.enabled);
      btn.setAttribute('aria-label', this.enabled ? 'Mute sound' : 'Unmute sound');
    }
    if (this.enabled) this.play('click');
  },

  play(type, cooldown = 80) {
    if (!this.enabled || !this.unlocked || !this.ctx) return;

    const now = performance.now();
    if (this.lastPlayed[type] && now - this.lastPlayed[type] < cooldown) return;
    this.lastPlayed[type] = now;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      const t = this.ctx.currentTime;

      switch (type) {
        case 'hover':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1200, t);
          osc.frequency.exponentialRampToValueAtTime(1800, t + 0.04);
          gain.gain.setValueAtTime(this.volume * 0.12, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
          osc.start(t);
          osc.stop(t + 0.07);
          break;

        case 'click':
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(600, t);
          osc.frequency.exponentialRampToValueAtTime(200, t + 0.08);
          gain.gain.setValueAtTime(this.volume * 0.25, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
          osc.start(t);
          osc.stop(t + 0.11);
          break;

        case 'whoosh':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(300, t);
          osc.frequency.exponentialRampToValueAtTime(80, t + 0.25);
          gain.gain.setValueAtTime(this.volume * 0.18, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
          osc.start(t);
          osc.stop(t + 0.3);
          break;

        case 'transition':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(400, t);
          osc.frequency.exponentialRampToValueAtTime(900, t + 0.15);
          gain.gain.setValueAtTime(this.volume * 0.15, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
          osc.start(t);
          osc.stop(t + 0.22);
          break;

        case 'tick':
          osc.type = 'square';
          osc.frequency.setValueAtTime(1400, t);
          gain.gain.setValueAtTime(this.volume * 0.08, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
          osc.start(t);
          osc.stop(t + 0.05);
          break;

        case 'reveal':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(500, t);
          osc.frequency.exponentialRampToValueAtTime(1200, t + 0.18);
          gain.gain.setValueAtTime(this.volume * 0.14, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
          osc.start(t);
          osc.stop(t + 0.24);
          break;

        default:
          osc.stop();
      }
    } catch (e) {
      // silent fail
    }
  }
};
  // ---------- DOM Refs ----------
  const dom = {
    loader: document.getElementById('loader'),
    loaderBar: document.getElementById('loader-bar'),
    loaderPercentage: document.getElementById('loader-percentage'),
    canvas: document.getElementById('webgl'),
    cursor: document.getElementById('cursor'),
    scrollProgress: document.getElementById('scroll-progress'),
    nav: document.getElementById('nav'),
    navMenuBtn: document.getElementById('nav-menu-btn'),
    navMobile: document.getElementById('nav-mobile'),
    navLinks: document.querySelectorAll('.nav-link'),
    backToTop: document.getElementById('back-to-top'),
    timelineProgress: document.getElementById('timeline-progress'),
  };

  // ---------- Three.js ----------
  let scene, camera, renderer, particles, geometryMesh;
  let particlePositions, particleVelocities;
  const PARTICLE_COUNT = state.isMobile ? 400 : 1200;

function initThree() {
  if (!dom.canvas || state.isReducedMotion) return;

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xffffff, 0.012);

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 30;

  renderer = new THREE.WebGLRenderer({
    canvas: dom.canvas,
    antialias: !state.isMobile,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0xffffff, 0);

  // Colorful Particles
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const velocities = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const sizes = new Float32Array(PARTICLE_COUNT);

  const colorPalette = [
    new THREE.Color(0xff6b6b), // red
    new THREE.Color(0x4ecdc4), // teal
    new THREE.Color(0x45b7d1), // blue
    new THREE.Color(0x96e6a1), // green
    new THREE.Color(0xfeca57), // yellow
    new THREE.Color(0xff9ff3), // pink
    new THREE.Color(0x54a0ff), // bright blue
    new THREE.Color(0x5f27cd), // purple
    new THREE.Color(0x01a3a4), // cyan
    new THREE.Color(0xff9f43), // orange
  ];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * 80;
    positions[i3 + 1] = (Math.random() - 0.5) * 80;
    positions[i3 + 2] = (Math.random() - 0.5) * 60;

    velocities[i3] = (Math.random() - 0.5) * 0.01;
    velocities[i3 + 1] = (Math.random() - 0.5) * 0.01;
    velocities[i3 + 2] = (Math.random() - 0.5) * 0.005;

    sizes[i] = Math.random() * 1.8 + 0.6;

    // Assign random color from palette
    const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    colors[i3] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;
  }

  particlePositions = positions;
  particleVelocities = velocities;

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.PointsMaterial({
    size: 0.18,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
  });

  particles = new THREE.Points(geometry, material);
  scene.add(particles);

  // Colorful Wireframe geometry
  const geoTypes = [
    new THREE.IcosahedronGeometry(8, 1),
    new THREE.OctahedronGeometry(6, 0),
    new THREE.TetrahedronGeometry(7, 0),
  ];
  const geoIndex = Math.floor(Math.random() * geoTypes.length);
  const wireGeo = geoTypes[geoIndex];
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0x5f27cd,
    wireframe: true,
    transparent: true,
    opacity: 0.25,
  });
  geometryMesh = new THREE.Mesh(wireGeo, wireMat);
  geometryMesh.position.set(12, -2, -10);
  scene.add(geometryMesh);

  // Secondary colorful wireframe
  const wireGeo2 = new THREE.IcosahedronGeometry(4, 0);
  const wireMat2 = new THREE.MeshBasicMaterial({
    color: 0xff6b6b,
    wireframe: true,
    transparent: true,
    opacity: 0.2,
  });
  const mesh2 = new THREE.Mesh(wireGeo2, wireMat2);
  mesh2.position.set(-15, 5, -20);
  scene.add(mesh2);
  geometryMesh.userData.secondary = mesh2;

  window.addEventListener('resize', onThreeResize);
  animateThree();
}

  function onThreeResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    state.isMobile = window.innerWidth < 768;
  }

  function animateThree() {
    if (!renderer || !scene || !camera) return;
    requestAnimationFrame(animateThree);

    const time = performance.now() * 0.0001;

    // Mouse parallax on camera
    state.mouseX += (state.targetMouseX - state.mouseX) * 0.05;
    state.mouseY += (state.targetMouseY - state.mouseY) * 0.05;

    camera.position.x = state.mouseX * 3;
    camera.position.y = state.mouseY * 2;
    camera.lookAt(0, 0, 0);

    // Scroll influence
    const scrollInfluence = state.scrollY * 0.002;
    camera.position.z = 30 - scrollInfluence * 0.5;

    // Particles
    if (particles && particlePositions) {
      const positions = particles.geometry.attributes.position.array;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        positions[i3] += particleVelocities[i3] + state.scrollVelocity * 0.001;
        positions[i3 + 1] += particleVelocities[i3 + 1] + Math.sin(time + i) * 0.002;
        positions[i3 + 2] += particleVelocities[i3 + 2];

        // Boundary wrap
        if (positions[i3] > 40) positions[i3] = -40;
        if (positions[i3] < -40) positions[i3] = 40;
        if (positions[i3 + 1] > 40) positions[i3 + 1] = -40;
        if (positions[i3 + 1] < -40) positions[i3 + 1] = 40;
      }
      particles.geometry.attributes.position.needsUpdate = true;
      particles.rotation.y = time * 0.3 + state.scrollY * 0.0001;
      particles.rotation.x = state.mouseY * 0.1;
    }

    // Geometry mesh
    if (geometryMesh) {
      geometryMesh.rotation.x = time * 0.5 + state.scrollY * 0.0003;
      geometryMesh.rotation.y = time * 0.3 + state.mouseX * 0.2;
      geometryMesh.position.y = -2 + Math.sin(time * 2) * 1.5;

      if (geometryMesh.userData.secondary) {
        const sec = geometryMesh.userData.secondary;
        sec.rotation.x = -time * 0.4;
        sec.rotation.z = time * 0.6;
        sec.position.y = 5 + Math.cos(time * 1.5) * 2;
      }
    }

    // Opacity based on scroll sections
    if (particles) {
      const progress = Math.min(state.scrollY / (document.body.scrollHeight - window.innerHeight), 1);
      particles.material.opacity = 0.6 - progress * 0.3;
    }

    renderer.render(scene, camera);
  }

  // ---------- Loader ----------
  function initLoader() {
    document.body.classList.add('is-loading');
    let progress = 0;
    const duration = 1800;
    const start = performance.now();

    function update(now) {
      const elapsed = now - start;
      progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const pct = Math.round(eased * 100);

      if (dom.loaderBar) dom.loaderBar.style.width = pct + '%';
      if (dom.loaderPercentage) dom.loaderPercentage.textContent = pct + '%';

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        finishLoader();
      }
    }

    requestAnimationFrame(update);
  }

  function finishLoader() {
    state.isLoaded = true;
    if (dom.loader) {
      dom.loader.classList.add('is-done');
    }
    document.body.classList.remove('is-loading');
    initTextAnimations();
    revealHero();
  }

  // ---------- Cursor ----------
  function initCursor() {
    if (!dom.cursor || state.isMobile || state.isReducedMotion) {
      if (dom.cursor) dom.cursor.style.display = 'none';
      return;
    }

    document.addEventListener('mousemove', (e) => {
      state.targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
      state.targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1;
      state.cursorX = e.clientX;
      state.cursorY = e.clientY;
    });

    document.addEventListener('mousedown', () => {
      dom.cursor.classList.add('is-clicking');
    });
    document.addEventListener('mouseup', () => {
      dom.cursor.classList.remove('is-clicking');
    });

    // Hover targets
    const hoverTargets = document.querySelectorAll(
      'a, button, [data-cursor="hover"], .skill-card, .project-card, .tech-item, .service-item'
    );
hoverTargets.forEach((el) => {
  el.addEventListener('mouseenter', () => {
    dom.cursor.classList.add('is-hovering');
    Sound.play('hover', 120);
  });
  el.addEventListener('mouseleave', () => {
    dom.cursor.classList.remove('is-hovering');
  });
});

    function updateCursor() {
      state.cursorRingX += (state.cursorX - state.cursorRingX) * 0.15;
      state.cursorRingY += (state.cursorY - state.cursorRingY) * 0.15;

      const dot = dom.cursor.querySelector('.cursor-dot');
      const ring = dom.cursor.querySelector('.cursor-ring');

      if (dot) {
        dot.style.left = state.cursorX + 'px';
        dot.style.top = state.cursorY + 'px';
      }
      if (ring) {
        ring.style.left = state.cursorRingX + 'px';
        ring.style.top = state.cursorRingY + 'px';
      }

      requestAnimationFrame(updateCursor);
    }
    updateCursor();
  }

  // ---------- Navigation ----------
  function initNavigation() {
    // Mobile menu
    if (dom.navMenuBtn && dom.navMobile) {
     dom.navMenuBtn.addEventListener('click', () => {
  const isOpen = dom.navMobile.classList.toggle('is-open');
  dom.navMenuBtn.classList.toggle('is-open', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
  Sound.play('click');
});

      dom.navMobile.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
          dom.navMobile.classList.remove('is-open');
          dom.navMenuBtn.classList.remove('is-open');
          document.body.style.overflow = '';
        });
      });
    }

    // Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (e) => {
    const href = anchor.getAttribute('href');
    if (href === '#') return;
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      Sound.play('click');
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: state.isReducedMotion ? 'auto' : 'smooth' });
    }
  });
});

    // Back to top
  if (dom.backToTop) {
  dom.backToTop.addEventListener('click', () => {
    Sound.play('whoosh');
    window.scrollTo({ top: 0, behavior: state.isReducedMotion ? 'auto' : 'smooth' });
  });
}

    // Active section highlighting
    const sections = document.querySelectorAll('section[id]');
    const observerOptions = {
      root: null,
      rootMargin: '-40% 0px -40% 0px',
      threshold: 0,
    };

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          dom.navLinks.forEach((link) => {
            link.classList.toggle('is-active', link.getAttribute('data-section') === id);
          });
        }
      });
    }, observerOptions);

    sections.forEach((section) => sectionObserver.observe(section));
  }

  // ---------- Scroll Handler ----------
  function initScroll() {
    let ticking = false;

    function onScroll() {
      state.scrollY = window.scrollY;
      state.scrollVelocity = state.scrollY - state.lastScrollY;
      state.lastScrollY = state.scrollY;

      if (!ticking) {
        requestAnimationFrame(() => {
          updateScrollUI();
          ticking = false;
        });
        ticking = true;
      }
    }

    function updateScrollUI() {
      // Progress bar
      const docHeight = document.body.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (state.scrollY / docHeight) * 100 : 0;
      if (dom.scrollProgress) {
        dom.scrollProgress.style.width = progress + '%';
      }

      // Nav scrolled state
      if (dom.nav) {
        dom.nav.classList.toggle('is-scrolled', state.scrollY > 50);
      }

      // Timeline progress
      if (dom.timelineProgress) {
        const timeline = document.querySelector('.timeline');
        if (timeline) {
          const rect = timeline.getBoundingClientRect();
          const timelineTop = state.scrollY + rect.top;
          const timelineHeight = timeline.offsetHeight;
          const viewMid = state.scrollY + window.innerHeight * 0.5;
          let pct = ((viewMid - timelineTop) / timelineHeight) * 100;
          pct = Math.max(0, Math.min(100, pct));
          dom.timelineProgress.style.height = pct + '%';
        }
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ---------- Text Animations ----------
  function splitText() {
    document.querySelectorAll('[data-split="chars"]').forEach((el) => {
      if (el.dataset.splitDone) return;
      const text = el.textContent.trim();
      el.innerHTML = '';
      el.setAttribute('aria-label', text);

      text.split('').forEach((char, i) => {
        const span = document.createElement('span');
        span.className = 'char';
        span.textContent = char === ' ' ? '\u00A0' : char;
        span.style.transitionDelay = `${i * 0.025}s`;
        el.appendChild(span);
      });
      el.dataset.splitDone = 'true';
    });

    document.querySelectorAll('[data-split="words"]').forEach((el) => {
      if (el.dataset.splitDone) return;
      const text = el.textContent.trim();
      el.innerHTML = '';
      el.setAttribute('aria-label', text);

      text.split(/\s+/).forEach((word, i) => {
        const wrapper = document.createElement('span');
        wrapper.style.display = 'inline-block';
        wrapper.style.overflow = 'hidden';
        wrapper.style.verticalAlign = 'top';
        wrapper.style.marginRight = '0.3em';

        const span = document.createElement('span');
        span.className = 'word';
        span.textContent = word;
        span.style.transitionDelay = `${i * 0.06}s`;
        wrapper.appendChild(span);
        el.appendChild(wrapper);
      });
      el.dataset.splitDone = 'true';
    });
  }

  function initTextAnimations() {
    if (state.isReducedMotion) {
      document.querySelectorAll('[data-split], [data-reveal]').forEach((el) => {
        el.classList.add('is-revealed');
        Sound.play('reveal', 300);
      });
      return;
    }

    splitText();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
if (entry.isIntersecting) {
  entry.target.classList.add('is-revealed');
  Sound.play('reveal', 300);
  // Stagger children if present
  const chars = entry.target.querySelectorAll('.char, .word');
  chars.forEach((c) => {
    c.style.transform = 'translateY(0)';
    c.style.opacity = '1';
  });
  observer.unobserve(entry.target);
}
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );

    document.querySelectorAll('[data-split], [data-reveal]').forEach((el) => {
      observer.observe(el);
    });
  }

  function revealHero() {
    if (state.isReducedMotion) return;

    const heroEls = document.querySelectorAll(
      '.hero-label, .hero-title-line, .hero-subtitle, .hero-cta, .hero-meta, .hero-social'
    );

    heroEls.forEach((el, i) => {
      setTimeout(() => {
        el.classList.add('is-revealed');
        const chars = el.querySelectorAll('.char, .word');
        chars.forEach((c) => {
          c.style.transform = 'translateY(0)';
          c.style.opacity = '1';
        });
        el.style.opacity = '1';
        el.style.transform = 'none';
      }, 200 + i * 120);
    });
  }

  // ---------- Number Counters ----------
  function initCounters() {
    const counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseInt(el.getAttribute('data-count'), 10);
            animateCount(el, target);
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach((c) => observer.observe(c));
  }

  function animateCount(el, target) {
    if (state.isReducedMotion) {
      el.textContent = target;
      return;
    }
    const duration = 1500;
    const start = performance.now();

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  // ---------- Project Card Tilt ----------
  function initProjectTilt() {
    if (state.isMobile || state.isReducedMotion) return;

    document.querySelectorAll('.project-card').forEach((card) => {
      const visual = card.querySelector('.project-image-wrap');
      if (!visual) return;

      card.addEventListener('mousemove', (e) => {
        const rect = visual.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        const rotateX = (y - 0.5) * -8;
        const rotateY = (x - 0.5) * 8;
        visual.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      });

      card.addEventListener('mouseleave', () => {
        visual.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
      });
    });
  }

  // ---------- Magnetic Buttons ----------
  function initMagnetic() {
    if (state.isMobile || state.isReducedMotion) return;

    document.querySelectorAll('.btn').forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate(0, 0)';
      });
    });
  }

  // ---------- Image Error Fallback ----------
  function initImageFallback() {
    document.querySelectorAll('img').forEach((img) => {
      img.addEventListener('error', function () {
        this.style.background = 'linear-gradient(135deg, #1a1a1a 0%, #222 100%)';
        this.style.minHeight = '200px';
        this.alt = this.alt || 'Image unavailable';
        this.src =
          'data:image/svg+xml,' +
          encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect fill="#1a1a1a" width="400" height="300"/><text fill="#444" font-family="sans-serif" font-size="14" x="50%" y="50%" text-anchor="middle" dy=".3em">Image</text></svg>'
          );
      });
    });
  }

  // ---------- Lucide Icons ----------
  function initIcons() {
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  // ---------- Resize Handler ----------
  function initResize() {
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        state.isMobile = window.innerWidth < 768;
      }, 150);
    });
  }
// ---------- Sound Unlock & Toggle ----------
function initSound() {
  Sound.init();

  // Unlock audio on first user interaction
  const unlockEvents = ['click', 'pointerdown', 'touchstart', 'keydown'];
  const unlock = () => {
    Sound.unlock();
    unlockEvents.forEach((evt) => document.removeEventListener(evt, unlock));
  };
  unlockEvents.forEach((evt) => document.addEventListener(evt, unlock, { once: true }));

  // Toggle button
  const toggleBtn = document.getElementById('sound-toggle');
  if (toggleBtn) {
    toggleBtn.classList.toggle('is-muted', !Sound.enabled);
    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      Sound.toggle();
    });
  }
}
  // ---------- Init ----------
  function init() {
    initLoader();
    initThree();
    initCursor();
    initNavigation();
    initScroll();
    initCounters();
    initProjectTilt();
    initMagnetic();
    initImageFallback();
    initIcons();
    initResize();
    initSound();
  }

  // DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();