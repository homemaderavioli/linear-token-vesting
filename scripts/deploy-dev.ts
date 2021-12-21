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

  const testSupply = 100000000000000000000;

  const accounts = await ethers.getSigners();

  const ownerAcc = accounts[0];
  const receiverAcc = accounts[1];

  // We get the contract to deploy
  const TestBFTToken = await ethers.getContractFactory("TestBFT");
  const testor = await TestBFTToken.deploy(testSupply);

  await testor.deployed();

  console.log("Testor Token deployed to:", testor.address);

  // await testor.transfer(acc1, 50000);

  // console.log(`Send ${acc1} 50000 ${await testor.symbol()}`);

  const token = testor.address;

  // We get the contract to deploy
  const TokenVesting = await ethers.getContractFactory("TokenVesting");
  const vestor = await TokenVesting.deploy(token, receiverAcc.address);

  await vestor.deployed();

  console.log("Vestor deployed to:", vestor.address);

  await testor.transfer(vestor.address, testSupply / 2);

  const ownerBalance = await testor.balanceOf(ownerAcc.address);
  console.log(`Owner balance ${ownerBalance}`);
  const vestorBalance = await testor.balanceOf(vestor.address);
  console.log(`Vestor balance ${vestorBalance}`);

  await vestor.start(testSupply / 2);
  const startTime = await vestor.startTime();
  console.log(`Vestor start time: ${startTime}`);

  const vestable = await vestor.vestable();
  console.log(`Vestable amount: ${vestable}`);

  await vestor.connect(receiverAcc).vestable();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
