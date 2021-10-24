import {
  Flex,
  Text,
  Heading,
  Image,
  SimpleGrid,
  Link,
  Icon
} from '@chakra-ui/react';
import { CHAINS } from '@splicenft/common';
import { useWeb3React } from '@web3-react/core';
import { providers } from 'ethers';
import React from 'react';
import { useSplice } from '../../context/SpliceContext';
import spliceWhite from '../../img/splice_plain_white.svg';
import { FaTwitter, FaGithub, FaDiscord } from 'react-icons/fa';

export const Footer = () => {
  const { chainId, account } = useWeb3React<providers.Web3Provider>();
  const { splice } = useSplice();

  return (
    <Flex bg="gray.800" p={12} color="white" direction="column">
      <SimpleGrid
        columns={[1, null, 3]}
        width="100%"
        spacing={10}
        justify="space-between"
      >
        <Flex justify="center">
          <Image src={spliceWhite} />
        </Flex>
        <Flex align="center" direction="column">
          <Flex direction="column" align="center" mb={1}>
            <Text fontSize="xl">
              Started at{' '}
              <Link
                href="https://showcase.ethglobal.com/ethonline2021/splice"
                isExternal
              >
                EthOnline21
              </Link>{' '}
              by
            </Text>
            <Flex gridGap={2} fontSize="lg">
              <Link href="https://twitter.com/stadolf" isExternal>
                @stadolf
              </Link>
              <Link href="https://twitter.com/emilyaweil" isExternal>
                @emilyaweil
              </Link>
              <Link href="https://twitter.com/timothycbkr" isExternal>
                @timothycbkr
              </Link>
            </Flex>
          </Flex>
          <Flex fontSize="sm">
            Honorable Mentions:{' '}
            <Link href="https://twitter.com/BiggyTava" isExternal>
              @BiggyTava
            </Link>
          </Flex>
          <Flex gridGap={8} mt={10} align="flex-end" justify="space-between">
            <Link
              href="https://github.com/cod1ng-earth/splicenft"
              isExternal
              fontStyle="bold"
            >
              <Icon as={FaGithub} boxSize="6" />
            </Link>
            <Link
              href="https://twitter.com/splicenft"
              isExternal
              fontStyle="bold"
            >
              <Flex direction="row" align="center" gridGap={2}>
                <Icon as={FaTwitter} boxSize="6" title="@splicenft" />
              </Flex>
            </Link>
            <Link
              href="https://discord.gg/JhtT87y2BA"
              isExternal
              fontStyle="bold"
            >
              <Icon as={FaDiscord} boxSize="6" />
            </Link>
          </Flex>
        </Flex>
        <Flex direction="column">
          {chainId && (
            <>
              <Heading size="md">Info</Heading>

              <Text>Network: {chainId && CHAINS[chainId]}</Text>
              <Text isTruncated>
                You:{' '}
                <Link
                  href={`https://etherscan.io/address/${account}`}
                  isExternal
                >
                  {' '}
                  {account}
                </Link>
              </Text>
              {splice && (
                <Text isTruncated>Splice contract: {splice.address} </Text>
              )}
            </>
          )}
        </Flex>
      </SimpleGrid>
    </Flex>
  );
};
