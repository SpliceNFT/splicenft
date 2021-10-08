import {
  Flex,
  Heading,
  Image,
  LinkBox,
  LinkOverlay,
  Spacer,
  Text
} from '@chakra-ui/react';
import React from 'react';
import { Link } from 'react-router-dom';
import { resolveImage } from '@splicenft/common';
import { NFTItem } from '@splicenft/common';
import { truncateAddress } from '../../modules/strings';

export const NFTCard = ({ nft }: { nft: NFTItem }) => {
  if (!nft.metadata) return <></>;

  /*
  setMintingState(MintingState.GETTING_COLORS);
    setMintingState(MintingState.GOT_COLORS);
    */
  // const buzy = [MintingState.GETTING_COLORS, MintingState.MINTING].includes(
  //   mintingState
  // );

  const imgUrl = resolveImage(nft.metadata);

  return (
    <LinkBox
      as={Flex}
      rounded="lg"
      minH="80"
      direction="column"
      overflow="hidden"
      _hover={{
        transform: 'translate(0, -3px)',
        boxShadow: 'rgba(0, 0, 0, 0.05) 0px 10px 20px 10px'
      }}
      style={{ transition: 'all ease .3s' }}
      boxShadow="rgba(0, 0, 0, 0.05) 0px 10px 20px 0px"
      justify="space-between"
    >
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
        <Flex direction="column">
          <Text color="gray.200" fontWeight="bold">
            contract
          </Text>
          <Text color="white">{truncateAddress(nft.contract_address)}</Text>
        </Flex>
        <Spacer />
      </Flex>
    </LinkBox>
  );
};
