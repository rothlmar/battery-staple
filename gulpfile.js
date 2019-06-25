var gulp = require('gulp');

gulp.task('bootstrap', function() {
  return gulp.src('node_modules/bootstrap/dist/css/bootstrap.min.css')
    .pipe(gulp.dest('bootstrap'));
});

gulp.task('firebase', function() {
  return gulp.src('node_modules/firebase/firebase-@(app|auth|firestore).js')
    .pipe(gulp.dest('firebase'));
});

gulp.task('nacl', function() {
  return gulp.src(['node_modules/tweetnacl/nacl-fast.min.js', 'node_modules/tweetnacl-util/nacl-util.min.js'])
    .pipe(gulp.dest('nacl'));
});

gulp.task('default', gulp.series('bootstrap', 'firebase', 'nacl'))
