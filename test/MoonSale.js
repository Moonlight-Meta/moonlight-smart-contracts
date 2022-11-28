const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers, waffle } = require("hardhat");
const { isCallTrace } = require("hardhat/internal/hardhat-network/stack-traces/message-trace");

describe("MoonSale Testing", function  () {

    async function deployTokenFixture() {

        const Vault = await ethers.getContractFactory("MoonVault");
        const Wrapper = await ethers.getContractFactory("MarketWrapper");
        const Token = await ethers.getContractFactory("MoonToken");

        const moonVault = await Vault.deploy();
        await moonVault.deployed();

        const [owner, one, two, three, four] = await ethers.getSigners();

        const marketWrapper = await Wrapper.deploy(ethers.utils.parseUnits((500).toString(), "wei"), four.address, "");
        await marketWrapper.deployed();

        const moonToken = await Token.deploy("MoonToken", "MTK", "12345");
        await moonToken.deployed();

        const Sale = await ethers.getContractFactory("MoonSale");

        const blockNum = await ethers.provider.getBlockNumber();
        const block = await ethers.provider.getBlock(blockNum);
        const blockTimeStamp = block.timestamp;
        const sevenDays =  7 * 24 * 60 * 60;

        const rate = 1
        const opening_time = blockTimeStamp + 1;
        const closing_time = blockTimeStamp + sevenDays;

        const moonSale = await Sale.deploy(rate, 
                                            moonToken.address, 
                                            opening_time,
                                            closing_time,
                                            moonVault.address,
                                            marketWrapper.address);

        await moonSale.deployed();

        await moonVault.grantOwnerRole(moonSale.address)
        await marketWrapper.grantOwnerRole(moonSale.address)
        await moonToken.grantOwnerRole(moonSale.address)

        const provider = waffle.provider;

        return {provider, Wrapper, moonSale, moonToken, moonVault, marketWrapper, owner, one, two, three, four}

    }

    it ("Should deploy", async function () {

        const {moonSale} = await loadFixture(deployTokenFixture)
        expect(moonSale)
        expect(await moonSale.buyNowPriceInWei()).equals(500)
        expect(await moonSale.interest()).equals(500/20)

    });

    it ("Should allow you to make a non refundable purchase", async function () {

        const {moonSale, provider, one} = await loadFixture(deployTokenFixture)

        const contractBalance = await provider.getBalance(moonSale.address);
        
        await moonSale.connect(one).buyTokens(one.address, false, {
            value: "100"
        })

        const newContractBalance = await provider.getBalance(moonSale.address);

        expect(await moonSale.nonRefundableBalances(one.address)).equals(100)
        expect(newContractBalance).equals(contractBalance.add(100))

    });


    it ("Should allow you to make a refundable purchase", async function () {

        const {moonSale, provider, one} = await loadFixture(deployTokenFixture)

        const contractBalance = await provider.getBalance(moonSale.address);
        
        await moonSale.connect(one).buyTokens(one.address, true, {
            value: "100"
        })

        const newContractBalance = await provider.getBalance(moonSale.address);

        const migrationCount = await moonSale.migrationCount()

        expect(await moonSale.currentRefundableBalances(migrationCount, one.address)).equals(100)
        expect(await moonSale.currentRefundableWei()).equals(100)
        expect(newContractBalance).equals(contractBalance.add(100))

    });

    it ("Should automatically make the purchase when the buyNowPrice+interest is hit", async function () {

        const {moonSale, marketWrapper, moonVault, provider, one, two, three, four} = await loadFixture(deployTokenFixture)

        const contractBalance = await provider.getBalance(moonSale.address);
        const previousMarketPlaceBalance = await provider.getBalance(four.address);

        await moonSale.connect(one).buyTokens(one.address, false, {
            value: ethers.utils.parseUnits((300).toString(), "wei")
        })

        await moonSale.connect(two).buyTokens(two.address, false, {
            value: ethers.utils.parseUnits((200).toString(), "wei")
        })

        await moonSale.connect(three).buyTokens(three.address, false, {
            value: ethers.utils.parseUnits((25).toString(), "wei")
        })

        const newContractBalance = await provider.getBalance(moonSale.address);
        const marketPlaceBalance = await provider.getBalance(four.address);

        expect(newContractBalance).equals(await moonSale.interest())
        expect(await moonSale.state()).equals(1)
        expect(await moonSale.currentRefundableWei()).equals(0)
        expect(marketPlaceBalance).equals(previousMarketPlaceBalance.add(500))
        expect(await moonVault.state()).equals(1)

    });

    it ("Should allow owners to collect the interest", async function () {

        const {moonSale, marketWrapper, moonVault, provider, one, two, three, four} = await loadFixture(deployTokenFixture)

        await moonSale.connect(one).buyTokens(one.address, false, {
            value: ethers.utils.parseUnits((300).toString(), "wei")
        })

        await moonSale.connect(two).buyTokens(two.address, false, {
            value: ethers.utils.parseUnits((200).toString(), "wei")
        })

        await moonSale.connect(three).buyTokens(three.address, false, {
            value: ethers.utils.parseUnits((25).toString(), "wei")
        })

        const contractBalance = await provider.getBalance(moonSale.address);

        const interest =  await moonSale.interest()
        expect(contractBalance).equals(interest)

        const fourBalance = await provider.getBalance(four.address);
        await moonSale.collectInterest(four.address)
        const newFourBalance = await provider.getBalance(four.address);

        const newContractBalance = await provider.getBalance(moonSale.address);

        expect(newContractBalance).equals(0)
        expect(fourBalance.add(interest)).equals(newFourBalance)

    });

    it ("Should prevent non owners from collecting interest or emergency refund", async function () {

        const {moonSale, marketWrapper, moonVault, provider, one, two, three, four} = await loadFixture(deployTokenFixture)

        await moonSale.connect(one).buyTokens(one.address, false, {
            value: ethers.utils.parseUnits((300).toString(), "wei")
        })

        await moonSale.connect(two).buyTokens(two.address, false, {
            value: ethers.utils.parseUnits((200).toString(), "wei")
        })

        await expect(moonSale.connect(two).collectInterest(two.address)).to.be.reverted

        await moonSale.connect(three).buyTokens(three.address, false, {
            value: ethers.utils.parseUnits((25).toString(), "wei")
        })

        await expect(moonSale.connect(two).collectInterest(two.address)).to.be.reverted

    });
    
    
    it ("Should allow users to collect tokens", async function () {

        const {moonSale, moonToken, provider, one, two, three} = await loadFixture(deployTokenFixture)
        
        await moonSale.connect(one).buyTokens(one.address, false, {
            value: ethers.utils.parseUnits((300).toString(), "wei")
        })

        await moonSale.connect(two).buyTokens(two.address, true, {
            value: ethers.utils.parseUnits((200).toString(), "wei")
        })

        await moonSale.connect(three).buyTokens(three.address, false, {
            value: ethers.utils.parseUnits((25).toString(), "wei")
        })

        await moonSale.connect(one).collectTokens()

        expect(await moonToken.balanceOf(one.address)).equals(300)
        expect(await moonSale.nonRefundableBalances(one.address)).equals(0)
        expect(await moonSale.currentRefundableBalances(0,one.address)).equals(0)     
        
        await moonSale.connect(two).collectTokens()

        expect(await moonToken.balanceOf(two.address)).equals(200)
        expect(await moonSale.nonRefundableBalances(two.address)).equals(0)
        expect(await moonSale.currentRefundableBalances(0,two.address)).equals(0)       

        await moonSale.connect(three).collectTokens()

        expect(await moonToken.balanceOf(three.address)).equals(25)
        expect(await moonSale.nonRefundableBalances(three.address)).equals(0)
        expect(await moonSale.currentRefundableBalances(0,three.address)).equals(0)       

    });

    it ("Should prevent non contributors from collect tokens", async function () {

        const {moonSale, provider, one, two, three, four} = await loadFixture(deployTokenFixture)

        const contractBalance = await provider.getBalance(moonSale.address);
        
        await moonSale.connect(one).buyTokens(one.address, false, {
            value: ethers.utils.parseUnits((300).toString(), "wei")
        })

        await moonSale.connect(two).buyTokens(two.address, true, {
            value: ethers.utils.parseUnits((200).toString(), "wei")
        })

        await moonSale.connect(three).buyTokens(three.address, false, {
            value: ethers.utils.parseUnits((25).toString(), "wei")
        })

       await expect(moonSale.connect(four).collectTokens()).to.be.reverted    

    });

    it ("Should prevent contributors from collect tokens before the crowdsale finishes", async function () {

        const {moonSale, provider, one, two, three, four} = await loadFixture(deployTokenFixture)

        const contractBalance = await provider.getBalance(moonSale.address);
        
        await moonSale.connect(one).buyTokens(one.address, false, {
            value: ethers.utils.parseUnits((300).toString(), "wei")
        })

        await moonSale.connect(two).buyTokens(two.address, true, {
            value: ethers.utils.parseUnits((200).toString(), "wei")
        })

       await expect(moonSale.connect(one).collectTokens()).to.be.reverted    

    });

    it ("Should allow a migration to happen", async function () {

        const {Wrapper, moonSale, moonVault, moonToken, provider, one, two, three, four} = await loadFixture(deployTokenFixture)

        const newMarketWrapper = await Wrapper.deploy(ethers.utils.parseUnits((299).toString(), "wei"), four.address, "");
        await newMarketWrapper.deployed();
        newMarketWrapper.grantOwnerRole(moonSale.address)

        await moonSale.connect(one).buyTokens(one.address, true, {
            value: ethers.utils.parseUnits((100).toString(), "wei")
        })

        const blockNum = await ethers.provider.getBlockNumber();
        const block = await ethers.provider.getBlock(blockNum);
        const blockTimeStamp = block.timestamp;
        const sevenDays =  7 * 24 * 60 * 60;

        const newClosingTime = blockTimeStamp +sevenDays

        await moonSale.migration(newClosingTime,newMarketWrapper.address )

        expect(await moonSale.migrationCount()).equals(1)
        expect(await moonSale.currentRefundableWei()).equals(0)
        expect(await moonSale.buyNowPriceInWei() ).equals(299)
        expect(await moonSale.interest()).to.equal(Math.floor(299/20))
        expect(await provider.getBalance(moonVault.address)).equals(100)
    });

    it ("Should allow a migration to automatically purchase the NFT if funds are in order", async function () {

        const {Wrapper, moonSale, moonToken, provider, one, two, three, four} = await loadFixture(deployTokenFixture)

                 
        await moonSale.connect(one).buyTokens(one.address, false, {
            value: ethers.utils.parseUnits((300).toString(), "wei")
        })

        const newMarketWrapper = await Wrapper.deploy(ethers.utils.parseUnits((250).toString(), "wei"), four.address, "");
        await newMarketWrapper.deployed();
        newMarketWrapper.grantOwnerRole(moonSale.address)

        const blockNum = await ethers.provider.getBlockNumber();
        const block = await ethers.provider.getBlock(blockNum);
        const blockTimeStamp = block.timestamp;
        const sevenDays =  7 * 24 * 60 * 60;

        const newClosingTime = blockTimeStamp +sevenDays

        await moonSale.migration(newClosingTime,newMarketWrapper.address )

        expect(await moonSale.migrationCount()).equals(1)
        expect(await moonSale.state()).equals(1)

    });

    it ("Should allow refunds", async function () {

        const {Wrapper, moonSale, moonToken, provider, one, two, three,four} = await loadFixture(deployTokenFixture)

        const newMarketWrapper = await Wrapper.deploy(ethers.utils.parseUnits((300).toString(), "wei"), four.address, "");
        await newMarketWrapper.deployed();
        newMarketWrapper.grantOwnerRole(moonSale.address)

        const blockNum = await ethers.provider.getBlockNumber();
        const block = await ethers.provider.getBlock(blockNum);
        const blockTimeStamp = block.timestamp;
        const sevenDays =  7 * 24 * 60 * 60;

        const newClosingTime = blockTimeStamp +sevenDays

        
        await moonSale.connect(one).buyTokens(one.address, true, {
            value: "100"
        })

        const oldContractBalance = await provider.getBalance(moonSale.address);
      
        let migrationCount = await moonSale.migrationCount()

        expect(await moonSale.currentRefundableBalances(migrationCount, one.address)).equals(100)

        await moonSale.migration(newClosingTime,newMarketWrapper.address )

        migrationCount = await moonSale.migrationCount()

        expect(await moonSale.currentRefundableBalances(migrationCount, one.address)).equals(0)

        const oldOneBalance = await provider.getBalance(one.address);

        await moonSale.connect(one).refund()

        const newOneBalance = await provider.getBalance(one.address);

        const newContractBalance = await provider.getBalance(moonSale.address);

        expect(oldContractBalance.sub(100)).equals(newContractBalance)
        expect(migrationCount).equals(1)
        expect(await moonSale.buyNowPriceInWei()).equals(300)
        expect(await moonSale.interest()).to.equal(Math.floor(300/20))

    });

    it ("Should prevent non contributors from collecting refunds", async function () {

        const {Wrapper, moonSale,  provider, one, two, three, four} = await loadFixture(deployTokenFixture)

        const newMarketWrapper = await Wrapper.deploy(ethers.utils.parseUnits((300).toString(), "wei"), four.address, "");
        await newMarketWrapper.deployed();
        newMarketWrapper.grantOwnerRole(moonSale.address)

        const blockNum = await ethers.provider.getBlockNumber();
        const block = await ethers.provider.getBlock(blockNum);
        const blockTimeStamp = block.timestamp;
        const sevenDays =  7 * 24 * 60 * 60;

        const newClosingTime = blockTimeStamp +sevenDays

        
        await moonSale.connect(one).buyTokens(one.address, true, {
            value: "100"
        })

        await moonSale.migration(newClosingTime,newMarketWrapper.address )

        await expect(moonSale.connect(two).refund()).to.be.reverted

    });

    it ("Should prevent non refundable contributors from collecting refunds", async function () {

        const {Wrapper, moonSale,  provider, one, two, three,four } = await loadFixture(deployTokenFixture)

        const newMarketWrapper = await Wrapper.deploy(ethers.utils.parseUnits((300).toString(), "wei"), four.address, "");
        await newMarketWrapper.deployed();
        newMarketWrapper.grantOwnerRole(moonSale.address)

        const blockNum = await ethers.provider.getBlockNumber();
        const block = await ethers.provider.getBlock(blockNum);
        const blockTimeStamp = block.timestamp;
        const sevenDays =  7 * 24 * 60 * 60;

        const newClosingTime = blockTimeStamp +sevenDays

        
        await moonSale.connect(one).buyTokens(one.address, false, {
            value: "100"
        })

        await moonSale.migration(newClosingTime,newMarketWrapper.address )

        await expect(moonSale.connect(one).refund()).to.be.reverted

    });

    it ("Should prevent current refundable contributors from collecting refunds", async function () {

        const {Wrapper, moonSale,  provider, one, two, three,four} = await loadFixture(deployTokenFixture)

        const newMarketWrapper = await Wrapper.deploy(ethers.utils.parseUnits((300).toString(), "wei"), four.address, "");
        await newMarketWrapper.deployed();
        newMarketWrapper.grantOwnerRole(moonSale.address)

        const blockNum = await ethers.provider.getBlockNumber();
        const block = await ethers.provider.getBlock(blockNum);
        const blockTimeStamp = block.timestamp;
        const sevenDays =  7 * 24 * 60 * 60;

        const newClosingTime = blockTimeStamp +sevenDays

        await moonSale.connect(one).buyTokens(one.address, true, {
            value: "100"
        })

        // await moonSale.migration(newClosingTime,newMarketWrapper.address )

        await expect(moonSale.connect(one).refund()).to.be.reverted

    });

    it ("Should prevent contributors from getting refunds after collecting tokens", async function () {

        const {moonSale, moonToken, provider, one, two, three} = await loadFixture(deployTokenFixture)
        
        await moonSale.connect(one).buyTokens(one.address, false, {
            value: ethers.utils.parseUnits((300).toString(), "wei")
        })

        await moonSale.connect(two).buyTokens(two.address, true, {
            value: ethers.utils.parseUnits((200).toString(), "wei")
        })

        await moonSale.connect(three).buyTokens(three.address, false, {
            value: ethers.utils.parseUnits((25).toString(), "wei")
        })

        await moonSale.connect(one).collectTokens()
        
        await moonSale.connect(two).collectTokens()

        await expect( moonSale.connect(one).refund()).to.be.reverted
        await expect( moonSale.connect(two).refund()).to.be.reverted

    });

    it ("Allows refunds after a migration post purchase for refundable contributors", async function () {

        const {Wrapper, moonSale, moonVault, moonToken, provider, one, two, three, four} = await loadFixture(deployTokenFixture)

        const newMarketWrapper = await Wrapper.deploy(ethers.utils.parseUnits((250).toString(), "wei"), four.address, "");
        await newMarketWrapper.deployed();
        newMarketWrapper.grantOwnerRole(moonSale.address)

        const blockNum = await ethers.provider.getBlockNumber();
        const block = await ethers.provider.getBlock(blockNum);
        const blockTimeStamp = block.timestamp;
        const sevenDays =  7 * 24 * 60 * 60;

        const newClosingTime = blockTimeStamp +sevenDays

        await moonSale.connect(one).buyTokens(one.address, true, {
            value: "100"
        })

        await moonSale.connect(two).buyTokens(two.address, false, {
            value: "300"
        })
      
        let migrationCount = await moonSale.migrationCount()

        expect(await moonSale.state()).to.equal(0)
        await moonSale.migration(newClosingTime,newMarketWrapper.address )

        migrationCount = await moonSale.migrationCount()

        expect(await moonSale.state()).to.equal(1)
        await expect(moonSale.connect(one).refund()).to.not.be.reverted

    });

    it ("Allows collecting tokens after a migration post purchase for non refundable contributors ", async function () {

        const {Wrapper, moonSale, moonVault, moonToken, provider, one, two, three, four} = await loadFixture(deployTokenFixture)

        const newMarketWrapper = await Wrapper.deploy(ethers.utils.parseUnits((250).toString(), "wei"), four.address, "");
        await newMarketWrapper.deployed();
        newMarketWrapper.grantOwnerRole(moonSale.address)

        const blockNum = await ethers.provider.getBlockNumber();
        const block = await ethers.provider.getBlock(blockNum);
        const blockTimeStamp = block.timestamp;
        const sevenDays =  7 * 24 * 60 * 60;

        const newClosingTime = blockTimeStamp +sevenDays

        await moonSale.connect(one).buyTokens(one.address, true, {
            value: "100"
        })

        await moonSale.connect(two).buyTokens(two.address, false, {
            value: "300"
        })
      
        let migrationCount = await moonSale.migrationCount()

        expect(await moonSale.state()).to.equal(0)
        await moonSale.migration(newClosingTime,newMarketWrapper.address )

        migrationCount = await moonSale.migrationCount()

        expect(await moonSale.state()).to.equal(1)
        await expect(moonSale.connect(two).collectTokens()).to.not.be.reverted

    });

    it ("Prevents collecting tokens after a migration post purchase for refundable contributors ", async function () {

        const {Wrapper, moonSale, moonVault, moonToken, provider, one, two, three, four} = await loadFixture(deployTokenFixture)

        const newMarketWrapper = await Wrapper.deploy(ethers.utils.parseUnits((250).toString(), "wei"), four.address, "");
        await newMarketWrapper.deployed();
        newMarketWrapper.grantOwnerRole(moonSale.address)

        const blockNum = await ethers.provider.getBlockNumber();
        const block = await ethers.provider.getBlock(blockNum);
        const blockTimeStamp = block.timestamp;
        const sevenDays =  7 * 24 * 60 * 60;

        const newClosingTime = blockTimeStamp +sevenDays

        await moonSale.connect(one).buyTokens(one.address, true, {
            value: "100"
        })

        await moonSale.connect(two).buyTokens(two.address, false, {
            value: "300"
        })
      
        let migrationCount = await moonSale.migrationCount()

        expect(await moonSale.state()).to.equal(0)
        await moonSale.migration(newClosingTime,newMarketWrapper.address )

        migrationCount = await moonSale.migrationCount()

        expect(await moonSale.state()).to.equal(1)
        await expect(moonSale.connect(one).collectTokens()).to.be.reverted

    });

    it ("Allows contributors to make both refundable and non refundable contributions", async function () {

        const {Wrapper, moonSale, moonVault, moonToken, provider, one, two, three, four} = await loadFixture(deployTokenFixture)

        const newMarketWrapper = await Wrapper.deploy(ethers.utils.parseUnits((250).toString(), "wei"), four.address, "");
        await newMarketWrapper.deployed();
        newMarketWrapper.grantOwnerRole(moonSale.address)

        const blockNum = await ethers.provider.getBlockNumber();
        const block = await ethers.provider.getBlock(blockNum);
        const blockTimeStamp = block.timestamp;
        const sevenDays =  7 * 24 * 60 * 60;

        const newClosingTime = blockTimeStamp +sevenDays

        await moonSale.connect(one).buyTokens(one.address, true, {
            value: "100"
        })

        await moonSale.connect(one).buyTokens(one.address, false, {
            value: "300"
        })
      
        let migrationCount = await moonSale.migrationCount()

        expect(await moonSale.state()).to.equal(0)
        await moonSale.migration(newClosingTime,newMarketWrapper.address )

        migrationCount = await moonSale.migrationCount()

        expect(await moonSale.state()).to.equal(1)
        await expect(moonSale.connect(one).collectTokens()).to.not.be.reverted
        expect(await moonToken.balanceOf(one.address)).to.equal(300)
        expect(await provider.getBalance(moonVault.address)).to.equal(100)
        await expect(moonSale.connect(one).refund()).to.not.be.reverted
        expect(await provider.getBalance(moonVault.address)).to.equal(0)

    });






});
