// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

async function main() {
  // eslint-disable-next-line no-unused-vars
  const ownerAcc = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";

  const receiver1 = "0x70997970c51812dc3a010c7d01b50e0d17dc79c8";
  const receiver2 = "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc";

  const testTokenAddr = "0xf5059a5D33d5853360D16C683c16e67980206f36";
  const TestToken = await ethers.getContractFactory("TestToken");
  const testToken = await TestToken.attach(testTokenAddr);

  const tokenVestingAddr = "0x95401dc811bb5740090279Ba06cfA8fcF6113778";
  const TokenVesting = await ethers.getContractFactory("TokenLocking");
  const tokenVesting = await TokenVesting.attach(tokenVestingAddr);

  const recSigner = await ethers.provider.getSigner(receiver1);
  const tx = await tokenVesting.connect(recSigner).withdrawLocked();

  tx.wait(1);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
