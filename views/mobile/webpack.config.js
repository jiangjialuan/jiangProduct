var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var OpenBrowserPlugin = require('open-browser-webpack-plugin');
var CleanPlugin = require('clean-webpack-plugin');
var CommonsChunkPlugin = webpack.optimize.CommonsChunkPlugin;
var prod = process.env.NODE_ENV === 'production' ? true : false,
    baseRoot = path.join(__dirname, '../../');
module.exports = {
    entry: __dirname + '/app.js',
    output: {
        path: path.resolve(__dirname, baseRoot + 'build/mobile'),
        filename: "js/[name].[hash:8].min.js",
        chunkFilename: 'js/[name].[hash:8].chunk.js',
        publicPath: prod ? 'http://liveimg.artqiyi.com/mobile/' : '/mobile/'
    },
    module: {
        loaders: [{
                test: /\.(png|jpg|jpeg|gif)$/,
                loader: 'url?limit=10000&name=images/[name].[hash:8].[ext]'
            }, {
                test: /\.(scss|css)$/,
                loader: ExtractTextPlugin.extract("style-loader", "css-loader!sass-loader") //这里如果没用ExtractTextPlugin是没问题的，用了提取不出来
            }, {
                test: /\.js[x]?$/,
                exclude: /node_modules/,
                loader: 'babel'
            }, {
                test: /\.html$/,
                loader: 'html?attrs=[img:src,link:href]'
            },
            // required for bootstrap icons
            {
                test: /\.woff$/,
                loader: "url-loader?prefix=font/&limit=5000&mimetype=application/font-woff"
            }, {
                test: /\.ttf$/,
                loader: "file-loader?prefix=font/"
            }, {
                test: /\.eot$/,
                loader: "file-loader?prefix=font/"
            }, {
                test: /\.svg$/,
                loader: "file-loader?prefix=font/"
            }
        ]
    },
    context: __dirname,
    node: {
        __dirname: true
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
        }),
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            }
        }),
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: __dirname + '/index.html',
            inject: 'body',
            favicon: __dirname + '/touch-icon-iphone.png',
            minify: {
                removeComments: true,
                collapseWhitespace: true,
                removeAttributeQuotes: true
            },
            chunksSortMode: 'dependency'
        }),
        new CleanPlugin(['build/mobile'], {
            root: baseRoot
        }),

        new ExtractTextPlugin('css/[name].[hash:8].chunk.css', {
            allChunks: false
        }),
        /* 公共库 */
        new CommonsChunkPlugin({
            name: 'vendors',
            minChunks: Infinity,
            // children: true,
            // async: true,
        }),
        new webpack.BannerPlugin("Copyright artqiyi inc.") //在这个数组中new一个就可以了
    ],
    externals: {
        react: 'React',
        zepto: 'Zepto',
        'react-dom': 'ReactDOM',
        'react-router': 'ReactRouter'
    }
};
// 判断开发环境还是生产环境, 添加uglify等插件
if (process.env.NODE_ENV === 'production') {
    module.exports.plugins = (module.exports.plugins || [])
        .concat([
            new webpack.DefinePlugin({
                __DEV__: JSON.stringify(JSON.parse(process.env.DEBUG || 'false'))
            }),
            new webpack.optimize.UglifyJsPlugin({
                compress: {
                    warnings: false,
                }
            }),

            new webpack.optimize.OccurenceOrderPlugin(),
        ]);
} else {
    module.exports.devServer = {
        contentBase: baseRoot + '/build',
        hot: true,
        stats: {
            colors: true
        },
        compress: {
            warnings: false,
            comments: false
        },
        proxy: {
            '/api/': {
                target: 'http://106.75.129.183:1888',
            },
            '/live/': {
                target: 'http://106.75.129.183:1888',
            },
            '/pay/': {
                target: 'http://106.75.129.183:1888',
            },
            '/backend/': {
                target: 'http://106.75.129.183:1888',
            }
        },
        plugins: [
            new webpack.HotModuleReplacementPlugin(),
            new webpack.optimize.OccurenceOrderPlugin(),

            // 启动热替换
            new OpenBrowserPlugin({
                url: 'http://192.168.0.131:80'
            }),
        ],
        historyApiFallback: {
            index: '/mobile/'
        }
    };
}
