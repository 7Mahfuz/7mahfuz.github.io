/**
 * Portfolio v2 - Three.js 3D Wireframe Scene & Interactive UI Controller
 * Al-Amin Mahfuzur Rahman | Senior Software Engineer - Enterprise Software & Mobile Apps
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
     4. Project Details Modal Controller
     -------------------------------------------------------------------------- */
  const PROJECTS_DATA = {
    'altios-goglobal': {
      title: 'Altios — GoGlobal International Expansion Platform',
      company: 'Bizzntek Ltd.',
      client: 'Altios (GoGlobal)',
      clientClass: 'us',
      clientIcon: 'fas fa-earth-americas',
      role: 'Senior Software Engineer',
      tech: ['C#', 'ASP.NET Core', 'Dynamics 365 Business Central', 'AL Language', 'RESTful APIs', 'MS SQL Server', 'Multi-Region Compliance'],
      desc: 'Enterprise platform engineering for Altios (altios.ai / altios.com) and their GoGlobal international expansion services. Facilitating global market entry, international corporate entity setup, cross-border compliance tracking, and ERP data harmonization for multinational enterprises expanding across worldwide markets.',
      highlights: [
        'Architected scalable backend APIs and business logic supporting multi-country compliance frameworks and global entity onboarding.',
        'Engineered seamless ERP synchronization workflows between Microsoft Business Central and web services.',
        'Collaborated directly with international stakeholders on cross-border data security and system localization.'
      ]
    },
    'western-digital': {
      title: 'Western Digital — Enterprise System Integration & Data Solutions',
      company: 'Bizzntek Ltd.',
      client: 'Western Digital',
      clientClass: 'us',
      clientIcon: 'fas fa-hard-drive',
      role: 'Senior Software Engineer',
      tech: ['C#', 'ASP.NET Core', 'MS SQL Server', 'Enterprise Integration', 'High-Volume Data Processing', 'Architecture Refactoring'],
      desc: 'Engineered mission-critical software modules and enterprise data integration workflows for Western Digital, a Fortune 500 global leader in digital storage and memory technology. Focused on transaction reliability, system integration pipelines, and high-performance database processing.',
      highlights: [
        'Designed high-throughput backend modules tailored for mission-critical enterprise operations and strict transaction consistency.',
        'Engineered secure API interfaces and automated data pipelines connecting internal enterprise systems.',
        'Led architectural code refactoring sessions and performance optimizations to eliminate processing latency.'
      ]
    },
    'bc-localization': {
      title: 'Microsoft Dynamics 365 Business Central Localization',
      company: 'Bizzntek Ltd.',
      client: 'Microsoft (NBR & Bangladesh Fiscal Localization)',
      clientClass: 'msft',
      clientIcon: 'fab fa-microsoft',
      role: 'Lead Extension Developer',
      tech: ['AL Language', 'Dynamics 365 Business Central', 'RDLC Reports', 'NBR Fiscal Standards', 'VAT / Tax Accounting', 'ERP Architecture'],
      desc: 'Pivotal national localization project preparing Microsoft Dynamics 365 Business Central ERP for the Bangladesh enterprise market. Engineered custom AL extensions compliant with National Board of Revenue (NBR) tax protocols, fiscal laws, VAT withholding calculations, and regulatory government audit reporting.',
      highlights: [
        'Authored custom Microsoft Business Central extensions using AL language to comply with Bangladesh Government & NBR fiscal requirements.',
        'Designed complex RDLC reports for official tax withholding, VAT summaries, and statutory audit registers.',
        'Collaborated closely with enterprise domain architects and government fiscal advisors to ensure 100% regulatory compliance.'
      ]
    },
    'rent-grid': {
      title: 'Rent & Property Management ERP',
      company: 'Bizzntek Ltd.',
      client: 'Rent Grid (USA)',
      clientClass: 'us',
      clientIcon: 'fas fa-building',
      role: 'Full-Stack ERP Developer',
      tech: ['C#', 'ASP.NET MVC', 'MS Business Central', 'Bootstrap 4', 'Payment Gateway Integration', 'jQuery', 'MS SQL Server'],
      desc: 'Comprehensive real estate ERP for US landlords and property managers. Supports unit management, tenant onboarding, automated rent billing, online payment gateway processing, and financial balance sheets.',
      highlights: [
        'Implemented tenant onboarding workflows, unit lease tracking, and automated scheduled invoicing.',
        'Integrated secure third-party payment gateways allowing tenants to pay rent online seamlessly.',
        'Developed financial ledger reporting giving landlords real-time visibility into income, expenses, and security deposits.'
      ]
    },
    'hotel-grid': {
      title: 'Hotel Operations & Guest Management ERP',
      company: 'Bizzntek Ltd.',
      client: 'Hotel Grid (USA)',
      clientClass: 'us',
      clientIcon: 'fas fa-hotel',
      role: 'Full-Stack ERP Developer',
      tech: ['C#', 'ASP.NET MVC', 'MS Business Central', 'Bootstrap 4', 'RESTful API', 'jQuery', 'MS SQL Server'],
      desc: 'End-to-end hotel operations software supporting multi-branch room reservations, guest check-in/check-out lifecycle, automated invoice settlement, and real-time occupancy reporting.',
      highlights: [
        'Engineered room allocation workflows with live status tracking and housekeeping schedules.',
        'Created unified guest billing module with consolidated invoices for room charges and amenities.',
        'Delivered administrative dashboards with occupancy metrics and revenue summaries.'
      ]
    },
    'factory-mgmt': {
      title: 'Factory Management ERP',
      company: 'SmartSoft Technology',
      client: 'MH Golden Jute Ltd. (Bangladesh)',
      clientClass: 'industrial',
      clientIcon: 'fas fa-industry',
      role: 'Full-Stack Engineer',
      tech: ['C#', 'ASP.NET Web Forms', 'MS SQL Server', 'T-SQL Stored Procedures', 'jQuery', 'Ledger Engine'],
      desc: 'Classical enterprise industrial ERP system built for MH Golden Jute Ltd. Manages raw material intake, multi-stage jute manufacturing workflows, inventory warehouse tracking, and automated financial accounting.',
      highlights: [
        'Built core modules for raw jute batch processing, weight logs, and production tracking.',
        'Authored optimized MS SQL Server stored procedures for automated ledger calculation and inventory reconciliation.',
        'Designed reporting dashboards for plant supervisors and enterprise accountants.'
      ]
    },
    'task-mgmt': {
      title: 'Enterprise Task & Workflow Management',
      company: 'SmartSoft Technology',
      client: 'MH Golden Jute Ltd. (Bangladesh)',
      clientClass: 'industrial',
      clientIcon: 'fas fa-list-check',
      role: 'Full-Stack Engineer',
      tech: ['C#', 'ASP.NET Web Forms', 'MS SQL Server', 'jQuery', 'Role-Based Access Control', 'Reporting Engine'],
      desc: 'Internal organizational workflow and task delegation platform. Facilitates managerial work distribution across departments, status updating, milestone tracking, and performance reporting.',
      highlights: [
        'Developed role-based task delegation system with status pipelines (Pending, In-Progress, Review, Completed).',
        'Engineered notification alerts and milestone deadline tracking for departmental staff.',
        'Built exportable performance audit and progress reporting tools.'
      ]
    },
    'smart-sell': {
      title: 'Smart Sell POS & Inventory Ledger',
      company: 'SmartSoft Technology',
      client: 'Kushtia Tech (Bangladesh)',
      clientClass: '',
      clientIcon: 'fas fa-cash-register',
      role: 'Full-Stack Engineer',
      tech: ['C#', 'ASP.NET Web Forms', 'MS SQL Server', 'jQuery', 'POS Architecture', 'Accounting Ledger'],
      desc: 'Point of Sale and field-agent commercial inventory software. Allows sales reps to dispatch orders on the road, track stock in warehouses, and presents accounting audits to administrators.',
      highlights: [
        'Implemented sales representative access portal for mobile order taking and dispatch logs.',
        'Constructed warehouse inventory tracking with automated stock replenishment triggers.',
        'Built double-entry financial ledger and customer billing ledger modules.'
      ]
    },
    'garments-hr': {
      title: 'Garments HR & Biometric Payroll System',
      company: 'GTRBD Ltd.',
      client: 'FnF Fashion BD (Bangladesh)',
      clientClass: 'industrial',
      clientIcon: 'fas fa-fingerprint',
      role: 'Software Engineer',
      tech: ['C#', 'ASP.NET MVC 5', 'MS SQL Server', 'ZKT Fingerprint Device SDK', 'Bootstrap 3', 'jQuery'],
      desc: 'Industrial HR and automated biometric payroll software for a large garment manufacturing operation. Direct integration with physical ZKT biometric devices to ingest punch data, record shifts, and compute automated monthly salaries.',
      highlights: [
        'Integrated ZKT biometric fingerprint punch hardware with the backend attendance database.',
        'Engineered automated calculation engine for overtime, late arrivals, unexcused absences, and festival bonuses.',
        'Automated monthly payroll generation and pay-slip printing for hundreds of factory workers.'
      ]
    },
    'motorshut': {
      title: 'Motorshut — UK Quality Used Car Marketplace',
      company: 'Personal / Independent Project',
      client: 'Motors Hut Ltd (Rainham, England, UK)',
      clientClass: 'us',
      clientIcon: 'fas fa-car-side',
      role: 'Full-Stack Web Architect',
      tech: ['Web Platform Architecture', 'SEO & Structured JSON-LD', 'Vehicle Filtering System', 'Lead Engine', 'Responsive UI'],
      desc: 'Motors Hut Ltd (motorshut.com) is a comprehensive online UK automotive dealership and verified vehicle marketplace based in Rainham, Essex, England. The platform provides car buyers with complete transparent inspection histories, MOT verification, clear service records, dynamic vehicle filtering, and integrated customer consultation booking.',
      highlights: [
        'Engineered complete vehicle inventory catalog with high-resolution image galleries and granular technical specifications.',
        'Built full SEO architecture with AutoDealer Schema.org JSON-LD microdata for premier Google visibility.',
        'Implemented streamlined buyer inquiry pipelines, WhatsApp direct connect, and mobile-friendly test-drive scheduling.'
      ]
    },
    'mapcars': {
      title: 'MapCars UK — Ride Sharing & Passenger Mobility Ecosystem',
      company: 'Personal / Independent Project',
      client: 'MapCars Ltd (Chichester, South Coast UK)',
      clientClass: 'us',
      clientIcon: 'fas fa-taxi',
      role: 'Full-Stack Developer',
      tech: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Interactive Geolocation & Route Maps', 'Fare Algorithm', 'Turbopack'],
      desc: 'Next-generation passenger ride-sharing web platform and mobile application ecosystem (mapcars.uk) operating across the South Coast of England (Southampton, Portsmouth, Chichester, Brighton, and Worthing). Delivers upfront guaranteed fares, real-time vehicle dispatch tracking, digital wallet balances, and streamlined driver onboarding.',
      highlights: [
        'Architected modern, responsive frontend with interactive vehicle category previews and booking flows.',
        'Engineered real-time route visualization with pickup/drop-off estimation across coastal UK transportation hubs.',
        'Constructed driver partner registration portal with automated commission calculations and credential audits.'
      ]
    },
    'vetmartbd': {
      title: 'VetMart BD — Veterinary Healthcare & Farm Products E-Commerce',
      company: 'Personal / Independent Project',
      client: 'VetMart Bangladesh',
      clientClass: 'industrial',
      clientIcon: 'fas fa-heart-pulse',
      role: 'Full-Stack E-Commerce Developer',
      tech: ['Next.js', 'React', 'Tailwind CSS', 'Bengali Localization', 'Vercel Serverless', 'PostgreSQL / Prisma', 'E-Commerce Engine'],
      desc: 'VetMart BD (vetmartbd.vercel.app) is a dedicated agro-veterinary e-commerce platform serving livestock farm owners, veterinarians, and cattle/poultry breeders across Bangladesh. Solves the supply-chain challenge of accessing verified veterinary medicines, nutritional feed supplements, and agricultural supplies.',
      highlights: [
        'Engineered multi-category product catalog with search, species filtering (Cattle, Poultry, Dairy, Fish), and batch tracking.',
        'Implemented dual-language support (Bengali & English) tailored for grassroots farm managers and veterinary professionals.',
        'Deployed on high-availability cloud architecture with automated edge caching on Vercel.'
      ]
    }
  };

  function initProjectModals() {
    const modal = document.getElementById('project-modal');
    if (!modal) return;

    const modalTitle = document.getElementById('modal-title');
    const modalCompany = document.getElementById('modal-company');
    const modalClient = document.getElementById('modal-client');
    const modalTechStack = document.getElementById('modal-tech-stack');
    const modalDesc = document.getElementById('modal-desc');
    const modalHighlights = document.getElementById('modal-highlights');
    const closeBtn = modal.querySelector('.modal-close-btn');

    function openModal(projectId) {
      const data = PROJECTS_DATA[projectId];
      if (!data) return;

      modalTitle.textContent = data.title;
      modalCompany.textContent = data.company;

      modalClient.className = 'client-pill ' + (data.clientClass || '');
      modalClient.innerHTML = '<i class="' + data.clientIcon + '"></i> ' + data.client;

      modalTechStack.innerHTML = data.tech.map(t => '<span class="tech-tag primary">' + t + '</span>').join('');
      modalDesc.textContent = data.desc;

      modalHighlights.innerHTML = data.highlights.map(h => '<li>' + h + '</li>').join('');

      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    document.querySelectorAll('.project-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const pid = pill.getAttribute('data-project');
        openModal(pid);
      });
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) {
        closeModal();
      }
    });
  }

  /* --------------------------------------------------------------------------
     DOM Ready Bootstrapper
     -------------------------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    initThreeHero();
    initNavigation();
    initEmailCopy();
    initProjectModals();
  });

})();
