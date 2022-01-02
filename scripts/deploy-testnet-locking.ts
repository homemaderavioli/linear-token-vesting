// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  const testSupply = ethers.utils.parseEther("1000000000000000");

  // const ownerAcc = "0xD8Ec4e985606d7964D7c02c7ac028358bFcC81F8";
  const receiver1 = "0x6428f761Ee1532a7b6CB451B9B6979B60670a719";
  const receiver2 = "0x38B27a71e11C4968575c02e241838e8096461d00";

  const receiver1Amount = testSupply.div(4);
  const receiver2Amount = testSupply.div(4);

  const duration1 = 86400 * 365;
  const duration2 = 86400 * 365 * 2;

  // We get the contract to deploy
  const TestBFTToken = await ethers.getContractFactory("TestToken");
  const testor = await TestBFTToken.deploy(testSupply._hex);

  await testor.deployed();

  console.log("Testor Token deployed to:", testor.address);

  // We get the contract to deploy
  const TokenLocking = await ethers.getContractFactory("TokenLocking");
  const locking = await TokenLocking.deploy(
    testor.address,
    testSupply.div(2),
    [receiver1, receiver2],
    [receiver1Amount, receiver2Amount],
    [duration1, duration2]
  );
  console.log([receiver1Amount.toString(), receiver2Amount.toString()]);
  console.log([duration1.toString(), duration2.toString()]);

  await locking.deployed();
  console.log("Locking deployed to:", locking.address);

  const unlockable = await locking.maxUnlockableTokens();
  console.log("maxUnlockableTokens: ", unlockable);

  const unlocked = await locking.unlockedTokens();
  console.log("unlocked: ", unlocked);

  const lock1 = await locking.locks(receiver1);
  console.log("lock1: ", lock1);

  const lock2 = await locking.locks(receiver2);
  console.log("lock2: ", lock2);

  await testor.transfer(locking.address, testSupply.div(2));

  const lockingBalance = await testor.balanceOf(locking.address);
  console.log(`Locking balance ${lockingBalance}`);

  await locking.start();
  const startTime = await locking.startTime();
  console.log(`Locking start time: ${startTime}`);

  const unlockTime1 = await locking.unlockTime(receiver1);
  console.log(`unlockTime for receiver1: ${unlockTime1}`);

  const unlockTime2 = await locking.unlockTime(receiver2);
  console.log(`unlockTime for receiver2: ${unlockTime2}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
