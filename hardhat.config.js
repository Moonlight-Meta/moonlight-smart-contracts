require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.13",
      },
      {
        version: "0.8.9",
        settings: {},
      },
    ],
  },
  settings: { optimizer: { enabled: true, runs: 1 } },
  gasReporter: {
    enabled: false,
    currency: "USD",
    coinmarketcap: "9f94aa54-3628-4304-9848-2adff6b93704"
  }
};

