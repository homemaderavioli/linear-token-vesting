import { ethers } from "hardhat";

async function main() {
  const tokenAddr = "";

  const totalSupply = ethers.utils.parseEther("100000000000");
  const contractSupply = totalSupply.mul(0.3);
  console.log("Contract supply: ", contractSupply.mul(0.3));
  const receiverAmount = totalSupply.mul(0.1);
  console.log("Receiver amount: ", receiverAmount);

  // const ownerAcc = "0xD8Ec4e985606d7964D7c02c7ac028358bFcC81F8";
  const receiver1 = "";
  const receiver2 = "";
  const receiver3 = "";

  const receiver1Amount = receiverAmount;
  const receiver2Amount = receiverAmount;
  const receiver3Amount = receiverAmount;

  const duration1 = 86400 * 365 * 2;
  const duration2 = 86400 * 365 * 2;
  const duration3 = 86400 * 365 * 3;

  const TokenLocking = await ethers.getContractFactory("TokenLocking");
  const locking = await TokenLocking.deploy(
    tokenAddr,
    contractSupply,
    [receiver1, receiver2, receiver3],
    [receiver1Amount, receiver2Amount, receiver3Amount],
    [duration1, duration2, duration3]
  );

  console.log("Token Address: ", tokenAddr);
  console.log("Contract supply: ", contractSupply);
  console.log("Receivers: ", [receiver1, receiver2, receiver3]);
  console.log("Receivers Amounts: ", [
    receiver1Amount.toString(),
    receiver2Amount.toString(),
    receiver3Amount.toString(),
  ]);
  console.log("Receivers Durations: ", [
    duration1.toString(),
    duration2.toString(),
    duration3.toString(),
  ]);

  await locking.deployed();
  console.log("Locking deployed to:", locking.address);

  // const unlockable = await locking.maxUnlockableTokens();
  // console.log("maxUnlockableTokens: ", unlockable);

  // const unlocked = await locking.unlockedTokens();
  // console.log("unlocked: ", unlocked);

  // const lock1 = await locking.locks(receiver1);
  // console.log("lock1: ", lock1);

  // const lock2 = await locking.locks(receiver2);
  // console.log("lock2: ", lock2);

  // await testor.transfer(locking.address, testSupply.div(2));

  // const lockingBalance = await testor.balanceOf(locking.address);
  // console.log(`Locking balance ${lockingBalance}`);

  // await locking.start();
  // const startTime = await locking.startTime();
  // console.log(`Locking start time: ${startTime}`);

  // const unlockTime1 = await locking.unlockTime(receiver1);
  // console.log(`unlockTime for receiver1: ${unlockTime1}`);

  // const unlockTime2 = await locking.unlockTime(receiver2);
  // console.log(`unlockTime for receiver2: ${unlockTime2}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
