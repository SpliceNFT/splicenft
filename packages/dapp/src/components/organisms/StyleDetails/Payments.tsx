import { useQuery } from '@apollo/client';
import {
  Flex,
  Heading,
  Link,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr
} from '@chakra-ui/react';
import {
  ISplicePriceStrategy,
  ReplaceablePaymentSplitter,
  SPLICE_ADDRESSES,
  Style,
  StyleStats
} from '@splicenft/common';
import { useWeb3React } from '@web3-react/core';
import { BigNumber, ethers, providers } from 'ethers';
import React, { useEffect, useState } from 'react';
import { StyleStatsData, STYLE_STATS } from '../../../modules/Queries';
import { PaymentInfo } from '../../../types/PaymentInfo';
import { NumBox } from '../../atoms/NumBox';
import { ClaimButton } from '../../molecules/StyleDetails/ClaimButton';

export const Payments = (props: { style: Style; stats: StyleStats }) => {
  const { style } = props;
  const {
    library: web3,
    account,
    chainId
  } = useWeb3React<providers.Web3Provider>();
  const [splitter, setSplitter] = useState<ReplaceablePaymentSplitter>();
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>();
  const [priceStrategy, setPriceStrategy] = useState<ISplicePriceStrategy>();
  const [price, setPrice] = useState<BigNumber>();

  const {
    loading: buzy,
    error: gqlErr,
    data: paymentStats
  } = useQuery<{ style: StyleStatsData }, { style_id: string }>(STYLE_STATS, {
    variables: { style_id: style.tokenId.toString() }
  });

  useEffect(() => {
    if (!web3) return;
    (async () => {
      try {
        const _splitter = await style.paymentSplitter();
        setSplitter(_splitter.connect(web3));

        const _priceStrategy = await style.priceStrategy();
        setPriceStrategy(_priceStrategy.connect(web3));
        setPrice(await _priceStrategy.quote(style.tokenId, [], []));
      } catch (e: any) {
        console.warn(e.message);
      }
    })();
  }, [web3]);

  useEffect(() => {
    if (!web3 || !splitter || !account) return;
    (async () => {
      try {
        const total = await web3.getBalance(splitter.address);
        const totalReleased = await splitter['totalReleased()']();
        const shares = await splitter.shares(account);
        const due = await splitter['due(address)'](account);
        setPaymentInfo({
          total,
          totalReleased,
          shares: shares.toNumber(),
          due
        });
      } catch (e: any) {
        console.error(e);
      }
    })();
  }, [web3, splitter, account]);

  const onClaimed = async () => {
    if (!web3 || !account || !splitter || !paymentInfo) return;
    const total = await web3.getBalance(splitter.address);
    const totalReleased = await splitter['totalReleased()']();
    const due = await splitter['due(address)'](account);
    setPaymentInfo({
      ...paymentInfo,
      total,
      totalReleased,
      due
    });
  };

  return (
    <Flex direction="column" my={5}>
      <Heading size="md">
        Payments{' '}
        <Text d="inline" fontSize="xs" fontWeight="normal">
          {chainId && splitter && (
            <Link
              href={`//${SPLICE_ADDRESSES[chainId]?.explorerRoot}/address/${splitter.address}`}
              isExternal
            >
              {splitter.address}
            </Link>
          )}
        </Text>
      </Heading>
      {paymentInfo && (
        <Flex direction="row" justify="space-between" my={5} gridGap={2}>
          <NumBox
            head="Total"
            val={ethers.utils.formatEther(paymentInfo.total)}
          />
          <NumBox
            head="Total Released"
            val={ethers.utils.formatEther(paymentInfo.totalReleased)}
          />
          <NumBox head="Your share" val={`${paymentInfo.shares / 100}%`} />
          <NumBox
            head="Your claim"
            val={`${ethers.utils.formatEther(paymentInfo.due)} Eth`}
          >
            {account && splitter && !paymentInfo.due.isZero() && (
              <ClaimButton splitter={splitter} onClaimed={onClaimed} />
            )}
          </NumBox>
        </Flex>
      )}
      {paymentStats && (
        <Table variant="unstyled" size="sm">
          <Thead>
            <Tr>
              <Th>From</Th>
              <Th>at</Th>
            </Tr>
          </Thead>
          <Tbody>
            {paymentStats.style.split.payments.map((p) => (
              <Tr key={p.id}>
                <Td>{p.from}</Td>
                <Td>{new Date(parseInt(p.time) * 1000).toISOString()}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
      {priceStrategy && (
        <Flex direction="column">
          <Heading size="md" my={5}>
            Pricing
          </Heading>
          <Text>Price Strategy {priceStrategy.address}</Text>
          {price && (
            <Flex my={5}>
              Current mint price: {ethers.utils.formatEther(price)} Eth
            </Flex>
          )}
        </Flex>
      )}
    </Flex>
  );
};
