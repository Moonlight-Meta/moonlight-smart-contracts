// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "../../interfaces/main/IToken.sol";
import "../../interfaces/main/IVault.sol";
import "../../interfaces/main/IMarketWrapper.sol";
import "../../interfaces/main/ICrowdsale.sol";

abstract contract ACrowdsale is ICrowdsale, AccessControl, ReentrancyGuard {
    using SafeMath for uint256;

    IToken public token;

    uint256 public rate;

    uint256 public openingTime;

    uint256 public closingTime;

    event TokenPurchase(
        address indexed beneficiary,
        uint256 value,
        uint256 amount
    );

    constructor(
        uint256 _rate,
        address _token,
        uint256 _openingTime,
        uint256 _closingTime
    ) {
        require(_rate >= 1);
        require(address(_token) != address(0));
        require(_openingTime >= block.timestamp);
        require(_closingTime > _openingTime);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        rate = _rate;
        token = IToken(_token);
        openingTime = _openingTime;
        closingTime = _closingTime;
    }

    receive() external payable {
        buyTokens(msg.sender, true);
    }

    fallback() external payable {
        buyTokens(msg.sender, true);
    }

    function grantOwnerRole(address to) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(DEFAULT_ADMIN_ROLE, to);
    }

    function emergencyWithdrawal(
        address payable to
    ) external payable onlyRole(DEFAULT_ADMIN_ROLE) {
        (bool success, ) = to.call{value: address(this).balance}("");
        require(success, "Ether transfer failed.");
    }

    // -----------------------------------------
    // Crowdsale external interface
    // -----------------------------------------

    function buyTokens(
        address _beneficiary,
        bool _refundable
    ) public payable nonReentrant {

        uint256 weiAmount = msg.value;
        _preValidatePurchase(_beneficiary, weiAmount);
        uint256 tokens = _getTokenAmount(weiAmount);
        _processPurchase(_beneficiary, weiAmount, _refundable);
        emit TokenPurchase(_beneficiary, weiAmount, tokens);
        _updatePurchasingState();
    }

    // -----------------------------------------
    // Internal interface (extensible)
    // -----------------------------------------

    function _getTokenAmount(
        uint256 _weiAmount
    ) internal view returns (uint256) {
        return _weiAmount.mul(rate);
    }

    function _deliverTokens(
        address _beneficiary,
        uint256 _tokenAmount
    ) internal {
        token.mint(_beneficiary, _tokenAmount/((10**18)/rate));
    }

    function _preValidatePurchase(
        address _beneficiary,
        uint256 _weiAmount
    ) internal virtual {
        require(block.timestamp < closingTime);
        require(_beneficiary != address(0));
        require(_weiAmount != 0);
    }

    function _ceil(uint a, uint m) pure internal returns (uint ) {
        return ((a + m - 1) / m) * m;
    }

    function _processPurchase(
        address _beneficiary,
        uint256 _weiAmount,
        bool _refundable
    ) internal virtual;

    function _updatePurchasingState() internal virtual;
}
