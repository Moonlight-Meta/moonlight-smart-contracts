// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./NFTToken.sol";

/**
 * @title Modified Crowdsale
 * @dev Crowdsale is a base contract for managing a token crowdsale,
 * allowing investors to purchase tokens with ether. This contract implements
 * such functionality in its most fundamental form and can be extended to provide additional
 * functionality and/or custom behavior.
 * The external interface represents the basic interface for purchasing tokens, and conform
 * the base architecture for crowdsales. They are *not* intended to be modified / overriden.
 * The internal interface conforms the extensible and modifiable surface of crowdsales. Override
 * the methods to add functionality. Consider using 'super' where appropiate to concatenate
 * behavior.
 */

contract ModifiedCrowdsale is Ownable{
    using SafeMath for uint256;

    // The token being sold
    NFTToken public token;

    // Address where funds are collected
    address payable public wallet;

    // How many token units a buyer gets per wei
    uint256 public rate;

    // Amount of wei raised
    uint256 public weiRaised;

    // Opening time for crowdsale
    uint256 public openingTime;

    // Closing time for crowdsale
    uint256 public closingTime;

    event TokenPurchase(
        address indexed purchaser,
        address indexed beneficiary,
        uint256 value,
        uint256 amount
    );

    constructor(
        uint256 _rate,
        address payable _wallet,
        NFTToken _token,
        uint256 _openingTime,
        uint256 _closingTime
    ) {
        require(_rate > 0);
        require(_wallet != address(0));
        require(address(_token) != address(0));
        require(_openingTime >= block.timestamp);
        require(_closingTime >= _openingTime);

        rate = _rate;
        wallet = _wallet;
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

    function buyTokens(address _beneficiary, bool _refundable) public payable {
        uint256 weiAmount = msg.value;
        _preValidatePurchase(_beneficiary, weiAmount);

        // calculate token amount to be created
        uint256 tokens = _getTokenAmount(weiAmount);

        // update state
        weiRaised = weiRaised.add(weiAmount);

        _processPurchase(_beneficiary, weiAmount, _refundable);
        emit TokenPurchase(msg.sender, _beneficiary, weiAmount, tokens);

        _updatePurchasingState();

        _forwardFunds(_refundable);
        _postValidatePurchase(_beneficiary, weiAmount);
    }

    // -----------------------------------------
    // Internal interface (extensible)
    // -----------------------------------------

    function _hasClosed() public view returns (bool){
        // solium-disable-next-line security/no-block-members
        return block.timestamp > closingTime;
    }

    function _getTokenAmount(uint256 _weiAmount) view
        internal returns (uint256)
    {
        return _weiAmount.mul(rate);
    }

   function _deliverTokens(address _beneficiary, uint256 _tokenAmount)
        internal
    {
        token.transfer(_beneficiary, _tokenAmount);
    }
    function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) virtual
        internal 
    {
        require( !(_hasClosed()) );
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

    function _forwardFunds(bool _refundable) virtual
        internal 
    {
        // optional override
    }
}
