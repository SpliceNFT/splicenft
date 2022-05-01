import { Flex, Link, Text } from '@chakra-ui/react';
import React from 'react';

export const SubFooter = () => {
  return (
    <Flex
      bg="gray.900"
      p={3}
      color="gray.400"
      direction="column"
      className="subfooter"
    >
      <Text fontSize="sm" align="center">
        Splice is an NFT protocol on Ethereum. Our code uses{' '}
        <Link
          href="https://docs.openzeppelin.com/contracts/4.x/upgradeable"
          isExternal
        >
          openzeppelin
        </Link>{' '}
        base contracts. We make use of{' '}
        <Link href="https://www.nftport.xyz/" isExternal>
          NFTPort
        </Link>{' '}
        and{' '}
        <Link href="https://nft.storage/" isExternal>
          nft.storage
        </Link>
        .{' '}
      </Text>
      <Text fontSize="sm" align="center">
        If you want to support us,{' '}
        <Link href="https://etherscan.io/address/0x03926e02bFf7f1eD401192B8D825B5bCe12E2b2D">
          send funds to our Gnosis Safe
        </Link>
        ,{' '}
        <Link href="https://twitter.com/splicenft" isExternal fontStyle="bold">
          follow us on twitter
        </Link>{' '}
        or join{' '}
        <Link href="https://discord.gg/JhtT87y2BA" isExternal fontStyle="bold">
          our discord server
        </Link>
        .
      </Text>
    </Flex>
  );
};
