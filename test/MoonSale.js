const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers, waffle } = require("hardhat");
const { isCallTrace } = require("hardhat/internal/hardhat-network/stack-traces/message-trace");

describe("MoonSale Testing", function  () {

    async function deploySaleFixture() {

        const [owner, one, two, three, four] = await ethers.getSigners();
        
        const provider = waffle.provider;

        const blockNum = await ethers.provider.getBlockNumber();
        const block = await ethers.provider.getBlock(blockNum);
        const blockTimeStamp = block.timestamp;
        const sevenDays =  7 * 24 * 60 * 60;

        const Vault = await ethers.getContractFactory("MoonVault");
        
        const moonVault = await Vault.deploy();
        await moonVault.deployed();

        const Wrapper = await ethers.getContractFactory("MarketWrapper");
        
        const _price = ethers.utils.parseUnits("8.6919","ether")
        const _gasEstimate = 1000
        const _marketPlace = four.address
        const _transactionData = "0x"
        const marketWrapper = await Wrapper.deploy(
            _price,
            _gasEstimate,
            _marketPlace,
            _transactionData
        )
        await marketWrapper.deployed();

        const Token = await ethers.getContractFactory("MoonToken");
        
        const _collectionOwner = owner.address
        const _fractionalUri = "fractional"
        const _adminUri = "admin"
        const _tokenId = 120
        const moonToken = await Token.deploy(
            _collectionOwner,
            _fractionalUri,
            _adminUri,
            _tokenId
        );
        await moonToken.deployed();

        const Sale = await ethers.getContractFactory("MoonSale");

        const _rate = 100
        const _tokenAddress = moonToken.address
        const _opening_time = blockTimeStamp + 10;
        const _closing_time = blockTimeStamp + sevenDays;
        const _vaultAddress = moonVault.address
        const _wrapperAddress = marketWrapper.address
        const moonSale = await Sale.deploy(
            _rate,
            _tokenAddress,
            _opening_time,
            _closing_time,
            _vaultAddress,
            _wrapperAddress
        )
        await moonSale.deployed();

        await moonVault.grantOwnerRole(moonSale.address)
        await marketWrapper.grantOwnerRole(moonSale.address)
        await moonToken.grantOwnerRole(moonSale.address)

        return {
            provider, 
            moonSale, 
                _rate, 
                _opening_time,
                _closing_time,
            moonVault,
            moonToken,
                _collectionOwner,
                _tokenId,
            marketWrapper, 
                _price,
                _gasEstimate,
                _marketPlace,
                _transactionData,
            owner, one, two, three, four
        }

    }

    it ("Should deploy", async function () {

        const {moonSale, _price, _rate} = await loadFixture(deploySaleFixture)
        expect(moonSale)

        const buyNowPrice = await moonSale.buyNowPriceInWei()
        const interest = await moonSale.interest()
        const goal = await moonSale.goal()
        
        expect(buyNowPrice ).equals(_price)
        expect(interest).equals(_price.div(20))

        const minimumContribution = BigInt(10**18/_rate)
        const sumedPrice = buyNowPrice.toBigInt() + interest.toBigInt()
        const ceiledPrice = (sumedPrice - sumedPrice % minimumContribution) + minimumContribution
        expect(goal).equals(ceiledPrice)

    })

    it ("Should prevent purchases of the incorrect number of decimal place", async function () {

        const {moonSale, one} = await loadFixture(deploySaleFixture)
        
        const _refundable = false
        const _deposit = ethers.utils.parseUnits(".5112","ether")
        
        await expect(moonSale.connect(one).buyTokens(one.address, _refundable, {
            value: _deposit
        })).to.be.reverted

    })

    it ("Should allow you to make a non refundable purchase", async function () {

        const {moonSale, provider, one} = await loadFixture(deploySaleFixture)

        const originalContractBalance = await provider.getBalance(moonSale.address);
        
        const _refundable = false
        const _deposit = ethers.utils.parseUnits(".51","ether")
        await moonSale.connect(one).buyTokens(one.address, _refundable, {
            value: _deposit
        })

        const newContractBalance = await provider.getBalance(moonSale.address);

        const migrationCount = await moonSale.migrationCount()
        expect(await moonSale.currentRefundableBalances(migrationCount, one.address)).to.equal(0)
        expect(await moonSale.nonRefundableBalances(one.address)).to.equal(_deposit)
        expect(newContractBalance).equals(originalContractBalance.add(_deposit))
    })

    it ("Should allow you to make multiple non refundable purchases", async function () {

        const {moonSale, provider, one} = await loadFixture(deploySaleFixture)

        const originalContractBalance = await provider.getBalance(moonSale.address);
        
        const _refundable = false

        const _depositOne = ethers.utils.parseUnits(".51","ether")
        await moonSale.connect(one).buyTokens(one.address, _refundable, {
            value: _depositOne
        })

        const _depositTwo = ethers.utils.parseUnits("1.65","ether")
        await moonSale.connect(one).buyTokens(one.address, _refundable, {
            value: _depositTwo
        })

        const newContractBalance = await provider.getBalance(moonSale.address);

        const migrationCount = await moonSale.migrationCount()
        expect(await moonSale.currentRefundableBalances(migrationCount, one.address)).to.equal(0)
        expect(await moonSale.nonRefundableBalances(one.address)).to.equal(_depositOne.add(_depositTwo))
        expect(newContractBalance).equals(originalContractBalance.add(_depositOne).add(_depositTwo))
    })

    it ("Should allow you to make a refundable purchase", async function () {

        const {moonSale, provider, one} = await loadFixture(deploySaleFixture)

        const orignalContractBalance = await provider.getBalance(moonSale.address);
        
        const _refundable = true
        const _deposit = ethers.utils.parseUnits(".51","ether")
        await moonSale.connect(one).buyTokens(one.address, _refundable, {
            value: _deposit
        })

        const newContractBalance = await provider.getBalance(moonSale.address);

        const migrationCount = await moonSale.migrationCount()
        expect(await moonSale.currentRefundableBalances(migrationCount, one.address)).equals(_deposit)
        expect(await moonSale.currentRefundableWei()).equals(_deposit)
        expect(newContractBalance).equals(orignalContractBalance.add(_deposit))

    })

    it ("Should allow you to make multiple refundable purchases", async function () {

        const {moonSale, provider, one} = await loadFixture(deploySaleFixture)

        const orignalContractBalance = await provider.getBalance(moonSale.address);
        
        const _refundable = true

        const _depositOne = ethers.utils.parseUnits(".51","ether")
        await moonSale.connect(one).buyTokens(one.address, _refundable, {
            value: _depositOne
        })

        const _depositTwo = ethers.utils.parseUnits("1.65","ether")
        await moonSale.connect(one).buyTokens(one.address, _refundable, {
            value: _depositTwo
        })

        const newContractBalance = await provider.getBalance(moonSale.address);

        const migrationCount = await moonSale.migrationCount()
        expect(await moonSale.currentRefundableBalances(migrationCount, one.address)).equals(_depositOne.add(_depositTwo))
        expect(await moonSale.currentRefundableWei()).equals(_depositOne.add(_depositTwo))
        expect(newContractBalance).equals(orignalContractBalance.add(_depositOne).add(_depositTwo))

    })

    it ("Should allow you to make multiple purchases of both types", async function () {

        const {moonSale, provider, one} = await loadFixture(deploySaleFixture)

        const orignalContractBalance = await provider.getBalance(moonSale.address);
        
        let _refundable = true

        const _depositOne = ethers.utils.parseUnits(".70","ether")
        await moonSale.connect(one).buyTokens(one.address, _refundable, {
            value: _depositOne
        })

        _refundable = false

        const _depositTwo = ethers.utils.parseUnits("2.3","ether")
        await moonSale.connect(one).buyTokens(one.address, _refundable, {
            value: _depositTwo
        })

        const newContractBalance = await provider.getBalance(moonSale.address);

        const migrationCount = await moonSale.migrationCount()
        expect(await moonSale.currentRefundableBalances(migrationCount, one.address)).equals(_depositOne)
        expect(await moonSale.currentRefundableWei()).equals(_depositOne)
        expect(newContractBalance).equals(orignalContractBalance.add(_depositOne).add(_depositTwo))

    })

    it ("Should automatically make the purchase when the buyNowPrice+interest is hit", async function () {

        const {moonSale, _price, moonVault, provider, one, two, three, four} = await loadFixture(deploySaleFixture)

        const originalContractBalance = await provider.getBalance(moonSale.address);
        const originalMarketPlaceBalance = await provider.getBalance(four.address);


        await moonSale.connect(one).buyTokens(one.address, false, {
            value: ethers.utils.parseUnits("4","ether")
        })

        await moonSale.connect(two).buyTokens(two.address, true, {
            value: ethers.utils.parseUnits("4","ether")
        })

        await moonSale.connect(three).buyTokens(three.address, false, {
            value: ethers.utils.parseUnits("1.13","ether")
        })

        const newContractBalance = await provider.getBalance(moonSale.address);
        const newMarketPlaceBalance = await provider.getBalance(four.address);

        expect(newContractBalance).to.be.at.least(await moonSale.interest())
        expect(await moonSale.state()).equals(1)
        expect(await moonVault.state()).equals(1)
        expect(await moonSale.currentRefundableWei()).equals(0)
        expect(newMarketPlaceBalance).equals(originalMarketPlaceBalance.add(_price))
        
    })

    // it ("Should allow owners to collect the interest", async function () {

    //     const {moonSale, marketWrapper, moonVault, provider, one, two, three, four} = await loadFixture(deployTokenFixture)

    //     await moonSale.connect(one).buyTokens(one.address, false, {
    //         value: ethers.utils.parseUnits((300).toString(), "wei")
    //     })

    //     await moonSale.connect(two).buyTokens(two.address, false, {
    //         value: ethers.utils.parseUnits((200).toString(), "wei")
    //     })

    //     await moonSale.connect(three).buyTokens(three.address, false, {
    //         value: ethers.utils.parseUnits((25).toString(), "wei")
    //     })

    //     const contractBalance = await provider.getBalance(moonSale.address);

    //     const interest =  await moonSale.interest()
    //     expect(contractBalance).equals(interest)

    //     const fourBalance = await provider.getBalance(four.address);
    //     await moonSale.collectInterest(four.address)
    //     const newFourBalance = await provider.getBalance(four.address);

    //     const newContractBalance = await provider.getBalance(moonSale.address);

    //     expect(newContractBalance).equals(0)
    //     expect(fourBalance.add(interest)).equals(newFourBalance)

    // });

    // it ("Should prevent non owners from collecting interest or emergency refund", async function () {

    //     const {moonSale, marketWrapper, moonVault, provider, one, two, three, four} = await loadFixture(deployTokenFixture)

    //     await moonSale.connect(one).buyTokens(one.address, false, {
    //         value: ethers.utils.parseUnits((300).toString(), "wei")
    //     })

    //     await moonSale.connect(two).buyTokens(two.address, false, {
    //         value: ethers.utils.parseUnits((200).toString(), "wei")
    //     })

    //     await expect(moonSale.connect(two).collectInterest(two.address)).to.be.reverted

    //     await moonSale.connect(three).buyTokens(three.address, false, {
    //         value: ethers.utils.parseUnits((25).toString(), "wei")
    //     })

    //     await expect(moonSale.connect(two).collectInterest(two.address)).to.be.reverted

    // });
    
    
    // it ("Should allow users to collect tokens", async function () {

    //     const {moonSale, moonToken, provider, one, two, three} = await loadFixture(deployTokenFixture)
        
    //     await moonSale.connect(one).buyTokens(one.address, false, {
    //         value: ethers.utils.parseUnits((300).toString(), "wei")
    //     })

    //     await moonSale.connect(two).buyTokens(two.address, true, {
    //         value: ethers.utils.parseUnits((200).toString(), "wei")
    //     })

    //     await moonSale.connect(three).buyTokens(three.address, false, {
    //         value: ethers.utils.parseUnits((25).toString(), "wei")
    //     })

    //     await moonSale.connect(one).collectTokens()

    //     expect(await moonToken.balanceOf(one.address)).equals(300)
    //     expect(await moonSale.nonRefundableBalances(one.address)).equals(0)
    //     expect(await moonSale.currentRefundableBalances(0,one.address)).equals(0)     
        
    //     await moonSale.connect(two).collectTokens()

    //     expect(await moonToken.balanceOf(two.address)).equals(200)
    //     expect(await moonSale.nonRefundableBalances(two.address)).equals(0)
    //     expect(await moonSale.currentRefundableBalances(0,two.address)).equals(0)       

    //     await moonSale.connect(three).collectTokens()

    //     expect(await moonToken.balanceOf(three.address)).equals(25)
    //     expect(await moonSale.nonRefundableBalances(three.address)).equals(0)
    //     expect(await moonSale.currentRefundableBalances(0,three.address)).equals(0)       

    // });

    // it ("Should prevent non contributors from collect tokens", async function () {

    //     const {moonSale, provider, one, two, three, four} = await loadFixture(deployTokenFixture)

    //     const contractBalance = await provider.getBalance(moonSale.address);
        
    //     await moonSale.connect(one).buyTokens(one.address, false, {
    //         value: ethers.utils.parseUnits((300).toString(), "wei")
    //     })

    //     await moonSale.connect(two).buyTokens(two.address, true, {
    //         value: ethers.utils.parseUnits((200).toString(), "wei")
    //     })

    //     await moonSale.connect(three).buyTokens(three.address, false, {
    //         value: ethers.utils.parseUnits((25).toString(), "wei")
    //     })

    //    await expect(moonSale.connect(four).collectTokens()).to.be.reverted    

    // });

    // it ("Should prevent contributors from collect tokens before the crowdsale finishes", async function () {

    //     const {moonSale, provider, one, two, three, four} = await loadFixture(deployTokenFixture)

    //     const contractBalance = await provider.getBalance(moonSale.address);
        
    //     await moonSale.connect(one).buyTokens(one.address, false, {
    //         value: ethers.utils.parseUnits((300).toString(), "wei")
    //     })

    //     await moonSale.connect(two).buyTokens(two.address, true, {
    //         value: ethers.utils.parseUnits((200).toString(), "wei")
    //     })

    //    await expect(moonSale.connect(one).collectTokens()).to.be.reverted    

    // });

    // it ("Should allow a migration to happen", async function () {

    //     const {Wrapper, moonSale, moonVault, moonToken, provider, one, two, three, four} = await loadFixture(deployTokenFixture)

    //     const newMarketWrapper = await Wrapper.deploy(ethers.utils.parseUnits((299).toString(), "wei"), four.address, "");
    //     await newMarketWrapper.deployed();
    //     newMarketWrapper.grantOwnerRole(moonSale.address)

    //     await moonSale.connect(one).buyTokens(one.address, true, {
    //         value: ethers.utils.parseUnits((100).toString(), "wei")
    //     })

    //     const blockNum = await ethers.provider.getBlockNumber();
    //     const block = await ethers.provider.getBlock(blockNum);
    //     const blockTimeStamp = block.timestamp;
    //     const sevenDays =  7 * 24 * 60 * 60;

    //     const newClosingTime = blockTimeStamp +sevenDays

    //     await moonSale.migration(newClosingTime,newMarketWrapper.address )

    //     expect(await moonSale.migrationCount()).equals(1)
    //     expect(await moonSale.currentRefundableWei()).equals(0)
    //     expect(await moonSale.buyNowPriceInWei() ).equals(299)
    //     expect(await moonSale.interest()).to.equal(Math.floor(299/20))
    //     expect(await provider.getBalance(moonVault.address)).equals(100)
    // });

    // it ("Should allow a migration to automatically purchase the NFT if funds are in order", async function () {

    //     const {Wrapper, moonSale, moonToken, provider, one, two, three, four} = await loadFixture(deployTokenFixture)

                 
    //     await moonSale.connect(one).buyTokens(one.address, false, {
    //         value: ethers.utils.parseUnits((300).toString(), "wei")
    //     })

    //     const newMarketWrapper = await Wrapper.deploy(ethers.utils.parseUnits((250).toString(), "wei"), four.address, "");
    //     await newMarketWrapper.deployed();
    //     newMarketWrapper.grantOwnerRole(moonSale.address)

    //     const blockNum = await ethers.provider.getBlockNumber();
    //     const block = await ethers.provider.getBlock(blockNum);
    //     const blockTimeStamp = block.timestamp;
    //     const sevenDays =  7 * 24 * 60 * 60;

    //     const newClosingTime = blockTimeStamp +sevenDays

    //     await moonSale.migration(newClosingTime,newMarketWrapper.address )

    //     expect(await moonSale.migrationCount()).equals(1)
    //     expect(await moonSale.state()).equals(1)

    // });

    // it ("Should allow refunds", async function () {

    //     const {Wrapper, moonSale, moonToken, provider, one, two, three,four} = await loadFixture(deployTokenFixture)

    //     const newMarketWrapper = await Wrapper.deploy(ethers.utils.parseUnits((300).toString(), "wei"), four.address, "");
    //     await newMarketWrapper.deployed();
    //     newMarketWrapper.grantOwnerRole(moonSale.address)

    //     const blockNum = await ethers.provider.getBlockNumber();
    //     const block = await ethers.provider.getBlock(blockNum);
    //     const blockTimeStamp = block.timestamp;
    //     const sevenDays =  7 * 24 * 60 * 60;

    //     const newClosingTime = blockTimeStamp +sevenDays

        
    //     await moonSale.connect(one).buyTokens(one.address, true, {
    //         value: "100"
    //     })

    //     const oldContractBalance = await provider.getBalance(moonSale.address);
      
    //     let migrationCount = await moonSale.migrationCount()

    //     expect(await moonSale.currentRefundableBalances(migrationCount, one.address)).equals(100)

    //     await moonSale.migration(newClosingTime,newMarketWrapper.address )

    //     migrationCount = await moonSale.migrationCount()

    //     expect(await moonSale.currentRefundableBalances(migrationCount, one.address)).equals(0)

    //     const oldOneBalance = await provider.getBalance(one.address);

    //     await moonSale.connect(one).refund()

    //     const newOneBalance = await provider.getBalance(one.address);

    //     const newContractBalance = await provider.getBalance(moonSale.address);

    //     expect(oldContractBalance.sub(100)).equals(newContractBalance)
    //     expect(migrationCount).equals(1)
    //     expect(await moonSale.buyNowPriceInWei()).equals(300)
    //     expect(await moonSale.interest()).to.equal(Math.floor(300/20))

    // });

    // it ("Should prevent non contributors from collecting refunds", async function () {

    //     const {Wrapper, moonSale,  provider, one, two, three, four} = await loadFixture(deployTokenFixture)

    //     const newMarketWrapper = await Wrapper.deploy(ethers.utils.parseUnits((300).toString(), "wei"), four.address, "");
    //     await newMarketWrapper.deployed();
    //     newMarketWrapper.grantOwnerRole(moonSale.address)

    //     const blockNum = await ethers.provider.getBlockNumber();
    //     const block = await ethers.provider.getBlock(blockNum);
    //     const blockTimeStamp = block.timestamp;
    //     const sevenDays =  7 * 24 * 60 * 60;

    //     const newClosingTime = blockTimeStamp +sevenDays

        
    //     await moonSale.connect(one).buyTokens(one.address, true, {
    //         value: "100"
    //     })

    //     await moonSale.migration(newClosingTime,newMarketWrapper.address )

    //     await expect(moonSale.connect(two).refund()).to.be.reverted

    // });

    // it ("Should prevent non refundable contributors from collecting refunds", async function () {

    //     const {Wrapper, moonSale,  provider, one, two, three,four } = await loadFixture(deployTokenFixture)

    //     const newMarketWrapper = await Wrapper.deploy(ethers.utils.parseUnits((300).toString(), "wei"), four.address, "");
    //     await newMarketWrapper.deployed();
    //     newMarketWrapper.grantOwnerRole(moonSale.address)

    //     const blockNum = await ethers.provider.getBlockNumber();
    //     const block = await ethers.provider.getBlock(blockNum);
    //     const blockTimeStamp = block.timestamp;
    //     const sevenDays =  7 * 24 * 60 * 60;

    //     const newClosingTime = blockTimeStamp +sevenDays

        
    //     await moonSale.connect(one).buyTokens(one.address, false, {
    //         value: "100"
    //     })

    //     await moonSale.migration(newClosingTime,newMarketWrapper.address )

    //     await expect(moonSale.connect(one).refund()).to.be.reverted

    // });

    // it ("Should prevent current refundable contributors from collecting refunds", async function () {

    //     const {Wrapper, moonSale,  provider, one, two, three,four} = await loadFixture(deployTokenFixture)

    //     const newMarketWrapper = await Wrapper.deploy(ethers.utils.parseUnits((300).toString(), "wei"), four.address, "");
    //     await newMarketWrapper.deployed();
    //     newMarketWrapper.grantOwnerRole(moonSale.address)

    //     const blockNum = await ethers.provider.getBlockNumber();
    //     const block = await ethers.provider.getBlock(blockNum);
    //     const blockTimeStamp = block.timestamp;
    //     const sevenDays =  7 * 24 * 60 * 60;

    //     const newClosingTime = blockTimeStamp +sevenDays

    //     await moonSale.connect(one).buyTokens(one.address, true, {
    //         value: "100"
    //     })

    //     // await moonSale.migration(newClosingTime,newMarketWrapper.address )

    //     await expect(moonSale.connect(one).refund()).to.be.reverted

    // });

    // it ("Should prevent contributors from getting refunds after collecting tokens", async function () {

    //     const {moonSale, moonToken, provider, one, two, three} = await loadFixture(deployTokenFixture)
        
    //     await moonSale.connect(one).buyTokens(one.address, false, {
    //         value: ethers.utils.parseUnits((300).toString(), "wei")
    //     })

    //     await moonSale.connect(two).buyTokens(two.address, true, {
    //         value: ethers.utils.parseUnits((200).toString(), "wei")
    //     })

    //     await moonSale.connect(three).buyTokens(three.address, false, {
    //         value: ethers.utils.parseUnits((25).toString(), "wei")
    //     })

    //     await moonSale.connect(one).collectTokens()
        
    //     await moonSale.connect(two).collectTokens()

    //     await expect( moonSale.connect(one).refund()).to.be.reverted
    //     await expect( moonSale.connect(two).refund()).to.be.reverted

    // });

    // it ("Allows refunds after a migration post purchase for refundable contributors", async function () {

    //     const {Wrapper, moonSale, moonVault, moonToken, provider, one, two, three, four} = await loadFixture(deployTokenFixture)

    //     const newMarketWrapper = await Wrapper.deploy(ethers.utils.parseUnits((250).toString(), "wei"), four.address, "");
    //     await newMarketWrapper.deployed();
    //     newMarketWrapper.grantOwnerRole(moonSale.address)

    //     const blockNum = await ethers.provider.getBlockNumber();
    //     const block = await ethers.provider.getBlock(blockNum);
    //     const blockTimeStamp = block.timestamp;
    //     const sevenDays =  7 * 24 * 60 * 60;

    //     const newClosingTime = blockTimeStamp +sevenDays

    //     await moonSale.connect(one).buyTokens(one.address, true, {
    //         value: "100"
    //     })

    //     await moonSale.connect(two).buyTokens(two.address, false, {
    //         value: "300"
    //     })
      
    //     let migrationCount = await moonSale.migrationCount()

    //     expect(await moonSale.state()).to.equal(0)
    //     await moonSale.migration(newClosingTime,newMarketWrapper.address )

    //     migrationCount = await moonSale.migrationCount()

    //     expect(await moonSale.state()).to.equal(1)
    //     await expect(moonSale.connect(one).refund()).to.not.be.reverted

    // });

    // it ("Allows collecting tokens after a migration post purchase for non refundable contributors ", async function () {

    //     const {Wrapper, moonSale, moonVault, moonToken, provider, one, two, three, four} = await loadFixture(deployTokenFixture)

    //     const newMarketWrapper = await Wrapper.deploy(ethers.utils.parseUnits((250).toString(), "wei"), four.address, "");
    //     await newMarketWrapper.deployed();
    //     newMarketWrapper.grantOwnerRole(moonSale.address)

    //     const blockNum = await ethers.provider.getBlockNumber();
    //     const block = await ethers.provider.getBlock(blockNum);
    //     const blockTimeStamp = block.timestamp;
    //     const sevenDays =  7 * 24 * 60 * 60;

    //     const newClosingTime = blockTimeStamp +sevenDays

    //     await moonSale.connect(one).buyTokens(one.address, true, {
    //         value: "100"
    //     })

    //     await moonSale.connect(two).buyTokens(two.address, false, {
    //         value: "300"
    //     })
      
    //     let migrationCount = await moonSale.migrationCount()

    //     expect(await moonSale.state()).to.equal(0)
    //     await moonSale.migration(newClosingTime,newMarketWrapper.address )

    //     migrationCount = await moonSale.migrationCount()

    //     expect(await moonSale.state()).to.equal(1)
    //     await expect(moonSale.connect(two).collectTokens()).to.not.be.reverted

    // });

    // it ("Prevents collecting tokens after a migration post purchase for refundable contributors ", async function () {

    //     const {Wrapper, moonSale, moonVault, moonToken, provider, one, two, three, four} = await loadFixture(deployTokenFixture)

    //     const newMarketWrapper = await Wrapper.deploy(ethers.utils.parseUnits((250).toString(), "wei"), four.address, "");
    //     await newMarketWrapper.deployed();
    //     newMarketWrapper.grantOwnerRole(moonSale.address)

    //     const blockNum = await ethers.provider.getBlockNumber();
    //     const block = await ethers.provider.getBlock(blockNum);
    //     const blockTimeStamp = block.timestamp;
    //     const sevenDays =  7 * 24 * 60 * 60;

    //     const newClosingTime = blockTimeStamp +sevenDays

    //     await moonSale.connect(one).buyTokens(one.address, true, {
    //         value: "100"
    //     })

    //     await moonSale.connect(two).buyTokens(two.address, false, {
    //         value: "300"
    //     })
      
    //     let migrationCount = await moonSale.migrationCount()

    //     expect(await moonSale.state()).to.equal(0)
    //     await moonSale.migration(newClosingTime,newMarketWrapper.address )

    //     migrationCount = await moonSale.migrationCount()

    //     expect(await moonSale.state()).to.equal(1)
    //     await expect(moonSale.connect(one).collectTokens()).to.be.reverted

    // });

    // it ("Allows contributors to make both refundable and non refundable contributions", async function () {

    //     const {Wrapper, moonSale, moonVault, moonToken, provider, one, two, three, four} = await loadFixture(deployTokenFixture)

    //     const newMarketWrapper = await Wrapper.deploy(ethers.utils.parseUnits((250).toString(), "wei"), four.address, "");
    //     await newMarketWrapper.deployed();
    //     newMarketWrapper.grantOwnerRole(moonSale.address)

    //     const blockNum = await ethers.provider.getBlockNumber();
    //     const block = await ethers.provider.getBlock(blockNum);
    //     const blockTimeStamp = block.timestamp;
    //     const sevenDays =  7 * 24 * 60 * 60;

    //     const newClosingTime = blockTimeStamp +sevenDays

    //     await moonSale.connect(one).buyTokens(one.address, true, {
    //         value: "100"
    //     })

    //     await moonSale.connect(one).buyTokens(one.address, false, {
    //         value: "300"
    //     })
      
    //     let migrationCount = await moonSale.migrationCount()

    //     expect(await moonSale.state()).to.equal(0)
    //     await moonSale.migration(newClosingTime,newMarketWrapper.address )

    //     migrationCount = await moonSale.migrationCount()

    //     expect(await moonSale.state()).to.equal(1)
    //     await expect(moonSale.connect(one).collectTokens()).to.not.be.reverted
    //     expect(await moonToken.balanceOf(one.address)).to.equal(300)
    //     expect(await provider.getBalance(moonVault.address)).to.equal(100)
    //     await expect(moonSale.connect(one).refund()).to.not.be.reverted
    //     expect(await provider.getBalance(moonVault.address)).to.equal(0)

    // });



});
