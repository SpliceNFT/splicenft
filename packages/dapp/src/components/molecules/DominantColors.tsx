import { Flex } from '@chakra-ui/react';
import palette, { RGB } from 'get-rgba-palette';
import ImageToColors from 'image-to-colors';
import React, { useEffect } from 'react';
import rgbHex from 'rgb-hex';

export const DominantColors = ({
  imgUrl,
  dominantColors,
  setDominantColors
}: {
  imgUrl: string;
  dominantColors: RGB[];
  setDominantColors: (c: RGB[]) => void;
}) => {
  const extractColors = async () => {
    const _pixels = await ImageToColors.getFromExternalSource(imgUrl, {
      setImageCrossOriginToAnonymous: true
    });
    const flatPixels = _pixels.flatMap((p) => [...p, 255]);

    const colors = palette(flatPixels, 10);

    setDominantColors(colors);
  };

  useEffect(() => {
    extractColors();
  }, []);

  return dominantColors.length > 0 ? (
    <Flex direction="row" w="100%" justify="space-between" height="40px">
      {dominantColors.map((color) => (
        <Flex
          flex="1 1 0px"
          background={`#${rgbHex(color[0], color[1], color[2])}`}
        >
          &nbsp;
        </Flex>
      ))}
    </Flex>
  ) : (
    <></>
  );
};
