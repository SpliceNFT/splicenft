import { Flex, IconButton, Skeleton, useClipboard } from '@chakra-ui/react';
import { extractColors, LoadImageBrowser } from '@splicenft/colors';
import { RGB } from 'get-rgba-palette';
import React, { useEffect } from 'react';
import { FaRegCopy } from 'react-icons/fa';
import rgbHex from 'rgb-hex';

export const DominantColorsDisplay = ({ colors }: { colors: RGB[] }) => {
  const { hasCopied, onCopy } = useClipboard(JSON.stringify(colors));

  return (
    <Skeleton isLoaded={colors.length > 0} w="70%" size="lg">
      <Flex direction="row" align="center" height="1.5em" gridGap={0}>
        {colors.map((color) => {
          const colorHex = `#${rgbHex(color[0], color[1], color[2])}`;
          return (
            <Flex key={colorHex} flex="1" background={colorHex}>
              &nbsp;
            </Flex>
          );
        })}

        <IconButton
          icon={
            <FaRegCopy onClick={onCopy} color={hasCopied ? 'green' : 'black'} />
          }
          aria-label="copy palette"
        />
      </Flex>
    </Skeleton>
  );
};

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
        await extractColors(imageUrl, LoadImageBrowser, {
          proxy: process.env.REACT_APP_CORS_PROXY
        })
      );
    })();
  }, [imageUrl]);

  return dominantColors.length > 1 ? (
    <DominantColorsDisplay colors={dominantColors} />
  ) : (
    <></>
  );
};
