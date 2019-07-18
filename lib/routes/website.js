const serveIndex = require("serve-index");
const webpackManager = require('../WebpackManager')
const history = require('connect-history-api-fallback');
const utils = require('../Utilities');

const setupWebsiteRoutes = () => {


    global.app.use(history());

    if (process.env.NODE_ENV == "development") {
        utils.info('WEB SITE', 'Using Webpack Dev Middleware to compile/serve html assets')
        webpackManager.useWebpackDevServer(global.app, '../webpack.config.js');
    } else {
        global.app.use(global.express.static("build/"));
        global.app.use('*/js/', global.express.static("build/js"))
        global.app.use('*/assets/', global.express.static("build/assets"))
        global.app.use('*/css/', global.express.static("build/css"))
    }
}

module.exports = {
    setupWebsiteRoutes
}