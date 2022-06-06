const { ethers, BigNumber } = require("hardhat")
const chalk = require("chalk")

function delay(t, val) {
    return new Promise(function(resolve) {
        setTimeout(function() {
            resolve(val);
        }, t);
    });
}

const main = async () => {
    // Deployer info
    const [admin] = await ethers.getSigners()
    console.log(`✅ Deployer address: \t${chalk.green(admin.address)}\n✅ Account Balance: \t${(await admin.getBalance()).toString()}`)

    // Tokens deployed on BSC testnet
    const tokenaddr = '0xC51Ef828319b131B595b7ec4B28210eCf4d05aD0'
    const lptokenaddr = '0xAf1DB0c88a2Bd295F8EdCC8C73f9eB8BcEe6fA8a'

    // The Chef
    const TheChef = await ethers.getContractFactory("MasterChef")
    const chef = await TheChef.deploy(
        tokenaddr,
        lptokenaddr,
        '235161210317460317',
        18478250,  // Jun 07 2022 12:00:17 GMT+0200
        21127550   // Sep 07 2022 11:45:53 GMT+0200
    )
    await chef.deployed()
    console.log(`✅ MasterChef deployed: \t${chalk.green(chef.address)}}`)
}

(async () => {
    try {
        await main()
    } catch (error) {
        console.error(error)
    }
})()
