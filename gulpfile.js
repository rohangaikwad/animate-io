const gulp = require('gulp');
const babel = require('gulp-babel');
const rename = require('gulp-rename');
const sourcemaps = require('gulp-sourcemaps');
const concat = require('gulp-concat');
const terser = require('gulp-terser');
const sass = require('gulp-sass');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const vinylss = require('vinyl-source-stream');
const browserify = require('browserify');
const streamify = require('gulp-streamify');

gulp.task('compile', (done) => {
    let srcFile = 'src/js/Main.js';
    var bundleStream = browserify(srcFile, {
        plugin: [
            [require('esmify')]
        ]
    }).bundle();

    bundleStream
        .pipe(vinylss(srcFile))
        //gulp.src('src/js/Main.js')
        //.pipe(sourcemaps.init())
        .pipe(rename("animate-io.js"))
        .pipe(gulp.dest('dist/'))
        .pipe(gulp.dest('docs/js'))
        .pipe(streamify(terser()))
        .pipe(rename({ suffix: '.min' }))
        //.pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist/'))
    //.pipe(brotli.compress({ 'extension': 'br' }))
    //.pipe(gulp.dest('dist/'));
    done();
})

gulp.task('compile-es2015', (done) => {
    let srcFile = 'dist/animate-io.js';

    gulp.src(srcFile)
        //.pipe(sourcemaps.init())
        .pipe(babel())
        .pipe(rename("animate-io-es2015.js"))
        .pipe(gulp.dest('dist/'))
        .pipe(gulp.dest('docs/js'))
        .pipe(terser())
        .pipe(rename({ suffix: '.min' }))
        //.pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist/'));
    //.pipe(brotli.compress({ 'extension': 'br' }))
    //.pipe(gulp.dest('dist/'));
    done();
})

gulp.task('compile-with-polyfill', (done) => {
    gulp.src(['src/js/polyfills/intersection-observer.js', 'dist/animate-io.js'])
        //.pipe(sourcemaps.init())
        .pipe(concat('animate-io-polyfill.js'))
        .pipe(babel())
        .pipe(gulp.dest('dist/'))
        //.pipe(sourcemaps.write())
        .pipe(terser())
        .pipe(rename({ suffix: '.min' }))
        //.pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist/'))
        .pipe(gulp.dest('docs/js'));
    //.pipe(brotli.compress({ 'extension': 'br' }))
    //.pipe(gulp.dest('dist/'))
    //.pipe(gulp.dest('docs/js'));
    done();
})

gulp.task('aio-style', (done) => {
    gulp.src(['src/scss/main.scss'])
        //.pipe(sourcemaps.init())
        .pipe(sass({ outputStyle: 'compact' }).on('error', sass.logError))
        .pipe(postcss([autoprefixer()]))
        .pipe(rename('animate-io.css'))
        .pipe(gulp.dest('dist/'))
        .pipe(sass({ outputStyle: 'compressed' }).on('error', sass.logError))
        .pipe(rename('animate-io.min.css'))
        .pipe(gulp.dest('dist/'))
        //.pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist/'))
        .pipe(gulp.dest('docs/css'));
    done();
});

gulp.task('demo-style', (done) => {
    gulp.src(['docs/css/style.scss'])
        //.pipe(sourcemaps.init())
        .pipe(sass({ outputStyle: 'compact' }).on('error', sass.logError))
        .pipe(postcss([autoprefixer()]))
        .pipe(sass({ outputStyle: 'compressed' }).on('error', sass.logError))
        .pipe(rename('style.min.css'))
        .pipe(gulp.dest('docs/css/'));
    //.pipe(sourcemaps.write('.'))
    done();
});


gulp.task("default", () => {
    gulp.watch(['src/js/*.js', 'src/js/modules/*.js'], gulp.parallel('compile'))
    gulp.watch('dist/animate-io.js', gulp.parallel('compile-es2015'))
    gulp.watch('dist/animate-io.js', gulp.parallel('compile-with-polyfill'))
    gulp.watch('src/scss/main.scss', gulp.parallel('aio-style'))
    gulp.watch('docs/css/style.scss', gulp.parallel('demo-style'))
});