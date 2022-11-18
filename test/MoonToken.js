const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers, waffle} = require("hardhat");

describe("MoonToken Testing", function  () {

  async function deployTokenFixture() {

    const Token = await ethers.getContractFactory("MoonToken");
    const [owner, one, two, three, four] = await ethers.getSigners();
    
    const moonToken = await Token.deploy("Moon Token One", "MTK1", "18348");

    await moonToken.deployed();

    return {Token, moonToken, owner, one, two, three, four}

  }

  it("Should deploy MoonToken", async function() {

    const {moonToken} = await loadFixture(deployTokenFixture)
    expect(moonToken)

  })
  it("Should be able to mint to specific users", async function() {

    const {moonToken, one, two} = await loadFixture(deployTokenFixture)
    const oneBalance = 50
    const twoBalance = 30
    
    await moonToken.mint(one.address, oneBalance)
    await moonToken.mint(two.address, twoBalance)
    expect(await moonToken.balanceOf(one.address)).to.equal(oneBalance)
    expect( await moonToken.balanceOf(two.address)).to.equal(twoBalance)

  })
  it("Should be able to send money", async function() {

    const {moonToken, one, two} = await loadFixture(deployTokenFixture)
    const oneBalance = 50
    const twoBalance = 30

    const transfer = 30

    await moonToken.mint(one.address, oneBalance)
    await moonToken.mint(two.address, twoBalance)
    
    await moonToken.connect(one).transfer(two.address, transfer)
    expect(await moonToken.balanceOf(two.address)).to.equal(twoBalance+transfer)
    expect(await moonToken.balanceOf(one.address)).to.equal(oneBalance-transfer)

  })
  it("Should be able to let another user transfer on their behalf", async function() {

    const {moonToken, one, two} = await loadFixture(deployTokenFixture)
    const oneBalance = 50
    const twoBalance = 30

    const transfer = 30

    await moonToken.mint(one.address, oneBalance)
    await moonToken.mint(two.address, twoBalance)

    await moonToken.connect(one).approve(two.address, transfer)
    
    await moonToken.connect(two).transferFrom(one.address, two.address, transfer)
    expect(await moonToken.balanceOf(two.address)).to.equal(twoBalance+transfer)
    expect(await moonToken.balanceOf(one.address)).to.equal(oneBalance-transfer)

  })


});