FROM node:16-buster

RUN mkdir -p /root/.cache/hardhat-nodejs/compilers/linux-amd64 \ 
  &&  wget -O /root/.cache/hardhat-nodejs/compilers/linux-amd64/solc-linux-amd64-v0.8.7+commit.e28d00a7 https://binaries.soliditylang.org/linux-amd64/solc-linux-amd64-v0.8.7+commit.e28d00a7 

RUN npm i -g pnpm