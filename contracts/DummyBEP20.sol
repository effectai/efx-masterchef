// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "@pancakeswap/pancake-swap-lib/contracts/token/BEP20/BEP20.sol";

contract DummyBEP20 is BEP20 {
    constructor() public BEP20('Dummy Token', 'DUM') {
        _mint(msg.sender, 1000000000 * (10 ** uint256(18)));
    }
}
