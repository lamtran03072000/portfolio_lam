import './style.css';
import GLightbox from 'glightbox';
import 'glightbox/dist/css/glightbox.min.css';
import * as THREE from 'three';

// Initialize GLightbox for gallery popups
const lightbox = GLightbox({
    touchNavigation: true,
    loop: true,
    autoplayVideos: true,
    zoomable: true
});

// ----------------------------------------------------
// 1. THREE.JS BACKGROUND SCENE
// ----------------------------------------------------

const container = document.getElementById('canvas-container');

const scene = new THREE.Scene();
// Dark tech vibe, matching zinc-950
scene.background = new THREE.Color('#09090b');
// Add some subtle fog for depth
scene.fog = new THREE.FogExp2('#09090b', 0.001);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 30;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

// Create a particle system / abstract network
const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 800; // Visual density 4 (restrained but present)

const posArray = new Float32Array(particlesCount * 3);
// We will store original positions for spring/oscillation animations
const originalPosArray = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount * 3; i += 3) {
  // Spread particles across a wide volume
  const x = (Math.random() - 0.5) * 100;
  const y = (Math.random() - 0.5) * 100;
  const z = (Math.random() - 0.5) * 50 - 10;
  
  posArray[i] = x;
  posArray[i + 1] = y;
  posArray[i + 2] = z;
  
  originalPosArray[i] = x;
  originalPosArray[i + 1] = y;
  originalPosArray[i + 2] = z;
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
particlesGeometry.setAttribute('a_original', new THREE.BufferAttribute(originalPosArray, 3));

// Emerald accent color
const particlesMaterial = new THREE.PointsMaterial({
  size: 0.15,
  color: '#34d399', 
  transparent: true,
  opacity: 0.8,
  blending: THREE.AdditiveBlending
});

const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

// Add some subtle floating geometric lines
const lineMaterial = new THREE.LineBasicMaterial({
  color: '#10b981',
  transparent: true,
  opacity: 0.1,
});

const lineGeometry = new THREE.BufferGeometry();
// Connect some random particles to form a constellation look
const linePosArray = [];
for (let i = 0; i < 50; i++) {
  const p1Index = Math.floor(Math.random() * particlesCount) * 3;
  const p2Index = Math.floor(Math.random() * particlesCount) * 3;
  
  linePosArray.push(
    originalPosArray[p1Index], originalPosArray[p1Index+1], originalPosArray[p1Index+2],
    originalPosArray[p2Index], originalPosArray[p2Index+1], originalPosArray[p2Index+2]
  );
}
lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePosArray, 3));
const linesMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
scene.add(linesMesh);


// Mouse interaction variables
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;
let scrollY = 0;

const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;

document.addEventListener('mousemove', (event) => {
  mouseX = (event.clientX - windowHalfX) * 0.05;
  mouseY = (event.clientY - windowHalfY) * 0.05;
});

document.addEventListener('scroll', () => {
  scrollY = window.scrollY;
});

// Animation Loop (Oscillation + Spring Physics concepts from threejs-animation skill)
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const elapsedTime = clock.getElapsedTime();
  const delta = clock.getDelta();

  // Smooth damping for mouse parallax (camera movement)
  targetX = mouseX * 0.1;
  targetY = mouseY * 0.1;
  
  camera.position.x += (targetX - camera.position.x) * 0.05;
  camera.position.y += (-targetY - camera.position.y) * 0.05;
  
  // Tie scroll position to camera Z and overall rotation for a deeper parallax effect
  const scrollRatio = scrollY / (document.body.scrollHeight - window.innerHeight || 1);
  camera.position.z = 30 + scrollRatio * 20; // Move camera back as you scroll
  camera.lookAt(scene.position);

  // Procedural Animation: Oscillation + Scroll Rotation
  particlesMesh.rotation.y = elapsedTime * 0.05 + scrollRatio * Math.PI;
  linesMesh.rotation.y = elapsedTime * 0.05 + scrollRatio * Math.PI;
  particlesMesh.rotation.x = scrollRatio * 0.5;
  linesMesh.rotation.x = scrollRatio * 0.5;
  
  // Animate individual particles based on sine waves
  const positions = particlesGeometry.attributes.position.array;
  const original = particlesGeometry.attributes.a_original.array;
  
  for(let i = 0; i < particlesCount * 3; i+=3) {
    // Oscillation on Y axis based on original X position
    const offset = Math.sin(elapsedTime * 0.5 + original[i] * 0.1) * 2;
    positions[i+1] = original[i+1] + offset;
  }
  particlesGeometry.attributes.position.needsUpdate = true;
  
  // Also update line positions to match their original particles somewhat
  // For simplicity, we just let them rotate with the mesh, 
  // but if we wanted full connectivity we'd update line geometry too.

  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// ----------------------------------------------------
// 2. SCROLL ANIMATIONS (Intersection Observer)
// ----------------------------------------------------
// Simple reveal stagger alternative from taste-skill since we use Vanilla JS

const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.15
};

const observer = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Select elements to animate (exclude skill sequence elements to avoid conflict)
const sections = document.querySelectorAll('section:not(#skills-container), .experience-item, .project-card');

sections.forEach((el, index) => {
  // Set initial state
  el.style.opacity = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = `all 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.05}s`;
  observer.observe(el);
});

// ----------------------------------------------------
// 3. SKILLS SCROLL SEQUENCE
// ----------------------------------------------------
const skillsContainer = document.getElementById('skills-container');
const skillsProgressBar = document.getElementById('skills-progress-bar');
const skillSteps = document.querySelectorAll('.skill-step');

if (skillsContainer && skillsProgressBar && skillSteps.length > 0) {
  // Helper function to set initial/reset state
  const setSkillsState = (isMobile) => {
    skillSteps.forEach((step, idx) => {
      if (isMobile || idx === 0) {
        step.style.opacity = '1';
        step.style.transform = 'scale(1)';
        step.style.borderColor = 'rgba(16, 185, 129, 0.4)'; // emerald-500/40 border
        step.style.filter = 'grayscale(0)';
      } else {
        step.style.opacity = '0.3';
        step.style.transform = 'scale(0.98)';
        step.style.borderColor = 'rgba(39, 39, 42, 0.6)'; // zinc-800/60 border
        step.style.filter = 'grayscale(0.8)';
      }
    });
    if (isMobile) skillsProgressBar.style.width = '100%';
  };

  // Set initial state
  setSkillsState(window.innerWidth < 1024);

  document.addEventListener('scroll', () => {
    if (window.innerWidth < 1024) {
      setSkillsState(true);
      return;
    }

    const rect = skillsContainer.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    
    // Calculate progress
    const start = rect.top;
    const totalDistance = rect.height - viewportHeight;
    
    let progress = 0;
    if (start <= 0) {
      progress = Math.min(Math.max(Math.abs(start) / totalDistance, 0), 1);
    }
    
    // Update progress bar
    skillsProgressBar.style.width = `${progress * 100}%`;
    
    // Determine active step
    const stepIndex = Math.min(
      Math.floor(progress * skillSteps.length),
      skillSteps.length - 1
    );
    
    skillSteps.forEach((step, idx) => {
      if (idx <= stepIndex) {
        // Active (and previously activated)
        step.style.opacity = '1';
        step.style.transform = 'scale(1)';
        step.style.borderColor = 'rgba(16, 185, 129, 0.4)';
        step.style.filter = 'grayscale(0)';
      } else {
        // Inactive (not reached yet)
        step.style.opacity = '0.3';
        step.style.transform = 'scale(0.98)';
        step.style.borderColor = 'rgba(39, 39, 42, 0.6)';
        step.style.filter = 'grayscale(0.8)';
      }
    });
  });
}

// ----------------------------------------------------
// 4. EXPERIENCE VERTICAL SCROLL PROGRESS
// ----------------------------------------------------
function setupExperienceScroll(sectionId, bulletsClass, progressLineId) {
  const section = document.getElementById(sectionId);
  const progressLine = document.getElementById(progressLineId);
  const bullets = document.querySelectorAll(`.${bulletsClass}`);
  const cardId = sectionId.replace('exp-', '') + '-card-wrapper';
  const cardWrapper = document.getElementById(cardId);
  const cardInner = cardWrapper ? cardWrapper.querySelector('.glass-card') : null;

  if (section && progressLine && bullets.length > 0) {
    const setExperienceState = (isMobile) => {
      bullets.forEach((bullet) => {
        bullet.querySelector('.bullet-dot').style.backgroundColor = isMobile ? '#10b981' : '#3f3f46';
        bullet.querySelector('.bullet-glow').style.opacity = isMobile ? '0.5' : '0';
        bullet.querySelector('.bullet-text').style.color = isMobile ? '#e4e4e7' : '#52525b';
      });
      if (isMobile) {
        progressLine.style.height = '100%';
        if (cardInner) cardInner.style.transform = 'translateY(0)';
      }
    };

    // Initial state
    setExperienceState(window.innerWidth < 1024);

    document.addEventListener('scroll', () => {
      if (window.innerWidth < 1024) {
        setExperienceState(true);
        return;
      }

      const rect = section.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      const start = rect.top;
      // We start tracking when the section hits the top of the viewport
      const totalDistance = rect.height - viewportHeight;
      
      let progress = 0;
      if (start <= 0 && totalDistance > 0) {
        progress = Math.min(Math.max(Math.abs(start) / totalDistance, 0), 1);
      }
      
      // Auto-scroll the card content if it's taller than the viewport
      if (cardWrapper && cardInner) {
        const cardRect = cardWrapper.getBoundingClientRect();
        // Allow some padding at the bottom (e.g. 100px)
        const overflowAmount = Math.max(0, cardInner.scrollHeight - viewportHeight + 150);
        if (overflowAmount > 0) {
          // Translate up based on progress
          cardInner.style.transform = `translateY(-${progress * overflowAmount}px)`;
        }
      }
      
      // Calculate dynamic bullet progress based on content height
      let bulletProgress = progress;
      if (cardInner) {
        const ul = section.querySelector('ul');
        if (ul) {
          const bulletsEndPos = ul.offsetTop + ul.offsetHeight;
          const totalInnerHeight = cardInner.scrollHeight;
          const completionFraction = bulletsEndPos / totalInnerHeight;
          // Scale progress so it reaches 100% when we've scrolled past the bullets
          bulletProgress = Math.min(1, progress / Math.max(0.1, completionFraction));
        }
      }

      // Update vertical progress bar height
      progressLine.style.height = `${bulletProgress * 100}%`;
      
      // Determine active bullets
      // We multiply by 1.1 so the last item activates slightly before 100% bullet progress
      const stepIndex = Math.min(
        Math.floor(bulletProgress * bullets.length * 1.1),
        bullets.length
      );
      
      bullets.forEach((bullet, idx) => {
        if (idx < stepIndex) {
          bullet.querySelector('.bullet-dot').style.backgroundColor = '#10b981'; // emerald-500
          bullet.querySelector('.bullet-glow').style.opacity = '0.5';
          bullet.querySelector('.bullet-text').style.color = '#e4e4e7'; // zinc-200
        } else {
          bullet.querySelector('.bullet-dot').style.backgroundColor = '#3f3f46'; // zinc-700
          bullet.querySelector('.bullet-glow').style.opacity = '0';
          bullet.querySelector('.bullet-text').style.color = '#52525b'; // zinc-600
        }
      });
    });
  }
}

setupExperienceScroll('exp-urbox', 'urbox-bullet', 'urbox-progress-line');
setupExperienceScroll('exp-cybersoft', 'cybersoft-bullet', 'cybersoft-progress-line');

// ----------------------------------------------------
// 5. TOC SCROLLSPY
// ----------------------------------------------------
const tocLinks = document.querySelectorAll('.toc-link');
const tocProgress = document.getElementById('toc-progress');

if (tocLinks.length > 0) {
  // Smooth scroll for ToC clicks
  tocLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('data-target');
      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        targetSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Scrollspy logic
  document.addEventListener('scroll', () => {
    const scrollPosition = window.scrollY + window.innerHeight / 3;
    let currentActiveIndex = 0;

    tocLinks.forEach((link, index) => {
      const targetId = link.getAttribute('data-target');
      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        // Find absolute top position
        let sectionTop = targetSection.offsetTop;
        let parent = targetSection.offsetParent;
        while (parent) {
          sectionTop += parent.offsetTop;
          parent = parent.offsetParent;
        }
        
        if (scrollPosition >= sectionTop) {
          currentActiveIndex = index;
        }
      }
    });

    // Update ToC UI
    tocLinks.forEach((link, index) => {
      if (index === currentActiveIndex) {
        link.classList.add('active');
        link.querySelector('.toc-dot').style.backgroundColor = '#10b981'; // emerald-500
        link.querySelector('.toc-glow').style.opacity = '0.5';
        link.querySelector('span').style.color = '#34d399'; // emerald-400
        link.querySelector('span').style.fontWeight = '700'; // bold
      } else {
        link.classList.remove('active');
        link.querySelector('.toc-dot').style.backgroundColor = '#3f3f46'; // zinc-700
        link.querySelector('.toc-glow').style.opacity = '0';
        link.querySelector('span').style.color = '#71717a'; // zinc-500
        link.querySelector('span').style.fontWeight = '500'; // medium
      }
    });

    // Update ToC Progress line
    if (tocLinks.length > 1) {
      const progressPercent = (currentActiveIndex / (tocLinks.length - 1)) * 100;
      if (tocProgress) {
        tocProgress.style.height = `calc(${progressPercent}% + 12px)`; // +12px to cover the dot
      }
    }
  });
  
  // Trigger once on load
  window.dispatchEvent(new Event('scroll'));
}
