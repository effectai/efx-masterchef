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

    // POOL SIZE = 807,116 EFX
    // POOL DURATION BLOCKS = 2649841
    // EMMISSION = 0.304590350892751678 EFX per BLOCK

    // The Chef
    const TheChef = await ethers.getContractFactory("MasterChef")
    const chef = await TheChef.deploy(
        tokenaddr,
        lptokenaddr,
        '304590350892751678',
        32859659,  // Mon Oct 23 2023 14:23:23 GMT+0200
        35509500   // Tue Jan 23 2024 14:35:41 GMT+0100
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
