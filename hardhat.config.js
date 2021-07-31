require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");

require('dotenv').config();

const BSC_TESTNET_PRIVATE_KEY = process.env.BSC_TESTNET_PRIVATE_KEY ||
      "0000000000000000000000000000000000000000";

const BSC_MAINNET_PRIVATE_KEY = process.env.BSC_MAINNET_PRIVATE_KEY ||
      "0000000000000000000000000000000000000000";

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || '';

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
    const accounts = await hre.ethers.getSigners();

    for (const account of accounts) {
        console.log(account.address);
    }
});

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
    solidity: {
        compilers: [
            {
                version: '0.6.12'
            },
            {
                version: "0.6.6"
            },
            {
                version: "0.5.16"
            }
        ],
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    },
    paths: {
        sources: './contracts',
        tests: './test',
        cache: './cache',
        artifacts: './artifacts'
    },
    networks: {
        testnet: {
            url: "https://data-seed-prebsc-1-s1.binance.org:8545",
            chainId: 97,
            gasPrice: 20000000000,
            accounts: [`0x${BSC_TESTNET_PRIVATE_KEY}`]
        },
        mainnet: {
            url: "https://bsc-dataseed.binance.org/",
            chainId: 56,
            gasPrice: 20000000000,
            accounts: [`0x${BSC_MAINNET_PRIVATE_KEY}`]
        }
    },
    etherscan: {
        apiKey: `${ETHERSCAN_API_KEY}`
    }
};
