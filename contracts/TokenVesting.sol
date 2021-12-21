// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract TokenVesting {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    address public owner;

    IERC20 public token;

    uint256 public startTime;
    uint256 public constant DURATION = 86400 * 365;

    address public immutable receiver;

    uint256 public total;
    uint256 public vested;

    constructor(
        IERC20 _token,
        address _receiver
    ) {
        token = _token;
        receiver = _receiver;
        owner = msg.sender;
    }

    function vestable() external view returns (uint256) {
        if (startTime == 0) return 0;
        uint256 elapsedTime = block.timestamp.sub(startTime);
        if (elapsedTime > DURATION) elapsedTime = DURATION;
        uint256 _vestable = total.mul(elapsedTime).div(DURATION);
        return _vestable.sub(vested);
    }

    function start(uint256 _total) external {
        require(msg.sender == owner, "must be owner");
        require(startTime == 0, "startTime must be 0");
        require(token.balanceOf(address(this)) == _total, "token balance must eq _total");
        total = _total;
        startTime = block.timestamp;
    }

    function vest() external {
        require(msg.sender == receiver, "caller must be receiver");
        require(startTime != 0, "startTime must not be 0");
        uint256 elapsedTime = block.timestamp.sub(startTime);
        if (elapsedTime > DURATION) elapsedTime = DURATION;
        uint256 _vestable = total.mul(elapsedTime).div(DURATION);
        if (_vestable > vested) {
            uint256 amount = _vestable.sub(vested);
            token.safeTransfer(receiver, amount);
            vested = _vestable;
        }
    }

    function withdraw() external {
        require(msg.sender == owner, "must be owner");
        require(startTime == 0, "startTime must be 0");
        uint256 balance = token.balanceOf(address(this));
        token.safeTransfer(owner, balance);
    }
}