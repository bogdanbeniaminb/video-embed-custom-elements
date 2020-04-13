import { html, unsafeCSS } from 'lit-element';
import { VideoEmbed } from './VideoEmbed';
import style from './youtube.lit.scss';

/**
 * The YoutubeEmbed class, used for the youtube-embed custom element
 *
 * created by Bogdan-Beniamin Barbu
 */
class YoutubeEmbed extends VideoEmbed {
  static defaultThumbSize = 'maxresdefault';
  static shouldUseWebP = true;
  static preconnected = false;
  type = 'youtube-embed';

  static get styles() {
    return unsafeCSS(style);
  }

  static get properties() {
    return { ...super.properties };
  }

  static addAPI() {
    return new Promise(resolve => {
      if (this.APIReady) resolve();

      if (window.YT) {
        this.APIReady = true;
        this.APILoaded = true;
        resolve();
      }

      if (!this.APILoaded) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        this.APILoaded = true;
      }

      window.onYouTubeIframeAPIReady = () => {
        this.APIReady = true;
        resolve();
        delete window.onYouTubeIframeAPIReady;
      };
    });
  }

  getThumbnailStructure() {
    return `https://i.ytimg.com/vi${this.supportsWebP ? '_webp' : ''}/${
      this.videoId
    }/maxresdefault.${this.supportsWebP ? 'webp' : 'jpg'}`;
  }

  /** get the thumbnail size */
  async getThumbSize() {
    const sizes = ['maxresdefault', 'sddefault', 'hqdefault', 'mqdefault'];
    async function asyncForEach(array, callback, isDone) {
      for (let index = 0; index < array.length; index++) {
        if (!isDone()) {
          await callback(array[index], index, array);
        }
      }
    }
    let foundSize = false;
    await asyncForEach(
      sizes,
      async size => {
        const url = `https://i.ytimg.com/vi${
          this.supportsWebP ? '_webp' : ''
        }/${this.videoId}/${size}.${this.supportsWebP ? 'webp' : 'jpg'}`;
        try {
          await this.constructor.loadImagePromise(url);
          foundSize = size;
        } catch (e) {}
      },
      () => foundSize
    );
    return foundSize || 'default';
  }

  /**
   * Begin pre-connecting to warm up the iframe load
   */
  static warmConnections() {
    if (this.preconnected) return;

    // The iframe document and most of its subresources come right off youtube.com
    this.addPrefetch('preconnect', 'https://www.youtube-nocookie.com');
    this.addPrefetch('preconnect', 'https://i.ytimg.com');
    this.addPrefetch('preconnect', 'https://s.ytimg.com');

    this.preconnected = true;
  }

  open() {
    if ('ShadyCSS' in window) this.style.backgroundImage = '';
    if (this.withApi) {
      this.constructor.addAPI().then(() => {
        const iframe = this.shadowRoot.querySelector('iframe');
        this.playerReady = false;
        this.player = new YT.Player(iframe, {
          events: {
            onReady: () => {
              this.playerReady = true;
              if (this.muted) {
                this.player.mute();
              }
              if (this.paused) {
                this.player.pauseVideo();
              } else {
                this.player.playVideo();
              }
            },
          },
        });
      });
    } else {
      this.playerReady = true;
    }
  }

  play() {
    super.play();
    if (this.withApi && this.player && this.playerReady) {
      this.player.playVideo();
    }
  }

  pause() {
    if (this.withApi && this.player && this.playerReady) {
      this.player.pauseVideo();
      super.pause();
    }
  }

  mute() {
    if (this.withApi && this.player && this.playerReady) {
      this.player.mute();
      super.mute();
    }
  }

  unmute() {
    if (this.withApi && this.player && this.playerReady) {
      this.player.unMute();
      super.unmute();
    }
  }

  render() {
    // add the parameters
    const params = {
      autoplay: !this.initialPaused,
      rel: 0,
      modestbranding: 1,
      ...(this.withApi
        ? {
            enablejsapi: 1,
            origin: window.location.origin,
          }
        : {}),
      muted: this.initialMuted,
      ...this.params,
    };
    const iframeURL = `
      https://www.youtube-nocookie.com/embed/${this.videoId}`,
      iframeURLObject = new URL(iframeURL);
    if (params) {
      Object.keys(params).forEach(key => {
        iframeURLObject.searchParams.set(key, params[key]);
      });
    }

    return html`
      ${(!this.lazy || this.inView) && !('ShadyCSS' in window)
        ? html`
            <style>
              :host {
                background-image: url(https://i.ytimg.com/vi${this.supportsWebP
                    ? '_webp'
                    : ''}/${this.videoId}/${this.thumbSize}.${this.supportsWebP
                    ? 'webp'
                    : 'jpg'});
              }
            </style>
          `
        : html``}
      ${this.opened
        ? html`
            <iframe
              class="${this.playerReady ? 'ready' : ''}"
              width="100%"
              frameborder="0"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
              src="${iframeURLObject.toString()}"
            ></iframe>
          `
        : html` <div class="button"></div> `}
    `;
  }
}

// make sure we have all the polyfills loaded before this
WebComponents.waitFor(() => {
  customElements.define('youtube-embed', YoutubeEmbed);
});
