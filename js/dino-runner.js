/**
 * 3D Cyber Dino Runner - Interactive Three.js Arcade Mini-Game
 * Al-Amin Mahfuzur Rahman | Senior Software Engineer Portfolio
 *
 * Features:
 * - Procedural low-poly 3D Voxel T-Rex with articulated running, jumping, and ducking animation
 * - 3D Voxel Cacti and animated flying Pterodactyls with wing-flapping physics
 * - Dynamic Day / Night horizon cycle every 500 points
 * - Procedural Web Audio API sound synthesizer (jump blip, 100-pt chime, crash crunch)
 * - Persistent High Score via localStorage
 * - Keyboard (Space/Up/Down) & Mobile Touch Controls
 */

(function () {
  'use strict';

  /* --------------------------------------------------------------------------
     1. Web Audio API Procedural Sound Synthesizer
     -------------------------------------------------------------------------- */
  class DinoAudio {
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

    playJump() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;

      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        const now = this.ctx.currentTime;
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(460, now + 0.08);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.08);
      } catch (e) {
        // Audio error ignored gracefully
      }
    }

    playMilestone() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;

      try {
        const now = this.ctx.currentTime;
        // Two-tone classic chime (587Hz -> 880Hz)
        const notes = [
          { freq: 587.33, start: now, dur: 0.09 },
          { freq: 880.00, start: now + 0.1, dur: 0.14 }
        ];

        notes.forEach((n) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'square';
          osc.frequency.setValueAtTime(n.freq, n.start);

          gain.gain.setValueAtTime(0.12, n.start);
          gain.gain.exponentialRampToValueAtTime(0.001, n.start + n.dur);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(n.start);
          osc.stop(n.start + n.dur);
        });
      } catch (e) {
        // Audio error ignored gracefully
      }
    }

    playCrash() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;

      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        const now = this.ctx.currentTime;
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.28);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.28);
      } catch (e) {
        // Audio error ignored gracefully
      }
    }
  }

  /* --------------------------------------------------------------------------
     2. 3D Voxel Dino Runner Engine Class
     -------------------------------------------------------------------------- */
  class DinoRunnerGame {
    constructor() {
      // DOM Elements
      this.viewport = document.getElementById('dino-viewport');
      this.canvas = document.getElementById('dino-canvas');
      this.overlay = document.getElementById('dino-overlay');
      this.overlayTitle = document.getElementById('dino-overlay-title');
      this.overlayDesc = document.getElementById('dino-overlay-desc');
      this.overlayStats = document.getElementById('dino-overlay-stats');
      this.finalScoreEl = document.getElementById('dino-final-score');
      this.finalHiEl = document.getElementById('dino-final-hi');
      this.playBtn = document.getElementById('dino-play-btn');
      this.playText = document.getElementById('dino-play-text');
      this.scoreEl = document.getElementById('dino-score');
      this.hiScoreEl = document.getElementById('dino-hi-score');
      this.speedValEl = document.getElementById('dino-speed-val');
      this.muteBtn = document.getElementById('dino-mute-btn');
      this.pauseBtn = document.getElementById('dino-pause-btn');

      // Optional Mobile Touch Buttons
      this.btnTouchJump = document.getElementById('btn-touch-jump');
      this.btnTouchDuck = document.getElementById('btn-touch-duck');

      if (!this.viewport || !this.canvas || typeof THREE === 'undefined') {
        return;
      }

      // Audio
      this.sound = new DinoAudio();
      this.updateMuteIcon();

      // Game States
      this.isPlaying = false;
      this.isPaused = false;
      this.isTabActive = true;
      this.score = 0;
      this.hiScore = parseInt(localStorage.getItem('dino_hi_score') || '0', 10);
      this.speed = 0.42;
      this.baseSpeed = 0.42;
      this.lastMilestone = 0;

      // Kinematics (Jump & Duck)
      this.dinoY = 0;
      this.dinoVy = 0;
      this.gravity = -0.024;
      this.jumpVelocity = 0.52;
      this.isGrounded = true;
      this.isDucking = false;

      // Animation & Time
      this.runTime = 0;
      this.obstacles = [];
      this.clouds = [];
      this.nextSpawnDistance = 25;
      this.distanceTraveled = 0;

      // Day / Night Cycle
      this.isNight = false;
      this.dayBg = new THREE.Color(0x090d16);
      this.nightBg = new THREE.Color(0x020617);
      this.dayFog = 0x090d16;
      this.nightFog = 0x020617;

      // Update initial HI score in HUD
      if (this.hiScoreEl) {
        this.hiScoreEl.textContent = this.hiScore.toString().padStart(5, '0');
      }

      this.initScene();
      this.initEvents();
    }

    /* --- Three.js Scene Setup --- */
    initScene() {
      const width = this.viewport.clientWidth;
      const height = this.viewport.clientHeight;

      // 1. Scene & Camera
      this.scene = new THREE.Scene();
      this.scene.background = this.dayBg.clone();
      this.scene.fog = new THREE.FogExp2(this.dayFog, 0.012);

      this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 150);
      this.camera.position.set(0, 3.8, 17);
      this.camera.lookAt(0, 2.2, 0);

      // 2. Renderer
      try {
        this.renderer = new THREE.WebGLRenderer({
          canvas: this.canvas,
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance'
        });
      } catch (e) {
        console.warn('WebGL initialization failed in DinoRunner:', e);
        return;
      }

      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

      // 3. Lighting
      this.ambientLight = new THREE.AmbientLight(0x64748b, 1.4);
      this.scene.add(this.ambientLight);

      this.dirLight = new THREE.DirectionalLight(0xffffff, 1.3);
      this.dirLight.position.set(12, 18, 10);
      this.scene.add(this.dirLight);

      // 4. Ground Strip & Track
      const groundGeo = new THREE.BoxGeometry(100, 2, 8);
      const groundMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.8
      });
      this.groundMesh = new THREE.Mesh(groundGeo, groundMat);
      this.groundMesh.position.set(0, -1, 0);
      this.scene.add(this.groundMesh);

      // Moving Ground Grid / Markers
      this.trackMarkers = new THREE.Group();
      for (let i = 0; i < 20; i++) {
        const markerGeo = new THREE.BoxGeometry(0.8, 0.05, 0.15);
        const markerMat = new THREE.MeshBasicMaterial({ color: 0x334155 });
        const marker = new THREE.Mesh(markerGeo, markerMat);
        marker.position.set(-25 + i * 2.8, 0.02, (Math.random() - 0.5) * 4);
        this.trackMarkers.add(marker);
      }
      this.scene.add(this.trackMarkers);

      // 5. Parallax Background Dunes
      this.dunes = new THREE.Group();
      for (let i = 0; i < 8; i++) {
        const duneGeo = new THREE.ConeGeometry(4 + Math.random() * 3, 3 + Math.random() * 2, 4);
        const duneMat = new THREE.MeshStandardMaterial({
          color: 0x0f172a,
          roughness: 0.9,
          flatShading: true
        });
        const dune = new THREE.Mesh(duneGeo, duneMat);
        dune.position.set(-35 + i * 12, 0.5, -12 - Math.random() * 6);
        dune.rotation.y = Math.random() * Math.PI;
        this.dunes.add(dune);
      }
      this.scene.add(this.dunes);

      // 6. Floating Voxel Clouds
      this.cloudsGroup = new THREE.Group();
      for (let i = 0; i < 6; i++) {
        const cloud = this.createVoxelCloud();
        cloud.position.set(-20 + i * 15, 6 + Math.random() * 2.5, -8 - Math.random() * 4);
        this.cloudsGroup.add(cloud);
        this.clouds.push(cloud);
      }
      this.scene.add(this.cloudsGroup);

      // 7. Voxel T-Rex Player
      this.createDinoMesh();

      // Render initial frame
      this.renderer.render(this.scene, this.camera);
    }

    /* --- Procedural 3D Voxel T-Rex --- */
    createDinoMesh() {
      this.dinoGroup = new THREE.Group();
      this.dinoGroup.position.set(-8, 0, 0);

      const skinMat = new THREE.MeshStandardMaterial({
        color: 0x64748b, // Classic slate
        roughness: 0.4,
        metalness: 0.2
      });

      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x090d16 });
      const toothMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });

      // Torso / Body
      const bodyGeo = new THREE.BoxGeometry(1.6, 1.8, 1.0);
      this.dinoBody = new THREE.Mesh(bodyGeo, skinMat);
      this.dinoBody.position.set(0, 1.6, 0);
      this.dinoGroup.add(this.dinoBody);

      // Tail
      const tailGeo = new THREE.BoxGeometry(1.2, 0.8, 0.7);
      const tail = new THREE.Mesh(tailGeo, skinMat);
      tail.position.set(-1.2, 1.4, 0);
      tail.rotation.z = 0.2;
      this.dinoGroup.add(tail);

      // Neck & Head Group (pivots for ducking)
      this.headGroup = new THREE.Group();
      this.headGroup.position.set(0.6, 2.3, 0);

      // Snout
      const snoutGeo = new THREE.BoxGeometry(1.4, 1.1, 0.9);
      const snout = new THREE.Mesh(snoutGeo, skinMat);
      snout.position.set(0.5, 0.2, 0);
      this.headGroup.add(snout);

      // Eye
      const eyeGeo = new THREE.BoxGeometry(0.2, 0.2, 0.95);
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(0.4, 0.5, 0);
      this.headGroup.add(eye);

      // Teeth
      const teethGeo = new THREE.BoxGeometry(0.5, 0.15, 0.85);
      const teeth = new THREE.Mesh(teethGeo, toothMat);
      teeth.position.set(0.9, -0.25, 0);
      this.headGroup.add(teeth);

      this.dinoGroup.add(this.headGroup);

      // Small T-Rex Arms
      const armGeo = new THREE.BoxGeometry(0.4, 0.2, 1.1);
      const arms = new THREE.Mesh(armGeo, skinMat);
      arms.position.set(0.7, 1.5, 0);
      this.dinoGroup.add(arms);

      // Left Leg Pivot Group
      this.leftLegGroup = new THREE.Group();
      this.leftLegGroup.position.set(-0.2, 0.9, 0.45);
      const legGeo = new THREE.BoxGeometry(0.35, 1.0, 0.35);
      const leftLeg = new THREE.Mesh(legGeo, skinMat);
      leftLeg.position.y = -0.45;
      this.leftLegGroup.add(leftLeg);
      const leftFoot = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.2, 0.35), skinMat);
      leftFoot.position.set(0.12, -0.85, 0);
      this.leftLegGroup.add(leftFoot);
      this.dinoGroup.add(this.leftLegGroup);

      // Right Leg Pivot Group
      this.rightLegGroup = new THREE.Group();
      this.rightLegGroup.position.set(0.3, 0.9, -0.45);
      const rightLeg = new THREE.Mesh(legGeo, skinMat);
      rightLeg.position.y = -0.45;
      this.rightLegGroup.add(rightLeg);
      const rightFoot = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.2, 0.35), skinMat);
      rightFoot.position.set(0.12, -0.85, 0);
      this.rightLegGroup.add(rightFoot);
      this.dinoGroup.add(this.rightLegGroup);

      this.scene.add(this.dinoGroup);
    }

    createVoxelCloud() {
      const group = new THREE.Group();
      const cloudMat = new THREE.MeshBasicMaterial({
        color: 0x334155,
        transparent: true,
        opacity: 0.35
      });

      const parts = [
        { w: 3.5, h: 0.8, d: 0.8, x: 0, y: 0 },
        { w: 2.0, h: 0.7, d: 0.8, x: -0.5, y: 0.6 },
        { w: 1.6, h: 0.6, d: 0.8, x: 0.8, y: 0.4 }
      ];

      parts.forEach((p) => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(p.w, p.h, p.d), cloudMat);
        mesh.position.set(p.x, p.y, 0);
        group.add(mesh);
      });

      return group;
    }

    /* --- DOM Event Listeners --- */
    initEvents() {
      // Play / Restart Button
      if (this.playBtn) {
        this.playBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.sound.init();
          this.start();
        });
      }

      // Mute Button
      if (this.muteBtn) {
        this.muteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.sound.toggleMute();
          this.updateMuteIcon();
        });
      }

      // Pause Button
      if (this.pauseBtn) {
        this.pauseBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.togglePause();
        });
      }

      // Keyboard Controls
      window.addEventListener('keydown', (e) => {
        if (!this.isTabActive) return;

        if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
          e.preventDefault();
          if (!this.isPlaying) {
            this.start();
          } else if (!this.isPaused) {
            this.jump();
          }
        } else if (e.code === 'ArrowDown' || e.key === 's' || e.key === 'S') {
          e.preventDefault();
          if (this.isPlaying && !this.isPaused) {
            this.setDucking(true);
          }
        }
      });

      window.addEventListener('keyup', (e) => {
        if (!this.isTabActive) return;

        if (e.code === 'ArrowDown' || e.key === 's' || e.key === 'S') {
          this.setDucking(false);
        }
      });

      // Canvas Click & Touch
      this.viewport.addEventListener('pointerdown', (e) => {
        if (e.target.closest('.arcade-overlay') || e.target.closest('.arcade-btn')) return;

        const rect = this.viewport.getBoundingClientRect();
        const clientY = e.clientY - rect.top;

        if (!this.isPlaying) {
          this.start();
        } else if (!this.isPaused) {
          // Bottom 30% of viewport triggers duck, upper 70% triggers jump
          if (clientY > rect.height * 0.7) {
            this.setDucking(true);
          } else {
            this.jump();
          }
        }
      });

      this.viewport.addEventListener('pointerup', () => {
        if (this.isDucking) {
          this.setDucking(false);
        }
      });

      // Mobile Touch Buttons (if present)
      if (this.btnTouchJump) {
        this.btnTouchJump.addEventListener('touchstart', (e) => {
          e.preventDefault();
          this.jump();
        });
      }

      if (this.btnTouchDuck) {
        this.btnTouchDuck.addEventListener('touchstart', (e) => {
          e.preventDefault();
          this.setDucking(true);
        });
        this.btnTouchDuck.addEventListener('touchend', (e) => {
          e.preventDefault();
          this.setDucking(false);
        });
      }

      // Resize
      window.addEventListener('resize', () => this.onResize());
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

    /* --- Game Actions --- */
    jump() {
      if (this.isGrounded) {
        this.isGrounded = false;
        this.dinoVy = this.jumpVelocity;
        this.sound.playJump();
      }
    }

    setDucking(ducking) {
      this.isDucking = ducking;
      // If ducking in air, accelerate downward (fast-fall)
      if (this.isDucking && !this.isGrounded) {
        this.dinoVy = Math.min(this.dinoVy, -0.3);
      }
    }

    start() {
      this.isPlaying = true;
      this.isPaused = false;
      this.score = 0;
      this.distanceTraveled = 0;
      this.speed = this.baseSpeed;
      this.dinoY = 0;
      this.dinoVy = 0;
      this.isGrounded = true;
      this.isDucking = false;
      this.lastMilestone = 0;
      this.isNight = false;

      // Clear existing obstacles
      this.clearObstacles();

      if (this.overlay) {
        this.overlay.classList.add('hidden');
      }

      if (this.pauseBtn) {
        const icon = this.pauseBtn.querySelector('i');
        if (icon) icon.className = 'fas fa-pause';
        this.pauseBtn.title = 'Pause Game';
      }

      this.updateHUD();
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
      this.sound.playCrash();

      // Update High Score
      if (this.score > this.hiScore) {
        this.hiScore = this.score;
        localStorage.setItem('dino_hi_score', this.hiScore.toString());
      }

      if (this.overlayTitle) this.overlayTitle.textContent = 'SYSTEM OVERHEAT';
      if (this.overlayDesc) this.overlayDesc.textContent = 'T-Rex collided with an obstacle. High speed compromised.';
      if (this.finalScoreEl) this.finalScoreEl.textContent = this.score.toString().padStart(5, '0');
      if (this.finalHiEl) this.finalHiEl.textContent = this.hiScore.toString().padStart(5, '0');
      if (this.overlayStats) this.overlayStats.style.display = 'grid';
      if (this.playText) this.playText.textContent = 'RUN AGAIN';

      if (this.overlay) {
        this.overlay.classList.remove('hidden');
      }

      this.updateHUD();
    }

    clearObstacles() {
      this.obstacles.forEach((obs) => {
        this.scene.remove(obs.mesh);
        obs.mesh.traverse((child) => {
          if (child.isMesh) {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
          }
        });
      });
      this.obstacles = [];
      this.nextSpawnDistance = 25;
    }

    updateHUD() {
      if (this.scoreEl) {
        this.scoreEl.textContent = this.score.toString().padStart(5, '0');
      }
      if (this.hiScoreEl) {
        this.hiScoreEl.textContent = this.hiScore.toString().padStart(5, '0');
      }
      if (this.speedValEl) {
        const factor = (this.speed / this.baseSpeed).toFixed(1);
        this.speedValEl.textContent = `${factor}x`;
      }
    }

    /* --- Obstacle Spawning --- */
    spawnObstacle() {
      const allowPtero = this.score > 350;
      const roll = Math.random();

      if (allowPtero && roll > 0.65) {
        // Spawn Flying Pterodactyl
        this.spawnPterodactyl();
      } else {
        // Spawn Voxel Cactus
        this.spawnCactus(roll > 0.4);
      }
    }

    spawnCactus(isCluster) {
      const group = new THREE.Group();
      const cactusMat = new THREE.MeshStandardMaterial({
        color: 0x10b981, // Emerald green
        roughness: 0.5,
        flatShading: true
      });

      const count = isCluster ? (Math.random() > 0.5 ? 2 : 3) : 1;

      for (let i = 0; i < count; i++) {
        const height = 1.8 + Math.random() * 0.7;
        const main = new THREE.Mesh(new THREE.BoxGeometry(0.5, height, 0.5), cactusMat);
        main.position.set(i * 0.75, height / 2, 0);
        group.add(main);

        // Side arms
        const armL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.6, 0.3), cactusMat);
        armL.position.set(i * 0.75 - 0.35, height * 0.6, 0);
        group.add(armL);

        const armR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.7, 0.3), cactusMat);
        armR.position.set(i * 0.75 + 0.35, height * 0.55, 0);
        group.add(armR);
      }

      group.position.set(22, 0, 0);
      this.scene.add(group);

      this.obstacles.push({
        type: 'cactus',
        mesh: group,
        width: count * 0.8,
        height: 2.2
      });
    }

    spawnPterodactyl() {
      const group = new THREE.Group();
      const pteroMat = new THREE.MeshStandardMaterial({
        color: 0x9333ea, // Cyber purple
        roughness: 0.3,
        flatShading: true
      });

      // Body & Beak
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 0.5), pteroMat);
      group.add(body);

      const beak = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.2, 0.3), pteroMat);
      beak.position.set(-0.9, -0.05, 0);
      group.add(beak);

      // Flapping Wings
      const wingGeo = new THREE.BoxGeometry(0.7, 0.1, 1.2);
      const wingL = new THREE.Mesh(wingGeo, pteroMat);
      wingL.position.set(0, 0.1, 0.7);
      group.add(wingL);

      const wingR = new THREE.Mesh(wingGeo, pteroMat);
      wingR.position.set(0, 0.1, -0.7);
      group.add(wingR);

      // Two altitudes: Low (1.6, must duck) or Mid (3.2, can jump or duck)
      const alt = Math.random() > 0.5 ? 1.6 : 3.2;
      group.position.set(24, alt, 0);
      this.scene.add(group);

      this.obstacles.push({
        type: 'ptero',
        mesh: group,
        wingL: wingL,
        wingR: wingR,
        wingTime: Math.random() * Math.PI,
        width: 1.4,
        height: 0.8
      });
    }

    /* --- Day & Night Cycle --- */
    updateDayNight() {
      const cyclePeriod = Math.floor(this.score / 500);
      const night = cyclePeriod % 2 === 1;

      if (night !== this.isNight) {
        this.isNight = night;
        const targetBg = this.isNight ? this.nightBg : this.dayBg;
        const targetFog = this.isNight ? this.nightFog : this.dayFog;

        this.scene.background.copy(targetBg);
        this.scene.fog.color.setHex(targetFog);

        if (this.ambientLight) {
          this.ambientLight.color.setHex(this.isNight ? 0x1e293b : 0x64748b);
        }
      }
    }

    /* --- Game Loop & Collision Detection --- */
    requestFrame() {
      if (!this.frameId) {
        this.frameId = requestAnimationFrame((timestamp) => this.loop(timestamp));
      }
    }

    loop(timestamp) {
      this.frameId = null;

      if (!this.isPlaying || this.isPaused || !this.isTabActive) {
        return;
      }

      this.runTime += 0.05;

      // 1. Update Distance & Score
      this.distanceTraveled += this.speed;
      this.score = Math.floor(this.distanceTraveled * 1.8);

      // 100-Point Milestone Sound
      if (this.score > 0 && Math.floor(this.score / 100) > this.lastMilestone) {
        this.lastMilestone = Math.floor(this.score / 100);
        this.sound.playMilestone();
      }

      // Smooth Speed Scaling
      this.speed = Math.min(0.85, this.baseSpeed + Math.floor(this.score / 200) * 0.035);

      // Day / Night
      this.updateDayNight();
      this.updateHUD();

      // 2. Dino Jump Physics & Pose
      if (!this.isGrounded) {
        this.dinoY += this.dinoVy;
        this.dinoVy += this.gravity;

        if (this.dinoY <= 0) {
          this.dinoY = 0;
          this.dinoVy = 0;
          this.isGrounded = true;
        }
      }

      this.dinoGroup.position.y = this.dinoY;

      // Pose updates: Running stride vs Ducking
      if (this.isDucking) {
        // Flatten torso and head forward
        this.dinoBody.scale.set(1.4, 0.55, 1.0);
        this.dinoBody.position.set(0.2, 0.65, 0);
        this.headGroup.position.set(1.4, 0.8, 0);
        this.headGroup.rotation.z = -0.35;
        this.leftLegGroup.position.y = 0.45;
        this.rightLegGroup.position.y = 0.45;
      } else {
        // Normal running posture
        this.dinoBody.scale.set(1.0, 1.0, 1.0);
        this.dinoBody.position.set(0, 1.6, 0);
        this.headGroup.position.set(0.6, 2.3, 0);
        this.headGroup.rotation.z = 0;
        this.leftLegGroup.position.y = 0.9;
        this.rightLegGroup.position.y = 0.9;

        if (this.isGrounded) {
          this.leftLegGroup.rotation.z = Math.sin(this.runTime * 18) * 0.7;
          this.rightLegGroup.rotation.z = -Math.sin(this.runTime * 18) * 0.7;
        } else {
          // In air: tuck legs
          this.leftLegGroup.rotation.z = 0.4;
          this.rightLegGroup.rotation.z = -0.2;
        }
      }

      // 3. Move Track Markers & Parallax
      this.trackMarkers.children.forEach((marker) => {
        marker.position.x -= this.speed;
        if (marker.position.x < -25) {
          marker.position.x = 25;
        }
      });

      this.dunes.children.forEach((dune) => {
        dune.position.x -= this.speed * 0.25;
        if (dune.position.x < -40) {
          dune.position.x = 40;
        }
      });

      this.clouds.forEach((cloud) => {
        cloud.position.x -= this.speed * 0.12;
        if (cloud.position.x < -30) {
          cloud.position.x = 35;
        }
      });

      // 4. Spawn & Move Obstacles
      this.nextSpawnDistance -= this.speed;
      if (this.nextSpawnDistance <= 0) {
        this.spawnObstacle();
        // Spacing varies between 22 and 36 units
        this.nextSpawnDistance = 22 + Math.random() * 16;
      }

      // 5. Collision Check & Obstacle Updates
      const dinoBox = new THREE.Box3();
      // Shrink hitbox slightly (10%) for responsive, fair play
      dinoBox.setFromObject(this.dinoGroup);
      dinoBox.expandByScalar(-0.15);

      for (let i = this.obstacles.length - 1; i >= 0; i--) {
        const obs = this.obstacles[i];
        obs.mesh.position.x -= this.speed;

        // Wing flap animation for pterodactyls
        if (obs.type === 'ptero') {
          obs.wingTime += 0.2;
          obs.wingL.rotation.z = Math.sin(obs.wingTime) * 0.6;
          obs.wingR.rotation.z = -Math.sin(obs.wingTime) * 0.6;
        }

        // Bounding box collision
        const obsBox = new THREE.Box3().setFromObject(obs.mesh);
        obsBox.expandByScalar(-0.12);

        if (dinoBox.intersectsBox(obsBox)) {
          this.gameOver();
          return;
        }

        // Despawn offscreen
        if (obs.mesh.position.x < -20) {
          this.scene.remove(obs.mesh);
          obs.mesh.traverse((child) => {
            if (child.isMesh) {
              if (child.geometry) child.geometry.dispose();
              if (child.material) child.material.dispose();
            }
          });
          this.obstacles.splice(i, 1);
        }
      }

      // 6. Render
      this.renderer.render(this.scene, this.camera);

      // Loop
      this.requestFrame();
    }
  }

  // Export & Self-Initialize
  window.__DinoRunnerGame = DinoRunnerGame;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.dinoGameInstance = new DinoRunnerGame();
    });
  } else {
    window.dinoGameInstance = new DinoRunnerGame();
  }
})();
