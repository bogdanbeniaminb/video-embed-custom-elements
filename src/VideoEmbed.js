import { LitElement, html } from 'lit-element';

/**
 * The main Video class, which will be extended by the YoutubeEmbed/VimeoEmbed classes
 *
 * created by Bogdan-Beniamin Barbu
 */
export class VideoEmbed extends LitElement {
  static APILoaded = false;
  static APIReady = false;
  static caniuseWebP = false;
  static shouldUseWebP = false;
  static defaultThumbSize = '';
  type = 'video-embed';

  static get type() {
    return this.type;
  }

  get APIReady() {
    return this.constructor.APIReady;
  }

  get APILoaded() {
    return this.constructor.APILoaded;
  }

  static get properties() {
    return {
      id: {
        type: String,
      },
      opened: {
        type: Boolean,
      },
      paused: {
        type: Boolean,
      },
      muted: {
        type: Boolean,
      },
      lazy: {
        type: Boolean,
      },
      inView: {
        type: Boolean,
        attribute: false,
      },
      webp: {
        type: Boolean,
      },
      testingWebP: {
        type: Boolean,
        attribute: false,
      },
      supportsWebP: {
        type: Boolean,
        attribute: false,
      },
      thumbSize: {
        type: String,
        attribute: false,
      },
      thumbnail: {
        type: String,
      },
      params: {
        type: Object,
      },
      withApi: {
        type: Boolean,
        attribute: 'with-api',
      },
      playerReady: {
        type: Boolean,
        attribute: false,
      },
    };
  }

  setupEventListeners() {
    this.addEventListener(
      'pointerover',
      () => this.constructor.warmConnections(),
      {
        once: true,
      }
    );
    this.addEventListener('click', this.clickHandler, {
      once: true,
    });
  }

  setupDefaultProperties() {
    // default attribute values
    this.withApi = true;
    this.lazy = true;
    this.opened = false;
    this.paused = false;
    this.muted = false;
    this.inView = false;

    this.testingWebP =
      this.constructor.shouldUseWebP &&
      !this.constructor.caniuseWebP &&
      !('ShadyCSS' in window);
    this.supportsWebP =
      this.constructor.caniuseWebP ||
      (this.constructor.shouldUseWebP && !('ShadyCSS' in window)); // most browsers do
    this.webp =
      this.constructor.caniuseWebP ||
      (this.constructor.shouldUseWebP && !('ShadyCSS' in window));
    this.playerReady = false;

    this.thumbSize = this.constructor.defaultThumbSize; // a default thumbnail size
  }

  constructor() {
    super();

    this.setupEventListeners();
    this.setupDefaultProperties();
  }

  static addAPI() {
    return new Promise(resolve => {
      resolve();
    });
  }

  static async detectWebpSupport() {
    if (this.caniuseWebP) return true;
    if (!window.createImageBitmap) return false;

    const webpData =
      'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=';
    const blob = await fetch(webpData).then(r => r.blob());
    this.caniuseWebP = createImageBitmap(blob).then(
      () => true,
      () => false
    );
    return this.caniuseWebP;
  }

  getThumbnailStructure() {
    return '';
  }

  /** check if we support webp and return a promise */
  maybeCheckWebP() {
    return new Promise(async (resolve, reject) => {
      if (!this.testingWebP) resolve();
      const setupWebP = result => {
        this.supportsWebP = result;
        this.testingWebP = false;
        this.thumbnail = this.getThumbnailStructure();
      };
      try {
        const withWebP = this.webp
          ? await this.constructor.detectWebpSupport()
          : false;
        setupWebP(withWebP);
      } catch (e) {
        setupWebP(false);
      }
      resolve();
    });
  }

  connectedCallback() {
    super.connectedCallback();

    // initial values, so that we don't reload the iframe
    this.initialPaused = this.paused && this.opened;
    this.initialMuted = this.muted;

    // warm up the connections
    this.constructor.warmConnections();

    // add the API
    if (this.withApi) {
      // this.constructor.addAPI();
    }

    // add background when in view
    if (this.lazy) {
      this.observer = new IntersectionObserver(
        entries => {
          entries.forEach(async entry => {
            if (entry.isIntersecting) {
              this.observer.unobserve(entry.target);
              await this.maybeCheckWebP();
              const size = await this.getThumbSize();
              if (size) {
                this.thumbSize = size;
              }
              this.inView = true;
              delete this.observer;
            }
          });
        },
        { rootMargin: '300px' }
      );
      this.observer.observe(this);
    }

    // check if we support webp
    this.maybeCheckWebP();
  }

  static loadImagePromise = (url, testSize = true) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        if (img.naturalWidth != 120 && img.naturalHeight != 90) {
          resolve(url);
        } else {
          reject('404 placeholder');
        }
      };
      img.onerror = error => {
        reject(error);
      };
      img.src = url;
    });
  };

  /** get the thumbnail size */
  async getThumbSize() {
    return 'default';
  }

  /**
   * Add a <link rel={preload | preconnect} ...> to the head
   */
  static addPrefetch(kind, url, as) {
    const linkElem = document.createElement('link');
    linkElem.rel = kind;
    linkElem.href = url;
    if (as) {
      linkElem.as = as;
    }
    linkElem.crossorigin = true;
    document.head.append(linkElem);
  }

  /**
   * Begin pre-connecting to warm up the iframe load
   */
  static warmConnections() {}

  clickHandler() {
    if (!this.opened) {
      this.opened = true;
    }
  }

  updated(changedProperties) {
    // initialize the thumbnail image on IE11
    if (
      'ShadyCSS' in window &&
      (changedProperties.has('thumbSize') ||
        (changedProperties.has('id') && changedProperties.get('id')))
    ) {
      this.style.backgroundImage = `url(${this.getThumbnailStructure()})`;
    }

    // reinitialize the iframe etc
    if (changedProperties.has('id') && changedProperties.get('id')) {
      this.getThumbSize()
        .then(size => {
          this.thumbSize = size;
        })
        .catch(console.error);
    }

    // thumbnail
    if (changedProperties.has('thumbSize')) {
      this.thumbnail = this.getThumbnailStructure();
    }

    // initialize the player on iframe load
    if (changedProperties.has('opened') && this.opened) {
      this.open();
    }

    // handle pauses
    if (changedProperties.has('paused')) {
      if (this.paused) {
        this.pause();
      } else {
        if (changedProperties.get('paused')) {
          this.play();
        }
      }
    }

    // handle muted
    if (changedProperties.has('muted')) {
      if (this.muted) {
        this.mute();
      } else {
        this.unmute();
      }
    }
  }

  open() {}

  play() {
    this.paused = false;
    this.opened = true;
  }

  pause() {
    this.paused = true;
  }

  mute() {
    this.muted = true;
  }

  unmute() {
    this.muted = false;
  }

  render() {
    return html``;
  }
}
