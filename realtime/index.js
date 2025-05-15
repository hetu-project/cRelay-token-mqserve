/**
 * Create with mqMiddleware
 * Author: ChrisChiu
 * Date: 2022/7/18
 * Desc
 */

const faucetOnchain = require('./faucet');
const tokenDistribution = require('./tokenDistribution');

module.exports = async () => {
    await faucetOnchain();
    await tokenDistribution();
};
