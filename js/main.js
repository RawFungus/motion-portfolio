const sectionLinks = [...document.querySelectorAll('[data-section-link]')];
const observedSections = [
  document.querySelector('#intro'),
  ...document.querySelectorAll('[data-section]')
].filter(Boolean);

const setActiveLink = (id) => {
  sectionLinks.forEach((link) => {
    link.classList.toggle('is-active', link.dataset.sectionLink === id);
  });
};

const navObserver = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (visible) setActiveLink(visible.target.id);
  },
  {
    rootMargin: '-20% 0px -55% 0px',
    threshold: [0.08, 0.25, 0.5]
  }
);

observedSections.forEach((section) => navObserver.observe(section));
setActiveLink('intro');

// Автовоспроизведение видео только когда оно находится рядом с viewport.
// После добавления видео используйте атрибут data-autoplay.
const videos = [...document.querySelectorAll('video[data-autoplay]')];

if (videos.length) {
  const videoObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.isIntersecting) {
          const playPromise = video.play();
          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(() => {});
          }
        } else {
          video.pause();
        }
      });
    },
    { rootMargin: '160px 0px', threshold: 0.15 }
  );

  videos.forEach((video) => videoObserver.observe(video));
}

// Компактное desktop-оглавление появляется только после Intro.
// Оно не участвует во внутренней сетке проектов; на широких экранах
// под него резервируется только внешнее пространство слева от main.
const desktopRail = document.querySelector('[data-desktop-rail]');
const introSection = document.querySelector('#intro');
const desktopRailMedia = window.matchMedia('(min-width: 1440px)');

const setDesktopRailVisible = (visible) => {
  if (!desktopRail) return;

  const shouldShow = Boolean(visible && desktopRailMedia.matches);
  desktopRail.classList.toggle('is-visible', shouldShow);
  desktopRail.setAttribute('aria-hidden', String(!shouldShow));
};

let railUpdateQueued = false;
const updateDesktopRail = () => {
  railUpdateQueued = false;
  if (!desktopRail || !introSection) return;

  const introRect = introSection.getBoundingClientRect();
  const introMostlyPassed = introRect.bottom <= window.innerHeight * 0.28;
  setDesktopRailVisible(introMostlyPassed);
};

const requestDesktopRailUpdate = () => {
  if (railUpdateQueued) return;
  railUpdateQueued = true;
  window.requestAnimationFrame(updateDesktopRail);
};

window.addEventListener('scroll', requestDesktopRailUpdate, { passive: true });
window.addEventListener('resize', requestDesktopRailUpdate);

if (desktopRailMedia.addEventListener) {
  desktopRailMedia.addEventListener('change', requestDesktopRailUpdate);
} else if (desktopRailMedia.addListener) {
  desktopRailMedia.addListener(requestDesktopRailUpdate);
}

document.querySelectorAll('.project-index a[href^="#"], .desktop-rail a[href^="#"]').forEach((link) => {
  link.addEventListener('click', () => {
    const targetId = link.getAttribute('href').slice(1);
    setActiveLink(targetId);
    setDesktopRailVisible(targetId !== 'intro');
  });
});

requestDesktopRailUpdate();

// The nut in the intro index is driven by page scrolling.
// Scroll adds angular velocity; after scrolling stops, inertia keeps the nut
// moving briefly and friction brings it smoothly to rest.
const indexNut = document.querySelector('[data-index-nut]');
const reducedMotionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');

if (indexNut) {
  const SCROLL_FORCE = 0.018;
  const INERTIA = 0.92;
  const MAX_ANGULAR_VELOCITY = 10;
  const STOP_SPEED = 0.02;

  let nutRotation = 0;
  let angularVelocity = 0;
  let lastScrollY = window.scrollY;
  let lastFrameTime = 0;
  let nutFrameId = null;

  const stopNutAnimation = () => {
    if (nutFrameId !== null) {
      window.cancelAnimationFrame(nutFrameId);
    }

    angularVelocity = 0;
    lastFrameTime = 0;
    nutFrameId = null;
  };

  const animateNut = (timestamp) => {
    const frameScale = lastFrameTime
      ? Math.min((timestamp - lastFrameTime) / (1000 / 60), 2)
      : 1;

    lastFrameTime = timestamp;
    nutRotation = (nutRotation + angularVelocity * frameScale) % 360;
    angularVelocity *= Math.pow(INERTIA, frameScale);
    indexNut.style.transform = `rotate(${nutRotation}deg)`;

    if (Math.abs(angularVelocity) <= STOP_SPEED) {
      stopNutAnimation();
      return;
    }

    nutFrameId = window.requestAnimationFrame(animateNut);
  };

  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    const scrollDelta = currentScrollY - lastScrollY;
    lastScrollY = currentScrollY;

    if (reducedMotionMedia.matches || scrollDelta === 0) return;

    angularVelocity += scrollDelta * SCROLL_FORCE;
    angularVelocity = Math.max(
      -MAX_ANGULAR_VELOCITY,
      Math.min(MAX_ANGULAR_VELOCITY, angularVelocity)
    );

    if (nutFrameId === null) {
      nutFrameId = window.requestAnimationFrame(animateNut);
    }
  }, { passive: true });

  const handleReducedMotionChange = (event) => {
    lastScrollY = window.scrollY;
    if (event.matches) stopNutAnimation();
  };

  if (reducedMotionMedia.addEventListener) {
    reducedMotionMedia.addEventListener('change', handleReducedMotionChange);
  } else if (reducedMotionMedia.addListener) {
    reducedMotionMedia.addListener(handleReducedMotionChange);
  }
}


// Images and videos open in a viewport-sized media viewer.
// Videos are cloned so the autoplay element in the project layout stays in place.
const mediaViewer = document.querySelector('[data-media-viewer]');
const mediaViewerStage = document.querySelector('[data-media-viewer-stage]');
const mediaViewerClose = document.querySelector('[data-media-viewer-close]');
const mediaViewerPage = document.querySelector('.page-shell');

if (mediaViewer && mediaViewerStage && mediaViewerClose) {
  const mediaFrames = [...document.querySelectorAll('.media-frame')];
  let activeSource = null;
  let activeViewerMedia = null;
  let sourceRect = null;
  let sourceVideoWasPlaying = false;
  let sourceVideoTime = 0;
  let previousFocus = null;

  const fitViewerMedia = () => {
    if (!activeViewerMedia || !sourceRect) return;

    const stageRect = mediaViewerStage.getBoundingClientRect();
    let mediaWidth = sourceRect.width;
    let mediaHeight = sourceRect.height;

    if (activeViewerMedia instanceof HTMLImageElement) {
      mediaWidth = activeViewerMedia.naturalWidth || mediaWidth;
      mediaHeight = activeViewerMedia.naturalHeight || mediaHeight;
    } else if (activeViewerMedia instanceof HTMLVideoElement) {
      mediaWidth = activeViewerMedia.videoWidth || mediaWidth;
      mediaHeight = activeViewerMedia.videoHeight || mediaHeight;
    }

    if (!mediaWidth || !mediaHeight || !stageRect.width || !stageRect.height) return;

    const scale = Math.min(
      stageRect.width / mediaWidth,
      stageRect.height / mediaHeight
    );

    activeViewerMedia.style.width = `${Math.max(1, Math.floor(mediaWidth * scale))}px`;
    activeViewerMedia.style.height = `${Math.max(1, Math.floor(mediaHeight * scale))}px`;
  };

  const closeMediaViewer = () => {
    if (mediaViewer.hidden) return;

    if (
      activeSource instanceof HTMLVideoElement &&
      activeViewerMedia instanceof HTMLVideoElement
    ) {
      if (activeViewerMedia.readyState >= 1 && Number.isFinite(activeViewerMedia.currentTime)) {
        try {
          activeSource.currentTime = activeViewerMedia.currentTime;
        } catch (error) {
          // Keep the original time if the browser cannot seek yet.
        }
      }

      activeViewerMedia.pause();

      if (sourceVideoWasPlaying) {
        const playPromise = activeSource.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {});
        }
      }
    }

    mediaViewer.hidden = true;
    mediaViewerStage.replaceChildren();
    document.body.classList.remove('media-viewer-open');
    document.body.style.removeProperty('--media-viewer-scrollbar');
    mediaViewerPage?.removeAttribute('inert');
    desktopRail?.removeAttribute('inert');

    const focusTarget = previousFocus;
    activeSource = null;
    activeViewerMedia = null;
    sourceRect = null;
    sourceVideoWasPlaying = false;
    sourceVideoTime = 0;
    previousFocus = null;

    if (focusTarget instanceof HTMLElement) {
      focusTarget.focus({ preventScroll: true });
    }
  };

  const openMediaViewer = (source, trigger) => {
    if (!mediaViewer.hidden) return;

    activeSource = source;
    sourceRect = source.getBoundingClientRect();
    previousFocus = document.activeElement;
    activeViewerMedia = source.cloneNode(true);
    activeViewerMedia.classList.add('media-viewer__asset');
    activeViewerMedia.removeAttribute('id');
    activeViewerMedia.removeAttribute('data-autoplay');

    if (activeViewerMedia instanceof HTMLImageElement) {
      activeViewerMedia.loading = 'eager';
      activeViewerMedia.addEventListener('load', fitViewerMedia, { once: true });
    }

    if (
      source instanceof HTMLVideoElement &&
      activeViewerMedia instanceof HTMLVideoElement
    ) {
      sourceVideoWasPlaying = !source.paused;
      sourceVideoTime = source.currentTime || 0;
      source.pause();

      activeViewerMedia.controls = true;
      activeViewerMedia.autoplay = true;
      activeViewerMedia.playsInline = true;
      activeViewerMedia.muted = source.muted;

      activeViewerMedia.addEventListener('loadedmetadata', () => {
        const duration = activeViewerMedia.duration;
        const maxTime = Number.isFinite(duration)
          ? Math.max(0, duration - 0.05)
          : sourceVideoTime;

        try {
          activeViewerMedia.currentTime = Math.min(sourceVideoTime, maxTime);
        } catch (error) {
          // Starting from zero is acceptable if seeking is not available yet.
        }

        fitViewerMedia();
        const playPromise = activeViewerMedia.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {});
        }
      }, { once: true });
    }

    const scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    document.body.style.setProperty('--media-viewer-scrollbar', `${scrollbarWidth}px`);
    document.body.classList.add('media-viewer-open');
    mediaViewerPage?.setAttribute('inert', '');
    desktopRail?.setAttribute('inert', '');

    mediaViewerStage.replaceChildren(activeViewerMedia);
    mediaViewer.hidden = false;
    window.requestAnimationFrame(() => {
      fitViewerMedia();
      mediaViewerClose.focus({ preventScroll: true });
    });

    trigger.blur();
  };

  mediaFrames.forEach((frame) => {
    const source = frame.querySelector(':scope > img, :scope > video');
    if (!source) return;

    frame.classList.add('is-viewable');
    frame.tabIndex = 0;
    frame.setAttribute('role', 'button');
    frame.setAttribute('aria-haspopup', 'dialog');
    frame.setAttribute(
      'aria-label',
      source instanceof HTMLVideoElement ? 'Open video fullscreen' : 'Open image fullscreen'
    );

    frame.addEventListener('click', () => openMediaViewer(source, frame));
    frame.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      openMediaViewer(source, frame);
    });
  });

  mediaViewerClose.addEventListener('click', closeMediaViewer);

  mediaViewer.addEventListener('click', (event) => {
    if (event.target === mediaViewer || event.target === mediaViewerStage) {
      closeMediaViewer();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !mediaViewer.hidden) {
      closeMediaViewer();
    }
  });

  window.addEventListener('resize', () => {
    if (!mediaViewer.hidden) fitViewerMedia();
  });
}
