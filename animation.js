/* ==============================================
   PAWS & CARE — animation.js
   Lightweight Three.js hero animation + nav toggle
   ============================================== */

/* -----------------------------------------------
   1. MOBILE NAV TOGGLE
   Handles the hamburger menu open/close
----------------------------------------------- */
(function initNav() {
  const toggle = document.querySelector('.nav-toggle');
  const links  = document.querySelector('.nav-links');

  if (!toggle || !links) return;

  toggle.addEventListener('click', function () {
    const isOpen = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen);
    toggle.textContent = isOpen ? '✕' : '☰';
  });

  /* Close nav when any link is clicked */
  links.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', false);
      toggle.textContent = '☰';
    });
  });
})();


/* -----------------------------------------------
   2. THREE.JS HERO ANIMATION
   A soft, slowly-rotating 3D paw-inspired sphere
   only rendered on screens ≥ 768 px for performance
----------------------------------------------- */
(function initHeroAnimation() {

  /* --- 2a. Guard: skip on small / no-WebGL devices --- */
  const MOBILE_BREAKPOINT = 768;

  if (window.innerWidth < MOBILE_BREAKPOINT) return;

  /* Bail if Three.js didn't load */
  if (typeof THREE === 'undefined') {
    console.warn('animation.js: THREE is not defined — skipping hero animation.');
    return;
  }

  /* --- 2b. Container --- */
  const container = document.getElementById('hero-canvas');
  if (!container) return;

  /* --- 2c. Scene --- */
  const scene = new THREE.Scene();

  /* --- 2d. Camera --- */
  const camera = new THREE.PerspectiveCamera(
    50,                                           /* field of view */
    container.clientWidth / container.clientHeight, /* aspect ratio */
    0.1,                                          /* near clip */
    100                                           /* far clip */
  );
  camera.position.z = 5;

  /* --- 2e. Renderer --- */
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true      /* transparent background so hero gradient shows through */
  });

  /* Cap pixel ratio to 2 — prevents over-rendering on high-DPI screens */
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setClearColor(0x000000, 0);  /* fully transparent clear */

  container.appendChild(renderer.domElement);

  /* --- 2f. Geometry — smooth icosphere for an organic look --- */
  const geometry = new THREE.IcosahedronGeometry(1.5, 4); /* radius, subdivisions */

  /* --- 2g. Material — soft teal-green, slightly transparent --- */
  const material = new THREE.MeshPhongMaterial({
    color:       0x3db08f,   /* --clr-accent from design.css */
    emissive:    0x1a7f64,   /* subtle inner glow */
    emissiveIntensity: 0.15,
    shininess:   60,
    transparent: true,
    opacity:     0.82,
    wireframe:   false
  });

  const sphere = new THREE.Mesh(geometry, material);
  scene.add(sphere);

  /* --- 2h. Second, slightly larger wireframe shell for depth --- */
  const wireMat = new THREE.MeshBasicMaterial({
    color:     0x2e7bbf,   /* --clr-blue */
    wireframe: true,
    transparent: true,
    opacity:   0.08        /* very subtle — just adds texture */
  });
  const wireShell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.65, 2),
    wireMat
  );
  scene.add(wireShell);

  /* --- 2i. Lighting --- */

  /* Ambient: fills dark areas softly */
  const ambientLight = new THREE.AmbientLight(0xe6f5f1, 0.9);
  scene.add(ambientLight);

  /* Directional: creates highlights and depth */
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(4, 6, 5);
  scene.add(dirLight);

  /* Rim light from bottom-left for a subtle glow */
  const rimLight = new THREE.PointLight(0x2e7bbf, 0.5, 20);
  rimLight.position.set(-4, -3, 2);
  scene.add(rimLight);

  /* --- 2j. Resize handler --- */
  function onResize() {
    /* If window drops below breakpoint, pause rendering */
    if (window.innerWidth < MOBILE_BREAKPOINT) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
      return;
    }

    const w = container.clientWidth;
    const h = container.clientHeight;

    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);

    /* Resume if it was paused */
    if (!animFrameId) animate();
  }

  /* Debounced resize for performance */
  let resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(onResize, 150);
  });

  /* --- 2k. Animation loop --- */
  let animFrameId = null;
  let clock = new THREE.Clock();

  function animate() {
    animFrameId = requestAnimationFrame(animate);

    const elapsed = clock.getElapsedTime();

    /* Slow, gentle rotation on two axes */
    sphere.rotation.y = elapsed * 0.18;
    sphere.rotation.x = elapsed * 0.08;

    /* Wireframe shell rotates in the opposite direction for contrast */
    wireShell.rotation.y = -(elapsed * 0.12);
    wireShell.rotation.z =   elapsed * 0.06;

    /* Subtle breathing scale — very gentle pulse */
    const pulse = 1 + Math.sin(elapsed * 0.9) * 0.018;
    sphere.scale.setScalar(pulse);

    renderer.render(scene, camera);
  }

  /* Kick off the loop */
  animate();

  /* --- 2l. Pause animation when tab is not visible (saves battery) --- */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
      clock.stop();
    } else {
      clock.start();
      if (!animFrameId) animate();
    }
  });

})();