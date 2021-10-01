serverless functions, deployed on vercel.

```bash
pnpx vercel dev
```

-> runs an api server on your local machine (:3000)

adds CORS headers to all responses using vercels native CORS setup https://vercel.com/support/articles/how-to-enable-cors

access functions in /api like http://localhost:3000/api/<function>

checkout https://vercel.com/docs/runtimes#official-runtimes/node-js/node-js-request-and-response-objects for more docs
