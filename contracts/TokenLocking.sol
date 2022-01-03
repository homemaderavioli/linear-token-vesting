// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract TokenLocking {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    address public owner;
    IERC20 public token;
    uint256 public startTime;
    uint256 public immutable maxUnlockableTokens;
    uint256 public unlockedTokens;

    struct Lock {
        uint256 total;
        uint256 duration;
    }

    mapping(address => Lock) public locks;

    constructor(
        IERC20 _token,
        uint256 _maxUnlockable,
        address[] memory _receivers,
        uint256[] memory _amounts,
        uint256[] memory _durations
    ) {
        require(_receivers.length == _amounts.length, "_receivers len == _amounts len");
        require(_receivers.length == _durations.length, "_receivers len == _durations len");
        token = _token;
        uint256 unlockable;
        for (uint256 i = 0; i < _receivers.length; i++) {
            require(locks[_receivers[i]].total == 0, "total must be 0");
            require(locks[_receivers[i]].duration == 0, "duration must be 0");
            unlockable = unlockable.add(_amounts[i]);
            locks[_receivers[i]].total = _amounts[i];
            locks[_receivers[i]].duration = _durations[i];
        }
        require(unlockable == _maxUnlockable, "total == _unlockable");
        maxUnlockableTokens = _maxUnlockable;
        owner = msg.sender;
    }

    function unlockTime(address _receiver) external view returns (uint256) {
        if (startTime == 0) return 0;
        Lock storage _locks = locks[_receiver];
        if (_locks.duration == 0) return 0;
        return startTime.add(_locks.duration);
    }

    function withdrawBeforeStart() external {
        require(msg.sender == owner, "must be owner");
        require(startTime == 0, "startTime must be 0");
        uint256 balance = token.balanceOf(address(this));
        token.safeTransfer(owner, balance);
    }

    function start() external {
        require(msg.sender == owner, "must be owner");
        require(startTime == 0, "startTime must be 0");
        require(token.balanceOf(address(this)) == maxUnlockableTokens, "balance == maxUnlockableTokens");
        startTime = block.timestamp;
    }

    function withdrawLocked() external {
        require(startTime != 0, "startTime must not be 0");
        Lock storage _locks = locks[msg.sender];
        require(_locks.duration != 0, "lock duration must not be 0");
        require(startTime.add(_locks.duration) < block.timestamp, "lock duration has not ended");
        uint256 amount = _locks.total;
        delete locks[msg.sender];
        unlockedTokens = unlockedTokens.add(amount);
        token.safeTransfer(msg.sender, amount);
    }
}