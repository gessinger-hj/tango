/* 
* @Author: Hans Jürgen Gessinger
* @Date:   2016-01-07 13:52:54
* @Last Modified by:   hg02055
* @Last Modified time: 2016-01-07 16:16:37
*/

var gulp = require('gulp');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');
 
gulp.task('javascript', function() {
  return gulp.src(['../src/Tango.js','../src/File.js'])
    .pipe(sourcemaps.init())
      .pipe(concat('all.js'))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./dist'));
});