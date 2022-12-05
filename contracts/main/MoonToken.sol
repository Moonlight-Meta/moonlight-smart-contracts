// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../abstracts/main/AToken.sol";

contract MoonToken is AToken {
    string public fractionalUri;
    string public adminUri;
    uint256 public tokenId;

    constructor(
        address _collectionOwner,
        string memory _fractionalUri,
        string memory _adminUri,
        uint256 _tokenId
    ) AToken() {
        fractionalUri = _fractionalUri;
        adminUri = _adminUri;
        tokenId = _tokenId;
        _transferOwnership(_collectionOwner);
        _mint(_collectionOwner, 0, 1, "");
    }

    function mint(
        address _account,
        uint256 _amount
    ) public override onlyRole(DEFAULT_ADMIN_ROLE) {
        _mint(_account, tokenId, _amount, "");
    }

    function setCollectionOwner(
        address _collectionOwner
    ) public override onlyRole(DEFAULT_ADMIN_ROLE) {
        _transferOwnership(_collectionOwner);
    }

    function migration(
        uint256 _tokenId,
        string memory _fractionalUri
    ) public override onlyRole(DEFAULT_ADMIN_ROLE) {
        tokenId = _tokenId;
        fractionalUri = _fractionalUri;
    }

    // The following functions are overrides required by OpenSea.

    function uri(
        uint256 _tokenid
    ) public view override returns (string memory) {
        if (_tokenid == 0) {
            return adminUri;
        }
        return fractionalUri;
    }
}
