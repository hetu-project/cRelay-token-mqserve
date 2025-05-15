/**
 * Create with mqMiddleware
 * Author:  aurelia
 * Date: 2025/05/15
 * Desc
 */
const config = require('../../config');
const response = require('../../utils/response');
const amqplib = require('amqplib');

const amqp_url = config.CLOUDAMQP_URL;

class MQ {
    constructor(app) {
        app.post('/api/tokenDistribution', this.checkSecretKey, this.distribute);
    }

    async checkSecretKey(req, res, next) {
        if (req.headers.authorization === `Bearer ${config.secretKey}`) {
            next();
        } else {
            return response.returnAuthError(res);
        }
    }
    async distribute(req, res) {
        try {
            const conn = await amqplib.connect(amqp_url, 'heartbeat=60');
            const ch = await conn.createChannel();
            const exch = 'tokenDistributionExchange';
            const q = 'tokenDistributionQueue';
            const rkey = 'tokenDistributionRoute';
            const msg = req.body.message;
            await ch.assertExchange(exch, 'direct', {durable: true}).catch(console.error);
            await ch.assertQueue(q, {durable: true});
            await ch.bindQueue(q, exch, rkey);
            await ch.publish(exch, rkey, Buffer.from(msg));
            setTimeout(() => {
                ch.close();
                conn.close();
                return response.returnSuccess(res, 'complete');
            }, 500);
        } catch (e) {
            return response.returnError(res, e);
        }
    }
}

module.exports = MQ;
