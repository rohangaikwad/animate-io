const gulp = require('gulp');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const sourcemaps = require('gulp-sourcemaps');
const concat = require('gulp-concat');
const terser = require('gulp-terser');
const sass = require('gulp-sass');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const brotli = require('gulp-brotli');

gulp.task('compile', (done) => {
    gulp.src('src/main.js')
        //.pipe(sourcemaps.init())
        .pipe(rename("animate-io.js"))
        .pipe(gulp.dest('dist/'))
        .pipe(terser())
        .pipe(rename({ suffix: '.min' }))
        //.pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist/'))
        .pipe(brotli.compress({ 'extension': 'br' }))
        .pipe(gulp.dest('dist/'));
    done();
})

gulp.task('compile-es2015', (done) => {
    gulp.src('src/main.js')
        //.pipe(sourcemaps.init())
        .pipe(babel())
        .pipe(rename("animate-io-es2015.js"))
        .pipe(gulp.dest('dist/'))
        .pipe(terser())
        .pipe(rename({ suffix: '.min' }))
        //.pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist/'))
        .pipe(brotli.compress({ 'extension': 'br' }))
        .pipe(gulp.dest('dist/'));
    done();
})

gulp.task('compile-with-polyfill', (done) => {
    gulp.src(['src/intersection-observer-polyfill.js', 'src/main.js'])
        //.pipe(sourcemaps.init())
        .pipe(concat('animate-io-polyfill.js'))
        .pipe(babel())
        .pipe(gulp.dest('dist/'))
        //.pipe(sourcemaps.write())
        .pipe(terser())
        .pipe(rename({ suffix: '.min' }))
        //.pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist/'))
        .pipe(brotli.compress({ 'extension': 'br' }))
        .pipe(gulp.dest('dist/'))
        .pipe(gulp.dest('docs/js'));
    done();
})

gulp.task('style', (done) => {
    gulp.src(['src/styles.scss'])
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

gulp.task("default", () => {
    gulp.watch('src/main.js', gulp.parallel('compile'))
    gulp.watch('src/main.js', gulp.parallel('compile-es2015'))
    gulp.watch('src/main.js', gulp.parallel('compile-with-polyfill'))
    gulp.watch('src/styles.scss', gulp.parallel('style'))
});