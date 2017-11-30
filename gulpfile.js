var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var gutil = require('gulp-util');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var cleanCSS = require('gulp-clean-css');
var del = require('del');
var templateCache = require('gulp-angular-templatecache');

var paths = {
    scriptsSystem: 'app/**/*.js',
    scriptsVendor: [
        'node_modules/angular/angular.min.js',
        'node_modules/angular-route/angular-route.min.js',
        'node_modules/angular-websocket/dist/angular-websocket.js',
        'node_modules/leaflet/dist/leaflet.js',
        // 'node_modules/leaflet.markercluster/dist/leaflet.markercluster.js',
        'node_modules/prunecluster/dist/PruneCluster.js',
        'node_modules/angular-leaflet-directive/dist/angular-leaflet-directive.js',
        // 'node_modules/angular-ui-bootstrap/dist/ui-bootstrap.js',
        // 'node_modules/angular-ui-bootstrap/dist/ui-bootstrap-tpls.js'
    ],
    stylesSystem: 'assets/scss/**/*.scss',
    stylesVendor: [
        'node_modules/leaflet/dist/leaflet.css',
        'node_modules/prunecluster/dist/LeafletStyleSheet.css',
        // 'node_modules/leaflet.markercluster/dist/MarkerCluster.css',
        // 'node_modules/leaflet.markercluster/dist/MarkerCluster.Default.css',
        // 'node_modules/angular-ui-bootstrap/dist/ui-bootstrap-csp.css',
        // 'node_modules/bootstrap/dist/css/bootstrap.min.css',
        // 'node_modules/font-awesome/css/font-awesome.css'
    ],
    templates: 'views/modals/*.html'
};

var buildPaths = {
    scripts: 'assets/js/',
    styles: 'assets/css/'
};

gulp.task('clean', function() {
    return del(['build']);
});

gulp.task('system-scripts', ['clean'], function() {
    return gulp.src(paths.scriptsSystem)
        .pipe(sourcemaps.init())
        .pipe(uglify())
        .on('error', function (err) { gutil.log(gutil.colors.red('[Error]'), err.toString()); })
        .pipe(concat('system.min.js'))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(buildPaths.scripts));
});

gulp.task('vendor-scripts', ['clean'], function() {
    return gulp.src(paths.scriptsVendor)
        .pipe(sourcemaps.init())
        .pipe(uglify())
        .on('error', function (err) { gutil.log(gutil.colors.red('[Error]'), err.toString()); })
        .pipe(concat('vendor.min.js'))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(buildPaths.scripts));
});

gulp.task('system-styles', function () {
    return gulp.src(paths.stylesSystem)
        .pipe(sass().on('error', sass.logError))
        .pipe(cleanCSS({compatibility: 'ie8'}))
        .pipe(concat('system.min.css'))
        .pipe(gulp.dest(buildPaths.styles));
});

gulp.task('vendor-styles', function () {
    return gulp.src(paths.stylesVendor)
        .pipe(cleanCSS({compatibility: 'ie8'}))
        .pipe(concat('vendor.min.css'))
        .pipe(gulp.dest(buildPaths.styles));
});

gulp.task('fonts', function() {
    return gulp.src('node_modules/font-awesome/fonts/**.*')
        .pipe(gulp.dest('assets/fonts'));
});

gulp.task('templates', function () {
    return gulp.src(paths.templates)
        .pipe(templateCache('templates.js', {
            standalone: true,
            module: 'templates'
        }))
        .pipe(gulp.dest(buildPaths.scripts));
});

gulp.task('watch', function() {
    gulp.watch(paths.scriptsSystem, ['system-scripts']);

    gulp.watch(paths.stylesSystem, ['system-styles']);

    gulp.watch(paths.templates, ['templates']);
});

gulp.task('default', ['fonts', 'templates', 'system-scripts', 'vendor-scripts', 'system-styles', 'vendor-styles', 'watch']);