// const { expect } = require("chai");
// const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
// const { ethers, waffle } = require("hardhat");
// const { isCallTrace } = require("hardhat/internal/hardhat-network/stack-traces/message-trace");

// describe("MoonSaleFactory Testing", function () {

//     async function deployFactoryFixture() {
//         const SaleFactory = await ethers.getContractFactory("MoonSaleFactory");

//         const WrapperFactory = await ethers.getContractFactory("MarketWrapperFactory");
//         const marketWrapperFactory = await WrapperFactory.deploy();
//         await marketWrapperFactory.deployed();

//         const VaultFactory = await ethers.getContractFactory("MoonVaultFactory");
//         const moonVaultFactory = await VaultFactory.deploy();
//         await moonVaultFactory.deployed();

//         const TokenFactory = await ethers.getContractFactory("MoonTokenFactory");
//         const moonTokenFactory = await TokenFactory.deploy();
//         await moonTokenFactory.deployed();

//         const moonSaleFactory = await SaleFactory.deploy(moonTokenFactory.address, marketWrapperFactory.address, moonVaultFactory.address);

//         await moonSaleFactory.deployed();

//         await marketWrapperFactory.grantOwnerRole(moonSaleFactory.address)
//         await moonVaultFactory.grantOwnerRole(moonSaleFactory.address)
//         await moonTokenFactory.grantOwnerRole(moonSaleFactory.address)

//         const [owner, one, two, three, four] = await ethers.getSigners();

//         return { moonSaleFactory, owner, one, two, three, four }
//     }

//     it("Should deploy a MoonSaleFactory", async function () {
//         const { moonSaleFactory } = await loadFixture(deployFactoryFixture)
//         expect(moonSaleFactory)
//     })

//     async function deployTokenFixture() {
//         const { moonSaleFactory, owner, one, two, three, four } = await loadFixture(deployFactoryFixture)

//         const Sale = await ethers.getContractFactory("MoonSale");
//         const Token = await ethers.getContractFactory("MoonToken");
//         const Vault = await ethers.getContractFactory("MoonVault");
//         const Wrapper = await ethers.getContractFactory("MarketWrapper");

//         const blockNum = await ethers.provider.getBlockNumber();
//         const block = await ethers.provider.getBlock(blockNum);
//         const blockTimeStamp = block.timestamp;
//         const sevenDays = 7 * 24 * 60 * 60;

//         const rate = 1
//         const opening_time = blockTimeStamp + 1;
//         const closing_time = blockTimeStamp + sevenDays;
//         const name = "MoonToken"
//         const symbol = "MTKN"
//         const baseNftID = "12345"
//         const buyNowPrice = 500

//         await moonSaleFactory.newMoonSale(
//             rate,
//             opening_time,
//             closing_time,
//             name,
//             symbol,
//             baseNftID,
//             buyNowPrice,
//             four.address,
//             ""
//         )

//         const saleAddress = await moonSaleFactory.getLatestSale();

//         const tokenAddress = await moonSaleFactory.saleTokens(saleAddress)
//         const vaultAddress = await moonSaleFactory.saleVaults(saleAddress)
//         const wrapperAddress = await moonSaleFactory.saleMarketWrappers(saleAddress)

//         const moonSale = await Sale.attach(saleAddress)

//         const moonToken = await Token.attach(tokenAddress)
//         const moonVault = await Vault.attach(vaultAddress)
//         const marketWrapper = await Wrapper.attach(wrapperAddress)

//         const provider = waffle.provider;

//         return { provider, Wrapper, moonSaleFactory, moonSale, moonToken, moonVault, marketWrapper, owner, one, two, three, four }
//     }

//     it("MoonSaleFactory should be able to deploy a moonSale", async function () {
//         const { moonSale } = await loadFixture(deployTokenFixture)
//         expect(moonSale)
//     })


//     it("MoonSaleFactory should be able to perform a migration", async function () {
//         const { moonSaleFactory, moonSale, moonToken, one, four } = await loadFixture(deployTokenFixture)
        
//         const saleAddress = await moonSaleFactory.getLatestSale();

//         const blockNum = await ethers.provider.getBlockNumber();
//         const block = await ethers.provider.getBlock(blockNum);
//         const blockTimeStamp = block.timestamp;
//         const sevenDays = 7 * 24 * 60 * 60;

//         const closing_time = blockTimeStamp + sevenDays;
//         const baseNftID = 200
//         const buyNowPrice = 300

//         await moonSaleFactory.migration(
//             saleAddress,
//             closing_time,
//             baseNftID,
//             buyNowPrice,
//             four.address,
//             ""
//         )

//         await expect(moonSaleFactory.connect(one).migration(
//             saleAddress,
//             closing_time,
//             baseNftID,
//             buyNowPrice
//         )).to.be.reverted

//         expect(await moonSale.buyNowPriceInWei()).equals(300)
//         expect(await moonToken.baseNftID()).equals(200)
//         expect(await moonSale.migrationCount()).equals(1)
//     })

//     it("MoonSaleFactory should be able to perform an emergencyWithdrawal", async function () {
//         const {provider, moonSaleFactory, moonSale, moonVault, marketWrapper, owner, one } = await loadFixture(deployTokenFixture)
        
//         await owner.sendTransaction({
//             to: moonSale.address,
//             value: "100"
//           });

//         await owner.sendTransaction({
//             to: moonVault.address,
//             value: "100" 
//           });

//         await owner.sendTransaction({
//             to: marketWrapper.address,
//             value: "100"
//           });

//         expect(await provider.getBalance(moonSale.address)).to.equal(100)
//         expect(await provider.getBalance(moonVault.address)).to.equal(100)
//         expect(await provider.getBalance(marketWrapper.address)).to.equal(100)

//         const oneBalance = await provider.getBalance(one.address)
//         await moonSaleFactory.emergencyWithdrawal(moonSale.address, one.address) 
        
//         expect(await provider.getBalance(moonSale.address)).to.equal(0)
//         expect(await provider.getBalance(moonVault.address)).to.equal(0)
//         expect(await provider.getBalance(marketWrapper.address)).to.equal(0)

//         expect(await provider.getBalance(one.address)).to.equal(oneBalance.add(300))

//     })

//     it("MoonSaleFactory should prevent non admin calls to emergencyWithdrawal", async function () {
//         const {provider, moonSaleFactory, moonSale, moonVault, marketWrapper, owner, one } = await loadFixture(deployTokenFixture)

//         await expect(moonSaleFactory
//                     .connect(one)
//                     .emergencyWithdrawal(
//                         moonSale.address, 
//                         one.address))
//                     .to.be.reverted
//     })


//     describe("MoonSale testing", function () {
//         it ("Should deploy", async function () {

//             const {moonSale} = await loadFixture(deployTokenFixture)
//             expect(moonSale)
//             expect(await moonSale.buyNowPriceInWei()).equals(500)
//             expect(await moonSale.interest()).equals(500/20)
    
//         });
    
//         it ("Should allow you to make a non refundable purchase", async function () {
    
//             const {moonSale, provider, one} = await loadFixture(deployTokenFixture)
    
//             const contractBalance = await provider.getBalance(moonSale.address);
            
//             await moonSale.connect(one).buyTokens(one.address, false, {
//                 value: "100"
//             })
    
//             const newContractBalance = await provider.getBalance(moonSale.address);
    
//             expect(await moonSale.nonRefundableBalances(one.address)).equals(100)
//             expect(newContractBalance).equals(contractBalance.add(100))
    
//         });
    
    
//         it ("Should allow you to make a refundable purchase", async function () {
    
//             const {moonSale, provider, one} = await loadFixture(deployTokenFixture)
    
//             const contractBalance = await provider.getBalance(moonSale.address);
            
//             await moonSale.connect(one).buyTokens(one.address, true, {
//                 value: "100"
//             })
    
//             const newContractBalance = await provider.getBalance(moonSale.address);
    
//             const migrationCount = await moonSale.migrationCount()
    
//             expect(await moonSale.currentRefundableBalances(migrationCount, one.address)).equals(100)
//             expect(await moonSale.currentRefundableWei()).equals(100)
//             expect(newContractBalance).equals(contractBalance.add(100))
    
//         });
    
//         it ("Should automatically make the purchase when the buyNowPrice+interest is hit", async function () {
    
//             const {moonSale, marketWrapper, moonVault, provider, one, two, three, four} = await loadFixture(deployTokenFixture)
    
//             const contractBalance = await provider.getBalance(moonSale.address);
//             const previousMarketPlaceBalance = await provider.getBalance(four.address);
    
//             await moonSale.connect(one).buyTokens(one.address, false, {
//                 value: ethers.utils.parseUnits((300).toString(), "wei")
//             })
    
//             await moonSale.connect(two).buyTokens(two.address, false, {
//                 value: ethers.utils.parseUnits((200).toString(), "wei")
//             })
    
//             await moonSale.connect(three).buyTokens(three.address, false, {
//                 value: ethers.utils.parseUnits((25).toString(), "wei")
//             })
    
//             const newContractBalance = await provider.getBalance(moonSale.address);
//             const marketPlaceBalance = await provider.getBalance(four.address);
    
//             expect(newContractBalance).equals(await moonSale.interest())
//             expect(await moonSale.state()).equals(1)
//             expect(await moonSale.currentRefundableWei()).equals(0)
//             expect(marketPlaceBalance).equals(previousMarketPlaceBalance.add(500))
//             expect(await moonVault.state()).equals(1)
    
//         });
    
//         it ("Should allow owners to collect the interest", async function () {
    
//             const {moonSale, marketWrapper, moonVault, provider, one, two, three, four} = await loadFixture(deployTokenFixture)
    
//             await moonSale.connect(one).buyTokens(one.address, false, {
//                 value: ethers.utils.parseUnits((300).toString(), "wei")
//             })
    
//             await moonSale.connect(two).buyTokens(two.address, false, {
//                 value: ethers.utils.parseUnits((200).toString(), "wei")
//             })
    
//             await moonSale.connect(three).buyTokens(three.address, false, {
//                 value: ethers.utils.parseUnits((25).toString(), "wei")
//             })
    
//             const contractBalance = await provider.getBalance(moonSale.address);
    
//             const interest =  await moonSale.interest()
//             expect(contractBalance).equals(interest)
    
//             const fourBalance = await provider.getBalance(four.address);
//             await moonSale.collectInterest(four.address)
//             const newFourBalance = await provider.getBalance(four.address);
    
//             const newContractBalance = await provider.getBalance(moonSale.address);
    
//             expect(newContractBalance).equals(0)
//             expect(fourBalance.add(interest)).equals(newFourBalance)
    
//         });
    
//         it ("Should prevent non owners from collecting interest or emergency refund", async function () {
    
//             const {moonSale, marketWrapper, moonVault, provider, one, two, three, four} = await loadFixture(deployTokenFixture)
    
//             await moonSale.connect(one).buyTokens(one.address, false, {
//                 value: ethers.utils.parseUnits((300).toString(), "wei")
//             })
    
//             await moonSale.connect(two).buyTokens(two.address, false, {
//                 value: ethers.utils.parseUnits((200).toString(), "wei")
//             })
    
//             await expect(moonSale.connect(two).collectInterest(two.address)).to.be.reverted
    
//             await moonSale.connect(three).buyTokens(three.address, false, {
//                 value: ethers.utils.parseUnits((25).toString(), "wei")
//             })
    
//             await expect(moonSale.connect(two).collectInterest(two.address)).to.be.reverted
    
//         });
        
        
//         it ("Should allow users to collect tokens", async function () {
    
//             const {moonSale, moonToken, provider, one, two, three} = await loadFixture(deployTokenFixture)
            
//             await moonSale.connect(one).buyTokens(one.address, false, {
//                 value: ethers.utils.parseUnits((300).toString(), "wei")
//             })
    
//             await moonSale.connect(two).buyTokens(two.address, true, {
//                 value: ethers.utils.parseUnits((200).toString(), "wei")
//             })
    
//             await moonSale.connect(three).buyTokens(three.address, false, {
//                 value: ethers.utils.parseUnits((25).toString(), "wei")
//             })
    
//             await moonSale.connect(one).collectTokens()
    
//             expect(await moonToken.balanceOf(one.address)).equals(300)
//             expect(await moonSale.nonRefundableBalances(one.address)).equals(0)
//             expect(await moonSale.currentRefundableBalances(0,one.address)).equals(0)     
            
//             await moonSale.connect(two).collectTokens()
    
//             expect(await moonToken.balanceOf(two.address)).equals(200)
//             expect(await moonSale.nonRefundableBalances(two.address)).equals(0)
//             expect(await moonSale.currentRefundableBalances(0,two.address)).equals(0)       
    
//             await moonSale.connect(three).collectTokens()
    
//             expect(await moonToken.balanceOf(three.address)).equals(25)
//             expect(await moonSale.nonRefundableBalances(three.address)).equals(0)
//             expect(await moonSale.currentRefundableBalances(0,three.address)).equals(0)       
    
//         });
    
//         it ("Should prevent non contributors from collect tokens", async function () {
    
//             const {moonSale, provider, one, two, three, four} = await loadFixture(deployTokenFixture)
    
//             const contractBalance = await provider.getBalance(moonSale.address);
            
//             await moonSale.connect(one).buyTokens(one.address, false, {
//                 value: ethers.utils.parseUnits((300).toString(), "wei")
//             })
    
//             await moonSale.connect(two).buyTokens(two.address, true, {
//                 value: ethers.utils.parseUnits((200).toString(), "wei")
//             })
    
//             await moonSale.connect(three).buyTokens(three.address, false, {
//                 value: ethers.utils.parseUnits((25).toString(), "wei")
//             })
    
//            await expect(moonSale.connect(four).collectTokens()).to.be.reverted    
    
//         });
    
//         it ("Should prevent contributors from collect tokens before the crowdsale finishes", async function () {
    
//             const {moonSale, provider, one, two, three, four} = await loadFixture(deployTokenFixture)
    
//             const contractBalance = await provider.getBalance(moonSale.address);
            
//             await moonSale.connect(one).buyTokens(one.address, false, {
//                 value: ethers.utils.parseUnits((300).toString(), "wei")
//             })
    
//             await moonSale.connect(two).buyTokens(two.address, true, {
//                 value: ethers.utils.parseUnits((200).toString(), "wei")
//             })
    
//            await expect(moonSale.connect(one).collectTokens()).to.be.reverted    
    
//         });
    
//         it ("Should allow a migration to happen", async function () {
    
//             const {Wrapper, moonSale, moonVault, moonToken, provider, one, two, three, four} = await loadFixture(deployTokenFixture)
    
//             const newMarketWrapper = await Wrapper.deploy(ethers.utils.parseUnits((299).toString(), "wei"), four.address, "");
//             await newMarketWrapper.deployed();
//             newMarketWrapper.grantOwnerRole(moonSale.address)
    
//             await moonSale.connect(one).buyTokens(one.address, true, {
//                 value: ethers.utils.parseUnits((100).toString(), "wei")
//             })
    
//             const blockNum = await ethers.provider.getBlockNumber();
//             const block = await ethers.provider.getBlock(blockNum);
//             const blockTimeStamp = block.timestamp;
//             const sevenDays =  7 * 24 * 60 * 60;
    
//             const newClosingTime = blockTimeStamp +sevenDays
    
//             await moonSale.migration(newClosingTime,newMarketWrapper.address )
    
//             expect(await moonSale.migrationCount()).equals(1)
//             expect(await moonSale.currentRefundableWei()).equals(0)
//             expect(await moonSale.buyNowPriceInWei() ).equals(299)
//             expect(await moonSale.interest()).to.equal(Math.floor(299/20))
//             expect(await provider.getBalance(moonVault.address)).equals(100)
//         });
    
//         it ("Should allow a migration to automatically purchase the NFT if funds are in order", async function () {
    
//             const {Wrapper, moonSale, moonToken, provider, one, two, three, four} = await loadFixture(deployTokenFixture)
    
                     
//             await moonSale.connect(one).buyTokens(one.address, false, {
//                 value: ethers.utils.parseUnits((300).toString(), "wei")
//             })
    
//             const newMarketWrapper = await Wrapper.deploy(ethers.utils.parseUnits((250).toString(), "wei"), four.address, "");
//             await newMarketWrapper.deployed();
//             newMarketWrapper.grantOwnerRole(moonSale.address)
    
//             const blockNum = await ethers.provider.getBlockNumber();
//             const block = await ethers.provider.getBlock(blockNum);
//             const blockTimeStamp = block.timestamp;
//             const sevenDays =  7 * 24 * 60 * 60;
    
//             const newClosingTime = blockTimeStamp +sevenDays
    
//             await moonSale.migration(newClosingTime,newMarketWrapper.address )
    
//             expect(await moonSale.migrationCount()).equals(1)
//             expect(await moonSale.state()).equals(1)
    
//         });
    
//         it ("Should allow refunds", async function () {
    
//             const {Wrapper, moonSale, moonToken, provider, one, two, three,four} = await loadFixture(deployTokenFixture)
    
//             const newMarketWrapper = await Wrapper.deploy(ethers.utils.parseUnits((300).toString(), "wei"), four.address, "");
//             await newMarketWrapper.deployed();
//             newMarketWrapper.grantOwnerRole(moonSale.address)
    
//             const blockNum = await ethers.provider.getBlockNumber();
//             const block = await ethers.provider.getBlock(blockNum);
//             const blockTimeStamp = block.timestamp;
//             const sevenDays =  7 * 24 * 60 * 60;
    
//             const newClosingTime = blockTimeStamp +sevenDays
    
            
//             await moonSale.connect(one).buyTokens(one.address, true, {
//                 value: "100"
//             })
    
//             const oldContractBalance = await provider.getBalance(moonSale.address);
          
//             let migrationCount = await moonSale.migrationCount()
    
//             expect(await moonSale.currentRefundableBalances(migrationCount, one.address)).equals(100)
    
//             await moonSale.migration(newClosingTime,newMarketWrapper.address )
    
//             migrationCount = await moonSale.migrationCount()
    
//             expect(await moonSale.currentRefundableBalances(migrationCount, one.address)).equals(0)
    
//             const oldOneBalance = await provider.getBalance(one.address);
    
//             await moonSale.connect(one).refund()
    
//             const newOneBalance = await provider.getBalance(one.address);
    
//             const newContractBalance = await provider.getBalance(moonSale.address);
    
//             expect(oldContractBalance.sub(100)).equals(newContractBalance)
//             expect(migrationCount).equals(1)
//             expect(await moonSale.buyNowPriceInWei()).equals(300)
//             expect(await moonSale.interest()).to.equal(Math.floor(300/20))
    
//         });
    
//         it ("Should prevent non contributors from collecting refunds", async function () {
    
//             const {Wrapper, moonSale,  provider, one, two, three, four} = await loadFixture(deployTokenFixture)
    
//             const newMarketWrapper = await Wrapper.deploy(ethers.utils.parseUnits((300).toString(), "wei"), four.address, "");
//             await newMarketWrapper.deployed();
//             newMarketWrapper.grantOwnerRole(moonSale.address)
    
//             const blockNum = await ethers.provider.getBlockNumber();
//             const block = await ethers.provider.getBlock(blockNum);
//             const blockTimeStamp = block.timestamp;
//             const sevenDays =  7 * 24 * 60 * 60;
    
//             const newClosingTime = blockTimeStamp +sevenDays
    
            
//             await moonSale.connect(one).buyTokens(one.address, true, {
//                 value: "100"
//             })
    
//             await moonSale.migration(newClosingTime,newMarketWrapper.address )
    
//             await expect(moonSale.connect(two).refund()).to.be.reverted
    
//         });
    
//         it ("Should prevent non refundable contributors from collecting refunds", async function () {
    
//             const {Wrapper, moonSale,  provider, one, two, three,four } = await loadFixture(deployTokenFixture)
    
//             const newMarketWrapper = await Wrapper.deploy(ethers.utils.parseUnits((300).toString(), "wei"), four.address, "");
//             await newMarketWrapper.deployed();
//             newMarketWrapper.grantOwnerRole(moonSale.address)
    
//             const blockNum = await ethers.provider.getBlockNumber();
//             const block = await ethers.provider.getBlock(blockNum);
//             const blockTimeStamp = block.timestamp;
//             const sevenDays =  7 * 24 * 60 * 60;
    
//             const newClosingTime = blockTimeStamp +sevenDays
    
            
//             await moonSale.connect(one).buyTokens(one.address, false, {
//                 value: "100"
//             })
    
//             await moonSale.migration(newClosingTime,newMarketWrapper.address )
    
//             await expect(moonSale.connect(one).refund()).to.be.reverted
    
//         });
    
//         it ("Should prevent current refundable contributors from collecting refunds", async function () {
    
//             const {Wrapper, moonSale,  provider, one, two, three,four} = await loadFixture(deployTokenFixture)
    
//             const newMarketWrapper = await Wrapper.deploy(ethers.utils.parseUnits((300).toString(), "wei"), four.address, "");
//             await newMarketWrapper.deployed();
//             newMarketWrapper.grantOwnerRole(moonSale.address)
    
//             const blockNum = await ethers.provider.getBlockNumber();
//             const block = await ethers.provider.getBlock(blockNum);
//             const blockTimeStamp = block.timestamp;
//             const sevenDays =  7 * 24 * 60 * 60;
    
//             const newClosingTime = blockTimeStamp +sevenDays
    
//             await moonSale.connect(one).buyTokens(one.address, true, {
//                 value: "100"
//             })
    
//             // await moonSale.migration(newClosingTime,newMarketWrapper.address )
    
//             await expect(moonSale.connect(one).refund()).to.be.reverted
    
//         });
    
//         it ("Should prevent contributors from getting refunds after collecting tokens", async function () {
    
//             const {moonSale, moonToken, provider, one, two, three} = await loadFixture(deployTokenFixture)
            
//             await moonSale.connect(one).buyTokens(one.address, false, {
//                 value: ethers.utils.parseUnits((300).toString(), "wei")
//             })
    
//             await moonSale.connect(two).buyTokens(two.address, true, {
//                 value: ethers.utils.parseUnits((200).toString(), "wei")
//             })
    
//             await moonSale.connect(three).buyTokens(three.address, false, {
//                 value: ethers.utils.parseUnits((25).toString(), "wei")
//             })
    
//             await moonSale.connect(one).collectTokens()
            
//             await moonSale.connect(two).collectTokens()
    
//             await expect( moonSale.connect(one).refund()).to.be.reverted
//             await expect( moonSale.connect(two).refund()).to.be.reverted
    
//         });
    
//         it ("Allows refunds after a migration post purchase for refundable contributors", async function () {
    
//             const {Wrapper, moonSale, moonVault, moonToken, provider, one, two, three, four} = await loadFixture(deployTokenFixture)
    
//             const newMarketWrapper = await Wrapper.deploy(ethers.utils.parseUnits((250).toString(), "wei"), four.address, "");
//             await newMarketWrapper.deployed();
//             newMarketWrapper.grantOwnerRole(moonSale.address)
    
//             const blockNum = await ethers.provider.getBlockNumber();
//             const block = await ethers.provider.getBlock(blockNum);
//             const blockTimeStamp = block.timestamp;
//             const sevenDays =  7 * 24 * 60 * 60;
    
//             const newClosingTime = blockTimeStamp +sevenDays
    
//             await moonSale.connect(one).buyTokens(one.address, true, {
//                 value: "100"
//             })
    
//             await moonSale.connect(two).buyTokens(two.address, false, {
//                 value: "300"
//             })
          
//             let migrationCount = await moonSale.migrationCount()
    
//             expect(await moonSale.state()).to.equal(0)
//             await moonSale.migration(newClosingTime,newMarketWrapper.address )
    
//             migrationCount = await moonSale.migrationCount()
    
//             expect(await moonSale.state()).to.equal(1)
//             await expect(moonSale.connect(one).refund()).to.not.be.reverted
    
//         });
    
//         it ("Allows collecting tokens after a migration post purchase for non refundable contributors ", async function () {
    
//             const {Wrapper, moonSale, moonVault, moonToken, provider, one, two, three, four} = await loadFixture(deployTokenFixture)
    
//             const newMarketWrapper = await Wrapper.deploy(ethers.utils.parseUnits((250).toString(), "wei"), four.address, "");
//             await newMarketWrapper.deployed();
//             newMarketWrapper.grantOwnerRole(moonSale.address)
    
//             const blockNum = await ethers.provider.getBlockNumber();
//             const block = await ethers.provider.getBlock(blockNum);
//             const blockTimeStamp = block.timestamp;
//             const sevenDays =  7 * 24 * 60 * 60;
    
//             const newClosingTime = blockTimeStamp +sevenDays
    
//             await moonSale.connect(one).buyTokens(one.address, true, {
//                 value: "100"
//             })
    
//             await moonSale.connect(two).buyTokens(two.address, false, {
//                 value: "300"
//             })
          
//             let migrationCount = await moonSale.migrationCount()
    
//             expect(await moonSale.state()).to.equal(0)
//             await moonSale.migration(newClosingTime,newMarketWrapper.address )
    
//             migrationCount = await moonSale.migrationCount()
    
//             expect(await moonSale.state()).to.equal(1)
//             await expect(moonSale.connect(two).collectTokens()).to.not.be.reverted
    
//         });
    
//         it ("Prevents collecting tokens after a migration post purchase for refundable contributors ", async function () {
    
//             const {Wrapper, moonSale, moonVault, moonToken, provider, one, two, three, four} = await loadFixture(deployTokenFixture)
    
//             const newMarketWrapper = await Wrapper.deploy(ethers.utils.parseUnits((250).toString(), "wei"), four.address, "");
//             await newMarketWrapper.deployed();
//             newMarketWrapper.grantOwnerRole(moonSale.address)
    
//             const blockNum = await ethers.provider.getBlockNumber();
//             const block = await ethers.provider.getBlock(blockNum);
//             const blockTimeStamp = block.timestamp;
//             const sevenDays =  7 * 24 * 60 * 60;
    
//             const newClosingTime = blockTimeStamp +sevenDays
    
//             await moonSale.connect(one).buyTokens(one.address, true, {
//                 value: "100"
//             })
    
//             await moonSale.connect(two).buyTokens(two.address, false, {
//                 value: "300"
//             })
          
//             let migrationCount = await moonSale.migrationCount()
    
//             expect(await moonSale.state()).to.equal(0)
//             await moonSale.migration(newClosingTime,newMarketWrapper.address )
    
//             migrationCount = await moonSale.migrationCount()
    
//             expect(await moonSale.state()).to.equal(1)
//             await expect(moonSale.connect(one).collectTokens()).to.be.reverted
    
//         });
    
//         it ("Allows contributors to make both refundable and non refundable contributions", async function () {
    
//             const {Wrapper, moonSale, moonVault, moonToken, provider, one, two, three, four} = await loadFixture(deployTokenFixture)
    
//             const newMarketWrapper = await Wrapper.deploy(ethers.utils.parseUnits((250).toString(), "wei"), four.address, "");
//             await newMarketWrapper.deployed();
//             newMarketWrapper.grantOwnerRole(moonSale.address)
    
//             const blockNum = await ethers.provider.getBlockNumber();
//             const block = await ethers.provider.getBlock(blockNum);
//             const blockTimeStamp = block.timestamp;
//             const sevenDays =  7 * 24 * 60 * 60;
    
//             const newClosingTime = blockTimeStamp +sevenDays
    
//             await moonSale.connect(one).buyTokens(one.address, true, {
//                 value: "100"
//             })
    
//             await moonSale.connect(one).buyTokens(one.address, false, {
//                 value: "300"
//             })
          
//             let migrationCount = await moonSale.migrationCount()
    
//             expect(await moonSale.state()).to.equal(0)
//             await moonSale.migration(newClosingTime,newMarketWrapper.address )
    
//             migrationCount = await moonSale.migrationCount()
    
//             expect(await moonSale.state()).to.equal(1)
//             await expect(moonSale.connect(one).collectTokens()).to.not.be.reverted
//             expect(await moonToken.balanceOf(one.address)).to.equal(300)
//             expect(await provider.getBalance(moonVault.address)).to.equal(100)
//             await expect(moonSale.connect(one).refund()).to.not.be.reverted
//             expect(await provider.getBalance(moonVault.address)).to.equal(0)
    
//         });
    
//     });


// });