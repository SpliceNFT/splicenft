# demo app

note about using this in a Nextjs context.

You *could* ask wasm-pack to target nodejs or web  but then you'd have to initialize the wasm module yourself. I've built this for the (default) bundler context however, so it "just works" when being consumed inside a Nextjs context application. You'll likely have to adjust your Next app's webpack config to support wasm loading, too (see next.config.js):

```ts
const nextConfig = {
  //...
  webpack: (config) => {
    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
    };
    return config;
  },
}
```