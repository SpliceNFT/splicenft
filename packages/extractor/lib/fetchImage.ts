import axios from 'axios';

export async function fetchUrlOrIpfs(
  uri: string,
  responseType: 'json' | 'arraybuffer' = 'json'
): Promise<any> {
  let dataUrl: string;

  if (uri.startsWith('ipfs://')) {
    const ipfsResource = uri.replace('ipfs://', '');
    dataUrl = `https://ipfs.io/ipfs/${ipfsResource}`;
  } else {
    dataUrl = uri;
  }

  return await (
    await axios.get(dataUrl, {
      responseType
    })
  ).data;
}
