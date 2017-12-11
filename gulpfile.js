var gulp = require('gulp'); 

// import components
var less = require('gulp-less');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var contentIncluder = require('gulp-content-includer');
var minifyCss = require('gulp-clean-css');


// compile all sass and minify css
gulp.task('sass', function() {
    gulp.src('./client_code/sass/*.scss')
        .pipe(sass())
        .pipe(rename({ suffix: '.min' }))
        .pipe(minifyCss())
        .pipe(gulp.dest('./public/stylesheets'));
});

// minify all js
gulp.task('js', function() {
    gulp.src('./client_code/js/*.js')
        .pipe(rename({ suffix: '.min' }))
        .pipe(uglify())
        .pipe(gulp.dest('./public/javascripts'));
});

// move img and font
gulp.task('move',function() {
    gulp.src("./client_code/img/**")
        .pipe(gulp.dest('./public/images'));
    gulp.src("./client_code/font/**")
        .pipe(gulp.dest('./public/fonts'));
    gulp.src("./client_code/auth/**")
        .pipe(gulp.dest('./public'));
});

// NOT USE, include components html
gulp.task('html',function() {
    gulp.src("./client_code/html/*.html")
        .pipe(contentIncluder({
            includerReg:/<!\-\-include\s+"([^"]+)"\-\->/g
        }))
        .pipe(gulp.dest('./public/html'));
});

// NOT USE, minify all css
gulp.task('css', function() {
    gulp.src('./client_code/css/*.css')
        .pipe(rename({ suffix: '.min' }))
        .pipe(minifyCss())
        .pipe(gulp.dest('./public/stylesheets'));
});

// NOT USE, compile main.less and minify css
gulp.task('less', function() {
    gulp.src('./client_code/less/main.less')
        .pipe(less())
        .pipe(rename({ suffix: '.min' }))
        .pipe(minifyCss())
        .pipe(gulp.dest('./public/stylesheets'));
});


// default watching resource change
gulp.task('default', function(){
    gulp.run('sass', 'js', 'move', 'html', 'css', 'less');

     gulp.watch("./client_code/**", ['sass', 'js', 'move', 'html', 'css', 'less']);
});