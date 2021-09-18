(async () => {
  await (async () => {
    const SampleNFT = await ethers.getContractFactory("SampleNFT");
    const sampleNft1 = await SampleNFT.deploy(
      "SampleNFT 1",
      "SFT1",
      "https://sample.token.one/"
    );
    const sampleNft2 = await SampleNFT.deploy(
      "SampleNFT 2",
      "SFT2",
      "https://two.token.sample/"
    );

    console.log(
      "Deployed two sample contracts:",
      sampleNft1.address,
      sampleNft2.address
    );
  })();
})();
