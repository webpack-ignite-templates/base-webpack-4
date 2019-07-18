require('../lib/Utilities').setupEnv();
const utils = require('../lib/Utilities');
const express = global.express = require("express");
const app = global.app = express();

const routeManager = require('./RouteManager')
const port = 3000;

global.httpServer = app.listen(port, () => utils.success(`WEB SERVER`, `Development Environment Running on port ${port}!`));

routeManager.setupWebRoutes();