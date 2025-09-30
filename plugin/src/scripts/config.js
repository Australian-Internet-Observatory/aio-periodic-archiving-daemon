import storage from './utils/utilitiesStorage';
import ext from './utils/utilitiesCrossBrowser';

const CONST_MANIFEST_VERSION_INTEGER = ext.runtime.getManifest().manifest_version;

var LOCAL_DEBUG = false; // Set to debug mode
var CONST_OVERRIDE_REGISTRATION = false; // Override registration
var CONST_BROWSER_TOGGLE_FORCE = null; // Can be used to toggle a user agent type eg. mobile_iphone12pro
var CONST_WIPE_OVERRIDE = false; // Override the 'wipe' feature
var CONST_BROWSER_TYPE = 'chrome';
var CONST_SERVER_OVERRIDE = `inject.${ext.runtime.getManifest().version}`

// Set the plugin to production mode:
const CONST_PRODUCTION = true;

if (CONST_PRODUCTION) {
  LOCAL_DEBUG = false; // Set to false
  CONST_OVERRIDE_REGISTRATION = false;
  CONST_BROWSER_TOGGLE_FORCE = null;
  CONST_WIPE_OVERRIDE = false;
  CONST_SERVER_OVERRIDE = `inject.${ext.runtime.getManifest().version}`
}

if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1) { CONST_BROWSER_TYPE = 'firefox'; }
if (navigator.userAgent.match(/Opera|OPR\//)) { CONST_BROWSER_TYPE = 'opera'; }
if (navigator.userAgent.match(/Edge|Edg/)) { CONST_BROWSER_TYPE = 'edge'; }

export { LOCAL_DEBUG, CONST_OVERRIDE_REGISTRATION, CONST_BROWSER_TYPE, CONST_MANIFEST_VERSION_INTEGER, CONST_WIPE_OVERRIDE, CONST_BROWSER_TOGGLE_FORCE }

// The default configuration is largely stripped


/*
  This function retrieves the default config
*/
export function getDefaultConfig(unloop=false) {
  return new Promise((resolve, reject) => {
    fetch(ext.runtime.getURL('./config.json')).then((defaultConfigRaw) => {
      const defaultConfig = defaultConfigRaw.json();
      resolve(defaultConfig);
    });
  });
}

/*
  This function retrieves the config file from storage
*/
export function getConfig(unloop=false) {
  return new Promise((resolve, reject) => {
    getDefaultConfig().then((defaultConfig) => {
      storage.get('config', function(result) {
        if (ext.runtime.lastError) {
          // If we get an error, return the configuration file
          return resolve(defaultConfig);
        }
        // If the response is well-formed, return it as the configuration file
        if (result.config && (Object.keys(result.config).length > 0 && result.config.constructor === Object)) {
          return resolve(result.config);
        } else {
          // Otherwise attempt to update the configuration file
          if (unloop) {
            return resolve(defaultConfig);
          } else {
            return resolve(updateConfig());
          }
        }
      });
    });
  });
}

/*
  This function updates the configuration file by querying the server
*/
export function updateConfig() {
  // Retrieve the config file (no caching it)
  function makeReq() {
    return new Promise((resolve, reject) => {
      getDefaultConfig().then((defaultConfig) => {
        var thisRequestHeaders = new Headers({'Cache-Control': 'no-cache', 'Pragma': 'no-cache', 'Expires': '0'});
        fetch(defaultConfig.configURL, { headers: thisRequestHeaders }).then(r => r.text()).then(result => {
          try {
            resolve(JSON.parse(result));
          } catch (e) {
            if (LOCAL_DEBUG) { console.log("No internet connection OR the JSON is malformed..."); }
            resolve(defaultConfig);
          }
          
        });
      });
    });
  }
  // Then, if the returned config file is not malformed, return it to the plugin
  return makeReq().then(res => {
    if (res && (!(Object.keys(res).length === 0 && res.constructor === Object))) {
      storage.set({'config' : res}, ()=>{});
      return res;
    } else {
      // Or else, use the default configuration
      return getConfig(true);
    }
  });
}
