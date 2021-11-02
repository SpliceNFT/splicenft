import { Flex, Heading, LinkOverlay, Spacer, Text } from '@chakra-ui/react';
import {
  MintingState,
  TokenHeritage,
  NFTItemInTransit,
  NFTMetaData,
  Splice
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

  // const MStatusText = (status: MintingState) => {
  //   switch (status) {
  //     case MintingState.MINTING_REQUESTED:
  //       return 'Minting Requested';
  //     case MintingState.MINTING_ALLOWED:
  //       return 'Minting Allowed';
  //     case MintingState.MINTED:
  //       return 'Minted';
  //     default:
  //       return null;
  //   }
  // };

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
      <Flex maxH={80}>
        <FallbackImage metadata={nftMetadata} />
      </Flex>

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
        <Spacer />
      </Flex>
    </SpliceCard>
  );
};
