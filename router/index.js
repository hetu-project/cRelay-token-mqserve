/**
 * Create with mqMiddleware
 * Author: ChrisChiu
 * Date: 2022/7/18
 * Desc
 */
const mq = require('./mq');

module.exports = (app) => {
    new mq(app);
};
