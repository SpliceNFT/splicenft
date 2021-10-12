require('dotenv-flow').config();
const axios = require('axios');

const METADATA_URI = `https://api.covalenthq.com/v1/{chain}/tokens/{collection}/nft_metadata/{token_id}`;
const USER_ASSETS_URI = `https://api.covalenthq.com/v1/{chain}/address/{address}/balances_v2/?nft=true`;
const COVALENT_AUTH = process.env.COVALENT_AUTH;

module.exports = async (req, res) => {
  const chain = req.query['chain'];
  const address = req.query['address'];

  let url = USER_ASSETS_URI.replace('{chain}', chain);
  url = url.replace('{address}', address);

  const { data: response } = await axios.get(url, {
    responseType: 'json',
    auth: {
      username: COVALENT_AUTH,
      password: ''
    }
  });

  const nftItems = response.data.items
    .map((item) => {
      if (item['type'] !== 'nft') {
        console.debug('no nft');
        return null;
      }

      if (!item['nft_data'] || item['nft_data'].length == 0) {
        console.error('no data');
        return null;
      }

      const nftData = item['nft_data'][0];
      if (!nftData['external_data']) {
        console.error('no metadata');
        return null;
      }

      const externalData = nftData['external_data'];

      return {
        contract_address: item['contract_address'],
        token_id: nftData['token_id'],
        name: externalData['name'],
        description: externalData['description'],
        asset_url: nftData['token_url'],
        metadata: {
          name: externalData['name'],
          description: externalData['description'],
          attributes: externalData['attribues'],
          external_url: externalData['external_url'],
          image: externalData['image'],
          image_url: externalData['image']
        }
      };
    })
    .filter((i) => i != null);

  res.status(200).json(nftItems);
};
