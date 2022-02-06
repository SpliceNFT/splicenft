import {
  AspectRatio,
  Button,
  Container,
  Flex,
  Heading,
  Image,
  Input,
  InputGroup,
  InputRightElement,
  SystemProps,
  Text,
  useToast
} from '@chakra-ui/react';
import {
  Partnership,
  Style,
  StyleStats,
  ReplaceablePaymentSplitter,
  ISplicePriceStrategy,
  ipfsGW
} from '@splicenft/common';
import { useWeb3React } from '@web3-react/core';
import { BigNumber, ethers, providers } from 'ethers';
import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';

import { useSplice } from '../../context/SpliceContext';
type PaymentInfo = {
  total: ethers.BigNumber;
  totalReleased: ethers.BigNumber;
  shares: number;
  due: ethers.BigNumber;
};

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
    <Button onClick={toggle} px={12} size="sm">
      {active ? 'Stop sales' : 'Start Sales'}
    </Button>
  );
};

const TransferForm = (props: { onRecipient: (r: string) => unknown }) => {
  const { onRecipient } = props;
  const [recipient, setRecipient] = useState<string>('');

  const validate = () => {
    //console.log(recipient);
    onRecipient(recipient);
  };

  return (
    <InputGroup size="md" width="50%">
      <Input
        pr="4.5rem"
        type="text"
        placeholder="0xrecipient"
        value={recipient}
        bg="white"
        onChange={(e) => {
          e.preventDefault();
          setRecipient(e.target.value);
        }}
      />
      <InputRightElement width="5rem">
        <Button
          size="xs"
          px={10}
          mr={2}
          variant="black"
          onClick={() => {
            validate();
          }}
        >
          Transfer
        </Button>
      </InputRightElement>
    </InputGroup>
  );
};
const TransferButton = (props: { account: string; tokenId: number }) => {
  const { splice } = useSplice();
  const { account, tokenId } = props;
  const toast = useToast();

  const [inTransfer, setInTransfer] = useState<boolean>(false);
  const [buzy, setBuzy] = useState<boolean>(false);

  const doTransfer = async (from: string, to: string) => {
    if (!splice) return;
    setInTransfer(false);
    setBuzy(true);
    try {
      const styleNFT = await splice.getStyleNFT();
      const tx = await styleNFT.transferFrom(from, to, tokenId);
      await tx.wait();

      toast({
        status: 'success',
        title: 'style transferred',
        description: 'reload the page'
      });
    } catch (e: any) {
      toast({ status: 'error', title: 'claim failed', description: e.message });
    } finally {
      setBuzy(false);
    }
  };

  return inTransfer ? (
    <TransferForm onRecipient={(r) => doTransfer(account, r)} />
  ) : (
    <Button
      isLoading={buzy}
      variant="white"
      size="sm"
      px={12}
      my={2}
      onClick={() => setInTransfer(true)}
    >
      Transfer
    </Button>
  );
};

const ClaimButton = (props: {
  splitter: ReplaceablePaymentSplitter;
  onClaimed: () => unknown;
}) => {
  const { library: web3, account } = useWeb3React<providers.Web3Provider>();
  const { splitter, onClaimed } = props;
  const toast = useToast();

  const claim = async () => {
    if (!web3 || !account) return;
    try {
      const _splitter = splitter.connect(await web3.getSigner());
      const tx = await _splitter['release(address)'](account);
      await tx.wait();
      onClaimed();
    } catch (e: any) {
      toast({ status: 'error', title: 'claim failed', description: e.message });
    }
  };

  return (
    <Button variant="black" size="sm" px={12} my={2} onClick={claim}>
      Claim
    </Button>
  );
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
      justify="center"
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
  const [priceStrategy, setPriceStrategy] = useState<ISplicePriceStrategy>();
  const [price, setPrice] = useState<BigNumber>();
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
            val={`${ethers.utils.formatEther(paymentInfo.due)} Eth`}
          >
            {account && splitter && !paymentInfo.due.isZero() && (
              <ClaimButton splitter={splitter} onClaimed={onClaimed} />
            )}
          </NumBox>
        </Flex>
      )}
      {priceStrategy && (
        <Flex direction="column">
          <Heading size="md">Pricing</Heading>
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

const StyleActions = (props: {
  style: Style;
  isStyleMinter: boolean;
  stats: StyleStats;
  partnership: Partnership | undefined;
}) => {
  const { account } = useWeb3React();
  const { style, stats, isStyleMinter, partnership } = props;

  return (
    <Flex direction="column" p={3} h="100%">
      <Flex direction="column">
        <Heading size="lg" color="white">
          {style.getMetadata().name}
        </Heading>

        <Text color="white" fontSize="sm">
          Owner: {stats.owner} {stats.owner === account && <span> (You)</span>}
        </Text>
        <Text color="white" fontSize="sm">
          Style ID: {style.tokenId}
        </Text>
      </Flex>
      <NumBox
        head="Minted"
        val={`${stats.settings.mintedOfStyle} /  ${stats.settings.cap}`}
        my={5}
        bg="transparent"
        color="white"
      ></NumBox>

      <Flex justify="flex-end" gridGap={3} align="center">
        {isStyleMinter || stats.owner === account ? (
          <ActivateButton style={style} stats={stats} />
        ) : (
          <Text>Active: {stats.active ? 'Yes' : 'No'}</Text>
        )}

        {stats.owner === account && (
          <TransferButton account={account} tokenId={style.tokenId} />
        )}
      </Flex>
    </Flex>
  );
};

const StyleDetailPage = () => {
  const { style_id: styleId } = useParams<{ style_id: string }>();

  const { account } = useWeb3React();
  const { splice, spliceStyles } = useSplice();
  const [stats, setStats] = useState<StyleStats>();
  const [partnership, setPartnership] = useState<Partnership | undefined>();
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
      try {
        setStats(await style.stats());
        const _partnership = await style.partnership();
        console.log(_partnership);
        setPartnership(_partnership);
      } catch (e: any) {
        console.warn('style: ', e.message);
      }
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
              <Flex zIndex={2} direction="column" flex="1" h="100%">
                <StyleActions
                  style={style}
                  isStyleMinter={isStyleMinter}
                  stats={stats}
                  partnership={partnership}
                />
              </Flex>
            </Flex>
          </AspectRatio>
          <Payments style={style} stats={stats} />
        </>
      )}
    </Container>
  );
};

export default StyleDetailPage;
