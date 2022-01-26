import {
  AspectRatio,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Image,
  SystemProps,
  Text,
  useToast
} from '@chakra-ui/react';
import {
  Partnership,
  Style,
  StyleStats,
  ReplaceablePaymentSplitter,
  ipfsGW
} from '@splicenft/common';
import { useWeb3React } from '@web3-react/core';
import { ethers, providers } from 'ethers';
import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';

import { useSplice } from '../../context/SpliceContext';

const ActivateButton = (props: { style: Style; stats: StyleStats }) => {
  const { style, stats } = props;
  const [active, setActive] = useState<boolean>(stats.active);
  const toast = useToast();

  const toggle = async () => {
    const newVal = !stats.active;
    try {
      await style.toggleActive(newVal);
      setActive(newVal);
    } catch (e: any) {
      toast({ title: 'tx failed', description: e.message });
    }
  };
  return (
    <Button onClick={toggle} px={12}>
      {active ? 'Stop sales' : 'Start Sales'}
    </Button>
  );
};

type PaymentInfo = {
  total: ethers.BigNumber;
  totalReleased: ethers.BigNumber;
  shares: number;
  due: ethers.BigNumber;
};

const NumBox = (
  props: {
    head: string;
    val: string;
    children?: React.ReactNode;
  } & SystemProps
) => {
  const { head, val, children, ...rest } = props;
  return (
    <Flex
      align="center"
      background="white"
      p={5}
      direction="column"
      flex="1"
      {...rest}
    >
      <Text>{head}</Text>
      <Text fontSize="2xl">{val}</Text>
      {children}
    </Flex>
  );
};
const Payments = (props: { style: Style; stats: StyleStats }) => {
  const { style, stats } = props;
  const { library: web3, account } = useWeb3React<providers.Web3Provider>();
  const [splitter, setSplitter] = useState<ReplaceablePaymentSplitter>();
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>();

  useEffect(() => {
    if (!web3) return;
    (async () => {
      const _splitter = await style.paymentSplitter();
      setSplitter(_splitter.connect(web3));
    })();
  }, [web3]);
  useEffect(() => {
    if (!web3 || !splitter || !account) return;
    (async () => {
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
    })();
  }, [web3, splitter, account]);
  return (
    <Flex direction="column" my={5}>
      <Heading size="md">Payments</Heading>
      <Text>Splitter {splitter?.address}</Text>
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
            val={ethers.utils.formatEther(paymentInfo.due)}
          >
            {!paymentInfo.due.isZero() && (
              <Button variant="black" size="sm" px={12}>
                Claim
              </Button>
            )}
          </NumBox>
        </Flex>
      )}
    </Flex>
  );
};

const StyleActions = (props: {
  style: Style;
  isStyleMinter: boolean;
  stats: StyleStats;
  partnership: Partnership | undefined;
}) => {
  const { account } = useWeb3React();
  const { style, stats, isStyleMinter, partnership } = props;

  return (
    <Flex direction="column" h="100%">
      <Heading size="lg" color="white">
        {style.getMetadata().name}
      </Heading>
      <Text color="white" fontSize="sm">
        Owner: {stats.owner} {stats.owner === account && <span> (You)</span>}
      </Text>
      <NumBox
        head="Minted"
        val={`${stats.settings.mintedOfStyle} /  ${stats.settings.cap}`}
        my={5}
        bg="transparent"
        color="white"
      ></NumBox>

      <Flex justify="flex-end" gridGap={3}>
        {isStyleMinter || stats.owner === account ? (
          <ActivateButton style={style} stats={stats} />
        ) : (
          <Text>Active: {stats.active ? 'Yes' : 'No'}</Text>
        )}

        {stats.owner === account && <Button px={12}>Transfer Style</Button>}
      </Flex>

      {partnership && (
        <Flex title={partnership.collections.join('|')}>
          {partnership.collections.length}
        </Flex>
      )}
    </Flex>
  );
};

export const StyleDetailPage = () => {
  const { style_id: styleId } = useParams<{ style_id: string }>();

  const { account } = useWeb3React();
  const { splice, spliceStyles } = useSplice();
  const [stats, setStats] = useState<StyleStats>();
  //const [partnership, setPartnership] = useState<Partnership | undefined>();
  const [isStyleMinter, setIsStyleMinter] = useState<boolean>(false);
  const [style, setStyle] = useState<Style>();

  useEffect(() => {
    if (!splice || !account) return;
    (async () => {
      const styleNft = await splice.getStyleNFT();
      const _style = spliceStyles.find(
        (s) => s.tokenId === Number.parseInt(styleId)
      );
      setStyle(_style);

      setIsStyleMinter(await styleNft.isStyleMinter(account));
    })();
  }, [spliceStyles, splice, account]);

  useEffect(() => {
    if (!style) return;
    (async () => {
      setStats(await style.stats());
      //setPartnership(await style.partnership());
    })();
  }, [style]);

  const previewImg = useMemo(() => {
    const image = style?.getMetadata().image;
    if (!image) return '';
    return ipfsGW(image);
  }, [style]);

  return (
    <Container maxW="container.lg">
      {style && stats && (
        <>
          <AspectRatio background="black" position="relative" ratio={3 / 1}>
            <Flex w="100%">
              <Image
                src={previewImg}
                opacity="0.4"
                position="absolute"
                fit="cover"
                zIndex={1}
              />
              <Flex zIndex={2} direction="column" p={3} flex="1" h="100%">
                <StyleActions
                  style={style}
                  isStyleMinter={isStyleMinter}
                  stats={stats}
                  partnership={undefined}
                />
              </Flex>
            </Flex>
          </AspectRatio>
          {(isStyleMinter || stats.owner == account) && (
            <Payments style={style} stats={stats} />
          )}
        </>
      )}
    </Container>
  );
};
