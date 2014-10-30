'use strict';
// generated on 2014-10-27 using generator-gulp-webapp 0.1.0

var gulp = require('gulp');
// Load plugins
var $ = require('gulp-load-plugins')();
var args = require('yargs').argv;


// Copy All Files At The Root Level (app)
gulp.task('extras', function() {
    return gulp.src(['app/*.*', '!app/*.html'], {
            dot: true
        })
        .pipe(gulp.dest('dist'))
        .pipe($.size({
            title: 'extras'
        }));
});

var AUTOPREFIXER_BROWSERS = [
  'ie >= 7',
  'ie_mob >= 7',
  'ff >= 22',
  'chrome >= 30',
  'safari >= 5',
  'opera >= 23',
  'ios >= 7',
  'android >= 4.4',
  'bb >= 10'
];

// Compile and Automatically Prefix Stylesheets
gulp.task('styles', function() {
    // For best performance, don't add Sass partials to `gulp.src`
    return gulp.src([
            'app/styles/*.scss'
        ])
        .pipe($.changed('styles', {
            extension: '.scss'
        }))
        .pipe($.rubySass({
                style: 'expanded',
                precision: 10
            })
            .on('error', console.error.bind(console))
        )
        .pipe($.autoprefixer({
            browsers: AUTOPREFIXER_BROWSERS,
            cascade: true
        }))
        .pipe(gulp.dest('.tmp/styles'))
        // Concatenate And Minify Styles
        .pipe($.if('*.css', $.csso()))
        .pipe(gulp.dest('dist/styles'))
        .pipe($.size({
            title: 'styles'
        }));
});

// Lint JavaScript
gulp.task('scripts', function() {
    return gulp.src('app/scripts/**/*.js')
        .pipe($.jscs())
        .pipe($.jshint())
        .pipe($.jshint.reporter(require('jshint-stylish')))
        .pipe($.size());
});

// Optimize JS and Stylesheets, copy them to the dist
gulp.task('html', ['styles', 'scripts'], function() {
    var jsFilter = $.filter('**/*.js');
    var cssFilter = $.filter('**/*.css');

    return gulp.src('app/*.html')
        .pipe($.useref.assets({
            searchPath: '{.tmp,app}'
        }))
        .pipe(jsFilter)
        .pipe($.uglify())
        .pipe(jsFilter.restore())
        .pipe(cssFilter)
        .pipe($.autoprefixer({
            browsers: AUTOPREFIXER_BROWSERS,
            cascade: true
        }))
        .pipe($.csso())
        .pipe(cssFilter.restore())
        .pipe($.useref.restore())
        .pipe($.useref())
        .pipe(gulp.dest('dist'))
        .pipe($.size());
});

// Optimize Images
gulp.task('images', function() {
    return gulp.src('app/images/**/*')
        .pipe($.cache($.imagemin({
            optimizationLevel: 3,
            progressive: true,
            interlaced: true
        })))
        .pipe(gulp.dest('dist/images'))
        .pipe($.size({
            title: 'images'
        }));
});

// Copy Fonts To Dist
gulp.task('fonts', function() {
    return $.bowerFiles()
        .pipe($.filter('**/*.{eot,svg,ttf,woff}'))
        .pipe($.flatten())
        .pipe(gulp.dest('dist/fonts'))
        .pipe($.size());
});

// Clean Output Directory
gulp.task('clean', function() {
    return gulp.src(['.tmp', 'dist'], {
        read: false
    }).pipe($.clean());
});

// Build dist
gulp.task('build', ['html', 'images', 'fonts', 'extras']);

// Default task = clean up dist and build it again
gulp.task('default', ['clean'], function() {
    gulp.start('build');
});


gulp.task('inject', ['manualInject'], function() {
    gulp.start('wiredep');
});
// Inject bower components into index.html
gulp.task('wiredep', function() {
    var wiredep = require('wiredep').stream;

    gulp.src('app/styles/*.scss')
        .pipe(wiredep({
            directory: 'app/bower_components'
        }))
        .pipe(gulp.dest('app/styles'));

    gulp.src('app/*.html')
        .pipe(wiredep({
            directory: 'app/bower_components'
        }))
        .pipe(gulp.dest('app'));
});

// Inject any reference injection into index.html
gulp.task('manualInject', function() {
    var target = gulp.src('app/index.html');
    // It's not necessary to read the files (will speed up things), we're only after their paths:
    var sources = gulp.src(['app/bower_components/html5-boilerplate/css/main.css'], {
        read: false
    });

    return target.pipe($.inject(sources, {
            name: 'inject',
            relative: true
        }))
        .pipe(gulp.dest('app'));
});

// Create a local web server with connect
gulp.task('connect', function() {
    var connect = require('connect');
    var app = connect()
        .use(require('connect-livereload')({
            port: 35729
        }))
        .use(connect.static('app'))
        .use(connect.static('.tmp'))
        .use(connect.directory('app'));

    require('http').createServer(app)
        .listen(9000)
        .on('listening', function() {
            console.log('Started connect web server on http://localhost:9000');
        });
});

// Serve the output from the app build
gulp.task('serve', ['connect', 'styles'], function() {
    require('opn')('http://localhost:9000');
});

gulp.task('connect:dist', function() {
    var connect = require('connect');
    var app = connect()
        .use(require('connect-livereload')({
            port: 35729
        }))
        .use(connect.static('dist'))
        .use(connect.directory('dist'));

    require('http').createServer(app)
        .listen(9000)
        .on('listening', function() {
            console.log('Started connect web server on http://localhost:9000');
        });
    require('opn')('http://localhost:9000');
});

gulp.task('serve:dist', ['build'], function() {
    gulp.start('connect:dist');
});

// Watch Files For Changes & Reload
gulp.task('watch', ['connect', 'serve'], function() {
    var server = $.livereload();

    gulp.watch([
        'app/*.html',
        '.tmp/styles/**/*.css',
        'app/scripts/**/*.js',
        'app/images/**/*'
    ]).on('change', function(file) {
        server.changed(file.path);
    });

    gulp.watch('app/styles/**/*.scss', ['styles']);
    gulp.watch('app/styles/**/**/*.scss', ['styles']);
    gulp.watch('app/scripts/**/*.js', ['scripts']);
    gulp.watch('app/images/**/*', ['images']);
    gulp.watch('bower.json', ['inject']);
});

// Publish the dist on remote server
gulp.task('publish', function() {
    gulp.src(['dist/**/*.*'])
        .pipe($.sftp({
            host: '217.70.188.184',
            remotePath: '/home/st_web/www/erecolnat',
            user: 'st_web',
            pass: args.p
        }));
});