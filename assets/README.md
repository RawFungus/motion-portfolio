# Медиа для портфолио

В `index.html` сейчас стоят плейсхолдеры. Их можно заменять по одному, не меняя сетку.

## Видео

Положите файлы в `assets/video/`, например:

- `merch-ad.mp4`
- `hook-promo.mp4`
- `placeholder-01.mp4`
- `placeholder-02.mp4`
- `text-imp.mp4`

Затем замените содержимое нужного `.media-frame` на:

```html
<video
  src="assets/video/merch-ad.mp4"
  autoplay
  muted
  loop
  playsinline
  preload="metadata"
  data-autoplay
></video>
```

`muted` нужен для надёжного autoplay в современных браузерах. Скрипт `js/main.js` автоматически ставит видео на паузу, когда оно уходит далеко за пределы экрана.

Если видео должно содержать звук, лучше убрать `autoplay` и добавить `controls`:

```html
<video
  src="assets/video/project.mp4"
  controls
  playsinline
  preload="metadata"
></video>
```

## Картинки

Положите изображения в `assets/images/`, например:

- `merch-process-01.webp`
- `merch-process-02.webp`
- `hook-storyboard.webp`
- `hook-figma.webp`
- `hook-blender.webp`
- `hook-render.webp`
- `text-imp-process.webp`

Внутри нужного `.media-frame` замените `.placeholder` на:

```html
<img
  src="assets/images/merch-process-01.webp"
  alt="Процесс работы над Merch Ad"
  loading="lazy"
>
```

## Форматы

Для статичных изображений удобнее использовать WebP или AVIF. Для motion — MP4/H.264 как наиболее беспроблемный вариант для GitHub Pages и браузеров.
