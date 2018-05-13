var fs = require("fs");
var browserify = require("browserify");
var babelify = require("babelify");
var babel = require("babel-core")

//creates npm package  for module imports
babel.transformFile("./src/index.js", { presets: ["env"] }, function (err, result) {
  fs.writeFile("./dist/dreamscale-api.js", result.code, function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("dreamscale-api.js was saved!");
	}); 
});

//for direct browser loading
browserify({ debug: true })
  .transform(babelify.configure({ presets: ["env"] }))
  .require("./src/index.js", { entry: true })
  .bundle()
  .on("error", function (err) { console.log("Error: " + err.message); })
  .pipe(fs.createWriteStream("./dist/dreamscale-api.bundle.js"));