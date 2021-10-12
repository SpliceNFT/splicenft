import { Flex } from '@chakra-ui/react';
import { NFTItem, resolveImage } from '@splicenft/common';
import palette, { RGB } from 'get-rgba-palette';
import ImageToColors from 'image-to-colors';
import React, { useEffect } from 'react';
import rgbHex from 'rgb-hex';

export const DominantColors = ({
  imageUrl,
  dominantColors,
  setDominantColors
}: {
  imageUrl?: string;
  dominantColors: RGB[];
  setDominantColors: (c: RGB[]) => void;
}) => {
  const extractColors = async (imgUrl: string) => {
    const _pixels = await ImageToColors.getFromExternalSource(imgUrl, {
      setImageCrossOriginToAnonymous: true
    });
    const flatPixels = _pixels.flatMap((p) => [...p, 255]);

    const colors = palette(flatPixels, 10);

    setDominantColors(colors);
  };

  useEffect(() => {
    if (!imageUrl) return;
    extractColors(imageUrl);
  }, [imageUrl]);

  return dominantColors.length > 0 ? (
    <Flex direction="row" w="100%" justify="space-between" height="40px">
      {dominantColors.map((color) => {
        const colorHex = `#${rgbHex(color[0], color[1], color[2])}`;
        return (
          <Flex key={colorHex} flex="1 1 0px" background={colorHex}>
            &nbsp;
          </Flex>
        );
      })}
    </Flex>
  ) : (
    <></>
  );
};
