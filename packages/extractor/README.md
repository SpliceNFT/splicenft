# Extractor

built using TS / ESM: https://2ality.com/2021/06/typescript-esm-nodejs.html

reads NFT data from covalent or chain, stores them in ./data/<contract>/tokenId

(if youd like to try with covalent, get a covalent api key first: https://www.covalenthq.com/platform/#/auth/register)

using _real_ chain data, get an Infura key first: https://infura.io/

`cp .env.sample .env`

add the key to the env file

`pnpm install`

build
`pnpm run build`

dev / watch tsc
`pnpm run dev`

invoke

`node dist/index.js -s chain <contract> <tokenId>`

or

`pnpm run nft -- fetch -s chain <contract> <tokenId>`

e.g.

'pnpm run nft -- fetch -s chain 0x1a92f7381b9f03921564a437210bb9396471050c 3975`

-> results go to the ./data folder that's gitignored
