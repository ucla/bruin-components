'use strict';

const { src, series, dest, parallel, watch, task } = require('gulp');
const sass = require('gulp-sass');
const concat = require('gulp-concat');
const gulpStylelint = require('gulp-stylelint');
const fractal = require("./fractal");
const eslint = require('gulp-eslint');
const image = require('gulp-image');

sass.compiler = require('node-sass');

/*
 * Configure a Fractal instance.
 *
 * This configuration could also be done in a separate file, provided that this file
 * then imported the configured fractal instance from it to work with in your Gulp tasks.
 * i.e. const fractal = require('./my-fractal-config-file');
 */

const logger = fractal.cli.console; // keep a reference to the fractal CLI console utility

/*
 * Run a static export of the project web UI.
 *
 * This task will report on progress using the 'progress' event emitted by the
 * builder instance, and log any errors to the terminal.
 *
 * The build destination will be the directory specified in the 'builder.dest'
 * configuration option set above.
 */
 // For debugging, make sure gulp is installed
 function defaultTask(cb) {
   cb();
 }

 function lintSassWatch() {
   return src('src/scss/components/**/*.scss')
     .pipe(gulpStylelint({
       reporters: [
         {formatter: 'string', console: true}
       ]
     }));
 }

 function docLintSassWatch() {
   return src('src/docs/**/*.scss')
     .pipe(gulpStylelint({
       reporters: [
         {formatter: 'string', console: true}
       ]
     }));
 }

 function stylesProductionPublic() {
   return src('src/scss/**/*.scss')
	 	 .pipe(sass.sync({outputStyle: 'compressed'}).on("error", sass.logError))
     .pipe(concat('ucla-lib.min.css'))
		 .pipe(dest('public/css'));
 }

 function docStylesProduction() {
   return src('src/docs/scss/**/*.scss')
    .pipe(sass.sync({outputStyle: 'compressed'}).on("error", sass.logError))
    .pipe(concat('global.css'))
    .pipe(dest('build/docs/css'));
 }

 function docStylesLocal() {
   return src('src/docs/scss/**/*.scss')
    .pipe(sass.sync({outputStyle: 'compressed'}).on("error", sass.logError))
    .pipe(concat('global.css'))
    .pipe(dest('public/docs/css'));
 }

 function lintJavascriptLib() {
      return src('src/js/*.js')
          // eslint() attaches the lint output to the "eslint" property
          // of the file object so it can be used by other modules.
          .pipe(eslint())
          // eslint.format() outputs the lint results to the console.
          // Alternatively use eslint.formatEach() (see Docs).
          .pipe(eslint.format())
          // To have the process exit with an error code (1) on
          // lint error, return the stream and pipe to failAfterError last.
          //.pipe(eslint.failAfterError());
  }

  function lintJavascriptDoc() {
       return src('src/docs/js/*.js')
           // eslint() attaches the lint output to the "eslint" property
           // of the file object so it can be used by other modules.
           .pipe(eslint())
           // eslint.format() outputs the lint results to the console.
           // Alternatively use eslint.formatEach() (see Docs).
           .pipe(eslint.format())
           // To have the process exit with an error code (1) on
           // lint error, return the stream and pipe to failAfterError last.
           //.pipe(eslint.failAfterError());
   }

 function watchStyles(done) {
	 watch('src/scss/**/*.scss', series(stylesProductionPublic, lintSassWatch)),
	 watch('src/docs/scss/**/*.scss', series(docStylesProduction, docLintSassWatch));
	 done();
 }

 function watchJavascript(done) {
	 watch('src/js/*.js', series(concatJsLibPublic, lintJavascriptLib));
   watch('src/docs/js/*.js', series(concatJsDoc, lintJavascriptDoc));
	 done();
 }

function concatJsLibPublic() {
   return src('src/js/**.js')
     .pipe(concat('ucla-lib-scripts.min.js'))
     .pipe(dest('public/js'));
 }

 function concatJsDoc() {
    return src('src/docs/js/**.js')
      .pipe(concat('scripts.js'))
      .pipe(dest('public/docs/js'));
  }

  function concatJsDocProd() {
     return src('src/docs/js/**.js')
       .pipe(concat('scripts.js'))
       .pipe(dest('build/docs/js'));
   }

 function concatImageDoc() {
    return src('src/docs/img/**/*')
     .pipe(image())
     .pipe(dest('build/img'));
 }

 function concatFavicon() {
    return src('src/favicon.ico')
     .pipe(image())
     .pipe(dest('public'));
 }

 function concatImagePublic() {
    return src('src/components/img/**/*')
     .pipe(image())
     .pipe(dest('public/img'));
 }
 /**
  * Fractal tasks
  */

	/*
	 * Start the Fractal server
	 *
	 * In this example we are passing the option 'sync: true' which means that it will
	 * use BrowserSync to watch for changes to the filesystem and refresh the browser automatically.
	 * Obviously this is completely optional!
	 *
	 * This task will also log any errors to the console.
	 */

	function fractalStart() {
	  const server = fractal.web.server({
	    sync: true
	  });
	  server.on("error", err => logger.error(err.message));
	  return server.start().then(() => {
	    logger.success(`Fractal server is now running at ${server.url}`);
	  });
	}

	/*
 * Run a static export of the project web UI.
 *
 * This task will report on progress using the 'progress' event emitted by the
 * builder instance, and log any errors to the terminal.
 *
 * The build destination will be the directory specified in the 'builder.dest'
 * configuration option set above.
 */

 function fractalBuild() {
   const builder = fractal.web.builder();
   builder.on("progress", (completed, total) =>
     logger.update(`Exported ${completed} of ${total} items`, "info")
   );
   builder.on("error", err => logger.error(err.message));
   return builder.build().then(() => {
     logger.success("Fractal build completed!");
   });
 }

 // gulp
 exports.default = defaultTask

// gulp styleProductionPublic
exports.stylesProductionPublic = stylesProductionPublic;


// gulp watch
exports.watch = series(
	fractalStart,
	watchStyles,
	watchJavascript,
  concatJsLibPublic,
  concatJsDoc
);

// gulp fractalBuild
exports.fractalBuild = fractalBuild;

// gulp build
exports.build = series(
	fractalBuild,
	stylesProductionPublic,
  docStylesLocal,
  concatJsLibPublic,
  concatJsDoc
);

// gulp production
exports.production = series(
	fractalBuild,
	stylesProductionPublic,
  docStylesProduction,
  concatJsLibPublic,
  concatJsDocProd,
  concatImageDoc,
  concatImagePublic,
  concatFavicon
);
