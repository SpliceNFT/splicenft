reads NFT data from covalent, stores them in ./data/<contract>/tokenId

get a covalent api key first: https://www.covalenthq.com/platform/#/auth/register

`cp .env.sample .env`

add the key to the env file

`pnpm install`

invoke

`pnpx ts-node index.ts <contract> <tokenId>`

or

`pnpm run nft fetch <contract> <tokenId>`

e.g.

'pnpm run nft fetch 0x1a92f7381b9f03921564a437210bb9396471050c 3975`

-> results go to the ./data folder that's gitignored
