const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers, waffle} = require("hardhat");

describe("MoonToken Testing", function  () {

  async function deployTokenFixture() {

    const Token = await ethers.getContractFactory("MoonToken");
    const [owner, one, two, three, four] = await ethers.getSigners();

    const tokenId = 128
    const moonToken = await Token.deploy(owner.address, "", "", 128);

    await moonToken.deployed();

    return {Token, moonToken, tokenId,  owner, one, two, three, four}

  }

  it("Should deploy MoonToken, and set the correct starting parameters", async function() {

    const {moonToken, owner} = await loadFixture(deployTokenFixture)
    const collectionOwner = await moonToken.owner()
    const adminTokenAmount = await moonToken.balanceOf(owner.address, 0)

    expect(moonToken)
    expect(adminTokenAmount).to.equal(1)
    expect(collectionOwner).to.equal(owner.address)

  })
  it("Should be able to mint to specific users", async function() {

    const {moonToken, tokenId, one, two} = await loadFixture(deployTokenFixture)
    const oneBalance = 50
    const twoBalance = 30
    
    await moonToken.mint(one.address, oneBalance)
    await moonToken.mint(two.address, twoBalance)
    expect(await moonToken.balanceOf(one.address, tokenId)).to.equal(oneBalance)
    expect( await moonToken.balanceOf( two.address, tokenId)).to.equal(twoBalance)

  })
  it("Should be able to transfer MoonTokens between users", async function() {

    const {moonToken, tokenId, one, two} = await loadFixture(deployTokenFixture)
    const oneBalance = 50
    const twoBalance = 30

    const transferAmount = 30

    await moonToken.mint(one.address, oneBalance)
    await moonToken.mint(two.address, twoBalance)
    
    await moonToken.connect(one).safeTransferFrom(one.address, two.address, tokenId, transferAmount, "0x")
    expect(await moonToken.balanceOf(two.address, tokenId)).to.equal(twoBalance+transferAmount)
    expect(await moonToken.balanceOf(one.address, tokenId)).to.equal(oneBalance-transferAmount)

  })

  it("Should prevent a user from letting another non openSea approved address transfer on their behalf", async function() {

    const {moonToken, tokenId, one, two} = await loadFixture(deployTokenFixture)
    const oneBalance = 50
    const twoBalance = 30

    const transferAmount = 30

    await moonToken.mint(one.address, oneBalance)
    await moonToken.mint(two.address, twoBalance)

    await moonToken.connect(one).setApprovalForAll(two.address, true)
    await expect(moonToken.connect(one).safeTransferFrom(one.address, two.address, tokenId, transferAmount, "")).to.be.reverted

  })
  it("Should prevent non admin function calls", async function() {
    const {moonToken, one} = await loadFixture(deployTokenFixture)
    
    await expect(moonToken.connect(one).mint(one.address, 50)).to.be.reverted
    await expect(moonToken.connect(one).setCollectionOwner(one.address)).to.be.reverted
    await expect(moonToken.connect(one).migration(100, one.address)).to.be.reverted

  })
  it("Should allow an admin to give admin privledges to another account", async function() {
    const {moonToken, one} = await loadFixture(deployTokenFixture)

    moonToken.grantOwnerRole(one.address)
    
    await expect(moonToken.connect(one).mint(one.address, 50)).to.not.be.reverted
    await expect(moonToken.connect(one).setCollectionOwner(one.address)).to.not.be.reverted
    await expect(moonToken.connect(one).migration(100, one.address)).to.not.be.reverted
  })
  it("Should allow an admin to set the collection owner", async function() {
    const {moonToken, one} = await loadFixture(deployTokenFixture)

    moonToken.setCollectionOwner(one.address)
    
    expect(await moonToken.owner()).equals(one.address)
  })
 


});