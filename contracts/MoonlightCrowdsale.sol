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
    uint256 public refundableWei = 0;

    uint256 public migrationCount = 0;
    mapping(uint256 => mapping(address => uint256)) public currentRefundableBalances;
    mapping(address => uint256) public nonRefundableBalances;
    
    NFTVault public vault;
    //CREATE MARKETWRAPPER VARIABLE HERE
    
    constructor(
        uint256 _rate,
        address payable _wallet,
        NFTToken _token,
        uint256 _openingTime,
        uint256 _closingTime
    ) ModifiedCrowdsale(_rate, _wallet, _token, _openingTime, _closingTime){
        // INSTANTIATE MARKETWRAPPER VARIABLE HERE
        // INSERT MARKETWRAPPER SETTING BUY NOW PRICE
        vault = new NFTVault(wallet);
    }

    modifier onlyAfterPurchase {
        require(getState() == State.Purchased);
        _;
    } 

    function migration(uint256 _newOpeningTime, uint256 _newClosingTime) public onlyOwner{
        // INSTANTIATE MARKETWRAPPER VARIABLE HERE
        // INSERT MARKETWRAPPER SETTING BUY NOW PRICE

        openingTime = _newOpeningTime;
        closingTime = _newClosingTime;
        weiRaised = weiRaised - refundableWei;
        refundableWei = 0;
        migrationCount+=1;
    }

    // -----------------------------------------
    // New Functions
    // -----------------------------------------

    function getMinBidInWei() public returns (uint256){
        // INSERT MARKETWRAPPER GETTING MINIMUM BID HERE
    }

    function getState() public returns (State){
        if(state == State.Purchased) return state;
    
        if(weiRaised < getMinBidInWei()) 
            state = State.Running;
        else 
            state = State.Bidded;

        return state;
    }

    function collectTokens() public onlyAfterPurchase{
        uint256 weiAmount;
        weiAmount += currentRefundableBalances[migrationCount][msg.sender];
        weiAmount += nonRefundableBalances[msg.sender];
        require(weiAmount > 0);

        currentRefundableBalances[migrationCount][msg.sender] = 0;
        nonRefundableBalances[msg.sender] = 0;
        
        uint256 tokenAmount;
        tokenAmount = _getTokenAmount(weiAmount);
        _deliverTokens(msg.sender, tokenAmount);
    }

    function canBeRefunded(address _refundee) view public returns (bool){
        if (currentRefundableBalances[migrationCount][_refundee] == 0 && 
            nonRefundableBalances[_refundee] == 0)
            return true;
        
        return false;
    }

    function refund() public payable{
        require(canBeRefunded(msg.sender));
        vault.refund(payable(msg.sender));
    }

    // -----------------------------------------
    // Overriden Functions
    // -----------------------------------------

    function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) internal override{
        super._preValidatePurchase(_beneficiary, _weiAmount);

        require(getState() == State.Running);
        require(weiRaised + _weiAmount <= buyNowPriceInWei);
    }

    function _postValidatePurchase(address _beneficiary, uint256 _weiAmount) internal override
    {
        // FOR ROLLBACK LOGIC IF NEEDED
    }

    function _updatePurchasingState() internal override{
        if(weiRaised == buyNowPriceInWei){
            //INSERT MARKETWRAPPER PURCHASING NFT
            uint256 coinsToMint = _getTokenAmount(weiRaised);
            token.mint(address(this), coinsToMint);
            vault.close();
            state = State.Purchased;
        }
        else if(weiRaised > getMinBidInWei()){
            //INSERT MARKETWRAPPER BIDDING ON NFT
            state = State.Bidded;
        }
    }

    function _processPurchase(address _beneficiary, uint256 _weiAmount, bool _refundable) internal override{
        if (_refundable)
            currentRefundableBalances[migrationCount][_beneficiary] += _weiAmount;
        else{
            nonRefundableBalances[_beneficiary] += _weiAmount;
            refundableWei += _weiAmount;
        }
    }

    function _forwardFunds(bool _refundable) internal override{
        vault.deposit{value: msg.value}(msg.sender, _refundable);
    }

}
