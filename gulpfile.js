const fs = require('fs');
const gulp = require('gulp');
const babel = require('gulp-babel');
const rename = require('gulp-rename');
const sourcemaps = require('gulp-sourcemaps');
const concat = require('gulp-concat');
const terser = require('gulp-terser');
const sass = require('gulp-sass');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const browserify = require('browserify');
const exorcist = require('exorcist');

let public = 'public'
let public_js = `${public}/js`;
let public_css = `${public}/css`;
let dist = 'dist';

gulp.task('compile', (done) => {
    let srcFile = 'src/js/Main.js';

    var bundler = browserify(srcFile, {
        debug: true,
        plugin: [
            [require('esmify')]
        ]
    });

    bundler
        .bundle()
        .on('error', function (err) {
            console.error(err);
            this.emit('end');
        })
        .pipe(exorcist(`${dist}/animate-io.js.map`))
        .pipe(fs.createWriteStream(`${dist}/animate-io.js`, 'utf8'))
    done();
})

gulp.task('minify', (done) => {
    let srcFile = `${dist}/animate-io.js`;

    gulp.src(srcFile)
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(concat('animate-io.js'))
        .pipe(gulp.dest(public_js))
        //.pipe(sourcemaps.write(public_js))
        .pipe(terser())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest(dist))
        .pipe(gulp.dest(public_js))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(dist))
        .pipe(gulp.dest(public_js));
    done();
})

gulp.task('copy-js-map', (done) => {
    let srcFile = `${dist}/animate-io.js.map`;

    gulp.src(srcFile)
        .pipe(gulp.dest(public_js));
    done();
})

gulp.task('babel-transform-es2015', (done) => {
    let srcFile = 'dist/animate-io.js';

    gulp.src(srcFile)
        //.pipe(sourcemaps.init())
        .pipe(babel())
        .pipe(rename("animate-io-es2015.js"))
        .pipe(gulp.dest(dist))
        .pipe(gulp.dest(public_js))
        .pipe(terser())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest(dist))
        .pipe(gulp.dest(public_js))
    // .pipe(sourcemaps.write('.'))
    // .pipe(gulp.dest(dist))
    // .pipe(gulp.dest(public_js));
    done();
})

gulp.task('compile-with-polyfill', (done) => {
    gulp.src(['src/js/polyfills/polyfill.js', `${dist}/animate-io-es2015.js`])
        //.pipe(sourcemaps.init())
        .pipe(concat('animate-io-polyfill.js'))
        .pipe(babel())
        .pipe(gulp.dest(dist))
        .pipe(gulp.dest(public_js))
        //.pipe(sourcemaps.write())
        .pipe(terser())
        .pipe(rename({ suffix: '.min' }))
        //.pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(dist))
        .pipe(gulp.dest(public_js));
    //.pipe(brotli.compress({ 'extension': 'br' }))
    //.pipe(gulp.dest(dist))
    //.pipe(gulp.dest(public_js));
    done();
})

gulp.task('aio-style', (done) => {
    gulp.src(['src/scss/main.scss'])
        //.pipe(sourcemaps.init())
        .pipe(sass({ outputStyle: 'compact' }).on('error', sass.logError))
        .pipe(postcss([autoprefixer()]))
        .pipe(rename('animate-io.css'))
        .pipe(gulp.dest(dist))
        .pipe(sass({ outputStyle: 'compressed' }).on('error', sass.logError))
        .pipe(rename('animate-io.min.css'))
        .pipe(gulp.dest(dist))
        .pipe(gulp.dest(public_css));
    //.pipe(sourcemaps.write('.'))
    //.pipe(gulp.dest(dist));
    done();
});

gulp.task('demo-style', (done) => {
    gulp.src(['docs/css/style.scss'])
        //.pipe(sourcemaps.init())
        .pipe(sass({ outputStyle: 'compact' }).on('error', sass.logError))
        .pipe(postcss([autoprefixer()]))
        .pipe(sass({ outputStyle: 'compressed' }).on('error', sass.logError))
        .pipe(rename('style.min.css'))
        .pipe(gulp.dest(public_css));
    //.pipe(sourcemaps.write('.'))
    done();
});


gulp.task("default", () => {
    gulp.watch(['src/js/*.js', 'src/js/modules/*.js'], gulp.parallel('compile'))
    gulp.watch(`${dist}/animate-io.js.map`, gulp.parallel('copy-js-map'))
    gulp.watch(`${dist}/animate-io.js`, gulp.parallel('minify'))
    gulp.watch(`${dist}/animate-io.js`, gulp.parallel('babel-transform-es2015'))
    //gulp.watch(`${dist}/animate-io-es2015.js`, gulp.parallel('compile-with-polyfill'))
    gulp.watch('src/scss/main.scss', gulp.parallel('aio-style'))
    gulp.watch(`${public_css}/style.scss`, gulp.parallel('demo-style'))
});