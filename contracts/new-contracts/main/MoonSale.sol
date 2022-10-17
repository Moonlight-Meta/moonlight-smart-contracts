// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../abstracts/main/ACrowdsale.sol";

contract MoonSale is ACrowdsale{

    enum State{Running, Purchased}
    State private state;

    IVault public vault;
    uint256 public currentRefundableWei = 0;

    uint256 public migrationCount = 0;
    mapping(uint256 => mapping(address => uint256)) public currentRefundableBalances;
    mapping(address => uint256) public nonRefundableBalances;
    
    IMarketWrapper public marketWrapper;
    uint256 public buyNowPriceInWei;

    modifier onlyAfterPurchase {require(state == State.Purchased); _;} 

    constructor(
        uint256 _rate,
        address _token,
        uint256 _openingTime,
        uint256 _closingTime,
        address payable _vault,
        address payable _marketWrapper
    ) 
    ACrowdsale(_rate, _token, _openingTime, _closingTime)
    {
        vault = IVault(_vault);
        marketWrapper = IMarketWrapper(_marketWrapper);
        buyNowPriceInWei = marketWrapper.getBuyNowPrice();
    }

    // -----------------------------------------
    // New Functions
    // -----------------------------------------

    function migration(uint256 _newClosingTime, address _marketWrapper)
    override external onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        marketWrapper = IMarketWrapper(payable(_marketWrapper));
        address payable vaultAddress = payable(address(vault));

        (bool success,) = vaultAddress.call{value:currentRefundableWei}("");

        require(success, "Function failed.");

        currentRefundableWei = 0;
        migrationCount+=1;
        openingTime = block.timestamp;
        closingTime = _newClosingTime;
        _updatePurchasingState();
    }

    function collectTokens() 
    override external nonReentrant onlyAfterPurchase
    {
        uint256 contributionInWei = currentRefundableBalances[migrationCount][msg.sender] + nonRefundableBalances[msg.sender];
        require(contributionInWei > 0);

        vault.deductRefundableBalances(msg.sender, currentRefundableBalances[migrationCount][msg.sender]);
        currentRefundableBalances[migrationCount][msg.sender] = 0;
        nonRefundableBalances[msg.sender] = 0;

        _deliverTokens(msg.sender, _getTokenAmount(contributionInWei));
    }

    function refund()
    override external payable nonReentrant{
        require(currentRefundableBalances[migrationCount][msg.sender] == 0);

        vault.refund(payable(msg.sender));
    }

    // -----------------------------------------
    // Overriden Functions
    // -----------------------------------------

    function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) internal override{
        super._preValidatePurchase(_beneficiary, _weiAmount);

        require(state == State.Running);
        require(_getTokenAmount(_weiAmount) >= 1);
        require(_getTokenAmount(address(this).balance + _weiAmount) <= _getTokenAmount(buyNowPriceInWei));
        
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
        if(address(this).balance >= buyNowPriceInWei){

            address payable marketWrapperAddress = payable(address(marketWrapper));
            (bool success,) = marketWrapperAddress.call{value: address(this).balance}("");

            require(success, "Purchase failed.");
            
            marketWrapper.buyNow();
            vault.close();
            state = State.Purchased;
        }
    }

}
