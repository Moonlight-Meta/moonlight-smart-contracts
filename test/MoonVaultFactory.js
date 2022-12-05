const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers, waffle } = require("hardhat");

describe("MoonVaultFactory Testing", function () {

    async function deployFactoryFixture() {

        const VaultFactory = await ethers.getContractFactory("MoonVaultFactory");

        const moonVaultFactory = await VaultFactory.deploy();

        await moonVaultFactory.deployed();

        const [owner, one, two, three, four] = await ethers.getSigners();

        return { moonVaultFactory, owner, one, two, three, four}

    }

    it("Should deploy MoonVaultFactory", async function () {
        const { moonVaultFactory } = await loadFixture(deployFactoryFixture)

        expect(moonVaultFactory);

    });

    it("Should allow us to add admins", async function () {
        const { moonVaultFactory, one} = await loadFixture(deployFactoryFixture)

        await expect(moonVaultFactory.connect(one).newMoonVault()).to.be.reverted

        await moonVaultFactory.grantOwnerRole(one.address);

        await expect(moonVaultFactory.connect(one).newMoonVault()).to.not.be.reverted
    });

    async function deployVaultFixture() {

        const {moonVaultFactory, owner, one, two, three, four} = await loadFixture(deployFactoryFixture)
        const provider = waffle.provider;

        await moonVaultFactory.newMoonVault()
        const vaultAddress = moonVaultFactory.getLatestVault();
        await moonVaultFactory.giveContractOwnership(vaultAddress, owner.address)

        const Vault = await ethers.getContractFactory("MoonVault");
        const moonVault = await Vault.attach(vaultAddress)

        _startingBalance = "100"
        await owner.sendTransaction({
            to: moonVault.address,
            value: _startingBalance
        });

        return {provider, moonVault, owner, one, two, three, four }
    }

    describe("MoonVault Testing", function  () {
      
        it("Should deploy MoonVault", async function () {
          const {moonVault} = await loadFixture(deployVaultFixture)
      
          expect(moonVault);
      
        })

        it("Should prevent non admins from paying the contract", async function() {
          const {moonVault, one} = await loadFixture(deployVaultFixture)
      
          await expect( one.sendTransaction({
              to: moonVault.address,
              value: "100"
            })).to.be.reverted
        })

        it("Should update refundable balances", async function () {
      
          const {moonVault, one} = await loadFixture(deployVaultFixture)
      
          const _weiAmount = 500
          await moonVault.updateRefundableBalances(one.address, _weiAmount)
      
          const balance = await moonVault.refundableBalances(one.address)
      
          expect(balance).equals(_weiAmount)
        })

        it("Should deduct refundable balances", async function () {
      
          const {moonVault, one} = await loadFixture(deployVaultFixture)
          
          const _deposit = 5000
          await moonVault.updateRefundableBalances(one.address, _deposit)
      
          const _tokenCollectionDeduction = 2500
          await moonVault.deductRefundableBalances(one.address, _tokenCollectionDeduction)
      
          const balance = await moonVault.refundableBalances(one.address)
      
          expect(balance).equals(_deposit-_tokenCollectionDeduction)
      
        })

        it("Should refund balances", async function () {
      
          const {provider, moonVault, one} = await loadFixture(deployVaultFixture)
      
          const _deposit = 100
      
          await moonVault.updateRefundableBalances(one.address, _deposit)
      
          const contractBalance = await provider.getBalance(moonVault.address);
          const signerBalance = await provider.getBalance(one.address);
      
          await moonVault.refund(one.address)
      
          const newContractBalance = await provider.getBalance(moonVault.address);
          const newSignerBalance = await provider.getBalance(one.address);
      
           expect(contractBalance).equals(newContractBalance.add(_deposit))
           expect(signerBalance).equals(newSignerBalance.sub(_deposit))
      
        })

        it("Should close and prevent other calls", async function () {
      
          const {moonVault, one} = await loadFixture(deployVaultFixture)
      
          await moonVault.close()
      
          await expect(moonVault.updateRefundableBalances(one.address, 50)).to.be.reverted
          await expect(moonVault.refund(one.address)).to.be.reverted
        })

        it("Should prevent non owner calls", async function () {
      
          const {moonVault, one} = await loadFixture(deployVaultFixture)
      
          await expect(moonVault.connect(one).updateRefundableBalances(one.address, 50)).to.be.reverted
          await expect(moonVault.connect(one).deductRefundableBalances(one.address, 25)).to.be.reverted
          await expect(moonVault.connect(one).refund(one.address)).to.be.reverted
        })

        it("Should allow MoonVault to add an admin", async function () {
      
          const {moonVault, owner, one} = await loadFixture(deployVaultFixture)
      
          await moonVault.grantOwnerRole(one.address)
      
          await expect(moonVault.connect(one).updateRefundableBalances(one.address, 50)).to.not.be.reverted
          await expect(moonVault.connect(one).deductRefundableBalances(one.address, 25)).to.not.be.reverted
          await expect(moonVault.connect(one).refund(one.address)).to.not.be.reverted
        })

        it("Should allow an emergency withdrawal", async function () {
      
          const {provider, moonVault, one} = await loadFixture(deployVaultFixture)
      
          const contractBalance = await provider.getBalance(moonVault.address);
          const ownerBalance = await provider.getBalance(one.address);
      
          await moonVault.emergencyWithdrawal(one.address);
      
          const newContractBalance = await provider.getBalance(moonVault.address);
          const newOwnerBalance = await provider.getBalance(one.address);
          
          expect(newContractBalance).to.equal(0);
          expect(newOwnerBalance).to.equal(ownerBalance.add(contractBalance))
      
        })
    

    })

})