var gulp = require('gulp');
var iife = require('gulp-iife');
var concat = require('gulp-concat');
var header = require('gulp-header');
var footer = require('gulp-footer');
var streamqueue = require('streamqueue');
var html2jsobject = require('gulp-html2jsobject');

var styles = ['main.css'];
var scripts = [
    'lib/utils.js',
    'lib/MergedCollection.js',
    'lib/SectionsManager.js',
    'lib/IconDropdownWidget.js',
    'lib/ConnectionErrorWidget.js',
    'lib/LocationModel.js',
    'lib/LocationMarkerManager.js',
    'lib/GeolocationControl.js',
    'runtime/core.js',
    'runtime/sections.js',
    'runtime/markers.js',
    'runtime/desktop.js',
    'runtime/mobile.js',
    'runtime/widgets.js',
    'runtime/tail.js',
    'translations.js',
    'index.js'
];
var images = ['tiny-grid.png'];
var templates = ['main.html'];

gulp.task('default', function() {
    var sourcesStream = gulp.src(scripts);

    var templatesStream = gulp.src(templates)
        .pipe(html2jsobject('nsGmx.Templates.Main'))
        .pipe(concat('templates.js'))
        .pipe(header('nsGmx.Templates.Main = {};\n'))
        .pipe(header('nsGmx.Templates = window.nsGmx.Templates || {};'))
        .pipe(header('var nsGmx = window.nsGmx || {};'));

    var cssStream = gulp.src(styles)

    var imgStream = gulp.src(images);

    var jsStream = streamqueue({
            objectMode: true
        }, templatesStream, sourcesStream)
        .pipe(footer(';'))
        .pipe(concat('main.js'))
        .pipe(iife());

    var finalStream = streamqueue({
            objectMode: true
        }, jsStream, cssStream, imgStream)
        .pipe(gulp.dest('build'));
});

gulp.task('watch', ['default'], function() {
    console.log([].concat(styles, scripts, templates));
    gulp.watch([].concat(styles, scripts, templates), ['default']);
});
