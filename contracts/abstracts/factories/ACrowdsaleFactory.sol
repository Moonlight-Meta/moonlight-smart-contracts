// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "../../interfaces/factories/ICrowdsaleFactory.sol";
import "../../interfaces/factories/IMarketWrapperFactory.sol";

import "../../interfaces/factories/IVaultFactory.sol";
import "../../interfaces/main/IToken.sol";
import "../../interfaces/main/IVault.sol";
import "../../interfaces/main/IMarketWrapper.sol";
import "../../main/MoonSale.sol";

abstract contract ACrowdsaleFactory is ICrowdsaleFactory, AccessControl {
    using SafeMath for uint256;

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function grantOwnerRole(address to) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(DEFAULT_ADMIN_ROLE, to);
    }
}
