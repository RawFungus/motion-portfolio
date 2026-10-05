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
