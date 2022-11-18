const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers, waffle } = require("hardhat");

describe("MarketWrapper Testing", function () {

    async function deployWrapperFixture() {

        const Wrapper = await ethers.getContractFactory("MarketWrapper");
        const [owner, one, two, three, four] = await ethers.getSigners();

        const marketWrapper = await Wrapper.deploy(500);

        await marketWrapper.deployed();

        return { marketWrapper, owner, one, two, three, four }

    }

    it("Should deploy MarketWrapper", async function () {

        const { marketWrapper } = await loadFixture(deployWrapperFixture)
        expect(marketWrapper)

    })

    it("Should return the buyNow Price of the marketWrapper MarketWrapper", async function () {

        const { marketWrapper } = await loadFixture(deployWrapperFixture)
        
        expect(await marketWrapper.getBuyNowPrice()).to.equal(500)
         
    })

    it("Should change the buyNow Price of the marketWrapper", async function () {

        const { marketWrapper } = await loadFixture(deployWrapperFixture)
        
        await marketWrapper.setBuyNowPrice(300);
        expect(await marketWrapper.getBuyNowPrice()).to.equal(300)
         
    })

    it("Should prevent changing the buyNow Price of the marketWrapper if not the owner", async function () {

        const { marketWrapper, one } = await loadFixture(deployWrapperFixture)
        
        await expect(marketWrapper.connect(one).setBuyNowPrice(300)).to.be.reverted
         
    })
    it("Should allow setting admins", async function () {

        const { marketWrapper, one } = await loadFixture(deployWrapperFixture)
        
        await marketWrapper.grantOwnerRole(one.address)
        await expect(marketWrapper.connect(one).setBuyNowPrice(300)).to.not.be.reverted
         
    })
    it("Should prevent calling buyNow with the wrong user", async function () {

        const { marketWrapper,one } = await loadFixture(deployWrapperFixture)
        
        await expect(marketWrapper.connect(one).buyNow()).to.be.reverted
         
    })

    it("Should prevent calling buyNow without necessary eth", async function () {

        const { marketWrapper,owner } = await loadFixture(deployWrapperFixture)
        
        await owner.sendTransaction({
            to: marketWrapper.address,
            value: "100" // Starting money
          });

        await expect(marketWrapper.buyNow()).to.be.reverted
         
    })

    it("Should buyNow with necessary eth", async function () {

        const { marketWrapper,owner } = await loadFixture(deployWrapperFixture)
        
        await owner.sendTransaction({
            to: marketWrapper.address,
            value: "500" // Starting money
          });


        await expect(marketWrapper.buyNow()).to.not.be.reverted
         
    })



});