/**
 * Create with mqMiddleware
 * Author: ChrisChiu
 * Date: 2022/7/18
 * Desc
 */
const schedule = require('node-schedule');

const process = async () => {
    const rule = new schedule.RecurrenceRule();
    rule.second = [0, 10, 20, 30, 40, 50];
    schedule.scheduleJob(rule, async () => {

    });
};


module.exports = () => {
    process();
};
