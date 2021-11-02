import { Flex, Heading, Skeleton, Text, Link } from '@chakra-ui/react';
import { SpliceNFT } from '@splicenft/common';
import React from 'react';
import { useSplice } from '../../../context/SpliceContext';
import { DominantColorsDisplay } from '../../molecules/DominantColors';

export const SpliceMetadata = ({
  tokenId,
  metadata,
  metadataUrl,
  children
}: {
  tokenId?: string;
  metadata: SpliceNFT | undefined | null;
  metadataUrl?: string;
  children?: React.ReactNode;
}) => {
  const { spliceStyles } = useSplice();

  const style = spliceStyles.find(
    (s) => s.tokenId === metadata?.properties.style_token_id
  );

  return (
    <Flex p={3} direction="column" gridGap={3} flex="1">
      {metadata ? (
        <>
          <Flex align="flex-end" gridGap={2}>
            <Heading size="md">Splice #{tokenId}</Heading>
            {metadataUrl && (
              <Link fontSize="xs" href={metadataUrl || ''} isExternal>
                Metadata
              </Link>
            )}
          </Flex>
          <Text>{metadata.description}</Text>

          <Text>
            <b>Randomness</b> {metadata.properties.randomness}
          </Text>
          <Text>
            <b>Style</b> {style?.getMetadata().name}
          </Text>
          <Text fontWeight="bold">Colors</Text>
          <DominantColorsDisplay colors={metadata.properties.colors} />
          {children}
        </>
      ) : (
        <Skeleton h="20px">no metadata yet</Skeleton>
      )}
    </Flex>
  );
};
