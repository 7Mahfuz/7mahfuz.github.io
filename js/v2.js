/**
 * Portfolio v2 - Three.js 3D Wireframe Scene & Interactive UI Controller
 * Al-Amin Mahfuzur Rahman | Enterprise Software Engineer
 */

(function () {
  'use strict';

  /* --------------------------------------------------------------------------
     1. Three.js 3D Wireframe Data Sphere
     -------------------------------------------------------------------------- */
  function initThreeHero() {
    const canvas = document.getElementById('three-hero-canvas');
    const container = canvas ? canvas.parentElement : null;
    if (!canvas || !container || typeof THREE === 'undefined') {
      return;
    }

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.z = 7.2;

    // Renderer
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
    } catch (e) {
      console.warn('WebGL not supported or disabled', e);
      return;
    }

    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Outer 3D Wireframe Sphere (Data Lattice)
    const outerGeo = new THREE.IcosahedronGeometry(2.3, 2);
    const outerMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      wireframe: true,
      roughness: 0.25,
      metalness: 0.85,
      transparent: true,
      opacity: 0.65
    });
    const outerMesh = new THREE.Mesh(outerGeo, outerMat);
    scene.add(outerMesh);

    // Inner Concentric Lattice
    const innerGeo = new THREE.IcosahedronGeometry(1.6, 1);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      wireframe: true,
      transparent: true,
      opacity: 0.28
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    scene.add(innerMesh);

    // Core Data Node
    const coreGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.6
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    scene.add(coreMesh);

    // Floating Data Particles (Cloud)
    const particleCount = 140;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      const radius = 2.6 + Math.random() * 1.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      positions[i] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = radius * Math.cos(phi);
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0x1d4ed8,
      size: 0.055,
      transparent: true,
      opacity: 0.75
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x3b82f6, 1.6);
    keyLight.position.set(5, 6, 7);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0x60a5fa, 1.2, 15);
    rimLight.position.set(-4, -4, 3);
    scene.add(rimLight);

    // Mouse Interaction Tracking
    let targetX = 0;
    let targetY = 0;
    let windowHalfX = window.innerWidth / 2;
    let windowHalfY = window.innerHeight / 2;

    function onPointerMove(e) {
      const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
      targetX = (clientX - windowHalfX) * 0.0006;
      targetY = (clientY - windowHalfY) * 0.0006;
    }

    window.addEventListener('mousemove', onPointerMove, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });

    // Responsive Resizing
    function handleResize() {
      if (!container || !renderer) return;
      windowHalfX = window.innerWidth / 2;
      windowHalfY = window.innerHeight / 2;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);
    window.addEventListener('resize', handleResize);

    // Animation Loop with Visibility Optimization
    let isVisible = true;
    let animFrameId = null;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isVisible = entry.isIntersecting;
        if (isVisible && !animFrameId) {
          animate();
        }
      });
    }, { threshold: 0.05 });

    observer.observe(container);

    function animate() {
      if (!isVisible) {
        animFrameId = null;
        return;
      }

      // Smooth idle rotation
      outerMesh.rotation.y += 0.0035;
      outerMesh.rotation.x += 0.0015;

      innerMesh.rotation.y -= 0.004;
      innerMesh.rotation.z += 0.002;

      particles.rotation.y += 0.0018;

      // Mouse Parallax Easing
      outerMesh.rotation.y += (targetX - outerMesh.rotation.y * 0.2) * 0.04;
      outerMesh.rotation.x += (targetY - outerMesh.rotation.x * 0.2) * 0.04;

      renderer.render(scene, camera);
      animFrameId = requestAnimationFrame(animate);
    }

    animate();
  }

  /* --------------------------------------------------------------------------
     2. Navigation, Smooth Scroll & Scrollspy
     -------------------------------------------------------------------------- */
  function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');
    const toggleBtn = document.querySelector('.nav-toggle-btn');
    const navList = document.querySelector('.nav-links');

    // Mobile Toggle
    if (toggleBtn && navList) {
      toggleBtn.addEventListener('click', () => {
        navList.classList.toggle('mobile-open');
        const isExpanded = navList.classList.contains('mobile-open');
        toggleBtn.setAttribute('aria-expanded', isExpanded);
      });

      // Close when clicking link
      navLinks.forEach(link => {
        link.addEventListener('click', () => {
          navList.classList.remove('mobile-open');
          toggleBtn.setAttribute('aria-expanded', 'false');
        });
      });
    }

    // Scrollspy with IntersectionObserver
    if ('IntersectionObserver' in window && sections.length > 0) {
      const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const currentId = entry.target.getAttribute('id');
            navLinks.forEach(link => {
              if (link.getAttribute('href') === '#' + currentId) {
                link.classList.add('active');
              } else {
                link.classList.remove('active');
              }
            });
          }
        });
      }, {
        rootMargin: '-30% 0px -60% 0px'
      });

      sections.forEach(sec => sectionObserver.observe(sec));
    }
  }

  /* --------------------------------------------------------------------------
     3. Copy Email to Clipboard with Toast Notification
     -------------------------------------------------------------------------- */
  function initEmailCopy() {
    const copyBtns = document.querySelectorAll('.btn-copy');
    const toast = document.getElementById('toast-notice');
    const emailToCopy = '7mahfuzur.rahman@gmail.com';

    copyBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(emailToCopy).then(() => {
            showToast('Email address copied to clipboard!');
          }).catch(() => {
            fallbackCopy(emailToCopy);
          });
        } else {
          fallbackCopy(emailToCopy);
        }
      });
    });

    function fallbackCopy(text) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        showToast('Email address copied to clipboard!');
      } catch (err) {
        window.location.href = 'mailto:' + text;
      }
      document.body.removeChild(textarea);
    }

    function showToast(message) {
      if (!toast) return;
      toast.querySelector('.toast-msg').textContent = message;
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 2600);
    }
  }

  /* --------------------------------------------------------------------------
     DOM Ready Bootstrapper
     -------------------------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    initThreeHero();
    initNavigation();
    initEmailCopy();
  });

})();
