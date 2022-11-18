const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers, waffle} = require("hardhat");

describe("MoonVault Testing", function  () {

  async function deployTokenFixture() {

    const Vault = await ethers.getContractFactory("MoonVault");
    const [owner, one, two, three, four] = await ethers.getSigners();
    
    const moonVault = await Vault.deploy();

    await moonVault.deployed();

    await owner.sendTransaction({
      to: moonVault.address,
      value: "100" // Starting money
    });

    return {Vault, moonVault, owner, one, two, three, four}

  }

  it("Should deploy MoonVault", async function () {
    const {moonVault} = await loadFixture(deployTokenFixture)

    expect(moonVault);

  });
  it("Should update refundable balances", async function () {

    const {moonVault, one} = await loadFixture(deployTokenFixture)

    const weiAmount = 5000

    await moonVault.updateRefundableBalances(one.address, weiAmount)

    const balance = await moonVault.refundableBalances(one.address)


    expect(balance).equals(weiAmount)
  });
  it("Should deduct refundable balances", async function () {

    const {moonVault, one} = await loadFixture(deployTokenFixture)
    
    const deposit = 5000

    await moonVault.updateRefundableBalances(one.address, deposit)

    const tokenCollectionDeduction = 2500

    await moonVault.deductRefundableBalances(one.address, tokenCollectionDeduction)

    const balance = await moonVault.refundableBalances(one.address)

    expect(balance).equals(deposit-tokenCollectionDeduction)
  });
  it("Should refund balances", async function () {

    const {moonVault, owner, one} = await loadFixture(deployTokenFixture)

    const deposit = 100

    await moonVault.updateRefundableBalances(one.address, deposit)

    const provider = waffle.provider;

    const contractBalance = await provider.getBalance(moonVault.address);
    const signerBalance = await provider.getBalance(one.address);

    await moonVault.refund(one.address)

    const newContractBalance = await provider.getBalance(moonVault.address);
    const newSignerBalance = await provider.getBalance(one.address);

     expect(contractBalance).equals(newContractBalance.add(deposit))
     expect(signerBalance).equals(newSignerBalance.sub(deposit))

  });
  it("Should close and prevent other calls", async function () {

    const {moonVault, owner, one} = await loadFixture(deployTokenFixture)

    await moonVault.close()

    await expect(moonVault.updateRefundableBalances(one.address, 50)).to.be.reverted
    await expect(moonVault.refund(one.address)).to.be.reverted
  });
  it("Should prevent non owner calls", async function () {

    const {moonVault, owner, one} = await loadFixture(deployTokenFixture)

    await expect(moonVault.connect(one).updateRefundableBalances(one.address, 50)).to.be.reverted
    await expect(moonVault.connect(one).deductRefundableBalances(one.address, 25)).to.be.reverted
    await expect(moonVault.connect(one).refund(one.address)).to.be.reverted
  });
  it("Should allow MoonVault to add an admin", async function () {

    const {moonVault, owner, one} = await loadFixture(deployTokenFixture)

    await moonVault.grantOwnerRole(one.address)

    await expect(moonVault.connect(one).updateRefundableBalances(one.address, 50)).to.not.be.reverted
    await expect(moonVault.connect(one).deductRefundableBalances(one.address, 25)).to.not.be.reverted
    await expect(moonVault.connect(one).refund(one.address)).to.not.be.reverted
  });
  it("Should allow an emergency withdrawal", async function () {

    const {moonVault, one, owner} = await loadFixture(deployTokenFixture)

    const provider = waffle.provider;

    const contractBalance = await provider.getBalance(moonVault.address);
    const ownerBalance = await provider.getBalance(one.address);

    await moonVault.emergencyWithdrawal(one.address);

    const newContractBalance = await provider.getBalance(moonVault.address);
    const newOwnerBalance = await provider.getBalance(one.address);
    
    expect(newContractBalance).to.equal(0);

    expect(newOwnerBalance).to.equal(ownerBalance.add(contractBalance))

  });




});