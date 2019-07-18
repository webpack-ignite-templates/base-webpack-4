const chalk = require('chalk');
const prettyjson = require('prettyjson-chalk');
// eslint-disable-next-line no-console
const _log = console.log;

const doLog = (header, message, headerColor, messageColor) => {
    
    var noMessage = message ? false : true;
    const _message = noMessage ? typeof header == "object" ? {...header} : header : message
    const _header = noMessage ? "DEBUG" : header

    if (typeof _message == "object") {        
        message = prettyjson.render(_message, { keysColor: messageColor, dashColor: messageColor, numberColor: 'yellow', stringColor: 'white'})
    } else {
        message = chalk[messageColor](`${_message}\n`)
    }

    _log(chalk[headerColor].underline.bold(`\n${_header}`))
    _log(message)
}

class Utilities {

    static setupEnv() {
        const dotEnvResults = require('dotenv').config()
        this.info('DOTENV PARSED CONFIG', dotEnvResults.parsed || dotEnvResults.error)

        const commandArgs = require('yargs').argv
        if (commandArgs['NODE_ENV'] != null) {
            process.env.NODE_ENV = commandArgs['NODE_ENV'];
        } else {
            process.env.NODE_ENV = process.env.NODE_ENV || 'production';
        }
        this.info('NODE_ENV', process.env.NODE_ENV)
    }

    static log(header, message) {
        doLog(header, message, 'white', 'white')
    }

    static info(header, message) {
        doLog(header, message, 'blue', 'blue')
    }

    static warn(header, message) {
        doLog(header, message, 'yellow', 'yellow')
    }

    static error(header, message) {
        doLog(header, message, 'red', 'red')
    }

    static success(header, message) {
        doLog(header, message, 'green', 'green')
    }

    static stringify(object) {
        return JSON.stringify(object);
    }
}

module.exports = Utilities;