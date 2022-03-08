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
  ActiveStyle,
  ISplicePriceStrategy,
  ReplaceablePaymentSplitter,
  SPLICE_ADDRESSES,
  Style,
  StyleStatsData
} from '@splicenft/common';
import { useWeb3React } from '@web3-react/core';
import { BigNumber, ethers, providers } from 'ethers';
import React, { useEffect, useState } from 'react';
import { PaymentInfo } from '../../../types/PaymentInfo';
import { NumBox } from '../../atoms/NumBox';
import { ClaimButton } from '../../molecules/StyleDetails/ClaimButton';

export const Payments = (props: {
  style: Style;
  activeStyle?: ActiveStyle;
  stats: StyleStatsData;
}) => {
  const { activeStyle, stats } = props;
  const {
    library: web3,
    account,
    chainId
  } = useWeb3React<providers.Web3Provider>();

  const [splitter, setSplitter] = useState<ReplaceablePaymentSplitter>();
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>();
  const [priceStrategy, setPriceStrategy] = useState<ISplicePriceStrategy>();
  const [price, setPrice] = useState<BigNumber>();

  useEffect(() => {
    if (!activeStyle) return;
    (async () => {
      try {
        const _splitter = await activeStyle.paymentSplitter();
        setSplitter(_splitter);

        const _priceStrategy = await activeStyle.priceStrategy();
        setPriceStrategy(_priceStrategy);
        setPrice(await _priceStrategy.quote(activeStyle.tokenId, [], []));
      } catch (e: any) {
        console.warn(e.message);
      }
    })();
  }, [activeStyle]);

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

      {stats.style.split.payments.length > 0 && (
        <Table variant="unstyled" size="sm">
          <Thead>
            <Tr>
              <Th>From</Th>
              <Th>at</Th>
            </Tr>
          </Thead>
          <Tbody>
            {stats.style.split.payments.map((p) => (
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
