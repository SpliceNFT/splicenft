import { Flex, IconButton, Skeleton, useClipboard } from '@chakra-ui/react';
import { RGB } from '@splicenft/common';
import React from 'react';
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
