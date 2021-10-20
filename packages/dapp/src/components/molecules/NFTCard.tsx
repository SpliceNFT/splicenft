import { Flex, Heading, LinkOverlay, Spacer, Text } from '@chakra-ui/react';
import {
  MintingState,
  MintJob,
  NFTItem,
  NFTMetaData,
  Splice
} from '@splicenft/common';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSplice } from '../../context/SpliceContext';
import { truncateAddress } from '../../modules/strings';
import { FallbackImage } from '../atoms/FallbackImage';
import { SpliceCard } from '../atoms/SpliceCard';

export const NFTCard = ({ nft }: { nft: NFTItem }) => {
  const [isCollectionAllowed, setIsCollectionAllowed] = useState<boolean>();
  const [mintJob, setMintJob] = useState<{ jobId: number; job: MintJob }>();
  const [mintingState, setMintingState] = useState<MintingState>();
  const [nftMetadata, setNftMetadata] = useState<NFTMetaData>();

  const { splice } = useSplice();

  /*
  setMintingState(MintingState.GETTING_COLORS);
    setMintingState(MintingState.GOT_COLORS);
    */
  // const buzy = [MintingState.GETTING_COLORS, MintingState.MINTING].includes(
  //   mintingState
  // );

  const MStatusText = (status: MintingState) => {
    switch (status) {
      case MintingState.MINTING_REQUESTED:
        return 'Minting Requested';
      case MintingState.MINTING_ALLOWED:
        return 'Minting Allowed';
      case MintingState.MINTED:
        return 'Minted';
      default:
        return null;
    }
  };

  useEffect(() => {
    (async () => {
      const metadata = await nft.metadata;
      if (metadata) setNftMetadata(metadata);
    })();
  }, []);

  useEffect(() => {
    if (!splice) return;
    (async () => {
      const allowed = await splice.isCollectionAllowed(nft.contract_address);
      if (allowed) {
        const _mintJob = await splice.findJobFor(
          nft.contract_address,
          nft.token_id
        );
        if (_mintJob) {
          setMintJob(_mintJob);
          setMintingState(Splice.translateJobStatus(_mintJob.job));
        }
      }
      setIsCollectionAllowed(allowed);
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

          {mintJob && mintingState && (
            <Flex direction="column">
              <Text color="white">{MStatusText(mintingState)}</Text>
            </Flex>
          )}
        </Flex>
        <Spacer />
      </Flex>
    </SpliceCard>
  );
};
