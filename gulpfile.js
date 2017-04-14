/**
 * Created by rick on 2015/10/29.
 */

var gulp = require('gulp');
var webpack = require('webpack');
var gulpWebpack = require('webpack-stream');
var named = require('vinyl-named-with-path');
var extend = require('extend');
var exec = require('child_process').exec;
var plumber = require('gulp-plumber');
var runSequence = require('run-sequence');
var postcss = require('gulp-postcss');
var csswring = require('csswring');
var atImport = require('postcss-import');
var connect = require('gulp-connect');
require('text-loader');
require('style-loader');

var devConfig = {
    module: {
        loaders: [{
            test: /\.html$/,
            loader: 'text'
        }, {
            test: /\.css$/,
            loader: 'style-loader!css-loader'
        }, {
            test: /ueditor.all.min/,
            loader: 'exports?UE'
        }]
    },
    externals: {
        jquery: 'jQuery',
        underscore: '_'
    },
    /*resolve: {
        modulesDirectories:['node_modules','scripts'],
        alias:{
            umeditor:'lib/umeditor.min'
        }
    },*/
    watch: true,
    devtool: '#source-map'
};

var prodConfig = extend({}, devConfig, {
    watch: false,
    plugins: [new webpack.optimize.UglifyJsPlugin('*.js')]
});

gulp.task('webpackdev', function() {
    return gulp.src('./web/scripts/source/**/*Main.js')
        .pipe(named())
        .pipe(plumber())
        .pipe(gulpWebpack(devConfig))
        .pipe(gulp.dest('./web/scripts/dist'));
});

gulp.task('prod', function() {
    return gulp.src('./web/scripts/source/**/*Main.js')
        .pipe(named())
        .pipe(gulpWebpack(prodConfig))
        .pipe(gulp.dest('./web/scripts/dist'));
});


gulp.task('npm-install', function(cb) {
    exec('npm install', function(err, stdout, stderr) {
        //console.log('stdout : ' + stdout);
        console.log('stderr : ' + stderr);
        cb(err);
    });
});

gulp.task('flatten', function(cb) {
    exec('flatten-packages ./', {
        maxBuffer: 500 * 1024
    }, function(err, stdout, stderr) {
        //console.log('stdout : ' + stdout);
        console.log('stderr : ' + stderr);
        cb(err);
    });
});

//压缩css
gulp.task('postcss', function() {
    return gulp.src(['./web/css/source/**/*.css'], {
            //base: 'web'
        })
        .pipe(plumber())
        .pipe(postcss([
            atImport({
                path: process.cwd() + '/css'
            }),
            csswring()
        ]))
        .pipe(gulp.dest('./web/css/dist'));

}).on('error', function(e) {
    console.log('buildError\n', e);
});


gulp.task('dev', function() {
    return runSequence('postcss', 'watchcss', 'webpackdev');
});

gulp.task('watchcss', function() {
    gulp.watch(['./web/css/source/**/*.css'], ['postcss']);
});


gulp.task('default', ['dev', 'webserver']);
gulp.task('webserver', function() {
    connect.server({
        host:'webgl.demo.com',
        root: 'web',
        port: 8888,
        livereload: true
    });
});