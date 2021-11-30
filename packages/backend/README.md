# SPLICE Backend

## Generic Proxy
comes with two services. First, it can deploy a very simple serverless proxy function on vercel. You can start it with

```bash
pnpx vercel dev
```

it'll run an api server on your local machine (:3000) and add CORS headers to all responses using vercels [native CORS setup](https://vercel.com/support/articles/how-to-enable-cors). This is used by the frontend to request remote resources (particularly NFT images) from non-CORS enables origins (set its URL to the `dapp`'s .env `REACT_APP_CORS_PROXY`)

checkout https://vercel.com/docs/runtimes#official-runtimes/node-js/node-js-request-and-response-objects for more docs

## Backend server

```bash
pnpm run compile
pnpm run start
```

needs an Infura key to connect to an Ethereum JSON RPC API. Upon startup the backend service reads all Splice style NFTs and caches their metadata and code per chain locally. The backend deals as metadata service for Splice NFTs as long as their metadata is not frozen into IPFS (which is an option in our Style NFT contract).

It can be requested to serve an existing Splice's artwork, thereby downloading its origin NFT, extracting its colors and metadata and rendering the selected style on the server side.
