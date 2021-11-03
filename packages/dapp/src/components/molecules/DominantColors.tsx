import { Flex, Skeleton } from '@chakra-ui/react';
import { RGB } from 'get-rgba-palette';
import React, { useEffect } from 'react';
import rgbHex from 'rgb-hex';
import { extractColors } from '@splicenft/common';

export const DominantColorsDisplay = ({ colors }: { colors: RGB[] }) => (
  <Flex direction="row" w="100%" align="center" height="10px" gridGap={1}>
    {colors.map((color) => {
      const colorHex = `#${rgbHex(color[0], color[1], color[2])}`;
      return (
        <Flex key={colorHex} flex="1 1 0px" background={colorHex}>
          &nbsp;
        </Flex>
      );
    })}
  </Flex>
);

/**
 * @deprecated don't use. Use your image's src directly
 */
export const DominantColors = ({
  imageUrl,
  dominantColors,
  setDominantColors
}: {
  imageUrl?: string;
  dominantColors: RGB[];
  setDominantColors: (c: RGB[]) => void;
}) => {
  useEffect(() => {
    if (!imageUrl) return;
    (async () => {
      setDominantColors(
        await extractColors(imageUrl, {
          proxy: process.env.REACT_APP_CORS_PROXY
        })
      );
    })();
  }, [imageUrl]);

  return dominantColors.length > 0 ? (
    <DominantColorsDisplay colors={dominantColors} />
  ) : (
    <Skeleton height="20px" />
  );
};
