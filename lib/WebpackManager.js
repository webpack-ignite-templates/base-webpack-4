const webpack = require('webpack');
const middleware = require('webpack-dev-middleware');
const hotMiddleware = require("webpack-hot-middleware");
const utils = require('./Utilities');


const useWebpackDevServer = (expressServer, webpackConfigFile) => {
    const webpackConfig = require(`${webpackConfigFile}`);
    webpackConfig({NODE_ENV:'development', watch: true, mode:'development'}).then(configs => {

        utils.info('WEBPACK', 'Loaded Webpack Configuration')
        if (!Array.isArray(configs)) {
            configs = [configs]
        }

        configs.forEach(function (config) {
                const compiler = webpack(config);
                expressServer.use(middleware(compiler, {
                    publicPath: `/`,
                    stats: {children: false, colors: true}
                }));
                expressServer.use(hotMiddleware(compiler));
            });
        });
}

module.exports =  {
    useWebpackDevServer
}
