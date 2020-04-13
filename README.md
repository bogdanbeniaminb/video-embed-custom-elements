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
<youtube-embed id="6v2L2UGZJAM"></youtube-embed>
<vimeo-embed id="67449472"></vimeo-embed>
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
<vimeo-embed id="67449472" opened muted></vimeo-embed>
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
<youtube-embed id="<?php echo esc_attr($id); ?>" params="<?php echo esc_attr(
  json_encode($params)
); ?>"></youtube-embed>
```

For example, to specify "Do Not Track" for vimeo videos:

```html
<vimeo-embed id="67449472" params='{"dnt": true}'></vimeo-embed>
```

Or, to loop the same youtube video:

```html
<youtube-embed
  id="6v2L2UGZJAM"
  params='{"playlist": "6v2L2UGZJAM"}'
></youtube-embed>
```
