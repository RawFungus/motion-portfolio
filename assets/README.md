# Медиа для портфолио

Все медиа подключаются напрямую из `index.html`. Сборщик не используется.

## Видео

Видео лежат в `assets/video/`:

- `merch-ad.mp4`
- `hook-promo.mp4`
- `placeholder-01.mp4`
- `placeholder-02.mp4`
- `text-imp.mp4`

Базовая разметка видео:

```html
<video
  src="assets/video/project.mp4"
  autoplay
  muted
  loop
  playsinline
  preload="metadata"
  data-autoplay
></video>
```

`js/main.js` ставит autoplay-видео на паузу вне экрана и принудительно держит все видео без звука, включая копию во fullscreen viewer.

## Изображения

Изображения лежат в `assets/images/`. Сейчас сайт использует в том числе:

- `merch-process-01.png`
- `merch-process-02.png`
- `hook-storyboard.png`
- `hook-figma.png`
- `hook-blender.png`
- `hook-render.png`
- `fbox-1.png` … `fbox-5.png`
- `text-imp-process.png`
- `text-imp-gui.png`
- `nut.svg`

Базовая разметка изображения:

```html
<div class="media-frame">
  <img
    src="assets/images/project.png"
    alt="Описание изображения"
    loading="lazy"
  >
</div>
```

Все `.media-frame` внутри одного `.media-area` автоматически объединяются в одну fullscreen-галерею. Для добавления нового кадра в существующий проект отдельный JavaScript не нужен.

## Форматы

Для статичных изображений подходят PNG, WebP или AVIF. Для motion — MP4/H.264 как наиболее совместимый вариант для GitHub Pages и современных браузеров.

При замене изображения желательно сохранять близкое соотношение сторон: CSS подстроит ширину, но сильно отличающийся aspect ratio изменит высоту композиции.
