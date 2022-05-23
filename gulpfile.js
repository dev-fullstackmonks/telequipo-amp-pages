const gulp = require('gulp');
const rename = require('gulp-rename');
const sass = require('gulp-sass');
const postcss = require('gulp-postcss');
const sourcemaps = require('gulp-sourcemaps');
const autoprefixer = require('autoprefixer');
const pug = require('gulp-pug');
const replace = require('gulp-replace');
const fs = require('fs');
const browserSync = require('browser-sync').create();
const browserSync2 = require('browser-sync').create();

const through2 = require('through2');
const AmpOptimizer = require('@ampproject/toolbox-optimizer');
const ampOptimizer = AmpOptimizer.create();

/* -------------------------------------------------------------------------
  begin Sass
* ------------------------------------------------------------------------- */

gulp.task('sass', () =>
  gulp
    .src('build/sass/global.scss')

    .pipe(
      sass({
        outputStyle: 'expanded',
      }).on('error', sass.logError)
    )
    .pipe(rename('bundle.css'))
    .pipe(gulp.dest('dist/css'))
    .pipe(postcss([autoprefixer()]))
    .pipe(gulp.dest('./dist/css'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(
      sass({
        outputStyle: 'compressed',
      }).on('error', sass.logError)
    )
    .pipe(gulp.dest('./dist/css'))
    .pipe(sourcemaps.init())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./dist/css'))
);

/* -------------------------------------------------------------------------
   end Sass
 * ------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------
  begin Inject (For AMP)
* ------------------------------------------------------------------------- */

gulp.task('inject', () =>
  gulp
    .src(['./dist/**/*.html'])
    .pipe(
      replace('<style amp-custom></style>', () => {
        const css = fs.readFileSync('dist/css/bundle.css', 'utf8');

        return `<style amp-custom>\n${css}\n</style>`;
      })
    )
    .pipe(gulp.dest('./dist'))
);

/* -------------------------------------------------------------------------
  end Inject (For AMP)
* ------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------
   begin Optimizer
 * ------------------------------------------------------------------------- */

gulp.task('optimizer', () =>
  gulp
    .src(['./dist/*.html'])
    .pipe(
      through2.obj(async (file, _, cb) => {
        if (file.isBuffer()) {
          const optimizedHtml = await ampOptimizer.transformHtml(file.contents.toString());
          file.contents = Buffer.from(optimizedHtml);
        }
        cb(null, file);
      })
    )
    .pipe(gulp.dest('./dist/optimizer'))
);

/* -------------------------------------------------------------------------
   end Optimizer
 * ------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------
   begin Pug
 * ------------------------------------------------------------------------- */

gulp.task('pug', () =>
  gulp
    .src(['build/pug/*.pug'])
    .pipe(
      pug({
        basedir: __dirname,
        pretty: true,
        // debug: true,
        // compileDebug: true,
      })
    )
    .pipe(gulp.dest('././dist'))
);

/* -------------------------------------------------------------------------
   end Pug
 * ------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------
  begin Experiment
* ------------------------------------------------------------------------- */
gulp.task('side', () => {
  const originalHtml = ``;

  ampOptimizer.transformHtml(originalHtml).then((optimizedHtml) => {
    console.log(optimizedHtml);
  });
});
/* -------------------------------------------------------------------------
  end Experiment
* ------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------
  begin Run
* ------------------------------------------------------------------------- */

gulp.task('watch', () => {
  browserSync.init({
    server: {
      baseDir: './dist',
      index: 'sub-category.html',
    },
    port: 3010,
    ui: {
      port: 3011,
    },
  });

  browserSync2.init({
    server: {
      baseDir: './dist',
      index: 'product-card.html',
    },
    port: 3012,
    ui: {
      port: 3013,
    },
  });

  gulp.watch('./build/pug/**/*.pug', gulp.series('pug', 'sass', 'inject', 'optimizer'));
  gulp.watch('./build/sass/**/*.scss', gulp.series('pug', 'sass', 'inject', 'optimizer'));
  // gulp.watch('./build/sass/**/*.scss', gulp.series('pug', 'sass', 'inject'));
  gulp.watch('./dist/css/*.css').on('change', browserSync.reload);
  gulp.watch('./dist/css/*.css').on('change', browserSync2.reload);
  gulp.watch('./dist/*.html').on('change', browserSync.reload);
  gulp.watch('./dist/*.html').on('change', browserSync2.reload);
});

/* -------------------------------------------------------------------------
   end Run
 * ------------------------------------------------------------------------- */
