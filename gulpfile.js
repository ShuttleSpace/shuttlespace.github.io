let gulp = require('gulp');
let minifycss = require('gulp-minify-css');
let uglify = require('gulp-uglify');
let htmlmin = require('gulp-htmlmin');
let htmlclean = require('gulp-htmlclean');
let imagemin = require('gulp-imagemin');

gulp.task("minify-html", function () {
    return gulp.src("./public/**/*.html")
        .pipe(htmlclean())
        .pipe(htmlmin({
            removeComments: true,
            minifyJS: true,
            minifyCSS: true,
            minifyURLs: true
        }))
        .pipe(gulp.dest('./public'))
});

gulp.task('minify-css', function () {
    return gulp.src('./public/**/*.css')
        .pipe(minifycss({
            compatibility: 'ie8'
        }))
        .pipe(gulp.dest('./public'));
});

gulp.task('minify-js', function () {
    return gulp.src('./public/js/**/*.js')
        .pipe(uglify())
        .pipe(gulp.dest('./public'));
});

gulp.task('minify-images', function () {
    return gulp.src('./public/images/**/*.*')
        .pipe(imagemin(
            [
                imagemin.gifsicle({
                    'optimizationLevel': 3
                }),
                imagemin.jpegtran({
                    'progressive': true
                }),
                imagemin.optipng({
                    'optimizationLevel': 7
                }),
                imagemin.svgo()
            ], {
                'verbose': true
            }
        ))
        .pipe(gulp.dest('./public/images'));
});

gulp.task('default', function (done) {
    gulp.series([
        'minify-html', 'minify-css', 'minify-js', 'minify-images'
    ])
    done();
});