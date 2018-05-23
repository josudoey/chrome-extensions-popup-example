const path = require('path')
const webpack = require('webpack')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin')
const globby = require('globby')
const camelCase = require('camelcase')

const projectPath = path.resolve(__dirname, '..')
const contentPath = path.resolve(projectPath, 'webpack')
const staticPath = path.resolve(projectPath, 'static')
const contentBase = path.resolve(projectPath, 'build')
const webpackPublicPath = '/bundle/'
const webpackOutputPath = path.join(contentBase, webpackPublicPath)

const isDev = process.env.NODE_ENV !== 'production'
const mode = (isDev) ? 'development' : 'production'

const config = module.exports = {
  projectPath: projectPath,
  contentBase: contentBase,
  static: {
    path: staticPath
  }
}

const entry = {}
const entryFiles = globby.sync(path.join(contentPath, 'entry', '*.js'), {
  cwd: __dirname,
  absolute: true,
  nodir: true
})
for (const entryPath of entryFiles) {
  const basename = path.basename(entryPath, '.js')
  const entryName = camelCase(basename)
  entry[entryName] = [entryPath]
}

const plugins = [
  new CleanWebpackPlugin([contentBase], {
    root: projectPath,
    verbose: true,
    dry: false,
    beforeEmit: true
  }),
  new webpack.ProvidePlugin({})
]

const templateFiles = globby.sync(path.join(contentPath, 'html', '**', 'template.pug'), {
  cwd: __dirname,
  absolute: true,
  nodir: true
})

for (const templatePath of templateFiles) {
  const dirName = path.dirname(templatePath)
  const basename = path.basename(dirName)
  const filename = `../${basename}.html`
  const plugin = new HtmlWebpackPlugin({
    inject: false,
    hash: true,
    template: templatePath,
    filename: filename,
    basename: basename,
    alwaysWriteToDisk: true
  })
  plugins.push(plugin)
}
plugins.push(new HtmlWebpackHarddiskPlugin())

config.webpack = {
  mode: mode,
  entry: entry,
  output: {
    path: webpackOutputPath,
    publicPath: webpackPublicPath,
    filename: '[name].js',
    chunkFilename: '[name].[id].[hash].js'
  },
  resolve: {
    alias: {}
  },
  module: {
    rules: [{
      test: /\.html$/,
      use: [{
        loader: 'html-loader',
        options: {
          minimize: true
        }
      }]
    }, {
      test: /.pug$/,
      loader: 'pug-loader'
    }, {
      test: /\.css$/,
      use: [{
        loader: 'style-loader/useable',
        options: {
          sourceMap: true
        }
      }, {
        loader: 'css-loader'
      }]
    }, {
      test: /\.js$/,
      exclude: /(node_modules|bower_components)/,
      include: [
        path.resolve(__dirname, '../webpack')
      ],
      loader: 'babel-loader'
    }, {
      test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
      loader: 'url-loader',
      query: {
        name: 'img/[name].[hash:8].[ext]'
      }
    }, {
      test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
      loader: 'url-loader',
      query: {
        name: 'fonts/[name].[hash:8].[ext]'
      }
    }]
  },
  plugins: plugins,
  devtool: (isDev) ? 'source-map' : false
}
