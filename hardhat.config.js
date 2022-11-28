require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.9",
  settings: { optimizer: { enabled: true, runs: 1 } },
  gasReporter: {
    enabled: true,
    currency: "USD",
    coinmarketcap: "9f94aa54-3628-4304-9848-2adff6b93704"
  }
};

