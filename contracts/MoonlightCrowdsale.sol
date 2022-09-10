// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./ModifiedCrowdsale.sol";
import "./MarketWrapper.sol";
import "./NFTVault.sol";

contract MoonlightCrowdsale is ModifiedCrowdsale{
    using SafeMath for uint256;

    enum State{ Running, Bidded, Purchased}
    State private state;

    uint256 public buyNowPriceInWei;
    uint256 public currentRefundableWei = 0;

    uint256 public migrationCount = 0;
    mapping(uint256 => mapping(address => uint256)) public currentRefundableBalances;
    mapping(address => uint256) public nonRefundableBalances;
    
    NFTVault public vault;
    //CREATE MARKETWRAPPER VARIABLE HERE

    modifier onlyAfterPurchase {
        require(getState() == State.Purchased);
        _;
    } 

    constructor(
        uint256 _rate,
        MoonlightNFT _token,
        uint256 _openingTime,
        uint256 _closingTime
    ) ModifiedCrowdsale(_rate, _token, _openingTime, _closingTime){
        // INSTANTIATE MARKETWRAPPER VARIABLE HERE
        // INSERT MARKETWRAPPER SETTING BUY NOW PRICE
        vault = new NFTVault();
    }

    // -----------------------------------------
    // New Functions
    // -----------------------------------------

    function migration(uint256 _newOpeningTime, uint256 _newClosingTime) public onlyOwner{
        // INSTANTIATE MARKETWRAPPER VARIABLE HERE
        // INSERT MARKETWRAPPER SETTING BUY NOW PRICE

        openingTime = _newOpeningTime;
        closingTime = _newClosingTime;
        payable(address(vault)).transfer(currentRefundableWei);
        currentRefundableWei = 0;
        migrationCount+=1;
    }

    function getMinBidInWei() public returns (uint256){
        // INSERT MARKETWRAPPER GETTING MINIMUM BID HERE
    }

    function getState() public returns (State){
        if(state == State.Purchased) return state;
    
        if(address(this).balance < getMinBidInWei()) 
            state = State.Running;

        return state;
    }

    function collectTokens() public onlyAfterPurchase{
        uint256 contributionInWei;
        contributionInWei = currentRefundableBalances[migrationCount][msg.sender] + nonRefundableBalances[msg.sender];
        require(contributionInWei > 0);

        currentRefundableBalances[migrationCount][msg.sender] = 0;
        nonRefundableBalances[msg.sender] = 0;

        _deliverTokens(msg.sender, _getTokenAmount(contributionInWei));
    }

    function refund() public payable{
        require(
            currentRefundableBalances[migrationCount][msg.sender] > 0 || 
            nonRefundableBalances[msg.sender] > 0);

        vault.refund(payable(msg.sender));
    }

    // -----------------------------------------
    // Overriden Functions
    // -----------------------------------------

    function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) internal override{
        super._preValidatePurchase(_beneficiary, _weiAmount);

        require(getState() == State.Running);
        require(address(this).balance + _weiAmount <= buyNowPriceInWei);
    }

    function _processPurchase(address _beneficiary, uint256 _weiAmount, bool _refundable) internal override{
        if (_refundable){
            currentRefundableBalances[migrationCount][_beneficiary] += _weiAmount;
            vault.updateRefundableBalances(_beneficiary, _weiAmount);
            currentRefundableWei += _weiAmount;
        }
        else
            nonRefundableBalances[_beneficiary] += _weiAmount;
            
    }

    function _updatePurchasingState() internal override{
        if(address(this).balance == buyNowPriceInWei){
            //INSERT MARKETWRAPPER PURCHASING NFT
            vault.close();
            state = State.Purchased;
        }
        else if(address(this).balance > getMinBidInWei()){
            //INSERT MARKETWRAPPER BIDDING ON NFT
            state = State.Bidded;
        }
    }

}
