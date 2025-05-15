/**
 * Create with mqMiddleware
 * Author: aurelia
 * Date: 2025/05/15
 * Desc
 */

require('dotenv').config();

module.exports = {
    port: process.env.PORT,
    timeout: 600000,
    secretKey: process.env.SECRET_KEY,
    CLOUDAMQP_URL: process.env.CLOUDAMQP_URL,
    nodeHTTP: process.env.EVM_ENDPOINT,
    defaultGas: 5000000,
    privateKey: process.env.PRIVATEKEY,
    contract: {
        factoryAddress: process.env.FACTORY_ADDRESS,
        factoryFee: process.env.FACTORY_FEE || '1000000000000000000' // 1 ETH in wei
    }
};
