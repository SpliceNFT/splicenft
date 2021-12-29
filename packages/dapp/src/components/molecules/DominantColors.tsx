import { Flex, IconButton, Skeleton, useClipboard } from '@chakra-ui/react';
import { Histogram } from '@splicenft/common';
import React from 'react';
import { FaRegCopy } from 'react-icons/fa';

export const DominantColorsDisplay = ({ colors }: { colors: Histogram }) => {
  const { hasCopied, onCopy } = useClipboard(JSON.stringify(colors));

  return (
    <Skeleton isLoaded={colors.length > 0} w="70%" size="lg">
      <Flex direction="row" align="center" height="1.5em" gridGap={0}>
        {colors.map((color) => {
          const colorHex = `#${color.hex}`;
          return (
            <Flex
              key={colorHex}
              flex="1"
              background={colorHex}
              title={`${(100 * color.freq).toFixed(2)}%`}
            >
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
