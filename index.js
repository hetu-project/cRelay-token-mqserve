/**
 * Create with mqMiddleware
 * Author: ChrisChiu
 * Date: 2022/7/18
 * Desc
 */
const config = require('./config');

const schedule = require('./schedule');
schedule();
const realtime = require('./realtime');
realtime();



const express = require('express');
const app = express();

const {port, timeout} = config;

const http = require('http').Server(app);
http.timeout = timeout;

const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

const routes = require('./router');
routes(app);

http.listen(port, function () {
    console.info(`Please open Internet explorer to access ：http://localhost:${port}/`);
});

process.on('unhandledRejection', function (err) {
    console.error('catch exception:', err.stack);
});

process.on('uncaughtException', function (err) {
    console.error('catch exception:', err.stack);
});

