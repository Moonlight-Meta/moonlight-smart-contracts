// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../abstracts/main/ACrowdsale.sol";

contract MoonSale is ACrowdsale {
    enum State {
        Running,
        Purchased
    }
    State public state;

    IVault public vault;
    uint256 public currentRefundableWei = 0;

    uint256 public migrationCount = 0;
    mapping(uint256 => mapping(address => uint256))
        public currentRefundableBalances;

    mapping(address => uint256) public nonRefundableBalances;

    IMarketWrapper public marketWrapper;
    uint256 public buyNowPriceInWei;
    uint256 public interest;
    uint256 public goal;

    modifier onlyAfterPurchase() {
        require(state == State.Purchased);
        _;
    }

    modifier onlyBeforePurchase() {
        require(state == State.Running);
        _;
    }

    constructor(
        uint256 _rate,
        address _token,
        uint256 _openingTime,
        uint256 _closingTime,
        address payable _vault,
        address payable _marketWrapper,
        uint256 _buyNowPrice
    ) ACrowdsale(_rate, _token, _openingTime, _closingTime) {
        vault = IVault(_vault);
        marketWrapper = IMarketWrapper(_marketWrapper);
        buyNowPriceInWei = _buyNowPrice;
        interest = buyNowPriceInWei / 20;
        goal = _ceil(buyNowPriceInWei + interest, ((10**18)/rate));
    }

    // -----------------------------------------
    // New Functions
    // -----------------------------------------

    function migration(
        uint256 _newClosingTime,
        uint256 _buyNowPrice
    ) external override onlyBeforePurchase onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_newClosingTime > openingTime);

        buyNowPriceInWei = _buyNowPrice;
        interest = uint256(buyNowPriceInWei) / 20;
        goal = _ceil(buyNowPriceInWei + interest, ((10**18)/rate));

        address payable vaultAddress = payable(address(vault));
        (bool success, ) = vaultAddress.call{value: currentRefundableWei}("");
        require(success, "Function failed.");

        currentRefundableWei = 0;
        migrationCount += 1;
        openingTime = block.timestamp;
        closingTime = _newClosingTime;
        _updatePurchasingState();
    }

    function refund() external payable override nonReentrant {
        require(currentRefundableBalances[migrationCount][msg.sender] == 0);

        vault.refund(payable(msg.sender));
    }

    function collectTokens() external override nonReentrant onlyAfterPurchase {
        uint256 contributionInWei = currentRefundableBalances[migrationCount][
            msg.sender
        ] + nonRefundableBalances[msg.sender];
        require(contributionInWei > 0);

        vault.deductRefundableBalances(
            msg.sender,
            currentRefundableBalances[migrationCount][msg.sender]
        );
        currentRefundableBalances[migrationCount][msg.sender] = 0;
        nonRefundableBalances[msg.sender] = 0;

        _deliverTokens(msg.sender, _getTokenAmount(contributionInWei));
    }

    function collectInterest(
        address payable to
    ) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant onlyAfterPurchase {
        (bool success, ) = to.call{value: address(this).balance}("");
        require(success, "Ether transfer failed.");
    }

    // -----------------------------------------
    // Overriden Functions
    // -----------------------------------------

    function _preValidatePurchase(
        address _beneficiary,
        uint256 _weiAmount
    ) internal override {
        super._preValidatePurchase(_beneficiary, _weiAmount);

        require(state == State.Running);
        require(_weiAmount % ((10**18)/rate) == 0);
        require(address(this).balance
                 <= goal);
    }

    function _processPurchase(
        address _beneficiary,
        uint256 _weiAmount,
        bool _refundable
    ) internal override {
        if (_refundable) {
            currentRefundableBalances[migrationCount][
                _beneficiary
            ] += _weiAmount;
            vault.updateRefundableBalances(_beneficiary, _weiAmount);
            currentRefundableWei += _weiAmount;
        } else nonRefundableBalances[_beneficiary] += _weiAmount;
    }

    function _updatePurchasingState() internal override {
        if (address(this).balance >= buyNowPriceInWei + interest) {
            address payable marketWrapperAddress = payable(
                address(marketWrapper)
            );
            (bool success, ) = marketWrapperAddress.call{
                value: buyNowPriceInWei
            }("");

            require(success, "Transfer failed.");

            bool purchase = marketWrapper.buyNow();

            require(purchase, "Purchase  failed.");

            currentRefundableWei = 0;
            vault.close();
            state = State.Purchased;
        }
    }
}
