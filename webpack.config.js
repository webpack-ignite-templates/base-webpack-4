/* eslint no-unused-vars: off */

/**
 * Webpack and Node.js Stuff
 */
const webpack = require('webpack');
const path = require('path');
const fs = require('fs');

/**
 * Webpack Plugins
 */
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ImageminWebpackPlugin = require('imagemin-webpack')


/**
 * Webpack Ignite Files
 */
const threadLoader = require('thread-loader');
const { WebpackIgnite } = require('webpack-ignite');
const localConfiguration = require('./.ignite/configuration')

/**
 * Webpack Configuration
 * @param env
 */

module.exports = env => {

    const webpackIgnite = new WebpackIgnite(env, localConfiguration);
    const configs = webpackIgnite.ignite().then(() => {
        /**
         * Local Variables / Plugins / Modules
         */
        const configuration = webpackIgnite.configuration;
        const startupFolder = process.cwd();
        //const { imageminLoader, ImageminWebpackPlugin } = ImageMinWebpack;

        const cssLoaderConfig =
            [
                configuration.runtime.sassWorkerPool.threads > 0 &&
                {
                    loader: 'thread-loader',
                    options: configuration.runtime.sassWorkerPool,
                },
                {
                    loader: 'css-loader',
                    options: {
                        sourceMap: webpackIgnite.Utils.ifNotProduction(),
                        importLoaders: 2
                    }
                },
                {
                    loader: 'postcss-loader'
                },
                {
                    loader: 'sass-loader',
                    options: configuration.advanced.sass.loaderOptions
                }
            ]

        /**
         * Worker Thread Boot Up
         */
        if (configuration.runtime.babelWorkerPool.threads > 0) {
            threadLoader.warmup(configuration.runtime.babelWorkerPool, ['babel-loader', '@babel/preset-env']);
        }
        if (configuration.runtime.sassWorkerPool.threads > 0) {
            threadLoader.warmup(configuration.runtime.sassWorkerPool, ['sass-loader', 'css-loader']);
        }

        Object.keys(webpackIgnite.Utils.entryFiles).map(entryName => {
            const entryArray = [];
            entryArray.push(path.join(configuration.runtime.appDir, configuration.source.path, `${webpackIgnite.Utils.entries[entryName].inputFile}.js`));
            if (webpackIgnite.Utils.ifNotProduction()) {
                entryArray.push(`webpack-hot-middleware/client`);
            }
            webpackIgnite.Utils.entryFiles[entryName] = entryArray
        });

        return {
            mode: webpackIgnite.Utils.ifProduction('production', 'development'),
            bail: webpackIgnite.Utils.ifProduction(),
            parallelism: 5,
            stats: { children: false },
            recordsPath: path.resolve(startupFolder, '.ignite', `records.json`),
            devtool: webpackIgnite.Utils.ifProduction(configuration.sourceMaps.production, configuration.sourceMaps.development),
            entry: webpackIgnite.Utils.entryFiles,
            target: 'web',
            output: {
                path: path.resolve(__dirname, configuration.output.outputPath),
                pathinfo: webpackIgnite.Utils.ifProduction(false, true),
                filename: webpackIgnite.Utils.assetFileName(webpackIgnite.enums.moduleTypes.JAVASCRIPT),
                publicPath: "/"
                //publicPath: webpackIgnite.Utils.ifProduction(configuration.output.serverPath, ''),
            },

            resolve: {
                modules: [
                    path.resolve(startupFolder, configuration.source.path),
                    path.resolve(startupFolder, 'node_modules'),
                ],
                extensions: ['.js', '.json', '.jsx', '.vue'],
                alias: configuration.advanced.aliases,
                symlinks: false
            },

            externals: configuration.advanced.externals,

            module: {
                rules: [
                    //ES Lint
                    {
                        test: /\.(js|jsx|vue)$/,
                        include: path.resolve(startupFolder, configuration.source.path),
                        exclude: path.resolve(startupFolder, 'node_modules'),
                        use: ['eslint-loader'],
                        enforce: 'pre'
                    },

                    //Vue.js
                    {
                        test: /\.vue$/,
                        include: path.resolve(startupFolder, configuration.source.path),
                        exclude: path.resolve(startupFolder, 'node_modules'),
                        loader: 'vue-loader',
                        options: {
                            cssSourceMap: false
                        }
                    },

                    //URL Loader for Images
                    {
                        include: path.resolve(startupFolder, configuration.source.path),
                        exclude: configuration.advanced.urlLoader.exclude,
                        use: [
                            {
                                loader: 'url-loader',
                                options: {
                                    //publicPath: configuration.advanced.fileLoader.relativeAssetsPath,
                                    //useRelativePath: true,
                                    context: configuration.source.path,
                                    limit: configuration.output.inlineAssetMaxSize,
                                    name: webpackIgnite.Utils.assetFileName()
                                }
                            },
                            configuration.advanced.urlLoader.processImages > 0 && {
                                loader: ImageminWebpackPlugin.loader,
                                options: {
                                    bail: false,
                                    imageminOptions: {
                                        plugins: configuration.advanced.urlLoader.imageProcessingPlugins
                                    }
                                }
                            }

                        ].filter(Boolean)
                    },

                    //Inline Loader for SVG files
                    {
                        test: /\.svg$/,
                        use: [
                            {
                                loader: 'raw-loader'
                            },
                            {
                                loader: 'svgo-loader',
                                options: {
                                    plugins: [
                                        // {removeTitle: true},
                                        // {convertColors: {shorthex: false}},
                                        {convertPathData: false},
                                        {convertTransform: false},
                                        {removeXMLNS: true},
                                        // {convertShapeToPath: false},
                                        {mergePaths:false},
                                        // {cleanupAttrs: true},
                                        {removeDoctype: true},
                                        // {removeUselessDefs: true},
                                        {prefixIds: true}
                                    ]
                                }
                            }
                        ]
                    },

                    //File Loader for excluded file(s)
                    {

                        test: configuration.advanced.fileLoader.fileLoaderFiles,
                        //include: path.resolve(startupFolder, configuration.source.path),
                        use: [{
                            loader: 'file-loader',
                            options: {
                                publicPath: configuration.advanced.fileLoader.relativeAssetsPath,
                                context: configuration.source.path,
                                name: webpackIgnite.Utils.assetFileName()
                            }
                        }]
                    },

                    // Process JS down to ES2015 with Babel
                    {
                        test: configuration.advanced.babel.files,
                        exclude: webpackIgnite.Utils.checkIf(configuration.advanced.babel.exclude.length > 0, configuration.advanced.babel.exclude, /null_exclude/),
                        include: path.resolve(startupFolder, configuration.source.path),
                        use: [
                            configuration.runtime.babelWorkerPool.threads > 0 && {
                                loader: 'thread-loader',
                                options: configuration.runtime.babelWorkerPool,
                            },
                            {
                                loader: 'babel-loader',
                                options: {
                                    'cacheDirectory': true
                                }
                            }
                        ].filter(Boolean),
                    },

                    // Loader for SASS/CSS
                    {
                        test: /\.(sa|sc|c)ss$/,
                        include: [path.resolve(startupFolder, configuration.source.path), ...configuration.advanced.sass.includes],
                        exclude: webpackIgnite.Utils.checkIf(configuration.advanced.sass.excludes.length > 0, configuration.advanced.sass.excludes, /null_exclude/),
                        use: [webpackIgnite.Utils.ifNotProduction() ? 'style-loader' : {loader: MiniCssExtractPlugin.loader, options:{publicPath: configuration.advanced.fileLoader.relativeAssetsPath}}, ...cssLoaderConfig].filter(Boolean),
                    },

                    //EJS for templates
                    {
                        test: /\.ejs$/,
                        include: path.resolve(startupFolder, configuration.source.path),
                        use:
                            [
                                {
                                    loader: 'html-loader',
                                    options: {
                                        attrs: ['img:src', 'source:src', 'link:href'],
                                        minimize: false,
                                        interpolate: true,
                                    },
                                },
                                {
                                    loader: 'ejs-html-loader'
                                },
                            ]
                    },
                ].filter(Boolean)
            },

            performance: {
                maxEntrypointSize: 1000000,
                maxAssetSize: 5000000,
                assetFilter: function (assetFilename) {
                    return assetFilename.endsWith('.js');
                }
            },

            optimization: {
                namedChunks: webpackIgnite.Utils.ifProduction(),
                namedModules:  webpackIgnite.Utils.ifNotProduction(),
                moduleIds: webpackIgnite.Utils.ifProduction('hashed', 'named'),
                minimizer: [
                    webpackIgnite.Utils.ifProduction(new TerserPlugin(
                        {
                            parallel: true,
                            extractComments: true,
                            cache: true,
                            terserOptions: {
                                ecma: undefined,
                                warnings: false,
                                parse: {},
                                compress: {},
                                mangle: true, // Note `mangle.properties` is `false` by default.
                                module: false,
                                output: null,
                                toplevel: false,
                                nameCache: null,
                                ie8: false,
                                keep_classnames: undefined,
                                keep_fnames: false,
                                safari10: false
                                }
                        }
                    )),
                    webpackIgnite.Utils.ifProduction(new OptimizeCSSAssetsPlugin({}))
                ].filter(Boolean),
                splitChunks: {
                    cacheGroups: {
                        vendor: {
                            test: /[\\/]node_modules[\\/]/,
                            name: 'vendor',
                            chunks: 'all'
                        },
                        common: {
                            name: 'common',
                            chunks: 'initial',
                            minChunks: 2
                        }
                    }
                },
                runtimeChunk: 'single'
            },

            plugins: [

                // webpackIgnite.Utils.ifProduction(new webpack.DefinePlugin({
                //     'process.env.NODE_ENV': env.NODE_ENV
                // })),

                //Cause errors when file path case doesn't match
                new CaseSensitivePathsPlugin(),

                webpackIgnite.Utils.ifProduction(new MiniCssExtractPlugin({
                    // Options similar to the same options in webpackOptions.output
                    // both options are optional
                    filename: webpackIgnite.Utils.assetFileName(webpackIgnite.enums.moduleTypes.STYLESHEET),
                    chunkFilename: webpackIgnite.Utils.assetFileName(webpackIgnite.enums.moduleTypes.STYLESHEET)
                })),


                //Clean the output folder if we are running this as a production build
                webpackIgnite.Utils.ifProduction(new CleanWebpackPlugin({
                    verbose: true,
                    dry: !configuration.output.clean,
                })),

                //Enable HMR
                configuration.runtime.env.mode == 'development' && configuration.runtime.env.watch ? (new webpack.HotModuleReplacementPlugin()) : null,

                //Webpack HTML plugins
                ...Object.keys(webpackIgnite.Utils.entries).map((name) => {
                    let template = path.join(startupFolder, configuration.source.templatePath, `${webpackIgnite.Utils.entries[name].templateFile}.ejs`);
                    let exists = false;
                    try {
                        fs.statSync(template);
                        exists = true;
                    } catch (e) {
                        //swallow the error
                    }

                    if (exists) {
                        return new HtmlWebpackPlugin({
                            multihtmlCache: true,
                            inject: configuration.advanced.html.injectStylesAndScripts,
                            chunks: [name, configuration.advanced.chunkNames.vendor, configuration.advanced.chunkNames.common, configuration.advanced.chunkNames.manifest],
                            template,
                            filename: `${webpackIgnite.Utils.entries[name].outputTemplateFile}.html`,
                            minify: configuration.advanced.html.minify
                        })
                    }
                }),


                new CopyWebpackPlugin(configuration.advanced.additionalCopyOperations, { debug: 'info' }),

                //Minify Images in Production
                webpackIgnite.Utils.checkIf(configuration.advanced.urlLoader.processImages, new ImageminWebpackPlugin({
                    bail: false,
                    excludeChunksAssets: false,
                    test: /\.(jpe?g|png|gif|svg)$/i,
                    loader: true,
                    name: webpackIgnite.Utils.assetFileName(),
                    imageminOptions: {
                        plugins: configuration.advanced.urlLoader.imageProcessingPlugins
                    }
                })),

                webpackIgnite.Utils.checkIf(configuration.runtime.env.optimize,
                    new BundleAnalyzerPlugin({
                        analyzerMode: 'static',
                        reportFilename: '_stats/webpack_report.html',
                        defaultSizes: 'parsed',
                        openAnalyzer: false,
                        generateStatsFile: true,
                        statsFilename: '_stats/webpack_stats.json',
                        statsOptions: null,
                        logLevel: 'info'
                    })
                ),

            ].filter(Boolean),
        };


    })
    return configs;
}