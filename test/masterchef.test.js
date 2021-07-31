const { ethers } = require("hardhat")
const { expect } = require("chai");

async function advanceBlock() {
    return ethers.provider.send("evm_mine", [])
}

async function advanceBlockTo(blockNumber) {
    for (let i = await ethers.provider.getBlockNumber(); i < blockNumber; i++) {
        await advanceBlock()
    }
}

describe("EfxMasterChef", function() {
    let admin, dev, alice, bob, carol;

    before(async () => {
        [admin, dev, alice, bob, carol] = await ethers.getSigners();
        this.EfxToken = await ethers.getContractFactory('DummyBEP20');
        this.LpToken = await ethers.getContractFactory('DummyBEP20');
        this.MasterChef = await ethers.getContractFactory('MasterChef');
    });

    beforeEach(async () => {
        this.efx = await this.EfxToken.deploy();
        await this.efx.deployed();

        this.lp = await this.LpToken.deploy();
        await this.lp.deployed();

        // 900 efx per block, starting from block 100
        this.chef = await this.MasterChef.deploy(this.efx.address, this.lp.address, '900', '100', '1000')
        await this.chef.deployed()
    });

    it('deploys correctly', async () => {
        const efx = await this.chef.efx()
        const owner = await this.chef.owner()

        expect(efx).to.equal(this.efx.address)
        expect(owner).to.equal(admin.address)
    });

    context('with LP tokens deployed', () => {
        beforeEach(async () => {
            await this.lp.transfer(alice.address, "1000")
            await this.lp.transfer(bob.address, "1000")
            await this.lp.transfer(carol.address, "1000")
        });

        it('should allow emergency withdraw', async () => {
            await this.lp.connect(bob).approve(this.chef.address, "1000")
            await this.chef.connect(bob).deposit("100")
            expect(await this.lp.balanceOf(bob.address)).to.equal("900")
            await this.chef.connect(bob).emergencyWithdraw()
            expect(await this.lp.balanceOf(bob.address)).to.equal("1000")
        })

        it('should not distribute before startBlock', async () => {
            await this.efx.transfer(this.chef.address, '9000')

            await this.lp.connect(bob).approve(this.chef.address, "1000")
            await this.chef.connect(bob).deposit("100")
            await advanceBlockTo("89")

            await this.chef.connect(bob).deposit("0") // block 90
            expect(await this.efx.balanceOf(bob.address)).to.equal("0")
            await advanceBlockTo("94")

            await this.chef.connect(bob).deposit("0") // block 95
            expect(await this.efx.balanceOf(bob.address)).to.equal("0")
            await advanceBlockTo("99")

            await this.chef.connect(bob).deposit("0") // block 100
            expect(await this.efx.balanceOf(bob.address)).to.equal("0")
            await advanceBlockTo("100")

            await this.chef.connect(bob).deposit("0") // block 101
            expect(await this.efx.balanceOf(bob.address)).to.equal("900")

            await advanceBlockTo("104")
            await this.chef.connect(bob).deposit("0") // block 105

            expect(await this.efx.balanceOf(bob.address)).to.equal("4500")
            expect(await this.efx.balanceOf(this.chef.address)).to.equal('4500')
        })

        it('should not distribute when vault is empty', async () => {
            await this.lp.connect(bob).approve(this.chef.address, "1000")

            await advanceBlockTo(199) // block 200
            await this.chef.connect(bob).deposit("100")

            await advanceBlockTo('204') // block 205
            await expect(this.chef.connect(bob).deposit('100')).to.be
                .revertedWith('BEP20: transfer amount exceeds balance')
            await expect(this.chef.connect(bob).withdraw('100')).to.be
                .revertedWith('BEP20: transfer amount exceeds balance')

            // when we fill up the vault it should distribute
            await this.efx.transfer(this.chef.address, '819000')
            await advanceBlockTo(289) // block 290
            await this.chef.connect(bob).deposit('0')


            expect(await this.efx.balanceOf(bob.address)).to.equal("81000")
            expect(await this.efx.balanceOf(this.chef.address)).to.equal('738000')
        })

        it('distribute accross multiple parties', async () => {
            await this.efx.transfer(this.chef.address, '819000')

            await this.lp.connect(bob).approve(this.chef.address, "1000")
            await this.lp.connect(alice).approve(this.chef.address, "1000")
            await this.lp.connect(carol).approve(this.chef.address, "1000")

            // Alice deposits 10 LPs at block 310
            await advanceBlockTo("309")
            await this.chef.connect(alice).deposit("10")
            // Bob deposits 20 LPs at block 314
            await advanceBlockTo("313")
            await this.chef.connect(bob).deposit("20")
            // Carol deposits 30 LPs at block 318
            await advanceBlockTo("317")
            await this.chef.connect(carol).deposit("30")
            // Alice deposits 10 more LPs at block 320. At this point:
            //   Alice should have: 4*900 + 4*1/3*900 + 2*1/6*900 = 5100
            //   MasterChef should have the remaining: (10*900) - 5100 = 76800
            await advanceBlockTo("319")
            await this.chef.connect(alice).deposit("10")
            expect(await this.efx.balanceOf(alice.address)).to.equal("5100")
            expect(await this.efx.balanceOf(bob.address)).to.equal("0")
            expect(await this.efx.balanceOf(carol.address)).to.equal("0")
            expect(await this.efx.balanceOf(this.chef.address)).to.equal("813900")
            // Bob withdraws 5 LPs at block 330. At this point:
            //   Bob should have: 4*2/3*900 + 2*2/6*900 + 10*2/7*900 = 6190
            await advanceBlockTo("329")
            await this.chef.connect(bob).withdraw("5")
            expect(await this.efx.balanceOf(alice.address)).to.equal("5100")
            expect(await this.efx.balanceOf(bob.address)).to.equal("5571")
            expect(await this.efx.balanceOf(carol.address)).to.equal("0")
            expect(await this.efx.balanceOf(this.chef.address)).to.equal("808329")
            // Alice withdraws 20 LPs at block 340.
            // Bob withdraws 15 LPs at block 350.
            // Carol withdraws 30 LPs at block 360.
            await advanceBlockTo("339")
            await this.chef.connect(alice).withdraw("20")
            await advanceBlockTo("349")
            await this.chef.connect(bob).withdraw("15")
            await advanceBlockTo("359")
            await this.chef.connect(carol).withdraw("30")
            // Alice should have: 5100 + 10*2/7*900 + 10*2/6.5*900 = 10440
            expect(await this.efx.balanceOf(alice.address)).to.equal("10440")
            // Bob should have: 5571 + 10*1.5/6.5 * 1000 + 10*1.5/4.5*1000 = 10648
            expect(await this.efx.balanceOf(bob.address)).to.equal("10648")
            // Carol should have: 2*3/6*900 + 10*3/7*900 + 10*3/6.5*900 + 10*3/4.5*900 + 10*900 = 23910
            expect(await this.efx.balanceOf(carol.address)).to.equal("23910")
            // All of them should have 1000 LPs back.
            expect(await this.lp.balanceOf(alice.address)).to.equal("1000")
            expect(await this.lp.balanceOf(bob.address)).to.equal("1000")
            expect(await this.lp.balanceOf(carol.address)).to.equal("1000")
        })
    });
});
