"use strict";

/* ------------------------
 * Imports & Env
 * ------------------------ */
const fs = require("fs");
const path = require('path');
const { src, dest, series, watch } = require("gulp");
const browserify = require("browserify");
const source = require("vinyl-source-stream");
const buffer = require("vinyl-buffer");
const rename = require("gulp-rename");
const preprocessify = require("preprocessify");
const gulpif = require("gulp-if");
const $ = require("gulp-load-plugins")();
const { finished } = require("node:stream/promises");

const production  = process.env.NODE_ENV === "production";
const target      = process.env.TARGET || "chrome";
const environment = process.env.NODE_ENV || "development";
const mv          = process.env.NODE_MV || "3"; // Defaults to MV3

/* ------------------------
 * Build-time context
 * ------------------------ */
const generic  = JSON.parse(fs.readFileSync(`./config/${environment}.json`));
const specific = JSON.parse(fs.readFileSync(`./config/${target}.json`));
const context  = Object.assign({}, generic, specific);
  
const thisConfig = loadJSON("./config.json");



const manifestExtras = {
  dev: { background: ((process.env.NODE_MV == "3") ? Object() : { scripts: ["scripts/livereload.js", "background.js"] }) },
  firefox: { applications: { gecko: { id: `{${thisConfig.constants.firefoxGeckoID}}` } } }
};

/* ------------------------
 * Helpers
 * ------------------------ */
function copy(glob, outDir) {
  // Return the terminal stream so Gulp/finished() can track it
  return src(glob, { allowEmpty: true }).pipe(dest(outDir));
}

async function copyAllAssets(destFolder) {
  const base = `./dist/build_MV${mv}/${destFolder}`;
  const streams = [
    copy("./src/icons/**/*",                       `${base}/icons`),
    copy("./src/pages/**/*",                       `${base}/pages`),
    copy("./src/resources/**/*",                   `${base}/resources`),
    copy("./src/scripts/utils/**/*",               `${base}/utils`),
    copy("./src/scripts/searchRoutine/**/*",       `${base}/searchRoutine`),
    copy("./src/scripts/registrationRoutine/**/*", `${base}/registrationRoutine`),
    copy("./src/**/*.html",                        `${base}`)
  ];
  // Await every copy stream explicitly
  await Promise.all(streams.map(s => finished(s)));
}

/* ------------------------
 * Tasks
 * ------------------------ */

// clean (you can switch to 'del' if you prefer)
function clean() {
  return src(`./dist/build_MV${mv}/${target}`, { allowEmpty: true }).pipe($.clean());
}

// styles
function styles() {
  return src("src/resources/**/*.css", { allowEmpty: true })
    .pipe(dest(`dist/build_MV${mv}/${target}/resources`));
}

// js — bundle multiple entries with Browserify
async function js() {
  const files = [
    "searchRoutine/searchRoutineWipe.js",
    "searchRoutine/searchRoutineCountdown.js",
    "searchRoutine/searchRoutineMediate.js",
    "utils/utilitiesCrossBrowser.js",
    "utils/utilitiesAssistant.js",
    "utils/utilitiesStorage.js",
    "utils/utilitiesApplyValues.js",
    "background.js",
    "popup.js",
    "alarms.js",
    "config.js",
    "livereload.js",
    "registrationRoutine/registrationSubmit.js"
  ];

  function bundleOne(file) {
    let entry     = `src/scripts/${file}`;
    let entryDest = `dist/build_MV${mv}/${target}/scripts`;
    if (file === "background.js") {
      entry     = "src/background.js";
      entryDest = `dist/build_MV${mv}/${target}`;
    }

    const stream = browserify({ entries: entry, debug: !production })
      .transform("babelify", { presets: ["@babel/preset-env"] })
      .transform(preprocessify, { includeExtensions: [".js"], context })
      .bundle()
      .on("error", (err) => { // make sure errors fail the task
        console.error(err.toString());
        stream.emit && stream.emit("error", err);
      })
      .pipe(source(file))
      .pipe(buffer())
      .pipe(gulpif(!production, $.sourcemaps.init({ loadMaps: true })))
      .pipe(gulpif(!production, $.sourcemaps.write("./")))
      // .pipe($.terser()) // enable for production if desired
      .pipe(dest(entryDest));

    return stream;
  }

  const streams = files.map(bundleOne);
  await Promise.all(streams.map(s => finished(s)));
}

// manifest
function manifestTask() {
  const thisManifestSource = loadJSON(`./config.json`)["manifest"];

  var thisManifestDestination = Object();
  for (var k in thisManifestSource["common"]) {
    if (mv == "2") {
      thisManifestDestination[((k in thisManifestSource["mappings"]) ? thisManifestSource["mappings"][k] : k)] = thisManifestSource["common"][k];
    } else {
      thisManifestDestination[k] = thisManifestSource["common"][k];
    }
  }
  for (var k in thisManifestSource["contextualised"]) {
    var tentativeValue = thisManifestSource["contextualised"][k][mv];
    if (tentativeValue != null) {
      thisManifestDestination[k] = tentativeValue;
    }
  }
  thisManifestDestination["manifest_version"] = (parseInt(mv));


  fs.writeFileSync(`./dist/build_MV${mv}/${target}/manifest.json`, JSON.stringify(thisManifestDestination, null, 2));
  return Promise.resolve();
}

// locales
function localesTask() {
  // Create the locales directory
  // TODO - return to this
  /*
  const thisLocalesSource = loadJSON(`./config.json`)["_locales"];
  const localesPath = path.join(__dirname, 'dist', `build_MV${mv}`, `${target}`, '_locales');
  fs.mkdirSync(localesPath, { recursive: true });
  for (var thisLanguage in thisLocalesSource) {
    const thisLanguageLocalesPath = path.join(localesPath, thisLanguage);
    fs.writeFileSync(path.join(`${localesPath}`, 'messages.json'), JSON.stringify(thisLocalesSource[thisLanguage], null, 2));
  }*/

  return Promise.resolve();
}


// rules (MV3 only)

function rules() {
  const templateRule = {
    "id": null,
    "priority": null,
    "action": {
      "type": "modifyHeaders",
      "requestHeaders": [
        { 
          "header": "User-Agent", 
          "operation": "set", 
          "value": null
        }
      ]
    },
    "condition": { 
      "urlFilter": null, 
      "resourceTypes": ["main_frame"] 
    }
  };

  var rulesSet = Array();
  var ruleIndex = 0;

  for (var thisUserAgentType in thisConfig.userAgentTypes) {
    if (thisUserAgentType != "desktop") {
      ruleIndex ++;
      var thisRule = structuredClone(templateRule);
      thisRule["id"] = ruleIndex;
      thisRule["priority"] = ruleIndex;
      thisRule["condition"]["urlFilter"] = `https://*?*${thisConfig.constants.queryParameterInjectionInterface}=${thisUserAgentType}`;
      thisRule["action"]["requestHeaders"][0]["value"] = thisConfig.userAgentTypes[thisUserAgentType].user_agent;
      rulesSet.push(thisRule);
    }
  }
  fs.writeFileSync(`./dist/build_MV${mv}/${target}/rules.json`, JSON.stringify(rulesSet, null, 2));
  return Promise.resolve();
}

// merge assets — await each copy stream (no merge libs)
async function mergeAssets() {
  await copyAllAssets(target);
}

// Load a mapping from a JSON string or a path to a JSON file
function loadJSON(arg) {
    const text = fs.readFileSync(arg, "utf8");
    return JSON.parse(text);
}

function replaceInFileSync(filePath, mapping) {
  if (fs.existsSync(filePath)) {
    var text = fs.readFileSync(filePath, "utf8");
    for (var targetFileName in mapping) {
      if ((filePath.includes(targetFileName)) || ("commonMappings" === targetFileName)) {
        for (var targetKey in mapping[targetFileName]) {
          text = text.replaceAll(`<!--${targetKey}-->`, mapping[targetFileName][targetKey]);
        }
      }
    }
    fs.writeFileSync(filePath, text);
  }
}

async function replacements() {
  fs.copyFileSync('./config.json', `./dist/build_MV${mv}/${target}/config.json`);
  const thisMapping = loadJSON(`./config.json`)["strings"];
  const files = fs.readdirSync(`./dist/build_MV${mv}/${target}/pages/`);
  files.forEach((thisFileName)=>{
    replaceInFileSync(`./dist/build_MV${mv}/${target}/pages/${thisFileName}`, thisMapping);
  })
  return;
}



// ext = manifest → [rules] → js → merge assets
const ext = series(manifestTask, localesTask, ...(mv === "3" ? [rules] : []), js, mergeAssets, replacements);

// build = clean → styles → ext
const build = series(clean, styles, ext);

// zip
function zip() {
  return src(`./dist/build_MV${mv}/${target}/**/*`, { allowEmpty: true })
    .pipe($.zip(`${target}.zip`))
    .pipe(dest("./dist"));
}

// dist = build → zip
const dist = series(build, zip);

// livereload watch
function reload(cb) { $.livereload.reload(); cb(); }
function watcher() {
  $.livereload.listen();
  watch(["./src/**/*"], series(build, reload));
}

/* ------------------------
 * Exports
 * ------------------------ */
exports.clean    = clean;
exports.styles   = styles;
exports.js       = js;
exports.manifest = manifestTask;
exports.locales = localesTask;
if (mv === "3") exports.rules = rules;

exports.ext     = ext;
exports.build   = build;
exports.dist    = dist;
exports.watch   = series(build, watcher);
exports.default = build;


