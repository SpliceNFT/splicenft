import { Flex, Skeleton } from '@chakra-ui/react';
import palette, { RGB } from 'get-rgba-palette';
import ImageToColors, { Color } from 'image-to-colors';
import React, { useEffect } from 'react';
import rgbHex from 'rgb-hex';

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
    let pixels: Color[] = [];
    try {
      pixels = await ImageToColors.getFromExternalSource(imgUrl, {
        setImageCrossOriginToAnonymous: true
      });
    } catch (e: any) {
      pixels = await ImageToColors.getFromExternalSource(
        `${process.env.REACT_APP_CORS_PROXY}?url=${imgUrl}`,
        {
          setImageCrossOriginToAnonymous: true
        }
      );
    }
    if (!pixels) return;
    const flatPixels = pixels.flatMap((p) => [...p, 255]);

    const colors = palette(flatPixels, 10);

    setDominantColors(colors);
  };

  useEffect(() => {
    if (!imageUrl) return;
    extractColors(imageUrl);
  }, [imageUrl]);

  return dominantColors.length > 0 ? (
    <DominantColorsDisplay colors={dominantColors} />
  ) : (
    <Skeleton height="20px" />
  );
};
