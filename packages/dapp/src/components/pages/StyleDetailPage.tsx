import {
  AspectRatio,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Container,
  Flex,
  Image
} from '@chakra-ui/react';
import { ipfsGW, Partnership, Style, StyleStats } from '@splicenft/common';
import { useWeb3React } from '@web3-react/core';
import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { NavLink } from 'react-router-dom';
import { useSplice } from '../../context/SpliceContext';
import ConnectAlert from '../molecules/ConnectAlert';
import { Partnerships } from '../molecules/StyleDetails/Partnerships';
import { StyleActions } from '../organisms/StyleDetails/StyleActions';
import { Payments } from '../organisms/StyleDetails/Payments';

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
        setPartnership(await style.partnership());
      } catch (e: any) {
        console.debug(style);
        console.warn('style: ', e.message || e);
      }
    })();
  }, [style]);

  const previewImg = useMemo(() => {
    const image = style?.getMetadata().image;
    if (!image) return '';
    return ipfsGW(image);
  }, [style]);

  return (
    <ConnectAlert>
      <Container maxW="container.lg">
        <Breadcrumb my={3}>
          <BreadcrumbItem fontSize="lg">
            <BreadcrumbLink as={NavLink} to="/styles">
              All Styles
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage fontSize="lg" fontWeight="bold">
            <BreadcrumbLink>{style?.getMetadata().name}</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
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

            {partnership && (
              <Partnerships
                style={style}
                stats={stats}
                partnership={partnership}
              />
            )}
          </>
        )}
      </Container>
    </ConnectAlert>
  );
};

export default StyleDetailPage;
