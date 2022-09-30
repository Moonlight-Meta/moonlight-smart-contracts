// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./ModifiedCrowdsale.sol";
import "./interfaces/IVault.sol";
import "./interfaces/IToken.sol";
import "./interfaces/IMarketWrapper.sol";

contract MoonSale is ModifiedCrowdsale{
    using SafeMath for uint256;

    enum State{ Running, Purchased}
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
        address _token,
        address _vault,
        address _wrapper,
        uint256 _openingTime,
        uint256 _closingTime
    ) ModifiedCrowdsale(_rate, _token, _openingTime, _closingTime){
        // INSTANTIATE MARKETWRAPPER VARIABLE HERE
        // INSERT MARKETWRAPPER SETTING BUY NOW PRICE
        vault = MoonVault(_vault);
    }

    // -----------------------------------------
    // New Functions
    // -----------------------------------------

    function migration(uint256 _newClosingTime) public onlyOwner{
        // INSTANTIATE MARKETWRAPPER VARIABLE HERE
        // INSERT MARKETWRAPPER SETTING BUY NOW PRICE

        //check security
        payable(address(vault)).transfer(currentRefundableWei);

        currentRefundableWei = 0;
        migrationCount+=1;
        openingTime = block.timestamp;
        closingTime = _newClosingTime;
        _updatePurchasingState();
    }

    function collectTokens() public onlyAfterPurchase{
        uint256 contributionInWei = currentRefundableBalances[migrationCount][msg.sender] + nonRefundableBalances[msg.sender];
        require(contributionInWei > 0);

        vault.deductRefundableBalances(msg.sender, currentRefundableBalances[migrationCount][msg.sender]);
        currentRefundableBalances[migrationCount][msg.sender] = 0;
        nonRefundableBalances[msg.sender] = 0;

        _deliverTokens(msg.sender, _getTokenAmount(contributionInWei));
    }

    function refund() public payable{
        require(currentRefundableBalances[migrationCount][msg.sender] == 0);

        vault.refund(payable(msg.sender));
    }

    // -----------------------------------------
    // Overriden Functions
    // -----------------------------------------

    function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) internal override{
        super._preValidatePurchase(_beneficiary, _weiAmount);

        require(getState() == State.Running);
        require(_getTokenAmount(_weiAmount) >= 1);
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
    }

}
