// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./MoonlightNFT.sol";

contract ModifiedCrowdsale is Ownable {
    using SafeMath for uint256;

    // The token being sold
    MoonlightNFT public token;

    // How many token units a buyer gets per wei
    uint256 public rate;

    // Opening time for crowdsale
    uint256 public openingTime;

    // Closing time for crowdsale
    uint256 public closingTime;

    event TokenPurchase(
        address indexed beneficiary,
        uint256 value,
        uint256 amount
    );

    constructor(
        uint256 _rate,
        MoonlightNFT _token,
        uint256 _openingTime,
        uint256 _closingTime
    ) {
        require(_rate >= 1);
        require(address(_token) != address(0));
        require(_openingTime >= block.timestamp);
        require(_closingTime > _openingTime);

        rate = _rate;
        token = _token;
        openingTime = _openingTime;
        closingTime = _closingTime;
    }

    // -----------------------------------------
    // Crowdsale external interface
    // -----------------------------------------

    receive() external payable {
        buyTokens(msg.sender, true);
    }

    fallback() external payable {
        buyTokens(msg.sender, true);
    }

    function buyTokens(address _beneficiary, bool _refundable) payable public{
        uint256 weiAmount = msg.value;
        _preValidatePurchase(_beneficiary, weiAmount);

        uint256 tokens = _getTokenAmount(weiAmount);

        _processPurchase(_beneficiary, weiAmount, _refundable);
        emit TokenPurchase(_beneficiary, weiAmount, tokens);

        _updatePurchasingState();

        _postValidatePurchase(_beneficiary, weiAmount);
    }

    // -----------------------------------------
    // Internal interface (extensible)
    // -----------------------------------------


    function _getTokenAmount(uint256 _weiAmount) view
        internal returns (uint256)
    {
        return _weiAmount.mul(rate);
    }

   function _deliverTokens(address _beneficiary, uint256 _tokenAmount)
        internal
    {
        token.mint(_beneficiary, _tokenAmount);
    }

    function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) virtual
        internal 
    {
        require( block.timestamp < closingTime );
        require(_beneficiary != address(0));
        require(_weiAmount != 0);
    }

    

    function _postValidatePurchase(address _beneficiary, uint256 _weiAmount) virtual
        internal 
    {
        // optional override
    }

    function _processPurchase( address _beneficiary, uint256 _weiAmount, bool _refundable) virtual
        internal  {
        // optional override
    }

    function _updatePurchasingState() virtual
        internal
    {
        // optional override
    }

}
