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

// Все видео на сайте принудительно без звука.
// Это остается в силе даже если в новом файле появится аудиодорожка.
const forceMuteVideo = (video) => {
  const keepMuted = () => {
    if (!video.muted) video.muted = true;
    if (video.volume !== 0) video.volume = 0;
  };

  video.defaultMuted = true;
  video.muted = true;
  video.volume = 0;
  video.setAttribute('muted', '');
  video.addEventListener('volumechange', keepMuted);
};

const allVideos = [...document.querySelectorAll('video')];
allVideos.forEach(forceMuteVideo);

// Автовоспроизведение видео только когда оно находится рядом с viewport.
// После добавления видео используйте атрибут data-autoplay.
const videos = allVideos.filter((video) => video.hasAttribute('data-autoplay'));

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
// Each .media-area acts as its own gallery, so arrows never jump between projects.
// Videos are cloned so the autoplay element in the project layout stays in place.
const mediaViewer = document.querySelector('[data-media-viewer]');
const mediaViewerStage = document.querySelector('[data-media-viewer-stage]');
const mediaViewerClose = document.querySelector('[data-media-viewer-close]');
const mediaViewerPrev = document.querySelector('[data-media-viewer-prev]');
const mediaViewerNext = document.querySelector('[data-media-viewer-next]');
const mediaViewerPage = document.querySelector('.page-shell');

if (
  mediaViewer &&
  mediaViewerStage &&
  mediaViewerClose &&
  mediaViewerPrev &&
  mediaViewerNext
) {
  const mediaFrames = [...document.querySelectorAll('.media-frame')];
  let activeSource = null;
  let activeViewerMedia = null;
  let activeGroup = [];
  let activeIndex = -1;
  let sourceRect = null;
  let sourceVideoWasPlaying = false;
  let previousFocus = null;

  const getFrameSource = (frame) => frame.querySelector(':scope > img, :scope > video');

  const getMediaGroup = (frame) => {
    const groupRoot = frame.closest('.media-area');
    if (!groupRoot) {
      const source = getFrameSource(frame);
      return source ? [source] : [];
    }

    return [...groupRoot.querySelectorAll('.media-frame')]
      .map(getFrameSource)
      .filter(Boolean);
  };

  const updateViewerNavigation = () => {
    const hasSiblings = activeGroup.length > 1;
    mediaViewerPrev.hidden = !hasSiblings;
    mediaViewerNext.hidden = !hasSiblings;

    if (!hasSiblings || activeIndex < 0) return;

    const position = activeIndex + 1;
    const total = activeGroup.length;
    mediaViewerPrev.setAttribute('aria-label', `Previous media (${position} of ${total})`);
    mediaViewerNext.setAttribute('aria-label', `Next media (${position} of ${total})`);
  };

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

  const releaseActiveVideo = () => {
    if (
      !(activeSource instanceof HTMLVideoElement) ||
      !(activeViewerMedia instanceof HTMLVideoElement)
    ) {
      sourceVideoWasPlaying = false;
      return;
    }

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

    sourceVideoWasPlaying = false;
  };

  const showViewerSource = (source) => {
    releaseActiveVideo();

    activeSource = source;
    sourceRect = source.getBoundingClientRect();
    activeViewerMedia = source.cloneNode(true);
    activeViewerMedia.classList.add('media-viewer__asset');
    activeViewerMedia.removeAttribute('id');
    activeViewerMedia.removeAttribute('data-autoplay');

    if (activeViewerMedia instanceof HTMLImageElement) {
      activeViewerMedia.loading = 'eager';
    }

    if (
      source instanceof HTMLVideoElement &&
      activeViewerMedia instanceof HTMLVideoElement
    ) {
      const sourceVideo = source;
      const viewerVideo = activeViewerMedia;
      const startTime = source.currentTime || 0;

      sourceVideoWasPlaying = !source.paused;
      source.pause();

      viewerVideo.controls = true;
      viewerVideo.autoplay = true;
      viewerVideo.playsInline = true;
      forceMuteVideo(viewerVideo);

      const startViewerVideo = () => {
        if (activeViewerMedia !== viewerVideo || activeSource !== sourceVideo) return;

        const duration = viewerVideo.duration;
        const maxTime = Number.isFinite(duration)
          ? Math.max(0, duration - 0.05)
          : startTime;

        try {
          viewerVideo.currentTime = Math.min(startTime, maxTime);
        } catch (error) {
          // Starting from zero is acceptable if seeking is not available yet.
        }

        fitViewerMedia();
        const playPromise = viewerVideo.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {});
        }
      };

      viewerVideo.addEventListener('loadedmetadata', startViewerVideo, { once: true });
    }

    mediaViewerStage.replaceChildren(activeViewerMedia);

    if (activeViewerMedia instanceof HTMLImageElement) {
      if (activeViewerMedia.complete) {
        fitViewerMedia();
      } else {
        activeViewerMedia.addEventListener('load', fitViewerMedia, { once: true });
      }
    } else if (
      activeViewerMedia instanceof HTMLVideoElement &&
      activeViewerMedia.readyState >= 1
    ) {
      // Metadata can already be available when the browser has this video cached.
      activeViewerMedia.dispatchEvent(new Event('loadedmetadata'));
    }

    updateViewerNavigation();
    window.requestAnimationFrame(fitViewerMedia);
  };

  const navigateMediaViewer = (direction) => {
    if (mediaViewer.hidden || activeGroup.length < 2) return;

    activeIndex = (
      activeIndex + direction + activeGroup.length
    ) % activeGroup.length;

    showViewerSource(activeGroup[activeIndex]);
  };

  const closeMediaViewer = () => {
    if (mediaViewer.hidden) return;

    releaseActiveVideo();

    mediaViewer.hidden = true;
    mediaViewerStage.replaceChildren();
    document.body.classList.remove('media-viewer-open');
    document.body.style.removeProperty('--media-viewer-scrollbar');
    mediaViewerPage?.removeAttribute('inert');
    desktopRail?.removeAttribute('inert');

    const focusTarget = previousFocus;
    activeSource = null;
    activeViewerMedia = null;
    activeGroup = [];
    activeIndex = -1;
    sourceRect = null;
    previousFocus = null;
    updateViewerNavigation();

    if (focusTarget instanceof HTMLElement) {
      focusTarget.focus({ preventScroll: true });
    }
  };

  const openMediaViewer = (source, trigger) => {
    if (!mediaViewer.hidden) return;

    activeGroup = getMediaGroup(trigger);
    activeIndex = activeGroup.indexOf(source);

    if (activeIndex < 0) {
      activeGroup = [source];
      activeIndex = 0;
    }

    previousFocus = document.activeElement;

    const scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    document.body.style.setProperty('--media-viewer-scrollbar', `${scrollbarWidth}px`);
    document.body.classList.add('media-viewer-open');
    mediaViewerPage?.setAttribute('inert', '');
    desktopRail?.setAttribute('inert', '');

    mediaViewer.hidden = false;
    showViewerSource(source);

    window.requestAnimationFrame(() => {
      fitViewerMedia();
      mediaViewerClose.focus({ preventScroll: true });
    });

    trigger.blur();
  };

  mediaFrames.forEach((frame) => {
    const source = getFrameSource(frame);
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
  mediaViewerPrev.addEventListener('click', () => navigateMediaViewer(-1));
  mediaViewerNext.addEventListener('click', () => navigateMediaViewer(1));

  mediaViewer.addEventListener('click', (event) => {
    if (event.target === mediaViewer || event.target === mediaViewerStage) {
      closeMediaViewer();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (mediaViewer.hidden) return;

    if (event.key === 'Escape') {
      closeMediaViewer();
      return;
    }

    if (event.target instanceof HTMLVideoElement) return;

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      navigateMediaViewer(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      navigateMediaViewer(1);
    }
  });

  window.addEventListener('resize', () => {
    if (!mediaViewer.hidden) fitViewerMedia();
  });
}
