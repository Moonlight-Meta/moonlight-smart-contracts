const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers, waffle } = require("hardhat");

describe("MarketWrapper Testing", function () {

    async function deployWrapperFixture() {

        const [owner, one, two, three, four] = await ethers.getSigners();
        
        const Wrapper = await ethers.getContractFactory("MarketWrapper");

        const _price = 500
        const _marketPlace = four.address
        const _transactiondata = "0x"
        const _gasEstimate = 0
        
        const marketWrapper = await Wrapper.deploy(_price,_gasEstimate, _marketPlace, _transactiondata);
        await marketWrapper.deployed();

        return { marketWrapper, _price, _marketPlace, _transactiondata,_gasEstimate, owner, one, two, three, four }

    }

    it("Should deploy MarketWrapper", async function () {

        const { marketWrapper } = await loadFixture(deployWrapperFixture)
        expect(marketWrapper)

    })

    it("Should prevent non admins from paying the contract", async function() {
        const {marketWrapper, one} = await loadFixture(deployWrapperFixture)

        await expect( one.sendTransaction({
            to: marketWrapper.address,
            value: "100"
          })).to.be.reverted
          
    })

    it("Should return the buyNow Price of the marketWrapper MarketWrapper", async function () {

        const { marketWrapper,_price } = await loadFixture(deployWrapperFixture)
        
        expect(await marketWrapper.getBuyNowPrice()).to.equal(_price)
         
    })

    it("Should allow changing the buyNow Price of the marketWrapper", async function () {

        const { marketWrapper } = await loadFixture(deployWrapperFixture)
        
        const _price = 300
        await marketWrapper.setBuyNowPrice(_price);
        expect(await marketWrapper.getBuyNowPrice()).to.equal(_price)
         
    })

    it("Should allow changing the transactionData of the marketWrapper", async function () {

        const { marketWrapper, } = await loadFixture(deployWrapperFixture)
        
        const _transactionData = "0x0000000000000000000000000000000000000000000000000000000061626364"
        await marketWrapper.setTransactionData(_transactionData);
        expect(await marketWrapper.transactionData()).to.equal(_transactionData)
         
    })

    it("Should allow changing the gasEstimate Price of the marketWrapper", async function () {

        const { marketWrapper } = await loadFixture(deployWrapperFixture)
        
        const _gasEstimate = 20
        await marketWrapper.setGasEstimate(_gasEstimate);
        expect(await marketWrapper.gasEstimate()).to.equal(_gasEstimate)
         
    })

    it("Should prevent non admin setter calls", async function () {

        const { marketWrapper, one } = await loadFixture(deployWrapperFixture)
        
        await expect(marketWrapper.connect(one).setBuyNowPrice(300)).to.be.reverted
         
    })

    it("Should allow a migration", async function () {

        const { marketWrapper, three} = await loadFixture(deployWrapperFixture)
        
        const _price = 300
        const _marketPlace = three.address
        const _transactionData = "0x0000000000000000000000000000000000000000000000000000000061626364"
        const _gasEstimate = 20

        await marketWrapper.migration(_price, _gasEstimate, _marketPlace, _transactionData )
        
        expect(await marketWrapper.buyNowPrice()).equals(_price)
        expect(await marketWrapper.marketPlace()).equals(_marketPlace)
        expect(await marketWrapper.transactionData()).equals(_transactionData)
        expect(await marketWrapper.gasEstimate()).equals(_gasEstimate)
         
    })

    it("Should prevent a non admin migration call", async function () {

        const { marketWrapper, one, three} = await loadFixture(deployWrapperFixture)
        
        const _price = 300
        const _marketPlace = three.address
        const _transactionData = "0x0000000000000000000000000000000000000000000000000000000061626364"
        const _gasEstimate = 20

        await marketWrapper.migration(_price, _gasEstimate, _marketPlace, _transactionData )         
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