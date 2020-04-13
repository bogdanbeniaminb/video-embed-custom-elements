import { html, unsafeCSS } from 'lit-element';
import { VideoEmbed } from './VideoEmbed';
import style from './vimeo.lit.scss';

/**
 * The VimeoEmbed class, used for the vimeo-embed custom element
 *
 * created by Bogdan-Beniamin Barbu
 */
class VimeoEmbed extends VideoEmbed {
  static shouldUseWebP = true;
  static preconnected = false;
  type = 'vimeo-embed';

  static get styles() {
    return unsafeCSS(style);
  }

  static get properties() {
    return { ...super.properties };
  }

  static addAPI() {
    return new Promise(resolve => {
      if (this.APIReady) resolve();

      if (window.Vimeo && window.Vimeo.Player) {
        this.APIReady = true;
        this.APILoaded = true;
        resolve();
      }

      import(/* webpackChunkName: "vimeo" */ '@vimeo/player').then(module => {
        window.Vimeo = { Player: module.default };
        this.APIReady = true;
        this.APILoaded = true;
        resolve();
      });
    });
  }

  getThumbnailStructure() {
    return `${this.thumbSize}`;
  }

  /** get the thumbnail size */
  async getThumbSize() {
    fetch(`https://vimeo.com/api/v2/video/${this.videoId}.json`)
      .then(response => response.json())
      .then(response => response[0])
      .then(async response => {
        let thumbnail =
          response.thumbnail_large ||
          response.thumbnail_medium ||
          response.thumbnail_small;
        let maxThumb = thumbnail.replace(/_640\./, '.');
        if (this.supportsWebP) {
          thumbnail = thumbnail.replace(/\.jpg/, '.webp');
          maxThumb = maxThumb.replace(/\.jpg/, '.webp');
        }
        // try {
        //   thumbnail = await this.constructor.loadImagePromise(maxThumb, false);
        // } catch (e) {
        //   console.error(e);
        // }
        thumbnail = maxThumb;
        this.thumbSize = thumbnail;
        this.thumbnail = thumbnail;
      });
  }

  /**
   * Begin pre-connecting to warm up the iframe load
   */
  static warmConnections() {
    if (this.preconnected) return;

    this.addPrefetch('preconnect', 'https://vimeo.com');
    this.addPrefetch('preconnect', 'https://player.vimeo.com');
    this.addPrefetch('preconnect', 'https://i.vimeocdn.com');
    this.addPrefetch('preconnect', 'https://f.vimeocdn.com');

    this.preconnected = true;
  }

  open() {
    if ('ShadyCSS' in window) this.style.backgroundImage = '';
    if (this.withApi) {
      this.constructor.addAPI().then(() => {
        const iframe = this.shadowRoot.querySelector('iframe');
        this.playerReady = false;
        this.player = new Vimeo.Player(iframe);
        this.player.ready().then(() => {
          this.playerReady = true;
          if (this.muted) {
            this.player.mute();
          }
          if (this.paused) {
            this.player.pause();
          } else {
            this.player.play();
          }
        });
      });
    } else {
      this.playerReady = true;
    }
  }

  play() {
    super.play();
    if (this.withApi && this.player && this.playerReady) {
      this.player.play();
    }
  }

  pause() {
    if (this.withApi && this.player && this.playerReady) {
      this.player.pause().then(() => {
        super.pause();
      });
    }
  }

  mute() {
    if (this.withApi && this.player && this.playerReady) {
      this.player.setMuted(true).then(() => {
        super.mute();
      });
    }
  }

  unmute() {
    if (this.withApi && this.player && this.playerReady) {
      this.player.setMuted(false).then(() => {
        super.unmute();
      });
    }
  }

  render() {
    // add the parameters
    const params = {
      autoplay: !this.initialPaused,
      dnt: 1,
      muted: this.initialMuted,
      ...this.params,
    };
    const iframeURL = `
      https://player.vimeo.com/video/${this.videoId}`,
      iframeURLObject = new URL(iframeURL);
    if (params) {
      Object.keys(params).forEach(key => {
        iframeURLObject.searchParams.set(key, params[key]);
      });
    }

    return html`
      ${(!this.lazy || this.inView) && !('ShadyCSS' in window) && this.thumbnail
        ? html`
            <style>
              :host {
                background-image: url(${this.thumbnail});
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
  customElements.define('vimeo-embed', VimeoEmbed);
});
