import './src/utils/polyfills'
import webpack from 'webpack'
import path from 'path'
import MiniCssExtractWebpackPlugin from 'mini-css-extract-plugin'
import OptimizeCssAssets from 'optimize-css-assets-webpack-plugin'
import CleanWebpackPlugin from 'clean-webpack-plugin'
import SimpleProgressPlugin from 'simple-progress-webpack-plugin'
import CompressionPlugin from 'compression-webpack-plugin'
import TerserWebpackPlugin from 'terser-webpack-plugin'
import HTMLWebpackPlugin from 'html-webpack-plugin'
import PreRenderSPAPlugin from 'prerender-spa-plugin'
import {BundleAnalyzerPlugin} from 'webpack-bundle-analyzer'
import HTMLInlineCSSWebpackPlugin from 'html-inline-css-webpack-plugin'

const configuration = (env: { production?: boolean, analyze?: boolean } = {}): webpack.Configuration => {
  return ({
    mode: env.production ? 'production' : 'development',
    context: path.resolve(__dirname, 'src'),
    entry: {
      main: './index.ts',
      webComponents: './web-components/index.tsx'
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      alias: {
        'DOM': path.resolve(__dirname, './src/utils/DOM/index.ts'),
        '~': path.resolve(__dirname, './src'),
        '@': path.resolve(__dirname, './src'),
      }
    },
    output: {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
      path: path.resolve(__dirname, 'www'),
      filename: env.production ? 'js/[chunkhash:5].js' : 'js/[name].js',
      publicPath: '/'
    },
    module: {
      rules: [
        {
          test: /\.(t|j)sx?$/,
          exclude: /node_modules/,
          use: ['babel-loader']
        },
        {
          test: /\.s?css$/,
          oneOf: [
            {
              include: /\/(web-components|fonts)\//,
              use: [
                'css-string-loader',
                'css-modules-typescript-loader',
                {
                  loader: 'css-loader',
                  options: {
                    modules: true,
                    localIdentName: env.production
                      ? '[hash:base64:5]'
                      : '[local]--[hash:base64:5]',
                    camelCase: 'only',
                  }
                },
                'sass-loader'
              ]
            },
            {
              exclude: /\/(web-components|fonts)\//,
              use: [
                env.production ? MiniCssExtractWebpackPlugin.loader : 'style-loader',
                'css-modules-typescript-loader',
                {
                  loader: 'css-loader',
                  options: {
                    modules: true,
                    localIdentName: env.production
                      ? '[hash:base64:5]'
                      : '[local]--[hash:base64:5]',
                    camelCase: 'only',
                    sourceMap: true
                  }
                },
                'css-variables-to-json-loader',
                'resolve-url-loader',
                {
                  loader: 'sass-loader',
                  options: {
                    sourceMap: true
                  }
                }
              ]
            }
          ],
        },
        {
          test: /\.svg$/,
          use: 'svg-inline-loader'
        },
        {
          test: /\.md$/,
          use: 'raw-loader'
        },
        {
          test: /\.(woff|woff2|ttf|otf)$/,
          use: {
            loader: 'file-loader',
            options: {
              name: `fonts/[${env.production ? 'hash:5' : 'name'}].[ext]` 
            }
          }
        },
        {
          test: /\.(jpe?g|png|pdf|ico)$/,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: `images/[${env.production ? 'hash:5' : 'name'}].[ext]`
              }
            }
          ]
        },
      ]
    },
    resolveLoader: {
      alias: {
        'css-string-loader': path.resolve(__dirname, './webpack/css-string-loader.ts'),
        'css-variables-to-json-loader': path.resolve(__dirname, './webpack/css-variables-to-json-loader.ts'),
        'dom-svg-loader': path.resolve(__dirname, './webpack/svg-loader.ts'),
      }
    },
    plugins: [
      new MiniCssExtractWebpackPlugin({
        filename: `styles/[${env.production ? 'contenthash:5' : 'name'}].css`,
        chunkFilename: `styles/[${env.production ? 'contenthash:5' : 'id'}].css`
      }),
      new HTMLWebpackPlugin({
        inject: false,
        template: './template.ts',
        minify: env.production as false | object,
      }),
      new webpack.EnvironmentPlugin({
        NODE_ENV: env.production
        ? 'production'
        : 'development'
      }),
      SimpleProgressPlugin({format: env.production ? 'compact' : 'minimal'}),
      new BundleAnalyzerPlugin({
        analyzerMode: env.analyze ? 'static' : 'disabled',
        analyzerPort: 3000,
        // generateStatsFile: true
      }),
      ...env.production
      ? [
        new HTMLInlineCSSWebpackPlugin(),
        new PreRenderSPAPlugin({
          staticDir: path.join(__dirname, 'www'),
          routes: [ '/' ],
          server: {port: 3001},
          minify: {
            collapseBooleanAttributes: true,
            collapseWhitespace: true,
            decodeEntities: true,
            keepClosingSlash: true,
            sortAttributes: true,
            removeComments: false
          }
        }),
        new CleanWebpackPlugin(),
        new CompressionPlugin({
          algorithm: 'gzip',
          filename: '[path].gz[query]',
          minRatio: 0.8,
          test: /\.js$/,
          threshold: 10240
        })
      ]
      : []
    ],
    optimization: {
      // namedModules: true,
      // splitChunks: {
      //   cacheGroups: {
      //     'dom': {
      //       test: /[\\/]DOM[\\/]/,
      //       name: 'dom',
      //       chunks: 'all',
      //       enforce: true
      //     },
      //   }
      // },
      minimizer: env.production ? [
        new TerserWebpackPlugin({
          cache: false,
          parallel: true,
          sourceMap: true,
          terserOptions: {
            output: {
              comments: false,
            },
          }
        }),
        new OptimizeCssAssets()
      ] : []
    },
    target: 'web',
    stats: env.production ? 'normal' : 'errors-only',
    devtool: 'source-map',
    devServer: {
      contentBase: path.resolve('./src'),
      host: '0.0.0.0',
      disableHostCheck: true,
      compress: false,
      historyApiFallback: true,
      inline: true,
      hot: false,
      https: false,
      port: 3000,
      stats: 'normal'
    }
  })
}

export default configuration
