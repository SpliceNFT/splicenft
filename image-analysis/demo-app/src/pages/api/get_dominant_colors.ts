import { get_dominant_colors } from '@/ext/pkg/image_analysis';
import { NextApiRequest, NextApiResponse } from "next";

const prepUrl = (url: string) => {
  if (url.startsWith("ipfs://")) {
    return url.replace("ipfs://", "https://ipfs2.getsplice.io/ipfs/")
  }
  if (url.startsWith("https://ipfs.io/")) {
    return url.replace("https://ipfs.io/", "https://ipfs2.getsplice.io/")
  }
  return url
}
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const url = prepUrl(req.query.image_url as string);

  console.debug("url", url);  
  const response = await fetch(url);
  const buffer = await response.arrayBuffer()
  const colors = await get_dominant_colors(new Uint8Array(buffer), 1, 10, 10);

  res.status(200).json({ colors });
}