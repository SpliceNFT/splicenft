import {
  Flex,
  IconButton,
  Skeleton,
  Text,
  useClipboard
} from '@chakra-ui/react';
import { HistogramEntry } from '@splicenft/colors';
import { Histogram } from '@splicenft/common';
import React from 'react';
import { FaRegCopy } from 'react-icons/fa';

const SwatchDetails = ({ entry }: { entry: HistogramEntry }) => {
  return <Text p={3}>{entry.hex}</Text>;
};

export const DominantColorsDisplay = ({
  colors,
  showDetails = false
}: {
  colors: Histogram;
  showDetails?: boolean;
}) => {
  const { hasCopied, onCopy } = useClipboard(JSON.stringify(colors));

  return (
    <Skeleton isLoaded={colors.length > 0} w="70%" size="lg">
      <Flex direction="row" align="center" height="1.5em" gridGap={0}>
        {colors.map((entry) => {
          return (
            <Flex
              key={entry.hex}
              flex="1"
              background={entry.hex}
              title={`${(100 * entry.freq).toFixed(2)}%`}
            >
              {showDetails ? (
                <SwatchDetails entry={entry} />
              ) : (
                <Text>&nbsp;</Text>
              )}
            </Flex>
          );
        })}

        <IconButton
          ml={2}
          size="sm"
          icon={
            <FaRegCopy onClick={onCopy} color={hasCopied ? 'green' : 'black'} />
          }
          aria-label="copy palette"
        />
      </Flex>
    </Skeleton>
  );
};
