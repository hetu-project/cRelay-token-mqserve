/**
 * Create with mqMiddleware
 * Author: AI Assistant
 * Date: 2024/03/21
 * Desc: Token distribution consumer
 */

const amqplib = require('amqplib');
const config = require('../../config');
const Web3 = require('web3');

const web3 = new Web3(new Web3.providers.HttpProvider(config.nodeHTTP));

// 创建账户对象
const account = web3.eth.accounts.privateKeyToAccount(config.privateKey);
web3.eth.accounts.wallet.add(account);

const tokenDistribution = async () => {
    const q = 'tokenDistributionQueue';

    async function doWork(msg) {
        const body = msg.content.toString();
        try {
            const { account: creatorAddress, tokenName, tokenSymbol, initialSupply, userWeights } = JSON.parse(body);
            
            // 1. 创建代币
            const factoryContract = new web3.eth.Contract(
                require('../../abi/MemeTokenFactory.json'),
                config.contract.factoryAddress
            );
            
            // 调用工厂合约创建代币
            const createTokenTx = factoryContract.methods.createMemeToken(
                tokenName,
                tokenSymbol,
                initialSupply,
                10, // creatorFeePercent - 10%
                creatorAddress // 使用消息中的account作为创建者地址
            );

            // 获取交易参数
            const createTokenData = createTokenTx.encodeABI();
            const gas = await createTokenTx.estimateGas({ from: account.address });
            const gasPrice = await web3.eth.getGasPrice();
            const nonce = await web3.eth.getTransactionCount(account.address);

            // 发送创建代币交易
            const createTokenResult = await web3.eth.sendTransaction({
                from: account.address,
                to: config.contract.factoryAddress,
                data: createTokenData,
                value: config.contract.factoryFee,
                gas,
                gasPrice,
                nonce
            });

            if (!createTokenResult.status) {
                throw new Error('Failed to create token');
            }

            // 从交易收据中获取新代币的地址
            const tokenAddress = createTokenResult.contractAddress;

            // 2. 分发代币
            const tokenContract = new web3.eth.Contract(
                require('../../abi/MemeToken.json'),
                tokenAddress
            );

            // 将userWeights转换为地址和权重的对应关系
            // 注意：这里需要根据实际情况将user1, user2等转换为实际的以太坊地址
            const recipients = Object.keys(userWeights);
            const weights = Object.values(userWeights).map(weight => Math.floor(weight * 100)); // 将小数转换为整数权重
            
            // 调用代币合约的distributeByWeight方法
            const distributeTx = tokenContract.methods.distributeByWeight(
                recipients,
                weights,
                initialSupply
            );
            
            // 获取交易参数
            const distributeData = distributeTx.encodeABI();
            const distributeGas = await distributeTx.estimateGas({ from: account.address });
            const distributeGasPrice = await web3.eth.getGasPrice();
            const distributeNonce = await web3.eth.getTransactionCount(account.address);

            // 发送分发交易
            await web3.eth.sendTransaction({
                from: account.address,
                to: tokenAddress,
                data: distributeData,
                gas: distributeGas,
                gasPrice: distributeGasPrice,
                nonce: distributeNonce
            });

            this.ack(msg);
        } catch (e) {
            console.error('Token distribution error:', e);
            // 可以选择重试或者将失败的消息放入死信队列
        }
    }

    amqplib.connect(config.CLOUDAMQP_URL).then((conn) => {
        conn.on('error', (err) => {
            console.error('Connection error:', err.message);
            return tokenDistribution();
        });
        
        return conn.createChannel().then(async (ch) => {
            await ch.assertQueue(q, {durable: true});
            ch.prefetch(1);
            ch.consume(q, doWork.bind(ch), {noAck: false, exclusive: true, consumerTag: 'tokenDistribution'});
            console.log('Token distribution consumer is ready.');
        });
    }).catch(console.warn);
};

module.exports = async () => {
    await tokenDistribution();
};