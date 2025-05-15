/**
 * Create with datacenter
 * Author: ChrisChiu
 * Date: 2022/11/17
 * Desc
 */

const oauth = require('axios-oauth-client');
const axios = require('axios');
const https = require('https');
const config = require('../config').tngateway;

const connect = async () => {
    const now = new Date().getTime();
    if (global.tngateway_expiresTime > now) {
        return global.tngateway_authorization;
    }

    const getClientCredentials = oauth.clientCredentials(
        axios.create({
            httpsAgent: new https.Agent({
                rejectUnauthorized: false,
            }),
        }),
        config.access_token_url, config.clientId, config.clientSecret, config.scope
    );
    const data = await getClientCredentials();
    if (!data.access_token) {
        return false;
    }
    global.tngateway_expiresTime = now + (data.expires_in * 1000);
    global.tngateway_authorization = `${data.token_type} ${data.access_token}`;

    return global.tngateway_authorization;
};

module.exports.getData = async (method, url, data) => {
    const authorization = await connect();
    if (!authorization) {
        return false;
    }
    if (method === 'get') {
        const conf = {headers: {Authorization: `${authorization}`}};
        if (data) {
            conf.params = data;
        }
        const result = await axios.create({
            httpsAgent: new https.Agent({
                rejectUnauthorized: false,
            }),
        }).get(url, conf);
        return result.data;
    }
    if (method === 'post') {
        const conf = {headers: {Authorization: `${authorization}`}};
        const result = await axios.create({
            httpsAgent: new https.Agent({
                rejectUnauthorized: false,
            }),
        }).post(url, data, conf);
        return result.data;
    }
};
