/**
 * Take care of cases in which the browser runs this script
 * before it has finished running
 * webcomponents-loader.js (e.g. Firefox script execution order)
 */
window.WebComponents = window.WebComponents || {
  waitFor(cb) {
    addEventListener('WebComponentsReady', cb);
  },
};

/**
 * create the waitFor function if it doesn't exist
 */
window.WebComponents.waitFor =
  window.WebComponents.waitFor ||
  function (callback) {
    callback();
  };
