const fs = require("fs");
const browserify = require("browserify");
const babelify = require("babelify");
const babel = require("babel-core")

//creates npm package  for module imports
console.log("[npm-dreamscale-api] performing babel compilation...");
const { code, map, ast } = babel.transformFileSync("./src/index.js", { presets: ["env"] });
console.log("[npm-dreamscale-api] creating dreamscale-api.js...");
fs.writeFileSync("./dist/dreamscale-api.js", code);

//for direct browser loading
console.log("[npm-dreamscale-api] creating dreamscale-api.bundle.js...");
browserify({ debug: true })
  .transform(babelify.configure({ presets: ["env"] }))
  .require("./src/index.js", { entry: true })
  .bundle()
  .on("error", function (err) { console.log("Error: " + err.message); })
  .pipe(fs.createWriteStream("./dist/dreamscale-api.bundle.js"));