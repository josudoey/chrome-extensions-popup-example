// ref https://webpack.github.io/docs/usage-with-gulp.html#without-webpack-stream
const gulp = require('gulp')
const cleanCss = require('gulp-clean-css')
const htmlmin = require('gulp-htmlmin')
const uglify = require('gulp-uglify')
const config = require('./webpack/config')
const log = require('fancy-log')
const PluginError = require('plugin-error')
const webpack = require('webpack')
const notProduction = process.env.NODE_ENV !== 'production'
const del = require('del')
const imagemin = require('gulp-imagemin')

const staticPath = './static'
const cloneGlob = staticPath + '/**/*.+(ttf|svg|eot|woff|woff2|ico|otf|json)'
const imageGlob = staticPath + '/**/*.+(jpeg|jpg|png)'
const jsGlob = staticPath + '/**/*.js'
const htmlGlob = staticPath + '/**/*.+(html|htm)'
const cssGlob = staticPath + '/**/*.css'
const buildPath = config.contentBase

gulp.task('clean', function () {
  return del.sync([buildPath])
})

gulp.task('clone', function () {
  return gulp.src(cloneGlob)
    .pipe(gulp.dest(buildPath))
})

gulp.task('webpack', function (callback) {
  webpack(config.webpack, function (err, stats) {
    if (err) {
      throw new PluginError('webpack', err)
    }
    log('[webpack]', stats.toString({}))
    callback()
  })
})

gulp.task('min:image', function () {
  const task = gulp.src(imageGlob)
  if (notProduction) {
    return task.pipe(gulp.dest(buildPath))
  }

  return gulp.src(imageGlob)
    .pipe(imagemin({
      interlaced: true,
      progressive: true,
      optimizationLevel: 5
    }))
    .pipe(gulp.dest(buildPath))
})

gulp.task('min:js', function () {
  const task = gulp.src(jsGlob)
  if (notProduction) {
    return task.pipe(gulp.dest(buildPath))
  }
  return task
    .pipe(uglify())
    .pipe(gulp.dest(buildPath))
})

gulp.task('min:css', function () {
  const task = gulp.src(cssGlob)
  if (notProduction) {
    return task.pipe(gulp.dest(buildPath))
  }
  return task.pipe(cleanCss())
    .pipe(gulp.dest(buildPath))
})

gulp.task('min:html', function () {
  const task = gulp.src(htmlGlob)
  if (notProduction) {
    return task.pipe(gulp.dest(buildPath))
  }

  return task.pipe(htmlmin({
    collapseWhitespace: true
  }))
    .pipe(gulp.dest(buildPath))
})

gulp.task('static', ['clone', 'min:image', 'min:js', 'min:css', 'min:html'])

gulp.task('build', ['clean', 'webpack', 'static'])

gulp.task('watch', function () {
  gulp.start('static')
  gulp.watch(cloneGlob, ['clone'])
  gulp.watch(imageGlob, ['min:image'])
  gulp.watch(cssGlob, ['min:css'])
  gulp.watch(jsGlob, ['min:js'])
  gulp.watch(htmlGlob, ['min:html'])
})

gulp.task('webpack:dev', function () {
  const configWebpack = config.webpack
  configWebpack.watch = true
  webpack(configWebpack, function (err, stats) {
    console.log(stats.toString({
      colors: true
    }))
  })
})

gulp.task('dev', ['webpack:dev', 'watch'])
