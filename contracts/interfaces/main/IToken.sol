// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IToken {
    function mint(address account, uint256 amount) external;

    function grantOwnerRole(address _to) external;

    function setCollectionOwner(address _collectionOwner) external;

    function migration(uint256 _tokenId, string memory _fractionalUri) external;
}
