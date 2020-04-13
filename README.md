# Custom Elements (Web Components) for video embeds

Custom Elements for embedding youtube and vimeo videos with some benefits:

- lazy-loaded
- API functionality (pause, play)

Lazy-loading works as follows:

- the thumbnail images is only loaded when coming into view
- the video iframe is loaded only when the client clicks to play (unless "opened" attribute is used)

For older browsers (IE, Edge <=18) you need the WebComponents polyfill:

```html
<script src="https://cdn.jsdelivr.net/npm/@webcomponents/webcomponentsjs@2.4.3/webcomponents-loader.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@webcomponents/webcomponentsjs@2.4.3/custom-elements-es5-adapter.js"></script>
```

Also, for the CSS for the web components, you will need to setup webpack to use the raw-loader:

```js
rules: [
  ...
  {
    test: /^.*(lit|webcomponent)\.s?css$/i,
    sideEffects: true,
    use: [
      'raw-loader',
      'extract-loader',
      'css-loader',
      'sass-loader',
    ],
  },
  ...
]
```

In the HTML markup, you can then use:

```html
<youtube-embed videoId="6v2L2UGZJAM"></youtube-embed>
<vimeo-embed videoId="67449472"></vimeo-embed>
```

## JavaScript API

Methods available on the HTML elements:

- element.play()
- element.pause()
- element.mute()
- element.unmute()

```js
window.addEventListener('DOMContentLoaded', () => {
  const youtube = document.querySelector('youtube-embed');
  youtube.play();
  youtube.stop();
});
```

## Attributes

You can also directly use attributes on the elements.

For example, use "opened muted" to autoplay the video (muted is required for to bypass browser autoplay restrictions):

```html
<vimeo-embed videoId="67449472" opened muted></vimeo-embed>
```

## Extra parameters

You can also add more platform-specific parameters to the iframe by using the `params` attribute.

**Warning!** This should store a JSON object - make sure it's a proper JSON object, using double quotes inside. In PHP, you can do something similar to this:

```<?php
$id = "6v2L2UGZJAM";
$params = [
  'playlist' => $id,
];
?>
<youtube-embed videoId="<?php echo esc_attr($id); ?>" params="<?php echo esc_attr(
  json_encode($params)
); ?>"></youtube-embed>
```

For example, to specify "Do Not Track" for vimeo videos:

```html
<vimeo-embed videoId="67449472" params='{"dnt": true}'></vimeo-embed>
```

Or, to loop the same youtube video:

```html
<youtube-embed
  videoId="6v2L2UGZJAM"
  params='{"loop": 1, "playlist": "6v2L2UGZJAM"}'
></youtube-embed>
```

## Some usage examples

These components can be helpful for tabs/sliders with videos, when you want to pause the video in the current slide before going to the next.

For example, for Foundation Tabs:

```js
$('[data-tabs]').on('change.zf.tabs', function (e, target, targetContent) {
  // get the [data-tabs-content] element (which is outside the [data-tabs] element)
  const id = this.id;
  const tabsContent = document.querySelector(`[data-tabs-content="${id}"]`);

  // stop videos and audios
  const medias = tabsContent.querySelectorAll(
    'youtube-embed,vimeo-embed,video-embed,video,audio'
  );
  [].forEach.call(medias, media => media.pause());
});
```

Or, for Slick-slider:

```js
// stop videos and audios
$('.your-element').on('beforeChange', function (
  event,
  slider,
  currentSlide,
  nextSlide
) {
  const $currentSlide = slider.$slides.get(currentSlide);
  const currentSlideEl = $currentSlide[0]; // get the DOM element (not jQuery)
  const medias = currentSlideEl.querySelectorAll(
    'youtube-embed,vimeo-embed,video-embed,video,audio'
  );
  [].forEach.call(medias, media => media.pause());
});
```
