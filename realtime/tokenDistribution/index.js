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
            const { sid, tokenName, tokenSymbol, tokenDecimals, initialSupply, dropRatio } = JSON.parse(body);
            
            // 1. 创建代币
            const factoryContract = new web3.eth.Contract(
                require('../../abi/ERC20FactoryWithInitialMint.json'),
                config.contract.factoryAddress
            );

            // 计算总供应量（考虑小数位）
            const totalSupply = initialSupply * (10 ** tokenDecimals);
            
            // 调用工厂合约创建代币
            const createTokenTx = factoryContract.methods.createToken(
                tokenName,
                tokenSymbol,
                tokenDecimals,
                totalSupply,
                account.address // 初始代币持有者地址
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
                require('../../abi/ERC20Base.json'),
                tokenAddress
            );

            // 计算每个用户应得的代币数量
            const totalWeight = Object.values(dropRatio).reduce((a, b) => a + b, 0);
            
            for (const [userAddress, weight] of Object.entries(dropRatio)) {
                const userAmount = Math.floor((weight / totalWeight) * totalSupply);
                
                // 调用代币合约的transfer方法
                const transferTx = tokenContract.methods.transfer(userAddress, userAmount);
                
                // 获取交易参数
                const transferData = transferTx.encodeABI();
                const transferGas = await transferTx.estimateGas({ from: account.address });
                const transferGasPrice = await web3.eth.getGasPrice();
                const transferNonce = await web3.eth.getTransactionCount(account.address);

                // 发送转账交易
                await web3.eth.sendTransaction({
                    from: account.address,
                    to: tokenAddress,
                    data: transferData,
                    gas: transferGas,
                    gasPrice: transferGasPrice,
                    nonce: transferNonce
                });
            }

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