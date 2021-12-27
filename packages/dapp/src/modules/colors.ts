import { RGB } from '@splicenft/common';
import axios from 'axios';

interface ColorsResponse {
  colors: [
    {
      rgb: RGB;
      hex: string;
    }
  ];
}

export default async function getDominantColors(
  chainId: number | string,
  collection: string,
  tokenId: string
): Promise<RGB[]> {
  const url = `${process.env.REACT_APP_VALIDATOR_BASEURL}/colors/${chainId}/${collection}/${tokenId}`;
  try {
    const { colors } = await (await axios.get<ColorsResponse>(url)).data;
    return colors.map((c) => c.rgb);
  } catch (e: any) {
    throw new Error(`couldnt get image colors: ${e.message}`);
  }
}
