/**
 * animation.js — Paws & Care Veterinary Clinic
 * Premium Three.js hero animation: floating soft orbs with mouse parallax
 * Optimized for performance, graceful mobile fallback
 */

(function () {
  'use strict';

  /* ─── Config ────────────────────────────────────────────── */
  const CFG = {
    MOBILE_BREAKPOINT : 768,
    MAX_PIXEL_RATIO   : 1.5,
    ORB_COUNT         : 14,
    PARTICLE_COUNT    : 60,
    PARALLAX_STRENGTH : 0.045,
    FLOAT_AMPLITUDE   : 0.28,
    FLOAT_SPEED       : 0.38,
    ROTATION_SPEED    : 0.12,
    /* calming teal / blue / mint palette */
    COLORS: [
      0x1a7f64, // brand teal
      0x2a9d7f, // mid teal
      0x3db08f, // accent
      0x2e7bbf, // blue
      0x4a9fd4, // sky blue
      0x8fedd4, // mint highlight
      0x135e4a, // deep teal
      0x1e5f8a, // deep blue
    ],
  };

  /* ─── State ─────────────────────────────────────────────── */
  let renderer, scene, camera, animId;
  let orbs = [], particles, particleGeo;
  let mouse = { x: 0, y: 0 };
  let target = { x: 0, y: 0 };
  let clock;
  let active = false;

  /* ─── Init ───────────────────────────────────────────────── */
  function init () {
    const wrap = document.getElementById('hero-canvas');
    if (!wrap || typeof THREE === 'undefined') return;

    /* Skip heavy animation on small screens */
    if (window.innerWidth < CFG.MOBILE_BREAKPOINT) {
      spawnMobileCanvas(wrap);
      return;
    }

    clock  = new THREE.Clock();
    scene  = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, wrap.clientWidth / wrap.clientHeight, 0.1, 120);
    camera.position.set(0, 0, 18);

    renderer = new THREE.WebGLRenderer({
      alpha           : true,
      antialias       : false,       // off for perf
      powerPreference : 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, CFG.MAX_PIXEL_RATIO));
    renderer.setSize(wrap.clientWidth, wrap.clientHeight);
    renderer.setClearColor(0x000000, 0);
    wrap.appendChild(renderer.domElement);

    buildLights();
    buildOrbs();
    buildParticles();

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('resize',    onResize);

    active = true;
    animate();
  }

  /* ─── Lights ─────────────────────────────────────────────── */
  function buildLights () {
    const ambient = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambient);

    const key = new THREE.PointLight(0x3db08f, 2.2, 55);
    key.position.set(6, 8, 12);
    scene.add(key);

    const fill = new THREE.PointLight(0x2e7bbf, 1.4, 50);
    fill.position.set(-10, -4, 8);
    scene.add(fill);

    const rim = new THREE.PointLight(0x8fedd4, 0.9, 40);
    rim.position.set(0, -12, 6);
    scene.add(rim);
  }

  /* ─── Orbs ───────────────────────────────────────────────── */
  function buildOrbs () {
    /* Icosphere-like: use IcosahedronGeometry with subdivision for smooth look */
    const geos = [
      new THREE.IcosahedronGeometry(1.0, 3),
      new THREE.IcosahedronGeometry(0.65, 3),
      new THREE.IcosahedronGeometry(0.42, 2),
    ];

    for (let i = 0; i < CFG.ORB_COUNT; i++) {
      const geoIdx = i % geos.length;
      const color  = CFG.COLORS[i % CFG.COLORS.length];
      const scale  = 0.55 + Math.random() * 1.05;
      const depth  = randomBetween(-8, 4);

      /* Translucent, glass-like material */
      const mat = new THREE.MeshPhongMaterial({
        color       : color,
        emissive    : color,
        emissiveIntensity: 0.18,
        shininess   : 80,
        transparent : true,
        opacity     : randomBetween(0.22, 0.52),
        wireframe   : false,
      });

      const mesh = new THREE.Mesh(geos[geoIdx], mat);
      mesh.scale.setScalar(scale);

      /* Spread across the hero viewport */
      mesh.position.set(
        randomBetween(-14, 14),
        randomBetween(-7, 7),
        depth
      );

      /* Per-orb animation seeds */
      mesh.userData = {
        floatOffset : Math.random() * Math.PI * 2,
        floatSpeed  : CFG.FLOAT_SPEED * (0.7 + Math.random() * 0.6),
        floatAmp    : CFG.FLOAT_AMPLITUDE * (0.8 + Math.random() * 0.4),
        rotAxis     : new THREE.Vector3(
          randomBetween(-1, 1),
          randomBetween(-1, 1),
          randomBetween(-0.3, 0.3)
        ).normalize(),
        rotSpeed    : CFG.ROTATION_SPEED * (0.5 + Math.random()),
        baseY       : mesh.position.y,
        parallaxFactor: randomBetween(0.3, 1.0) * (depth < -3 ? 0.4 : 1),
        pulse       : Math.random() * Math.PI * 2,
        pulseSpeed  : 0.4 + Math.random() * 0.5,
      };

      scene.add(mesh);
      orbs.push(mesh);
    }
  }

  /* ─── Particles (dust field) ─────────────────────────────── */
  function buildParticles () {
    const positions = new Float32Array(CFG.PARTICLE_COUNT * 3);
    const sizes     = new Float32Array(CFG.PARTICLE_COUNT);
    const phases    = new Float32Array(CFG.PARTICLE_COUNT);

    for (let i = 0; i < CFG.PARTICLE_COUNT; i++) {
      positions[i * 3]     = randomBetween(-18, 18);
      positions[i * 3 + 1] = randomBetween(-10, 10);
      positions[i * 3 + 2] = randomBetween(-12, 2);
      sizes[i]  = randomBetween(0.04, 0.14);
      phases[i] = Math.random() * Math.PI * 2;
    }

    particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));
    particleGeo.userData.phases = phases;

    const mat = new THREE.PointsMaterial({
      color       : 0x8fedd4,
      size        : 0.09,
      sizeAttenuation: true,
      transparent : true,
      opacity     : 0.55,
    });

    particles = new THREE.Points(particleGeo, mat);
    scene.add(particles);
  }

  /* ─── Animation Loop ─────────────────────────────────────── */
  function animate () {
    if (!active) return;
    animId = requestAnimationFrame(animate);

    const t   = clock.getElapsedTime();
    const dt  = clock.getDelta ? 0.016 : 0.016; // fallback

    /* Smooth mouse follow */
    target.x += (mouse.x - target.x) * 0.04;
    target.y += (mouse.y - target.y) * 0.04;

    /* Update orbs */
    orbs.forEach(orb => {
      const u = orb.userData;
      const floatY = Math.sin(t * u.floatSpeed + u.floatOffset) * u.floatAmp;

      orb.position.y = u.baseY + floatY;

      /* Mouse parallax per orb */
      orb.position.x += (target.x * CFG.PARALLAX_STRENGTH * u.parallaxFactor * 6 - orb.position.x * 0.0015) * 0.06;

      /* Slow rotation */
      orb.rotateOnAxis(u.rotAxis, u.rotSpeed * 0.016);

      /* Subtle pulse in opacity */
      const pulse = 0.06 * Math.sin(t * u.pulseSpeed + u.pulse);
      orb.material.opacity = Math.max(0.12, Math.min(0.58, orb.material.opacity + pulse * 0.008));
    });

    /* Animate particles */
    if (particleGeo) {
      const pos    = particleGeo.attributes.position.array;
      const phases = particleGeo.userData.phases;
      for (let i = 0; i < CFG.PARTICLE_COUNT; i++) {
        pos[i * 3 + 1] += Math.sin(t * 0.4 + phases[i]) * 0.002;
        pos[i * 3]     += Math.cos(t * 0.25 + phases[i]) * 0.001;
      }
      particleGeo.attributes.position.needsUpdate = true;
    }

    /* Camera micro-drift with mouse */
    camera.position.x += (target.x * 1.2 - camera.position.x) * 0.025;
    camera.position.y += (-target.y * 0.7 - camera.position.y) * 0.025;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  /* ─── Mobile Fallback: CSS-only canvas ───────────────────── */
  function spawnMobileCanvas (wrap) {
    /* Lightweight: just a few CSS-animated divs via canvas 2D */
    const canvas = document.createElement('canvas');
    canvas.width  = wrap.clientWidth  || 390;
    canvas.height = wrap.clientHeight || 640;
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';
    wrap.appendChild(canvas);

    const ctx    = canvas.getContext('2d');
    const blobs  = Array.from({ length: 5 }, () => ({
      x     : Math.random() * canvas.width,
      y     : Math.random() * canvas.height,
      r     : 40 + Math.random() * 60,
      phase : Math.random() * Math.PI * 2,
      color : CFG.COLORS[Math.floor(Math.random() * CFG.COLORS.length)],
      speed : 0.25 + Math.random() * 0.3,
    }));

    let start = null;
    function drawMobile (ts) {
      if (!start) start = ts;
      const t = (ts - start) * 0.001;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      blobs.forEach(b => {
        const dy = Math.sin(t * b.speed + b.phase) * 18;
        const hex = '#' + b.color.toString(16).padStart(6, '0');
        const grad = ctx.createRadialGradient(b.x, b.y + dy, 0, b.x, b.y + dy, b.r);
        grad.addColorStop(0, hex + '55');
        grad.addColorStop(1, hex + '00');
        ctx.beginPath();
        ctx.arc(b.x, b.y + dy, b.r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      });
      requestAnimationFrame(drawMobile);
    }
    requestAnimationFrame(drawMobile);
  }

  /* ─── Events ─────────────────────────────────────────────── */
  function onMouseMove (e) {
    /* Normalize to -1 … +1 */
    mouse.x =  (e.clientX / window.innerWidth  - 0.5) * 2;
    mouse.y = -(e.clientY / window.innerHeight - 0.5) * 2;
  }

  function onResize () {
    const wrap = document.getElementById('hero-canvas');
    if (!wrap || !renderer) return;
    const w = wrap.clientWidth, h = wrap.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  /* ─── Utility ────────────────────────────────────────────── */
  function randomBetween (a, b) { return a + Math.random() * (b - a); }

  /* ─── Nav toggle + scroll header + scroll-reveal ─────────── */
  function setupUI () {
    /* Hamburger */
    const toggle = document.getElementById('nav-toggle');
    const links  = document.getElementById('nav-links');
    if (toggle && links) {
      toggle.addEventListener('click', () => {
        const open = links.classList.toggle('open');
        toggle.classList.toggle('active', open);
        toggle.setAttribute('aria-expanded', open);
      });
      /* Close on nav link click */
      links.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
          links.classList.remove('open');
          toggle.classList.remove('active');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });
    }

    /* Sticky header shadow */
    const header = document.getElementById('site-header');
    if (header) {
      window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 20);
      }, { passive: true });
    }

    /* Scroll-reveal: [data-animate="fade-up"] */
    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            obs.unobserve(e.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

      document.querySelectorAll('[data-animate]').forEach(el => obs.observe(el));
    } else {
      /* Fallback: make everything visible */
      document.querySelectorAll('[data-animate]').forEach(el => el.classList.add('is-visible'));
    }
  }

  /* ─── Boot ───────────────────────────────────────────────── */
  function boot () {
    setupUI();
    /* Wait for Three.js to load (it's deferred) */
    if (typeof THREE !== 'undefined') {
      init();
    } else {
      /* Poll for THREE — it's loaded with defer */
      let attempts = 0;
      const poll = setInterval(() => {
        attempts++;
        if (typeof THREE !== 'undefined') {
          clearInterval(poll);
          init();
        } else if (attempts > 40) {
          clearInterval(poll); // give up after ~2s
        }
      }, 50);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();