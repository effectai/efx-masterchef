const { ethers } = require("hardhat")
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
    console.log(`✅ Deployment address: \t${chalk.green(admin.address)}\n✅ Account Balance: \t${(await admin.getBalance()).toString()}`)

    // Tokens deployed on BSC testnet
    const token = '0xAe39A0369ED22D75Cc62666ad2978C1D1ba3450E'
    const lptoken = '0x3667bA24f4a9B0510465283Be3184550c885cd2e'

    // The Chef
    const TheChef = await ethers.getContractFactory("MasterChef")
    const chef = await TheChef.deploy(token, 900, 0)
    console.log(`✅ MasterChef deployed: \t${chalk.green(chef.address)}\nYou can find his vault at: \t${await chef.vault()}`)
}

(async () => {
    try {
        await main()
    } catch (error) {
        console.error(error)
    }
})()
