import fs from "fs";
import { mkdir } from "./cli/mkdir";
import getColors from "get-image-colors";

export async function extractColors(
  contractAddress: string,
  tokenId: string
): Promise<chroma.Color[]> {
  const directory = mkdir(contractAddress, tokenId);
  const filePath = `${directory}/image.png`;
  console.log(filePath);
  if (!fs.existsSync(filePath)) {
    throw new Error("fetch the data first");
  }

  const colors = await getColors(filePath, {
    count: 10,
  });

  return colors;
}
