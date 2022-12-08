const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers, waffle } = require("hardhat");
const { isCallTrace } = require("hardhat/internal/hardhat-network/stack-traces/message-trace");
const { _toEscapedUtf8String } = require("ethers/lib/utils");

describe("MoonSale Testing", function  () {

    async function deploySaleFixture() {

        const [owner, one, two, three, four, five] = await ethers.getSigners();
        
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
        const _marketPlace = "0x00000000006c3852cbEf3e08E8dF289169EdE581"
        const _transactionData = "0x"
        const marketWrapper = await Wrapper.deploy(
            _price,
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
                _marketPlace,
                _transactionData,
            owner, one, two, three, four, five
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

    it ("Should prevent contributions of the incorrect number of decimal place", async function () {

        const {moonSale, one} = await loadFixture(deploySaleFixture)
        
        const _refundable = false
        const _deposit = ethers.utils.parseUnits(".5112","ether")
        
        await expect(moonSale.connect(one).buyTokens(one.address, _refundable, {
            value: _deposit
        })).to.be.reverted

    })

    it ("Should prevent paying the contract directly from a non admin account", async function () {

        const {moonSale, one} = await loadFixture(deploySaleFixture)
        
        const _deposit = ethers.utils.parseUnits(".51","ether")

        await expect(one.sendTransaction({
            to: moonSale.address,
            value: _deposit
        })).to.be.reverted
        
    })

    it ("Should allow you to make a non refundable contributions", async function () {

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

    it ("Should allow you to make multiple non refundable contributions", async function () {

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

    it ("Should allow you to make a refundable contribution", async function () {

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

    it ("Should allow you to make multiple refundable contributions", async function () {

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

    it ("Should allow you to make multiple contributions of both types", async function () {

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

    it ("Should prevent current refundable and non refundable contributors from collecting tokens before the crowdsale finishes", async function () {

        const {moonSale, one, two} = await loadFixture(deploySaleFixture)
        
        await moonSale.connect(one).buyTokens(one.address, false, {
            value: ethers.utils.parseUnits("4","ether")
        })

        await moonSale.connect(two).buyTokens(two.address, true, {
            value: ethers.utils.parseUnits("4","ether")
        })

       await expect(moonSale.connect(one).collectTokens()).to.be.reverted    

    });

    it ("Should prevent current refundable and non refundable contributors from getting refunds before the crowdsale finishes", async function () {

        const {moonSale, one, two} = await loadFixture(deploySaleFixture)
        
        await moonSale.connect(one).buyTokens(one.address, false, {
            value: ethers.utils.parseUnits("4","ether")
        })

        await moonSale.connect(two).buyTokens(two.address, true, {
            value: ethers.utils.parseUnits("4","ether")
        })

       await expect(moonSale.connect(one).refund()).to.be.reverted    
       await expect(moonSale.connect(two).refund()).to.be.reverted 

    });

    it ("Should allow an admin to make an emergency withdrawal in the middle of a crowdsale", async function () {

        const {moonSale, provider, one, two, five} = await loadFixture(deploySaleFixture)

        await moonSale.connect(one).buyTokens(one.address, false, {
            value: ethers.utils.parseUnits("4","ether")
        })

        await moonSale.connect(two).buyTokens(two.address, true, {
            value: ethers.utils.parseUnits("4","ether")
        })

        const originalFiveBalance = await provider.getBalance(five.address);
        const originalContractBalance = await provider.getBalance(moonSale.address)

        await moonSale.emergencyWithdrawal(five.address)

        const newContractBalance = await provider.getBalance(moonSale.address);
        const newFiveBalance = await provider.getBalance(five.address);

        expect(newContractBalance).to.equal(0)
        expect(newFiveBalance).to.equal(originalFiveBalance.add(originalContractBalance))
        
    })

    it ("Should prevent a non admin from making an emergency withdrawal in the middle of a crowdsale", async function () {

        const {moonSale, one, two, five} = await loadFixture(deploySaleFixture)

        await moonSale.connect(one).buyTokens(one.address, false, {
            value: ethers.utils.parseUnits("4","ether")
        })

        await moonSale.connect(two).buyTokens(two.address, true, {
            value: ethers.utils.parseUnits("4","ether")
        })

        await expect(moonSale.connect(five).emergencyWithdrawal(five.address)).to.be.reverted

    })

    it ("Should automatically make the NFT purchase when the goal is hit", async function () {

        const {moonSale, _price, _marketPlace, moonVault, provider, one, two, three, four} = await loadFixture(deploySaleFixture)
        
        const originalMarketPlaceBalance = await provider.getBalance(_marketPlace);

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
        const newMarketPlaceBalance = await provider.getBalance(_marketPlace);

        expect(newContractBalance).to.be.at.least(await moonSale.interest())
        expect(await moonSale.state()).equals(1)
        expect(await moonVault.state()).equals(1)
        expect(await moonSale.currentRefundableWei()).equals(0)
        expect(newMarketPlaceBalance).equals(originalMarketPlaceBalance.add(_price))
        
    })

    it ("Should prevent the NFT purchase when a person is overpaying the crowdsale", async function () {

        const {moonSale, provider, one, two, three, four} = await loadFixture(deploySaleFixture)

        await moonSale.connect(one).buyTokens(one.address, false, {
            value: ethers.utils.parseUnits("4","ether")
        })

        await moonSale.connect(two).buyTokens(two.address, true, {
            value: ethers.utils.parseUnits("4","ether")
        })

        await expect(moonSale.connect(three).buyTokens(three.address, false, {
            value: ethers.utils.parseUnits("1.14","ether")
        })).to.be.reverted
        
    })


    async function deployPostPurchaseSaleFixture() {
        const {
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
                _marketPlace,
                _transactionData,
            owner, one, two, three, four, five
        } = await loadFixture(deploySaleFixture)

        const oneDeposit = ethers.utils.parseUnits("4","ether")
        await moonSale.connect(one).buyTokens(one.address, true, {
            value: oneDeposit
        })

        const twoDeposit = ethers.utils.parseUnits("4","ether")
        await moonSale.connect(two).buyTokens(two.address, false, {
            value: twoDeposit
        })

        const threeDeposit = ethers.utils.parseUnits("1.13","ether")
        await moonSale.connect(three).buyTokens(three.address, true, {
            value: threeDeposit
        })

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
                _marketPlace,
                _transactionData,
            owner, one, two, three, four, five,
            oneDeposit, twoDeposit, threeDeposit
        }

    }

    it ("Should allow owners to collect the interest", async function () {

        const {moonSale, provider, five} = await loadFixture(deployPostPurchaseSaleFixture)
        const interest =  await moonSale.interest()

        const originalContractBalance = await provider.getBalance(moonSale.address);
        const originalFiveBalance = await provider.getBalance(five.address);
        
        await moonSale.collectInterest(five.address)
        
        const newFiveBalance = await provider.getBalance(five.address);
        const newContractBalance = await provider.getBalance(moonSale.address);

        expect(originalContractBalance).to.be.at.least(interest)
        expect(newContractBalance).equals(0)
        expect(newFiveBalance).equals(originalFiveBalance.add(originalContractBalance))

    });

    it ("Should prevent non owners from collecting interest or emergency withdrawal", async function () {

        const {moonSale, five} = await loadFixture(deployPostPurchaseSaleFixture)

        await expect(moonSale.connect(five).collectInterest(five.address)).to.be.reverted
        await expect(moonSale.connect(five).emergencyWithdrawal(five.address)).to.be.reverted

    });
    
    
    it ("Should allow users to collect tokens", async function () {

        const {moonSale, moonToken, one, oneDeposit, two, twoDeposit, three, threeDeposit, _rate,  _tokenId} = await loadFixture(deployPostPurchaseSaleFixture)
        const migrationCount = moonSale.migrationCount() 

        await moonSale.connect(one).collectTokens()

        const oneTokens = oneDeposit.toBigInt() * BigInt(_rate) / BigInt(10**18)
        expect(await moonToken.balanceOf(one.address, _tokenId)).equals(oneTokens)
        expect(await moonSale.nonRefundableBalances(one.address)).equals(0)
        expect(await moonSale.currentRefundableBalances(migrationCount, one.address)).equals(0)     
        
        await moonSale.connect(two).collectTokens()

        const twoTokens = twoDeposit.toBigInt() * BigInt(_rate) / BigInt(10**18)
        expect(await moonToken.balanceOf(two.address, _tokenId)).equals(twoTokens)
        expect(await moonSale.nonRefundableBalances(two.address)).equals(0)
        expect(await moonSale.currentRefundableBalances(migrationCount, two.address)).equals(0)  

        await moonSale.connect(three).collectTokens()

        const threeTokens = threeDeposit.toBigInt() * BigInt(_rate) / BigInt(10**18)
        expect(await moonToken.balanceOf(three.address,_tokenId)).equals(threeTokens)
        expect(await moonSale.nonRefundableBalances(three.address)).equals(0)
        expect(await moonSale.currentRefundableBalances(migrationCount,three.address)).equals(0)       

    });

    it ("Should prevent non contributors from collecting tokens", async function () {

        const {moonSale, four} = await loadFixture(deployPostPurchaseSaleFixture)

       await expect(moonSale.connect(four).collectTokens()).to.be.reverted    

    });


    it ("Should prevent refundable and non refundable contributors from collecting refunds after a successful crowdsale both before and after collecting tokens", async function () {

        const {moonSale, one, two} = await loadFixture(deployPostPurchaseSaleFixture)

        await expect(moonSale.connect(one).refund()).to.be.reverted    
        await expect(moonSale.connect(two).refund()).to.be.reverted
        
        await moonSale.connect(one).collectTokens()
        await moonSale.connect(two).collectTokens()

        await expect(moonSale.connect(one).refund()).to.be.reverted    
        await expect(moonSale.connect(two).refund()).to.be.reverted

    });

    it ("Should prevent a migration after a successful crowdsale", async function () {

        const {moonSale, one, two, three, four, _rate} = await loadFixture(deployPostPurchaseSaleFixture)

        const blockNum = await ethers.provider.getBlockNumber();
        const block = await ethers.provider.getBlock(blockNum);
        const blockTimeStamp = block.timestamp;
        const sevenDays =  7 * 24 * 60 * 60;

        const _closingTime = blockTimeStamp +sevenDays
        await expect(moonSale.migration(_closingTime)).to.be.reverted

    });

    it ("Should prevent a migration call from a non admin account", async function () {

        const {moonSale, one, two, three, four, _rate} = await loadFixture(deploySaleFixture)

        const blockNum = await ethers.provider.getBlockNumber();
        const block = await ethers.provider.getBlock(blockNum);
        const blockTimeStamp = block.timestamp;
        const sevenDays =  7 * 24 * 60 * 60;

        const _closingTime = blockTimeStamp +sevenDays
        await expect(moonSale.connect(one).migration(_closingTime)).to.be.reverted

    });

    it ("Should allow a migration to happen", async function () {

        const {moonSale, moonVault, moonToken, marketWrapper, provider, one, two, three, four, _rate} = await loadFixture(deploySaleFixture)

        const blockNum = await ethers.provider.getBlockNumber();
        const block = await ethers.provider.getBlock(blockNum);
        const blockTimeStamp = block.timestamp;
        const sevenDays =  7 * 24 * 60 * 60;

        const oneDeposit = ethers.utils.parseUnits("4.12","ether")
        await moonSale.connect(one).buyTokens(one.address, true, {
            value: oneDeposit
        })

        const twoDeposit = ethers.utils.parseUnits("4.12","ether")
        await moonSale.connect(two).buyTokens(two.address, false, {
            value: twoDeposit
        })

        const _tokenId = 100
        const _fractionalUri = ""
        await moonToken.migration(_tokenId, _fractionalUri)

        const _price = ethers.utils.parseUnits("9.199","ether")
        const _marketPlace = "0x00000000006c3852cbEf3e08E8dF289169EdE581"
        const _transactionData = "0x"
        await marketWrapper.migration(
            _price,
            _marketPlace,
            _transactionData
        )

        const _closingTime = blockTimeStamp +sevenDays
        await moonSale.migration(_closingTime)

        const buyNowPrice = await moonSale.buyNowPriceInWei()
        const interest = await moonSale.interest()
        const goal = await moonSale.goal()
        const migrationCount = await moonSale.migrationCount()
        const minimumContribution = BigInt(10**18/_rate)
        const sumedPrice = _price.toBigInt() + interest.toBigInt()
        const ceiledPrice = (sumedPrice - sumedPrice % minimumContribution) + minimumContribution

        expect(migrationCount).equals(1)
        expect(await moonSale.currentRefundableWei()).equals(0)
        expect(buyNowPrice).to.equal(_price)
        expect(interest).to.equal(_price.div(20))
        expect(goal).to.equal(ceiledPrice)
        expect(await provider.getBalance(moonVault.address)).equals(oneDeposit)
        expect(await moonSale.currentRefundableBalances(migrationCount, one.address)).to.equal(0)
        expect(await moonSale.currentRefundableBalances(migrationCount, two.address)).to.equal(0)
        expect(await moonSale.nonRefundableBalances(one.address) ).to.equal(0)
        expect(await moonSale.nonRefundableBalances(two.address) ).to.equal(twoDeposit)
    });

    it ("Should allow a migration to automatically purchase the NFT if it has enough non refundable funds", async function () {

        const {moonSale, moonVault, moonToken, marketWrapper, provider, one, two, three, four, _rate} = await loadFixture(deploySaleFixture)

        const blockNum = await ethers.provider.getBlockNumber();
        const block = await ethers.provider.getBlock(blockNum);
        const blockTimeStamp = block.timestamp;
        const sevenDays =  7 * 24 * 60 * 60;

        const oneDeposit = ethers.utils.parseUnits("4.12","ether")
        await moonSale.connect(one).buyTokens(one.address, true, {
            value: oneDeposit
        })

        const twoDeposit = ethers.utils.parseUnits("4.33","ether")
        await moonSale.connect(two).buyTokens(two.address, false, {
            value: twoDeposit
        })

        const _tokenId = 100
        const _fractionalUri = ""
        await moonToken.migration(_tokenId, _fractionalUri)

        const _price = ethers.utils.parseUnits("4.12","ether")
        const _marketPlace = "0x00000000006c3852cbEf3e08E8dF289169EdE581"
        const originalMarketPlaceBalance = await  provider.getBalance(_marketPlace)
        const _transactionData = "0x"
        await marketWrapper.migration(
            _price,
            _marketPlace,
            _transactionData
        )

        const _closingTime = blockTimeStamp +sevenDays
        await moonSale.migration(_closingTime)

        const newMarketPlaceBalance = await provider.getBalance(_marketPlace)
        const buyNowPrice = await moonSale.buyNowPriceInWei()
        const interest = await moonSale.interest()
        const goal = await moonSale.goal()
        const migrationCount = await moonSale.migrationCount()
        const minimumContribution = BigInt(10**18/_rate)
        const sumedPrice = _price.toBigInt() + interest.toBigInt()
        const ceiledPrice = (sumedPrice - sumedPrice % minimumContribution) + minimumContribution

        expect(migrationCount).equals(1)
        expect(await moonSale.currentRefundableWei()).equals(0)
        expect(buyNowPrice).to.equal(_price)
        expect(interest).to.equal(_price.div(20))
        expect(goal).to.equal(ceiledPrice)
        expect(await newMarketPlaceBalance).equals(originalMarketPlaceBalance.add(_price))
        expect(await moonSale.currentRefundableBalances(migrationCount, one.address)).to.equal(0)
        expect(await moonSale.currentRefundableBalances(migrationCount, two.address)).to.equal(0)
        expect(await moonSale.nonRefundableBalances(one.address)).to.equal(0)
        expect(await moonSale.nonRefundableBalances(two.address) ).to.equal(twoDeposit)
        
        await moonSale.connect(two).collectTokens()

        expect(await moonSale.nonRefundableBalances(two.address) ).to.equal(0)
        expect(await moonToken.balanceOf(two.address, _tokenId)).to.equal(433)

    });

    async function deployPostMigrationSaleFixture() {
        const {
            provider, 
            moonSale, 
                _rate, 
                _opening_time,
            moonVault,
            moonToken,
                _collectionOwner,
            marketWrapper, 
                _marketPlace,
                _transactionData,
            owner, one, two, three, four, five
        } = await loadFixture(deploySaleFixture)

        
        const blockNum = await ethers.provider.getBlockNumber();
        const block = await ethers.provider.getBlock(blockNum);
        const blockTimeStamp = block.timestamp;
        const sevenDays =  7 * 24 * 60 * 60;

        const oneDeposit = ethers.utils.parseUnits("4.5","ether")
        await moonSale.connect(one).buyTokens(one.address, true, {
            value: oneDeposit
        })

        const twoDeposit = ethers.utils.parseUnits("3.5","ether")
        await moonSale.connect(two).buyTokens(two.address, false, {
            value: twoDeposit
        })

        const threeRefundableDeposit = ethers.utils.parseUnits(".5","ether")
        await moonSale.connect(three).buyTokens(three.address, true, {
            value: threeRefundableDeposit
        })

        const threeNonRefundableDeposit = ethers.utils.parseUnits(".25","ether")
        await moonSale.connect(three).buyTokens(three.address, false, {
            value: threeNonRefundableDeposit
        })

        const _tokenId = 100
        const _fractionalUri = ""
        await moonToken.migration(_tokenId, _fractionalUri)

        const _price = ethers.utils.parseUnits("10","ether")
        await marketWrapper.migration(
            _price,
            _marketPlace,
            _transactionData
        )

        const _closing_time = blockTimeStamp +sevenDays
        await moonSale.migration(_closing_time)
        
        const migrationCount = await moonSale.migrationCount()

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
                _marketPlace,
                _transactionData,
            owner, one, two, three, four, five,
            oneDeposit, twoDeposit, threeRefundableDeposit, threeNonRefundableDeposit,
            migrationCount
        }
    }

    it ("Should allow a person to be refunded after a migration", async function () {
        const {moonSale, migrationCount, moonVault, provider, one,  oneDeposit, three, threeNonRefundableDeposit, threeRefundableDeposit} = await loadFixture(deployPostMigrationSaleFixture)

        const originalVaultBalance = await provider.getBalance(moonVault.address)
        const originalOneBalance = await provider.getBalance(one.address)

        await moonSale.connect(one).refund()
        
        let newVaultBalance = await provider.getBalance(moonVault.address)
        const newOneBalance = await provider.getBalance(one.address)

        expect(newOneBalance).to.be.above(originalOneBalance)
        expect(newVaultBalance).to.equal(originalVaultBalance.sub(oneDeposit))
        expect(await moonSale.currentRefundableBalances(migrationCount, one.address)).to.equal(0)

        const originalThreeBalance = await provider.getBalance(three.address)

        await moonSale.connect(three).refund()
        
        newVaultBalance = await provider.getBalance(moonVault.address)
        const newThreeBalance = await provider.getBalance(three.address)

        expect(newThreeBalance).to.be.above(originalThreeBalance)
        expect(newVaultBalance).to.equal(originalVaultBalance.sub(oneDeposit).sub(threeRefundableDeposit))
        expect(await moonSale.currentRefundableBalances(migrationCount, three.address)).to.equal(0)
        expect(await moonSale.nonRefundableBalances(three.address)).to.equal(threeNonRefundableDeposit)

    })  
   
    it ("Should prevent non contributors, and non refundable contributors from collecting refunds", async function () {

        const {moonSale, two, four} = await loadFixture(deployPostMigrationSaleFixture)

        await expect( moonSale.connect(two).refund()).to.be.reverted
        await expect( moonSale.connect(four).refund()).to.be.reverted

    });

    it ("Should prevent current refundable contributors from collecting refunds", async function () {

        const {moonSale, one} = await loadFixture(deployPostMigrationSaleFixture)

        const currentOneDeposit = ethers.utils.parseUnits(".5","ether")
        await moonSale.connect(one).buyTokens(one.address, true, {
            value: currentOneDeposit
        })

        await expect(moonSale.connect(one).refund()).to.be.reverted

    });

    it ("Should allow a crowdsale to make an NFT purchase post migration", async function () {

        const {provider, _price, moonSale, moonVault, _marketPlace, one} = await loadFixture(deployPostMigrationSaleFixture)

        const originalMarketPlaceBalance = await provider.getBalance(_marketPlace);

        const currentOneDeposit = ethers.utils.parseUnits("6.75","ether")
        await moonSale.connect(one).buyTokens(one.address, true, {
            value: currentOneDeposit
        })

        const newMarketPlaceBalance = await provider.getBalance(_marketPlace);
        const newContractBalance = await provider.getBalance(one.address);

        expect(newContractBalance).to.be.at.least(await moonSale.interest())
        expect(await moonSale.state()).equals(1)
        expect(await moonVault.state()).equals(1)
        expect(await moonSale.currentRefundableWei()).equals(0)
        expect(newMarketPlaceBalance).equals(originalMarketPlaceBalance.add(_price))

    });

    it ("Should allow a non refundable contributor w/ no current refundable contributions to collect refunds from past crowdsales", async function () {

        const {provider, _price, moonSale, moonVault, _marketPlace, one, oneDeposit, three, threeRefundableDeposit} = await loadFixture(deployPostMigrationSaleFixture)

        const currentOneDeposit = ethers.utils.parseUnits("6.75","ether")
        await moonSale.connect(one).buyTokens(one.address, false, {
            value: currentOneDeposit
        })

        const originalVaultBalance = await provider.getBalance(moonVault.address)
        const originalOneBalance = await provider.getBalance(one.address)
        const originalThreeBalance = await provider.getBalance(three.address)

        await moonSale.connect(one).refund()
        await moonSale.connect(three).refund()

        const newVaultBalance = await provider.getBalance(moonVault.address)
        const newOneBalance = await provider.getBalance(one.address)
        const newThreeBalance = await provider.getBalance(three.address)

        expect(newOneBalance).to.be.above(originalOneBalance)
        expect(newThreeBalance).to.be.above(originalThreeBalance)
        expect(newVaultBalance).to.equal(originalVaultBalance.sub(oneDeposit).sub(threeRefundableDeposit))

        await expect(moonSale.connect(one).collectTokens()).to.not.be.reverted
        await expect(moonSale.connect(three).collectTokens()).to.not.be.reverted

    });

    it ("Should allow a non refundable contributor w/ no current refundable contributions to collect tokens", async function () {

        const { _rate, _tokenId, moonSale, moonToken, _marketPlace, one, two, twoDeposit, three, threeNonRefundableDeposit} = await loadFixture(deployPostMigrationSaleFixture)

        const currentTwoDeposit = ethers.utils.parseUnits("6.75","ether")
        await moonSale.connect(two).buyTokens(two.address, false, {
            value: currentTwoDeposit
        })

        await moonSale.connect(two).collectTokens()
        await moonSale.connect(three).collectTokens()

        const twoTokenBalance = (twoDeposit.toBigInt() + currentTwoDeposit.toBigInt())* BigInt(_rate) / BigInt(10**18)
        const threeTokenBalance = threeNonRefundableDeposit.toBigInt() * BigInt(_rate) / BigInt(10**18)

        expect(await moonToken.balanceOf(two.address, _tokenId)).to.equal(twoTokenBalance)
        expect(await moonToken.balanceOf(three.address, _tokenId)).to.equal(threeTokenBalance)

        await expect(moonSale.connect(one).refund()).to.not.be.reverted
        await expect(moonSale.connect(three).refund()).to.not.be.reverted

    });

    it ("Should prevent a previous refundable contributor from collecting after purchase post migration", async function () {

        const { _rate, _tokenId, moonSale, moonToken, _marketPlace, one, two, twoDeposit, three, threeNonRefundableDeposit} = await loadFixture(deployPostMigrationSaleFixture)

        const currentTwoDeposit = ethers.utils.parseUnits("6.75","ether")
        await moonSale.connect(two).buyTokens(two.address, false, {
            value: currentTwoDeposit
        })

        await expect(moonSale.connect(one).collectTokens()).to.be.reverted

    });

    it ("Should prevent a current refundable contributor from collecting refunds from past crowdsales before collecting their tokens yet", async function () {

        const {provider, _price, moonSale, moonVault, _marketPlace, one} = await loadFixture(deployPostMigrationSaleFixture)

        const currentOneDeposit = ethers.utils.parseUnits("6.75","ether")
        await moonSale.connect(one).buyTokens(one.address, true, {
            value: currentOneDeposit
        })

        await expect(moonSale.connect(one).refund()).to.be.reverted

    });

    it ("Should allow a current refundable contributor to collect refunds from past crowdsales after collecting their tokens (also ensure that tokens are proportional to only current contributions)", async function () {

        const {provider, _price, _rate, moonSale, moonToken, _tokenId, moonVault, _marketPlace, one, three, oneDeposit, threeRefundableDeposit, threeNonRefundableDeposit} = await loadFixture(deployPostMigrationSaleFixture)

        const currentOneDeposit = ethers.utils.parseUnits("6","ether")
        await moonSale.connect(one).buyTokens(one.address, true, {
            value: currentOneDeposit
        })

        const currentThreeDeposit = ethers.utils.parseUnits(".75","ether")
        await moonSale.connect(three).buyTokens(three.address, true, {
            value: currentThreeDeposit
        })

        oneTokens = currentOneDeposit.toBigInt() * BigInt(_rate) / BigInt(10**18)
        threeTokens = (currentThreeDeposit.toBigInt() + threeNonRefundableDeposit.toBigInt()) * BigInt(_rate)/ BigInt(10**18)

        await moonSale.connect(one).collectTokens()
        await moonSale.connect(three).collectTokens()

        expect(await moonToken.balanceOf(one.address, _tokenId)).to.equal(oneTokens)
        expect(await moonToken.balanceOf(three.address, _tokenId)).to.equal(threeTokens)

        const originalVaultBalance = await provider.getBalance(moonVault.address)
        const originalOneBalance = await provider.getBalance(one.address)
        const originalThreeBalance = await provider.getBalance(three.address)

        await moonSale.connect(one).refund()
        await moonSale.connect(three).refund()

        const newVaultBalance = await provider.getBalance(moonVault.address)
        const newOneBalance = await provider.getBalance(one.address)
        const newThreeBalance = await provider.getBalance(three.address)

        expect(newOneBalance).to.be.above(originalOneBalance)
        expect(newThreeBalance).to.be.above(originalThreeBalance)
        expect(newVaultBalance).to.equal(originalVaultBalance.sub(threeRefundableDeposit).sub(oneDeposit))

    });

});
