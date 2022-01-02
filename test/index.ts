import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { TestToken, TokenLocking } from "../typechain";

describe("TokenLocking", function () {
  const testSupply = ethers.utils.parseEther("1000000000000000");

  const receiver1Amount = testSupply.div(4);
  const receiver2Amount = testSupply.div(4);

  const duration1 = 86400 * 365;
  const duration2 = 86400 * 365 * 2;

  let testToken: TestToken;
  let owner: SignerWithAddress;
  let receiver1: SignerWithAddress;
  let receiver2: SignerWithAddress;
  let randomUser: SignerWithAddress;

  beforeEach(async function () {
    [owner, receiver1, receiver2, randomUser] = await ethers.getSigners();
  });

  describe("Deployment", function () {
    beforeEach(async function () {
      const TestBFTToken = await ethers.getContractFactory("TestToken");
      testToken = await TestBFTToken.deploy(testSupply._hex);
      await testToken.deployed();
    });

    it("Test deploying sets owner to deployer", async function () {
      const TokenLocking = await ethers.getContractFactory("TokenLocking");
      const locking = await TokenLocking.deploy(
        testToken.address,
        receiver1Amount,
        [receiver1.address],
        [receiver1Amount],
        [duration1]
      );
      await locking.deployed();

      expect(await locking.owner()).to.equal(owner.address);
    });

    it("Test deploying with single lock", async function () {
      const TokenLocking = await ethers.getContractFactory("TokenLocking");
      const locking = await TokenLocking.deploy(
        testToken.address,
        receiver1Amount,
        [receiver1.address],
        [receiver1Amount],
        [duration1]
      );
      await locking.deployed();

      const locks1 = await locking.locks(receiver1.address);
      expect(locks1.total).to.equal(receiver1Amount);
      expect(locks1.duration).to.equal(duration1);

      expect(await locking.maxUnlockableTokens()).to.equal(receiver1Amount);
    });

    it("Test deploying with multi lock", async function () {
      const TokenLocking = await ethers.getContractFactory("TokenLocking");
      const locking = await TokenLocking.deploy(
        testToken.address,
        testSupply.div(2),
        [receiver1.address, receiver2.address],
        [receiver1Amount, receiver2Amount],
        [duration1, duration2]
      );
      await locking.deployed();

      const locks1 = await locking.locks(receiver1.address);
      expect(locks1.total).to.equal(receiver1Amount);
      expect(locks1.duration).to.equal(duration1);

      const locks2 = await locking.locks(receiver2.address);
      expect(locks2.total).to.equal(receiver2Amount);
      expect(locks2.duration).to.equal(duration2);

      expect(await locking.maxUnlockableTokens()).to.equal(testSupply.div(2));
    });

    it("Test deploying with lock 3 year duration", async function () {
      const threeYears = duration1 * 3;
      const TokenLocking = await ethers.getContractFactory("TokenLocking");
      const locking = await TokenLocking.deploy(
        testToken.address,
        receiver1Amount,
        [receiver1.address],
        [receiver1Amount],
        [threeYears]
      );
      await locking.deployed();

      const locks1 = await locking.locks(receiver1.address);
      expect(locks1.duration).to.equal(threeYears);
    });

    it("Test deploying with invalid receiver array", async function () {
      const TokenLocking = await ethers.getContractFactory("TokenLocking");
      const deploy = TokenLocking.deploy(
        testToken.address,
        testSupply.div(2),
        [receiver1.address],
        [receiver1Amount, receiver2Amount],
        [duration1, duration2]
      );
      await expect(deploy).to.revertedWith(
        "VM Exception while processing transaction: reverted with reason string '_receivers len == _amounts len'"
      );
    });

    it("Test deploying with invalid amounts array", async function () {
      const TokenLocking = await ethers.getContractFactory("TokenLocking");
      const deploy = TokenLocking.deploy(
        testToken.address,
        testSupply.div(2),
        [receiver1.address, receiver2.address],
        [receiver1Amount],
        [duration1, duration2]
      );
      await expect(deploy).to.revertedWith(
        "VM Exception while processing transaction: reverted with reason string '_receivers len == _amounts len'"
      );
    });

    it("Test deploying with invalid durations array", async function () {
      const TokenLocking = await ethers.getContractFactory("TokenLocking");
      const deploy = TokenLocking.deploy(
        testToken.address,
        testSupply.div(2),
        [receiver1.address, receiver2.address],
        [receiver1Amount, receiver2Amount],
        [duration1]
      );
      await expect(deploy).to.revertedWith(
        "VM Exception while processing transaction: reverted with reason string '_receivers len == _durations len'"
      );
    });

    it("Test deploying with incorrect receiver amounts", async function () {
      const TokenLocking = await ethers.getContractFactory("TokenLocking");
      const deploy = TokenLocking.deploy(
        testToken.address,
        testSupply.div(2),
        [receiver1.address, receiver2.address],
        [receiver1Amount, testSupply.div(2).sub(1)],
        [duration1, duration2]
      );
      await expect(deploy).to.revertedWith(
        "VM Exception while processing transaction: reverted with reason string 'total == _unlockable'"
      );
    });

    it("Test deploying with incorrect maxUnlockable", async function () {
      const TokenLocking = await ethers.getContractFactory("TokenLocking");
      const deploy = TokenLocking.deploy(
        testToken.address,
        testSupply.div(2).add(1),
        [receiver1.address, receiver2.address],
        [receiver1Amount, receiver2Amount],
        [duration1, duration2]
      );
      await expect(deploy).to.revertedWith(
        "VM Exception while processing transaction: reverted with reason string 'total == _unlockable'"
      );
    });

    it("Test deploying with incorrect maxUnlockable", async function () {
      const TokenLocking = await ethers.getContractFactory("TokenLocking");
      const deploy = TokenLocking.deploy(
        testToken.address,
        testSupply.div(2).sub(1),
        [receiver1.address, receiver2.address],
        [receiver1Amount, receiver2Amount],
        [duration1, duration2]
      );
      await expect(deploy).to.revertedWith(
        "VM Exception while processing transaction: reverted with reason string 'total == _unlockable'"
      );
    });

    it("Test deploying with incorrect duration1", async function () {
      const TokenLocking = await ethers.getContractFactory("TokenLocking");
      const deploy = TokenLocking.deploy(
        testToken.address,
        testSupply.div(2),
        [receiver1.address, receiver2.address],
        [receiver1Amount, receiver2Amount],
        [duration1 - 1, duration2]
      );
      await expect(deploy).to.revertedWith(
        "VM Exception while processing transaction: reverted with reason string 'duration must be 1, 2 or 3 years'"
      );
    });
  });

  describe("Start() without balance", function () {
    let locking: TokenLocking;

    beforeEach(async function () {
      const TestBFTToken = await ethers.getContractFactory("TestToken");
      testToken = await TestBFTToken.deploy(testSupply._hex);
      await testToken.deployed();
      const TokenLocking = await ethers.getContractFactory("TokenLocking");
      locking = await TokenLocking.deploy(
        testToken.address,
        testSupply.div(2),
        [receiver1.address, receiver2.address],
        [receiver1Amount, receiver2Amount],
        [duration1, duration2]
      );
      await locking.deployed();
    });

    it("Test start()", async function () {
      const start = locking.start();
      await expect(start).to.revertedWith(
        "VM Exception while processing transaction: reverted with reason string 'balance == maxUnlockableTokens'"
      );
    });
  });

  describe("Start()", function () {
    let locking: TokenLocking;

    beforeEach(async function () {
      const TestBFTToken = await ethers.getContractFactory("TestToken");
      testToken = await TestBFTToken.deploy(testSupply._hex);
      await testToken.deployed();
      const TokenLocking = await ethers.getContractFactory("TokenLocking");
      locking = await TokenLocking.deploy(
        testToken.address,
        testSupply.div(2),
        [receiver1.address, receiver2.address],
        [receiver1Amount, receiver2Amount],
        [duration1, duration2]
      );
      await locking.deployed();

      const txferTokensTX = await testToken.transfer(
        locking.address,
        testSupply.div(2)
      );
      await txferTokensTX.wait();

      expect(await testToken.balanceOf(locking.address)).to.equal(
        testSupply.div(2)
      );
    });

    it("Test start() as owner", async function () {
      await locking.start();
      const block = await ethers.provider.getBlock("latest");
      expect(await locking.startTime()).to.equal(block.timestamp);
    });

    it("Test start() as random user", async function () {
      const start = locking.connect(randomUser).start();
      await expect(start).to.revertedWith(
        "VM Exception while processing transaction: reverted with reason string 'must be owner'"
      );
    });

    it("Test start() as receiver1", async function () {
      const start = locking.connect(receiver1).start();
      await expect(start).to.revertedWith(
        "VM Exception while processing transaction: reverted with reason string 'must be owner'"
      );
    });

    it("Test start() called twice", async function () {
      await locking.start();
      const start = locking.start();
      await expect(start).to.revertedWith(
        "VM Exception while processing transaction: reverted with reason string 'startTime must be 0'"
      );
    });
  });

  describe("StartTime()", function () {
    let locking: TokenLocking;

    beforeEach(async function () {
      const TestBFTToken = await ethers.getContractFactory("TestToken");
      testToken = await TestBFTToken.deploy(testSupply._hex);
      await testToken.deployed();
      const TokenLocking = await ethers.getContractFactory("TokenLocking");
      locking = await TokenLocking.deploy(
        testToken.address,
        testSupply.div(2),
        [receiver1.address, receiver2.address],
        [receiver1Amount, receiver2Amount],
        [duration1, duration2]
      );
      await locking.deployed();

      const txferTokensTX = await testToken.transfer(
        locking.address,
        testSupply.div(2)
      );
      await txferTokensTX.wait();

      expect(await testToken.balanceOf(locking.address)).to.equal(
        testSupply.div(2)
      );
    });

    it("Test startTime() is 0 before start()", async function () {
      expect(await locking.startTime()).to.equal(0);
    });

    it("Test startTime() is latest block timestamp after start()", async function () {
      await locking.start();
      const block = await ethers.provider.getBlock("latest");
      expect(await locking.startTime()).to.equal(block.timestamp);
    });
  });

  describe("WithdrawBeforeStart()", function () {
    let locking: TokenLocking;

    beforeEach(async function () {
      const TestBFTToken = await ethers.getContractFactory("TestToken");
      testToken = await TestBFTToken.deploy(testSupply._hex);
      await testToken.deployed();
      const TokenLocking = await ethers.getContractFactory("TokenLocking");
      locking = await TokenLocking.deploy(
        testToken.address,
        testSupply.div(2),
        [receiver1.address, receiver2.address],
        [receiver1Amount, receiver2Amount],
        [duration1, duration2]
      );
      await locking.deployed();

      const txferTokensTX = await testToken.transfer(
        locking.address,
        testSupply.div(2)
      );
      await txferTokensTX.wait();

      expect(await testToken.balanceOf(locking.address)).to.equal(
        testSupply.div(2)
      );
    });

    it("Test withdrawBeforeStart() before start() as owner", async function () {
      await locking.withdrawBeforeStart();
      expect(await testToken.balanceOf(locking.address)).to.equal(0);
    });

    it("Test withdrawBeforeStart() before start() as random user", async function () {
      const withdrawBeforeStart = locking
        .connect(randomUser)
        .withdrawBeforeStart();
      await expect(withdrawBeforeStart).to.revertedWith(
        "VM Exception while processing transaction: reverted with reason string 'must be owner'"
      );
    });

    it("Test withdrawBeforeStart() before start() as receiver1", async function () {
      const withdrawBeforeStart = locking
        .connect(receiver1)
        .withdrawBeforeStart();
      await expect(withdrawBeforeStart).to.revertedWith(
        "VM Exception while processing transaction: reverted with reason string 'must be owner'"
      );
    });

    it("Test withdrawBeforeStart() after start() as owner", async function () {
      await locking.start();
      const withdrawBeforeStart = locking.withdrawBeforeStart();
      await expect(withdrawBeforeStart).to.revertedWith(
        "VM Exception while processing transaction: reverted with reason string 'startTime must be 0'"
      );
    });

    it("Test withdrawBeforeStart() after start() as random user", async function () {
      await locking.start();
      const withdrawBeforeStart = locking
        .connect(randomUser)
        .withdrawBeforeStart();
      await expect(withdrawBeforeStart).to.revertedWith(
        "VM Exception while processing transaction: reverted with reason string 'must be owner'"
      );
    });

    it("Test withdrawBeforeStart() after start() as receiver1", async function () {
      await locking.start();
      const withdrawBeforeStart = locking
        .connect(receiver1)
        .withdrawBeforeStart();
      await expect(withdrawBeforeStart).to.revertedWith(
        "VM Exception while processing transaction: reverted with reason string 'must be owner'"
      );
    });
  });

  describe("WithdrawLocked() user handling", function () {
    let locking: TokenLocking;

    beforeEach(async function () {
      const TestBFTToken = await ethers.getContractFactory("TestToken");
      testToken = await TestBFTToken.deploy(testSupply._hex);
      await testToken.deployed();
      const TokenLocking = await ethers.getContractFactory("TokenLocking");
      locking = await TokenLocking.deploy(
        testToken.address,
        testSupply.div(2),
        [receiver1.address, receiver2.address],
        [receiver1Amount, receiver2Amount],
        [duration1, duration2]
      );
      await locking.deployed();

      const txferTokensTX = await testToken.transfer(
        locking.address,
        testSupply.div(2)
      );
      await txferTokensTX.wait();

      expect(await testToken.balanceOf(locking.address)).to.equal(
        testSupply.div(2)
      );
    });

    it("Test withdrawLocked() before start() as owner", async function () {
      const withdrawLocked = locking.withdrawLocked();
      await expect(withdrawLocked).to.revertedWith(
        "VM Exception while processing transaction: reverted with reason string 'startTime must not be 0'"
      );
    });

    it("Test withdrawLocked() before start() as receiver1", async function () {
      const withdrawLocked = locking.connect(receiver1).withdrawLocked();
      await expect(withdrawLocked).to.revertedWith(
        "VM Exception while processing transaction: reverted with reason string 'startTime must not be 0'"
      );
    });

    it("Test withdrawLocked() before start() as random user", async function () {
      const withdrawLocked = locking.connect(randomUser).withdrawLocked();
      await expect(withdrawLocked).to.revertedWith(
        "VM Exception while processing transaction: reverted with reason string 'startTime must not be 0'"
      );
    });

    it("Test withdrawLocked() after start() as owner", async function () {
      await locking.start();
      const withdrawLocked = locking.withdrawLocked();
      await expect(withdrawLocked).to.revertedWith(
        "VM Exception while processing transaction: reverted with reason string 'lock duration must not be 0'"
      );
    });

    it("Test withdrawLocked() after start() as receiver1", async function () {
      await locking.start();
      const withdrawLocked = locking.connect(receiver1).withdrawLocked();
      await expect(withdrawLocked).to.revertedWith(
        "VM Exception while processing transaction: reverted with reason string 'lock duration has not ended'"
      );
    });

    it("Test withdrawLocked() after start() as random user", async function () {
      await locking.start();
      const withdrawLocked = locking.connect(randomUser).withdrawLocked();
      await expect(withdrawLocked).to.revertedWith(
        "VM Exception while processing transaction: reverted with reason string 'lock duration must not be 0'"
      );
    });
  });

  describe("WithdrawLocked() duration handling", function () {
    let locking: TokenLocking;

    beforeEach(async function () {
      const TestBFTToken = await ethers.getContractFactory("TestToken");
      testToken = await TestBFTToken.deploy(testSupply._hex);
      await testToken.deployed();
      const TokenLocking = await ethers.getContractFactory("TokenLocking");
      locking = await TokenLocking.deploy(
        testToken.address,
        testSupply.div(2),
        [receiver1.address, receiver2.address],
        [receiver1Amount, receiver2Amount],
        [duration1, duration2]
      );
      await locking.deployed();

      const txferTokensTX = await testToken.transfer(
        locking.address,
        testSupply.div(2)
      );
      await txferTokensTX.wait();

      expect(await testToken.balanceOf(locking.address)).to.equal(
        testSupply.div(2)
      );
    });

    it("Test withdrawLocked() after lock duration1 as owner", async function () {
      await locking.start();
      const block = await ethers.provider.getBlock("latest");
      await ethers.provider.send("evm_setNextBlockTimestamp", [
        block.timestamp + duration1 + 1,
      ]);
      const withdrawLocked = locking.withdrawLocked();
      await expect(withdrawLocked).to.revertedWith(
        "VM Exception while processing transaction: reverted with reason string 'lock duration must not be 0'"
      );
    });

    it("Test withdrawLocked() after lock duration1 as random user", async function () {
      await locking.start();
      const block = await ethers.provider.getBlock("latest");
      await ethers.provider.send("evm_setNextBlockTimestamp", [
        block.timestamp + duration1 + 1,
      ]);
      const withdrawLocked = locking.connect(randomUser).withdrawLocked();
      await expect(withdrawLocked).to.revertedWith(
        "VM Exception while processing transaction: reverted with reason string 'lock duration must not be 0'"
      );
    });

    it("Test withdrawLocked() after lock duration1 as receiver1", async function () {
      await locking.start();
      const block = await ethers.provider.getBlock("latest");
      await ethers.provider.send("evm_setNextBlockTimestamp", [
        block.timestamp + duration1 + 1,
      ]);
      await locking.connect(receiver1).withdrawLocked();

      const locks1 = await locking.locks(receiver1.address);
      expect(locks1.total).to.equal(0);
      expect(locks1.duration).to.equal(0);
    });

    it("Test withdrawLocked() after lock duration1 as receiver2", async function () {
      await locking.start();
      const block = await ethers.provider.getBlock("latest");
      await ethers.provider.send("evm_setNextBlockTimestamp", [
        block.timestamp + duration1 + 1,
      ]);
      const withdrawLocked = locking.connect(receiver2).withdrawLocked();
      await expect(withdrawLocked).to.revertedWith(
        "VM Exception while processing transaction: reverted with reason string 'lock duration has not ended'"
      );
    });

    it("Test withdrawLocked() on exactly lock duration2 as receiver2", async function () {
      await locking.start();
      const block = await ethers.provider.getBlock("latest");
      await ethers.provider.send("evm_setNextBlockTimestamp", [
        block.timestamp + duration2,
      ]);
      const withdrawLocked = locking.connect(receiver2).withdrawLocked();
      await expect(withdrawLocked).to.revertedWith(
        "VM Exception while processing transaction: reverted with reason string 'lock duration has not ended'"
      );
    });

    it("Test withdrawLocked() called twice as receiver1", async function () {
      await locking.start();
      const block = await ethers.provider.getBlock("latest");
      await ethers.provider.send("evm_setNextBlockTimestamp", [
        block.timestamp + duration1 + 1,
      ]);
      await locking.connect(receiver1).withdrawLocked();
      const withdrawLocked = locking.connect(receiver1).withdrawLocked();
      await expect(withdrawLocked).to.revertedWith(
        "VM Exception while processing transaction: reverted with reason string 'lock duration must not be 0'"
      );
    });

    it("Test withdrawLocked() reduces token balance of contract by receiver1 locks() total", async function () {
      await locking.start();
      const block = await ethers.provider.getBlock("latest");
      await ethers.provider.send("evm_setNextBlockTimestamp", [
        block.timestamp + duration1 + 1,
      ]);
      const locks1 = await locking.locks(receiver1.address);

      await locking.connect(receiver1).withdrawLocked();

      expect(await testToken.balanceOf(locking.address)).to.equal(locks1.total);
    });

    it("Test withdrawLocked() receiver1 receives correct amount of tokens", async function () {
      await locking.start();
      const block = await ethers.provider.getBlock("latest");
      await ethers.provider.send("evm_setNextBlockTimestamp", [
        block.timestamp + duration1 + 1,
      ]);
      const locks1 = await locking.locks(receiver1.address);

      await locking.connect(receiver1).withdrawLocked();

      expect(await testToken.balanceOf(receiver1.address)).to.equal(
        locks1.total
      );
    });
  });
});
