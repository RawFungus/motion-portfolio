const video = document.querySelector('#demo-video');
const status = document.querySelector('#video-status');

function setStatus(text) {
  status.textContent = text;
}

video.addEventListener('playing', () => setStatus('video playing ✓'));
video.addEventListener('pause', () => setStatus('paused'));
video.addEventListener('error', () => setStatus('video error'));
video.addEventListener('click', () => {
  if (video.paused) {
    video.play().catch(() => setStatus('tap to play'));
  } else {
    video.pause();
  }
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      video.play().catch(() => setStatus('tap video to play'));
    } else {
      video.pause();
    }
  });
}, { threshold: 0.25 });

observer.observe(video);
