#!/bin/bash

echo $(npx hardhat verify --network $1 --constructor-args contract-testnet-args.js $2)