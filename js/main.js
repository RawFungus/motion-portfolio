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
