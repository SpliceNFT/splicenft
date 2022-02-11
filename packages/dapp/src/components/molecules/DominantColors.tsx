import { Box, Flex, Skeleton, Text } from '@chakra-ui/react';
import { HistogramEntry } from '@splicenft/colors';
import { Histogram } from '@splicenft/common';
import React from 'react';

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
  return (
    <Skeleton isLoaded={colors.length > 0} w="70%" size="lg">
      <Flex direction="row" align="center" height="1.5em" gridGap="0.5">
        {colors.map((entry) => {
          return (
            <Flex
              rounded="sm"
              key={entry.hex}
              flex="1"
              background={entry.hex}
              title={`${(100 * entry.freq).toFixed(2)}%`}
            >
              {showDetails ? (
                <SwatchDetails entry={entry} />
              ) : (
                <Box w="5" h="5"></Box>
              )}
            </Flex>
          );
        })}
      </Flex>
    </Skeleton>
  );
};
