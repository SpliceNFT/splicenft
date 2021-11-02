import {
  AspectRatio,
  Flex,
  Heading,
  LinkOverlay,
  Text
} from '@chakra-ui/react';
import {
  NFTItemInTransit,
  NFTMetaData,
  TokenHeritage
} from '@splicenft/common';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSplice } from '../../context/SpliceContext';
import { truncateAddress } from '../../modules/strings';
import { FallbackImage } from '../atoms/FallbackImage';
import { SpliceCard } from '../atoms/SpliceCard';

export const NFTCard = ({ nft }: { nft: NFTItemInTransit }) => {
  const [heritage, setHeritage] = useState<TokenHeritage>();
  //const [mintingState, setMintingState] = useState<MintingState>();
  const [nftMetadata, setNftMetadata] = useState<NFTMetaData>();

  const { splice } = useSplice();

  useEffect(() => {
    (async () => {
      const metadata = await nft.metadata;
      if (metadata) setNftMetadata(metadata);
    })();
  }, []);

  useEffect(() => {
    if (!splice) return;

    (async () => {
      const _heritage = await splice.findHeritage(
        nft.contract_address,
        nft.token_id
      );
      if (_heritage) {
        setHeritage(_heritage);
        //setMintingState(Splice.translateJobStatus(_mintJob.job));
      }
    })();
  }, [splice]);

  return (
    <SpliceCard direction="column">
      <AspectRatio ratio={1}>
        <FallbackImage metadata={nftMetadata} />
      </AspectRatio>
      <Flex direction="column" flex="1">
        <LinkOverlay
          as={Link}
          to={`/nft/${nft.contract_address}/${nft.token_id}`}
          p={4}
          background="white"
        >
          {nftMetadata && <Heading size="md">{nftMetadata.name}</Heading>}
        </LinkOverlay>

        <Flex background="black" direction="row" p={6}>
          <Flex
            direction="row"
            align="center"
            justify="space-between"
            width="100%"
          >
            <Flex direction="column">
              <Text color="gray.200" fontWeight="bold">
                contract
              </Text>
              <Text color="white">{truncateAddress(nft.contract_address)}</Text>
            </Flex>

            {heritage && (
              <Flex direction="column">
                <Text color="white">Minted</Text>
              </Flex>
            )}
          </Flex>
        </Flex>
      </Flex>
    </SpliceCard>
  );
};
