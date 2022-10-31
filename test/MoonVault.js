const { expect } = require("chai");

describe("Token contract", function () {
  it("MoonVault Deploys", async function () {
    const [owner] = await ethers.getSigners();

    const Vault = await ethers.getContractFactory("MoonVault");

    const hardhatVault = await Vault.deploy();

    expect(hardhatVault);

  });
});