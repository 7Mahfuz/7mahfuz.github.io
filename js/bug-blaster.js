/**
 * 3D Bug Blaster - Interactive Three.js Arcade Mini-Game
 * Al-Amin Mahfuzur Rahman | Senior Software Engineer Portfolio
 *
 * Fully modular WebGL game:
 * - Raycaster targeting with custom holographic reticle
 * - Procedural Web Audio API sound synthesizer (zero external audio files)
 * - Three Enemy Archetypes: NullPointer Drone, MemoryLeak Swarm, SyntaxGlitch Cube
 * - Dynamic dual 3D laser line tracers & volumetric particle shatter physics
 * - Lazy IntersectionObserver rendering loop for optimal CPU/battery efficiency
 */

(function () {
  'use strict';

  /* --------------------------------------------------------------------------
     1. Web Audio API Procedural Sound Synthesizer
     -------------------------------------------------------------------------- */
  class SoundFX {
    constructor() {
      this.ctx = null;
      this.muted = localStorage.getItem('bb_muted') === 'true';
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggleMute() {
      this.muted = !this.muted;
      localStorage.setItem('bb_muted', this.muted.toString());
      return this.muted;
    }

    playLaser() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;

      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        const now = this.ctx.currentTime;
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.08);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.08);
      } catch (e) {
        // Audio policy or context error ignored gracefully
      }
    }

    playExplosion() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;

      try {
        const now = this.ctx.currentTime;
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.28);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(700, now);
        filter.frequency.exponentialRampToValueAtTime(70, now + 0.28);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(now);
        noise.stop(now + 0.28);
      } catch (e) {
        // Audio error ignored gracefully
      }
    }

    playStreakChime(streak) {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;

      try {
        const freqs = streak >= 5 ? [523.25, 659.25, 783.99, 1046.5] : [523.25, 659.25, 783.99];
        const now = this.ctx.currentTime;

        freqs.forEach((f, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now + idx * 0.05);

          gain.gain.setValueAtTime(0.1, now + idx * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.16);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now + idx * 0.05);
          osc.stop(now + idx * 0.05 + 0.16);
        });
      } catch (e) {
        // Audio error ignored gracefully
      }
    }

    playDamage() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;

      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        const now = this.ctx.currentTime;
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.25);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.25);
      } catch (e) {
        // Audio error ignored gracefully
      }
    }
  }

  /* --------------------------------------------------------------------------
     2. 3D Bug Blaster Main Engine Class
     -------------------------------------------------------------------------- */
  class BugBlasterGame {
    constructor() {
      // DOM Elements
      this.section = document.getElementById('arcade');
      this.viewport = document.getElementById('arcade-viewport');
      this.canvas = document.getElementById('bug-blaster-canvas');
      this.crosshair = document.getElementById('arcade-crosshair');
      this.overlay = document.getElementById('arcade-overlay');
      this.overlayTitle = document.getElementById('overlay-title');
      this.overlayDesc = document.getElementById('overlay-desc');
      this.overlayStats = document.getElementById('overlay-stats');
      this.finalScoreEl = document.getElementById('final-score');
      this.finalStreakEl = document.getElementById('final-streak');
      this.playBtn = document.getElementById('bb-play-btn');
      this.playText = document.getElementById('bb-play-text');
      this.scoreEl = document.getElementById('bb-score');
      this.streakEl = document.getElementById('bb-streak');
      this.integrityFill = document.getElementById('bb-integrity');
      this.muteBtn = document.getElementById('bb-mute-btn');
      this.pauseBtn = document.getElementById('bb-pause-btn');

      if (!this.viewport || !this.canvas || typeof THREE === 'undefined') {
        return;
      }

      // Audio Synthesizer
      this.sound = new SoundFX();
      this.updateMuteIcon();

      // Game State
      this.isPlaying = false;
      this.isPaused = false;
      this.isInView = false;
      this.score = 0;
      this.streak = 1;
      this.maxStreak = 1;
      this.integrity = 100;
      this.lastSpawnTime = 0;
      this.spawnInterval = 1400; // ms

      // Camera Shake
      this.shakeIntensity = 0;
      this.baseCamPos = new THREE.Vector3(0, 1.2, 12);

      // Mouse / Touch Normalized Device Coordinates
      this.mouse = new THREE.Vector2(0, 0);
      this.raycaster = new THREE.Raycaster();

      // Entities & Objects
      this.enemies = [];
      this.particles = [];
      this.lasers = [];

      // Initialize Three.js scene
      this.initScene();
      this.initEvents();
      this.initObserver();
    }

    /* --- Three.js Scene Setup --- */
    initScene() {
      const width = this.viewport.clientWidth;
      const height = this.viewport.clientHeight;

      // 1. Scene & Camera
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x090d16);
      this.scene.fog = new THREE.FogExp2(0x090d16, 0.015);

      this.camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 200);
      this.camera.position.copy(this.baseCamPos);
      this.camera.lookAt(0, 0.5, -30);

      // 2. Renderer
      try {
        this.renderer = new THREE.WebGLRenderer({
          canvas: this.canvas,
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance'
        });
      } catch (e) {
        console.warn('WebGL initialization failed in BugBlaster:', e);
        return;
      }

      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

      // 3. Lighting
      const ambientLight = new THREE.AmbientLight(0x1e293b, 1.6);
      this.scene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0x60a5fa, 1.2);
      dirLight.position.set(10, 20, 15);
      this.scene.add(dirLight);

      const pointLight = new THREE.PointLight(0x38bdf8, 1.4, 40);
      pointLight.position.set(0, 2, 8);
      this.scene.add(pointLight);

      // 4. Infinite Scrolling Grid Floor
      this.gridFloor = new THREE.GridHelper(160, 40, 0x2563eb, 0x1e293b);
      this.gridFloor.position.y = -3;
      this.scene.add(this.gridFloor);

      // 5. Starfield / Floating Cyber Particles
      const starCount = 350;
      const starGeo = new THREE.BufferGeometry();
      const starPos = new Float32Array(starCount * 3);

      for (let i = 0; i < starCount * 3; i += 3) {
        starPos[i] = (Math.random() - 0.5) * 80;
        starPos[i + 1] = Math.random() * 30 - 3;
        starPos[i + 2] = -Math.random() * 120 + 10;
      }

      starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
      const starMat = new THREE.PointsMaterial({
        color: 0x38bdf8,
        size: 0.12,
        transparent: true,
        opacity: 0.6
      });
      this.starfield = new THREE.Points(starGeo, starMat);
      this.scene.add(this.starfield);

      // Render standby initial frame
      this.renderer.render(this.scene, this.camera);
    }

    /* --- DOM Event Listeners --- */
    initEvents() {
      // Start / Play Again Button
      if (this.playBtn) {
        this.playBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.sound.init();
          this.start();
        });
      }

      // Mute Toggle Button
      if (this.muteBtn) {
        this.muteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.sound.toggleMute();
          this.updateMuteIcon();
        });
      }

      // Pause Toggle Button
      if (this.pauseBtn) {
        this.pauseBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.togglePause();
        });
      }

      // Spacebar for Pause
      window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && this.isInView && this.isPlaying) {
          e.preventDefault();
          this.togglePause();
        }
      });

      // Mouse Aiming & Crosshair Positioning
      this.viewport.addEventListener('mousemove', (e) => {
        const rect = this.viewport.getBoundingClientRect();
        const clientX = e.clientX - rect.left;
        const clientY = e.clientY - rect.top;

        // Position CSS reticle
        if (this.crosshair) {
          this.crosshair.style.left = `${clientX}px`;
          this.crosshair.style.top = `${clientY}px`;
        }

        // Calculate normalized device coordinates [-1, 1]
        this.mouse.x = (clientX / rect.width) * 2 - 1;
        this.mouse.y = -(clientY / rect.height) * 2 + 1;
      });

      // Mouse Shoot
      this.viewport.addEventListener('click', (e) => {
        if (!this.isPlaying || this.isPaused) return;
        // Don't fire if clicked directly on overlay or action buttons
        if (e.target.closest('.arcade-overlay') || e.target.closest('.arcade-btn')) return;

        const rect = this.viewport.getBoundingClientRect();
        const clientX = e.clientX - rect.left;
        const clientY = e.clientY - rect.top;
        this.mouse.x = (clientX / rect.width) * 2 - 1;
        this.mouse.y = -(clientY / rect.height) * 2 + 1;

        this.fire();
      });

      // Touch Aiming & Shooting for Mobile
      this.viewport.addEventListener('touchstart', (e) => {
        if (!this.isPlaying || this.isPaused) return;
        if (e.touches.length > 0) {
          const touch = e.touches[0];
          const rect = this.viewport.getBoundingClientRect();
          const clientX = touch.clientX - rect.left;
          const clientY = touch.clientY - rect.top;

          this.mouse.x = (clientX / rect.width) * 2 - 1;
          this.mouse.y = -(clientY / rect.height) * 2 + 1;

          if (this.crosshair) {
            this.crosshair.style.display = 'block';
            this.crosshair.style.left = `${clientX}px`;
            this.crosshair.style.top = `${clientY}px`;
          }

          this.fire();
        }
      }, { passive: true });

      // Window Resize Listener
      window.addEventListener('resize', () => {
        this.onResize();
      });
    }

    /* --- IntersectionObserver for Zero CPU Footprint --- */
    initObserver() {
      if ('IntersectionObserver' in window && this.section) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            this.isInView = entry.isIntersecting;
            if (this.isInView) {
              if (this.isPlaying && !this.isPaused) {
                this.requestFrame();
              }
            }
          });
        }, { threshold: 0.1 });

        observer.observe(this.section);
      } else {
        this.isInView = true;
      }
    }

    onResize() {
      if (!this.renderer || !this.camera || !this.viewport) return;
      const width = this.viewport.clientWidth;
      const height = this.viewport.clientHeight;

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

      if (!this.isPlaying) {
        this.renderer.render(this.scene, this.camera);
      }
    }

    updateMuteIcon() {
      if (!this.muteBtn) return;
      const icon = this.muteBtn.querySelector('i');
      if (icon) {
        icon.className = this.sound.muted ? 'fas fa-volume-xmark' : 'fas fa-volume-high';
      }
    }

    /* --- Game Lifecycle --- */
    start() {
      this.isPlaying = true;
      this.isPaused = false;
      this.score = 0;
      this.streak = 1;
      this.maxStreak = 1;
      this.integrity = 100;
      this.lastSpawnTime = performance.now();
      this.spawnInterval = 1400;

      // Clear existing entities
      this.clearEntities();

      // Update HUD
      this.updateHUD();

      // Hide Overlay
      if (this.overlay) {
        this.overlay.classList.add('hidden');
      }

      if (this.pauseBtn) {
        const icon = this.pauseBtn.querySelector('i');
        if (icon) icon.className = 'fas fa-pause';
        this.pauseBtn.title = 'Pause Game';
      }

      this.requestFrame();
    }

    togglePause() {
      if (!this.isPlaying) return;
      this.isPaused = !this.isPaused;

      if (this.pauseBtn) {
        const icon = this.pauseBtn.querySelector('i');
        if (icon) icon.className = this.isPaused ? 'fas fa-play' : 'fas fa-pause';
        this.pauseBtn.title = this.isPaused ? 'Resume Game' : 'Pause Game';
      }

      if (!this.isPaused) {
        this.requestFrame();
      }
    }

    gameOver() {
      this.isPlaying = false;
      this.sound.playDamage();

      if (this.overlayTitle) this.overlayTitle.textContent = 'SYSTEM BREACHED';
      if (this.overlayDesc) this.overlayDesc.textContent = 'System integrity reached 0%. Bugs overloaded the defense perimeter.';
      if (this.finalScoreEl) this.finalScoreEl.textContent = this.score.toLocaleString();
      if (this.finalStreakEl) this.finalStreakEl.textContent = `x${this.maxStreak}`;
      if (this.overlayStats) this.overlayStats.style.display = 'grid';
      if (this.playText) this.playText.textContent = 'REBOOT & PLAY AGAIN';

      if (this.overlay) {
        this.overlay.classList.remove('hidden');
      }
    }

    clearEntities() {
      this.enemies.forEach((item) => {
        this.scene.remove(item.mesh);
        if (item.mesh.geometry) item.mesh.geometry.dispose();
        if (item.mesh.material) {
          if (Array.isArray(item.mesh.material)) {
            item.mesh.material.forEach((m) => m.dispose());
          } else {
            item.mesh.material.dispose();
          }
        }
      });
      this.enemies = [];

      this.particles.forEach((p) => {
        this.scene.remove(p.mesh);
        if (p.mesh.geometry) p.mesh.geometry.dispose();
        if (p.mesh.material) p.mesh.material.dispose();
      });
      this.particles = [];

      this.lasers.forEach((l) => {
        this.scene.remove(l.mesh);
        if (l.mesh.geometry) l.mesh.geometry.dispose();
        if (l.mesh.material) l.mesh.material.dispose();
      });
      this.lasers = [];
    }

    updateHUD() {
      if (this.scoreEl) {
        this.scoreEl.textContent = this.score.toString().padStart(5, '0');
      }
      if (this.streakEl) {
        this.streakEl.textContent = `x${this.streak}`;
      }
      if (this.integrityFill) {
        this.integrityFill.style.width = `${Math.max(0, this.integrity)}%`;
        if (this.integrity <= 30) {
          this.integrityFill.classList.add('danger');
        } else {
          this.integrityFill.classList.remove('danger');
        }
      }
    }

    /* --- Spawning Enemies --- */
    spawnEnemy() {
      const types = ['nullPointer', 'nullPointer', 'memoryLeak', 'syntaxGlitch'];
      const chosenType = types[Math.floor(Math.random() * types.length)];

      let mesh;
      let hp = 1;
      let speed = 0.22 + Math.random() * 0.08;
      let rotSpeed = {
        x: (Math.random() - 0.5) * 0.05,
        y: (Math.random() - 0.5) * 0.05,
        z: (Math.random() - 0.5) * 0.05
      };

      if (chosenType === 'nullPointer') {
        // Faceted Cyan Icosahedron with Wireframe Shell
        const group = new THREE.Group();
        const coreGeo = new THREE.IcosahedronGeometry(0.85, 1);
        const coreMat = new THREE.MeshStandardMaterial({
          color: 0x0284c7,
          roughness: 0.3,
          metalness: 0.8
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        group.add(core);

        const wireGeo = new THREE.IcosahedronGeometry(1.05, 1);
        const wireMat = new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          wireframe: true,
          transparent: true,
          opacity: 0.6
        });
        const wire = new THREE.Mesh(wireGeo, wireMat);
        group.add(wire);

        mesh = group;
        hp = 1;
        speed = 0.24 + Math.random() * 0.06;
      } else if (chosenType === 'memoryLeak') {
        // Octahedron Swarm - Faster purple drone with oscillating trajectory
        const group = new THREE.Group();
        const coreGeo = new THREE.OctahedronGeometry(0.7, 0);
        const coreMat = new THREE.MeshStandardMaterial({
          color: 0x9333ea,
          roughness: 0.2,
          metalness: 0.9
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        group.add(core);

        const wireGeo = new THREE.OctahedronGeometry(0.88, 0);
        const wireMat = new THREE.MeshBasicMaterial({
          color: 0xc084fc,
          wireframe: true
        });
        const wire = new THREE.Mesh(wireGeo, wireMat);
        group.add(wire);

        mesh = group;
        hp = 1;
        speed = 0.32 + Math.random() * 0.08;
      } else {
        // Syntax Glitch Cube - Heavy 2 HP crimson node
        const group = new THREE.Group();
        const boxGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
        const boxMat = new THREE.MeshStandardMaterial({
          color: 0xdc2626,
          roughness: 0.4,
          metalness: 0.7
        });
        const box = new THREE.Mesh(boxGeo, boxMat);
        group.add(box);

        const wireGeo = new THREE.BoxGeometry(1.35, 1.35, 1.35);
        const wireMat = new THREE.MeshBasicMaterial({
          color: 0xf87171,
          wireframe: true
        });
        const wire = new THREE.Mesh(wireGeo, wireMat);
        group.add(wire);

        mesh = group;
        hp = 2;
        speed = 0.18 + Math.random() * 0.04;
      }

      // Position in deep 3D space
      mesh.position.x = (Math.random() - 0.5) * 16;
      mesh.position.y = Math.random() * 6 - 1.5;
      mesh.position.z = -75;

      this.scene.add(mesh);
      this.enemies.push({
        type: chosenType,
        mesh: mesh,
        hp: hp,
        maxHp: hp,
        speed: speed,
        rotSpeed: rotSpeed,
        oscTime: Math.random() * Math.PI * 2
      });
    }

    /* --- Laser Firing & Raycasting --- */
    fire() {
      this.sound.playLaser();

      // 1. Raycast into 3D scene from mouse coordinates
      this.raycaster.setFromCamera(this.mouse, this.camera);

      // Collect targetable enemy meshes
      const targetMeshes = [];
      const enemyMap = new Map();

      this.enemies.forEach((enemy) => {
        enemy.mesh.traverse((child) => {
          if (child.isMesh) {
            targetMeshes.push(child);
            enemyMap.set(child, enemy);
          }
        });
      });

      const intersects = this.raycaster.intersectObjects(targetMeshes, false);

      // Compute target 3D hit point
      let targetPoint;
      let hitEnemy = null;

      if (intersects.length > 0) {
        targetPoint = intersects[0].point;
        hitEnemy = enemyMap.get(intersects[0].object);
      } else {
        // Project ray to z = -35 plane for visual beam
        const distance = 40;
        targetPoint = new THREE.Vector3();
        this.raycaster.ray.at(distance, targetPoint);
      }

      // 2. Spawn Dual 3D Laser Tracers (left and right blasters)
      this.spawnLaserBeam(new THREE.Vector3(-1.8, -1.2, 9), targetPoint);
      this.spawnLaserBeam(new THREE.Vector3(1.8, -1.2, 9), targetPoint);

      // 3. Handle Hit / Miss
      if (hitEnemy) {
        hitEnemy.hp -= 1;

        if (hitEnemy.hp <= 0) {
          // Destroy enemy
          this.destroyEnemy(hitEnemy);
          this.streak += 1;
          if (this.streak > this.maxStreak) this.maxStreak = this.streak;

          // Sound effects & bonus
          this.sound.playExplosion();
          if (this.streak === 3 || this.streak === 5 || this.streak % 10 === 0) {
            this.sound.playStreakChime(this.streak);
          }

          this.score += 100 * this.streak;
          this.shakeCamera(0.08);
        } else {
          // Enemy took damage but didn't die (Syntax Glitch Cube)
          hitEnemy.mesh.scale.multiplyScalar(0.9);
          this.sound.playExplosion();
          this.spawnParticleBurst(targetPoint, 12, 0xf87171);
          this.score += 50;
        }
      } else {
        // Miss reset streak
        this.streak = 1;
      }

      this.updateHUD();
    }

    spawnLaserBeam(startPoint, endPoint) {
      const points = [startPoint, endPoint];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        linewidth: 2,
        transparent: true,
        opacity: 0.95
      });

      const line = new THREE.Line(geometry, material);
      this.scene.add(line);

      this.lasers.push({
        mesh: line,
        life: 0.12 // Seconds duration
      });
    }

    destroyEnemy(enemy) {
      const pos = enemy.mesh.position.clone();
      const color = enemy.type === 'memoryLeak' ? 0xa855f7 : (enemy.type === 'syntaxGlitch' ? 0xef4444 : 0x38bdf8);

      // Spawn volumetric shrapnel burst
      this.spawnParticleBurst(pos, 35, color);

      // Remove mesh from scene
      this.scene.remove(enemy.mesh);
      enemy.mesh.traverse((child) => {
        if (child.isMesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        }
      });

      // Remove from active enemy array
      const idx = this.enemies.indexOf(enemy);
      if (idx !== -1) {
        this.enemies.splice(idx, 1);
      }
    }

    spawnParticleBurst(origin, count, hexColor) {
      const pGeo = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      const velocities = [];

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        positions[i3] = origin.x;
        positions[i3 + 1] = origin.y;
        positions[i3 + 2] = origin.z;

        // Spherical random velocity
        const speed = 0.18 + Math.random() * 0.28;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);

        velocities.push(
          speed * Math.sin(phi) * Math.cos(theta),
          speed * Math.sin(phi) * Math.sin(theta),
          speed * Math.cos(phi)
        );
      }

      pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const pMat = new THREE.PointsMaterial({
        color: hexColor,
        size: 0.22,
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending
      });

      const points = new THREE.Points(pGeo, pMat);
      this.scene.add(points);

      this.particles.push({
        mesh: points,
        velocities: velocities,
        life: 1.0,
        maxLife: 1.0
      });
    }

    shakeCamera(intensity) {
      this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    }

    /* --- Animation / Game Loop --- */
    requestFrame() {
      if (!this.frameId) {
        this.frameId = requestAnimationFrame((timestamp) => this.loop(timestamp));
      }
    }

    loop(timestamp) {
      this.frameId = null;

      if (!this.isPlaying || this.isPaused || !this.isInView) {
        return;
      }

      const delta = 0.016; // Approx 60fps delta

      // 1. Spawning Logic
      if (timestamp - this.lastSpawnTime > this.spawnInterval) {
        this.spawnEnemy();
        this.lastSpawnTime = timestamp;
        // Gently accelerate spawn rate as score rises
        this.spawnInterval = Math.max(700, 1400 - Math.floor(this.score / 600) * 80);
      }

      // 2. Update Grid Floor & Starfield Movement
      if (this.gridFloor) {
        this.gridFloor.position.z += 0.2;
        if (this.gridFloor.position.z > 4) {
          this.gridFloor.position.z = 0;
        }
      }

      if (this.starfield) {
        const starPos = this.starfield.geometry.attributes.position.array;
        for (let i = 2; i < starPos.length; i += 3) {
          starPos[i] += 0.4;
          if (starPos[i] > 12) {
            starPos[i] = -110;
          }
        }
        this.starfield.geometry.attributes.position.needsUpdate = true;
      }

      // 3. Update Enemies
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const enemy = this.enemies[i];
        enemy.mesh.position.z += enemy.speed;

        // Rotation
        enemy.mesh.rotation.x += enemy.rotSpeed.x;
        enemy.mesh.rotation.y += enemy.rotSpeed.y;
        enemy.mesh.rotation.z += enemy.rotSpeed.z;

        // Wave oscillation for MemoryLeak drones
        if (enemy.type === 'memoryLeak') {
          enemy.oscTime += 0.06;
          enemy.mesh.position.x += Math.sin(enemy.oscTime) * 0.08;
        }

        // Check if enemy passed player boundary
        if (enemy.mesh.position.z > 6) {
          // Defense breach!
          this.sound.playDamage();
          this.integrity = Math.max(0, this.integrity - 20);
          this.streak = 1;
          this.shakeCamera(0.18);
          this.updateHUD();

          // Remove enemy
          this.scene.remove(enemy.mesh);
          this.enemies.splice(i, 1);

          if (this.integrity <= 0) {
            this.gameOver();
            return;
          }
        }
      }

      // 4. Update Particle Bursts
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.life -= delta * 1.8;

        if (p.life <= 0) {
          this.scene.remove(p.mesh);
          if (p.mesh.geometry) p.mesh.geometry.dispose();
          if (p.mesh.material) p.mesh.material.dispose();
          this.particles.splice(i, 1);
        } else {
          p.mesh.material.opacity = p.life / p.maxLife;
          const pos = p.mesh.geometry.attributes.position.array;
          const vel = p.velocities;

          for (let j = 0; j < vel.length; j += 3) {
            pos[j] += vel[j];
            pos[j + 1] += vel[j + 1];
            pos[j + 2] += vel[j + 2];
            // Subtle drag
            vel[j] *= 0.94;
            vel[j + 1] *= 0.94;
            vel[j + 2] *= 0.94;
          }
          p.mesh.geometry.attributes.position.needsUpdate = true;
        }
      }

      // 5. Update Laser Beams
      for (let i = this.lasers.length - 1; i >= 0; i--) {
        const l = this.lasers[i];
        l.life -= delta;
        if (l.life <= 0) {
          this.scene.remove(l.mesh);
          if (l.mesh.geometry) l.mesh.geometry.dispose();
          if (l.mesh.material) l.mesh.material.dispose();
          this.lasers.splice(i, 1);
        } else {
          l.mesh.material.opacity = l.life / 0.12;
        }
      }

      // 6. Camera Shake
      if (this.shakeIntensity > 0) {
        this.camera.position.x = this.baseCamPos.x + (Math.random() - 0.5) * this.shakeIntensity;
        this.camera.position.y = this.baseCamPos.y + (Math.random() - 0.5) * this.shakeIntensity;
        this.shakeIntensity *= 0.85;
        if (this.shakeIntensity < 0.005) {
          this.shakeIntensity = 0;
          this.camera.position.copy(this.baseCamPos);
        }
      }

      // 7. Render
      this.renderer.render(this.scene, this.camera);

      // Next frame
      this.requestFrame();
    }
  }

  // Self-initialize on DOM ready
  window.__BugBlasterGame = BugBlasterGame;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.bugBlasterInstance = new BugBlasterGame();
    });
  } else {
    window.bugBlasterInstance = new BugBlasterGame();
  }
})();
