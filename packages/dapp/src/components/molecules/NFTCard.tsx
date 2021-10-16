import {
  Flex,
  Heading,
  Image,
  LinkBox,
  LinkOverlay,
  Spacer,
  Text
} from '@chakra-ui/react';
import {
  MintingState,
  MintJob,
  NFTItem,
  resolveImage
} from '@splicenft/common';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSplice } from '../../context/SpliceContext';
import { truncateAddress } from '../../modules/strings';
import { SpliceCard } from '../atoms/SpliceCard';

export const NFTCard = ({ nft }: { nft: NFTItem }) => {
  if (!nft.metadata) return <></>;

  const [isCollectionAllowed, setIsCollectionAllowed] = useState<boolean>();
  const [mintJob, setMintJob] = useState<{ jobId: number; job: MintJob }>();
  const [mintingState, setMintingState] = useState<MintingState>();
  const { splice } = useSplice();

  /*
  setMintingState(MintingState.GETTING_COLORS);
    setMintingState(MintingState.GOT_COLORS);
    */
  // const buzy = [MintingState.GETTING_COLORS, MintingState.MINTING].includes(
  //   mintingState
  // );

  const imgUrl = resolveImage(nft.metadata);

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
          switch (_mintJob.job.status) {
            case 0:
              setMintingState(MintingState.MINTING_REQUESTED);
              break;
            case 1:
              setMintingState(MintingState.MINTING_ALLOWED);
              break;
            case 2:
              setMintingState(MintingState.MINTED);
              break;
            case 3:
              setMintingState(MintingState.FAILED);
          }
        }
      }
      setIsCollectionAllowed(allowed);
    })();
  }, [splice]);

  return (
    <SpliceCard direction="column">
      <Flex maxH={80}>
        <Image
          src={imgUrl}
          title={imgUrl}
          boxSize="fit-content"
          objectFit="cover"
          alt={imgUrl}
          fallbackSrc="https://via.placeholder.com/800"
          /*opacity={buzy ? 0.2 : 1}*/
        />
      </Flex>

      <LinkOverlay
        as={Link}
        to={`/nft/${nft.contract_address}/${nft.token_id}`}
        p={4}
        background="white"
      >
        <Heading size="md">{nft.metadata?.name}</Heading>
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
