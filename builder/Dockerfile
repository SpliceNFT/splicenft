FROM node:16-buster

RUN mkdir -p /root/.cache/hardhat-nodejs/compilers/linux-amd64 \ 
  &&  wget -O /root/.cache/hardhat-nodejs/compilers/linux-amd64/solc-linux-amd64-v0.8.9+commit.e5eed63a https://binaries.soliditylang.org/linux-amd64/solc-linux-amd64-v0.8.9+commit.e5eed63a 

RUN npm i -g pnpm