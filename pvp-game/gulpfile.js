/*
Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

'use strict';

// Include Gulp & Tools We'll Use
var gulp = require('gulp');
var mocha = require('gulp-mocha');
var $ = require('gulp-load-plugins')();
var del = require('del');
var runSequence = require('run-sequence');
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var merge = require('merge-stream');
var path = require('path');
var fs = require('fs');
const inject = require('gulp-inject')
var glob = require('glob');
var historyApiFallback = require('connect-history-api-fallback');
var print = require('gulp-print');
var plumber = require('gulp-plumber');
var notify = require('gulp-notify');
let nodemon = require('gulp-nodemon')
var preprocess = require('gulp-preprocess');
//var eslint = require('gulp-eslint');
var sourcemaps = require('gulp-sourcemaps');
var babel = require('gulp-babel');
var concat = require('gulp-concat');

var wiredep = require('wiredep').stream;

var es = require('event-stream');

var AUTOPREFIXER_BROWSERS = [
  'ie >= 10',
  'ie_mob >= 10',
  'ff >= 30',
  'chrome >= 34',
  'safari >= 7',
  'opera >= 23',
  'ios >= 7',
  'android >= 4.4',
  'bb >= 10'
];

var styleTask = function(stylesPath, srcs) {
  return gulp.src(srcs.map(function(src) {
      return path.join('app', stylesPath, src);
    }))
    .pipe($.changed(stylesPath, {
      extension: '.css'
    }))
    .pipe($.autoprefixer(AUTOPREFIXER_BROWSERS))
    .pipe(gulp.dest('.tmp/' + stylesPath))
    .pipe($.if('*.css', $.cssmin()))
    .pipe(gulp.dest('dist/' + stylesPath))
    .pipe($.size({
      title: stylesPath
    }));
};

// Compile and Automatically Prefix Stylesheets
gulp.task('styles', function() {
  return styleTask('styles', ['**/*.css']);
});

gulp.task('bower', function() {
  return gulp.src('app/index.html')
    .pipe(wiredep({
      exclude: [ /webcomponentsjs/],
    }))
    .pipe(gulp.dest('.tmp'));
});

// Transpile all JS to ES5.
gulp.task('js', function() {
  return gulp.src(['app/**/*.{js,html}'])
    // .pipe($.sourcemaps.init())
    .pipe($.if('*.html', $.crisper())) // Extract JS from .html files
    .pipe($.if('*.js', $.babel()))
    // .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('dist'));
});

var onError = function(err) {
  notify.onError({
    title: "Gulp",
    subtitle: "Failure!",
    message: "Error: <%= error.message %>",
    sound: "Beep"
  })(err);

  this.emit('end');
};

gulp.task('babel', function() {
  gulp.src(['dist/elements/**/*.js'])
    .pipe(plumber({
      errorHandler: onError
    }))
    // .pipe(sourcemaps.init())
    .pipe(babel())
    // .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist/elements'));

  return gulp.src(['dist/scripts/**/*.js'])
    .pipe(plumber({
      errorHandler: onError
    }))
    // .pipe(sourcemaps.init())
    .pipe(babel())
    // .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist/scripts'));
});



gulp.task('elements', function() {
  return styleTask('elements', ['**/*.css']);
});

// Lint JavaScript
gulp.task('jshint', function() {
  return gulp.src([
      'app/scripts/**/*.js',
      'app/elements/**/*.js',
      'app/elements/**/*.html'
    ])
    .pipe(reload({
      stream: true,
      once: true
    }))
    .pipe($.jshint.extract()) // Extract JS from .html files
    .pipe($.jshint())
    .pipe($.jshint.reporter('jshint-stylish'))
    .pipe($.if(!browserSync.active, $.jshint.reporter('fail')));
});

// Optimize Images
gulp.task('images', function() {
  return gulp.src('app/images/**/*')
    .pipe($.cache($.imagemin({
      progressive: true,
      interlaced: true
    })))
    .pipe(gulp.dest('dist/images'))
    .pipe($.size({
      title: 'images'
    }));
});

// Copy All Files At The Root Level (app)
gulp.task('copy', function() {
  var app = gulp.src([
    'app/*',
    '.tmp/index.html',
    '!app/index.html',
    '!app/test',
    '!app/precache.json'
  ], {
    dot: true
  }).pipe(gulp.dest('dist'));

  var bower = gulp.src([
    'bower_components/**/*'
  ]).pipe(gulp.dest('dist/bower_components'));

  var elements = gulp.src(['app/elements/**/*.*'])
    .pipe(gulp.dest('dist/elements'));

  var _3dmodels = gulp.src(['app/3dmodels/**/*'])
    .pipe(gulp.dest('dist/3dmodels'));

  var node_models = gulp.src(['node_modules/compassheading/**/*'])
    .pipe(gulp.dest('dist/node_modules/compassheading'));

  var scripts = gulp.src(['app/scripts/**/*.js'])
    .pipe(gulp.dest('dist/scripts'));

  var images = gulp.src(['app/images/**/*.*'])
    .pipe(gulp.dest('dist/images'));

  var swBootstrap = gulp.src(['bower_components/platinum-sw/bootstrap/*.js'])
    .pipe(gulp.dest('dist/elements/bootstrap'));

  var swToolbox = gulp.src(['bower_components/sw-toolbox/*.js'])
    .pipe(gulp.dest('dist/sw-toolbox'));

  var vulcanized = gulp.src(['app/elements/elements.html'])
    .pipe($.rename('elements.vulcanized.html'))
    .pipe(gulp.dest('dist/elements'));

  return merge(app, _3dmodels, bower, swBootstrap, swToolbox, scripts, images, elements, vulcanized)
    .pipe($.size({
      title: 'copy'
    }));
});

// Copy Web Fonts To Dist
gulp.task('fonts', function() {
  return gulp.src(['app/fonts/**'])
    .pipe(gulp.dest('dist/fonts'))
    .pipe($.size({
      title: 'fonts'
    }));
});

// Scan Your HTML For Assets & Optimize Them
gulp.task('html', function() {
  var assets = $.useref.assets();

  return gulp.src(['app/**/*.html', '!app/index.html', 'dist/index.html', '!app/{elements,test}/**/*.html'])
    // Replace path for vulcanized assets
    .pipe($.if('*.html', $.replace('elements/elements.html', 'elements/elements.vulcanized.html')))
    .pipe(assets)
    // Concatenate And Minify JavaScript
    .pipe($.if('*.js', $.uglify({
      preserveComments: 'some'
    })))
    // Concatenate And Minify Styles
    // In case you are still using useref build blocks
    .pipe($.if('*.css', $.cssmin()))
    .pipe(assets.restore())
    .pipe($.useref())
    // Minify Any HTML
    .pipe($.if('*.html', $.minifyHtml({
      quotes: true,
      empty: true,
      spare: true
    })))
    // Output Files
    .pipe(gulp.dest('dist'))
    .pipe($.size({
      title: 'html'
    }));
});

// Vulcanize imports
gulp.task('vulcanize', function() {
  var DEST_DIR = 'dist/elements';

  return gulp.src('dist/elements/elements.vulcanized.html')
    .pipe($.vulcanize({
      stripComments: true,
      inlineCss: true,
      inlineScripts: true
    }))
    .pipe(gulp.dest(DEST_DIR))
    .pipe($.size({
      title: 'vulcanize'
    }));
});

// Generate a list of files that should be precached when serving from 'dist'.
// The list will be consumed by the <platinum-sw-cache> element.
gulp.task('precache', function(callback) {
  var dir = 'dist';

  glob('{elements,scripts,styles}/**/*.*', {
    cwd: dir
  }, function(error, files) {
    if (error) {
      callback(error);
    } else {
      files.push('index.html', './', 'bower_components/webcomponentsjs/webcomponents-lite.min.js');
      var filePath = path.join(dir, 'precache.json');
      fs.writeFile(filePath, JSON.stringify(files), callback);
    }
  });
});

// Clean Output Directory
gulp.task('_clean', function() {
  return del([
    '.tmp',
    'dist',
  ]);
});
gulp.task('clean', del.bind(null, ['.tmp', 'dist']));

// Watch Files For Changes & Reload
gulp.task('serve', ['styles', 'elements', 'bower'], function() {
  nodeEnv = 'dev'

  var exec = require('child_process').exec;

  //start db
  var cmd = 'redis-server';
  exec(cmd, function(error, stdout, stderr) {
    // command output is in stdout
    if (error) {
      console.error('error starting redis-server', error)
    }
    console.log('redis-server started!')
  });

  settings();

  //start node server
  nodemon({
    exec: 'node-inspector -p 8888 & node --debug',
    script: 'server/index.js',
    debug: true,
    env: { 'secret': 'ä,.pyf' }
  })

  browserSync({
    notify: true,
    logPrefix: 'PSK',
    snippetOptions: {
      rule: {
        match: '<span id="browser-sync-binding"></span>',
        fn: function(snippet) {
          return snippet;
        }
      }
    },
    // Run as an https by uncommenting 'https: true'
    // Note: this uses an unsigned certificate which on first access
    //       will present a certificate warning in the browser.
    // https: true,
    server: {
      baseDir: ['.tmp', 'app'],
      middleware: [historyApiFallback()],
      routes: {
        '/bower_components': 'bower_components',
        '/node_modules': 'node_modules'
      }
    }
  });

  gulp.watch(['app/**/*.html'], reload);
  gulp.watch(['server/db.js'], settings);
  gulp.watch(['app/scripts/settings.js'], settings);
  gulp.watch(['app/styles/**/*.css'], ['styles', reload]);
  gulp.watch(['.tmp/**/*.*'], reload);
  gulp.watch(['app/elements/**/*.css'], ['elements', reload]);
  gulp.watch(['app/{scripts,elements}/**/*.js'], reload);
  // gulp.watch(['app/{scripts,elements}/**/*.js'], ['babel']);
  gulp.watch(['app/index.html', 'bower.json'], ['bower']);
  gulp.watch(['app/images/**/*'], reload);
});

// Build and serve the output from the dist build
gulp.task('serve:dist', ['default'], function() {
  browserSync({
    notify: false,
    logPrefix: 'PSK',
    snippetOptions: {
      rule: {
        match: '<span id="browser-sync-binding"></span>',
        fn: function(snippet) {
          return snippet;
        }
      }
    },
    // Run as an https by uncommenting 'https: true'
    // Note: this uses an unsigned certificate which on first access
    //       will present a certificate warning in the browser.
    // https: true,
    server: 'dist',
    middleware: [historyApiFallback()]
  });
});


function unitTests() {
  // Compile and run the tests
  var chai = require('chai');
  chai.use(require('chai-fuzzy'));
  chai.should();


  var tests = gulp.src(['app/test/specs**/*.js'])
    .pipe(plumber({
      errorHandler: onError
    }))
    .pipe(print())
    .pipe(mocha({
      globals: {
        THREE: true
      },
      compilers: {
        js: babel
      },
      clearRequireCache: true,
      reporter: 'spec'
    }));

};

gulp.task('utest', unitTests);
gulp.task('unittest', unitTests);
gulp.task('unittests', unitTests);
gulp.task('unit', unitTests);
gulp.task('watchTests', function() {
  gulp.watch(['app/scripts/**/*.js', 'test/specs/**/*.js'], ['babel', 'unittests']);
});

let nodeEnv

function settings() {
  console.log('settings: ', nodeEnv)

  gulp.src('server/db.js')
    .pipe(preprocess({
      context: {
        NODE_ENV: nodeEnv
      }
    }))
    .pipe(gulp.dest('server/build'))

  gulp.src('app/scripts/settings.js')
    .pipe(preprocess({
      context: {
        NODE_ENV: nodeEnv
      }
    }))
    .pipe(gulp.dest('dist/scripts'))
    .pipe(gulp.dest('.tmp/scripts'))


}

gulp.task('settings', settings);


// Build Production Files, the Default Task
gulp.task('default', [], function(cb) {
  nodeEnv = 'prod'

  runSequence(
    'clean',
    'bower', ['copy'],
    'settings',
    'styles', ['elements'],
    'babel', ['fonts', 'html'],
    'vulcanize',
    'build-systemjs',
    cb);
  // Note: add , 'precache' , after 'vulcanize', if your are going to use Service Worker
});

gulp.task('build-systemjs', function() {
  var gcallback = require('gulp-callback')

  gulp.src('./app/_systemjsbuild.js')
    .pipe(inject(gulp.src([
      './app/scripts/**/*.js',
      'node_modules/compassheading/index.js'
    ], {
      read: false
    }), {
      starttag: '// js-inject',
      cwd: '/app/',
      endtag: '// end',
      transform: function(filepath, file, i, length) {
        filepath = filepath.replace('/app/', '')
        filepath = filepath.replace('/node_modules', 'node_modules')

        return '  require("' + filepath + '"' + (i + 1 < length ? ');' : ');');
      }
    }))
    .pipe(print())
    .pipe(gulp.dest('./dist/scripts'))
    .pipe(gcallback(function() {
      var path = require("path");
      var Builder = require('systemjs-builder');

      var builder = new Builder({
          baseURL: 'dist',
          paths: {
            'node_modules/*': './node_modules/*',
            'scripts/*': 'scripts/*'
          },
          packageConfigPaths: ['node_modules/*/package.json'],
          // any map config
          map: {},

          // opt in to Babel for transpiling over Traceur
          transpiler: 'babel'

          // etc. any SystemJS config
        })
        .build('scripts/_systemjsbuild.js', 'dist/scripts/_systemjsbuild.js', {
          minify: false,
          sourceMaps: false
        }).then(() => {

          console.log('now transpile!')
          gulp.src(['dist/scripts/_systemjsbuild.js'])
            .pipe(plumber({
              errorHandler: onError
            }))
            .pipe(babel())
            .pipe(print())
            .pipe(gulp.dest('dist/scripts'));
        })
    }));
});

// Load tasks for web-component-tester
// Adds tasks for `gulp test:local` and `gulp test:remote`
require('web-component-tester').gulp.init(gulp);

// Load custom tasks from the `tasks` directory
try {
  require('require-dir')('tasks');
} catch (err) {}