import { useQuery } from '@apollo/client';
import {
  AspectRatio,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Container,
  Flex,
  Image,
  Text
} from '@chakra-ui/react';
import { ActiveStyle, ipfsGW, Style, StyleStatsData } from '@splicenft/common';
import { useWeb3React } from '@web3-react/core';
import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { NavLink } from 'react-router-dom';
import { useSplice } from '../../context/SpliceContext';
import { useStyles } from '../../context/StyleContext';
import { StyleStatsVars, STYLE_STATS } from '../../modules/Queries';

import { Partnerships } from '../molecules/StyleDetails/Partnerships';
import { Payments } from '../organisms/StyleDetails/Payments';
import { StyleInfo } from '../organisms/StyleDetails/StyleInfo';

const BaseStyleDetailPage = (props: {
  style: Style;
  stats: StyleStatsData;
  activeStyle?: ActiveStyle;
}) => {
  const { style, stats, activeStyle } = props;

  const previewImg = useMemo(() => {
    const image = style?.getMetadata().image;
    if (!image) return '';
    return ipfsGW(image);
  }, [style]);

  return (
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
            {stats && (
              <StyleInfo
                style={style}
                activeStyle={activeStyle}
                stats={stats}
              />
            )}
          </Flex>
        </Flex>
      </AspectRatio>
      <Payments style={style} stats={stats} activeStyle={activeStyle} />
      {activeStyle && <Partnerships style={activeStyle} />}
    </>
  );
};

const SubgraphStyleDetailPage = (props: {
  style: Style;
  activeStyle?: ActiveStyle;
}) => {
  const { data: stats } = useQuery<StyleStatsData, StyleStatsVars>(
    STYLE_STATS,
    {
      variables: { style_id: props.style.tokenId.toString() }
    }
  );
  return stats ? (
    <BaseStyleDetailPage stats={stats} {...props} />
  ) : (
    <Text>loading...</Text>
  );
};

const ChainStyleDetailPage = (props: {
  style: Style;
  activeStyle?: ActiveStyle;
}) => {
  const { activeStyle } = props;
  const [stats, setStats] = useState<StyleStatsData>();

  useEffect(() => {
    if (!activeStyle) return;
    (async () => {
      activeStyle.stats().then(setStats);
    })();
  }, [activeStyle]);
  return stats ? (
    <BaseStyleDetailPage stats={stats} {...props} />
  ) : (
    <Text>loading...</Text>
  );
};

const StyleDetailPage = () => {
  const { style_id: styleId } = useParams<{ style_id: string }>();
  const { chainId } = useWeb3React();
  const { styles } = useStyles();

  const [style, setStyle] = useState<Style>();
  const { splice } = useSplice();
  const [activeStyle, setActiveStyle] = useState<ActiveStyle>();

  useEffect(() => {
    (async () => {
      const _style = styles.find((s) => s.tokenId === Number.parseInt(styleId));
      setStyle(_style);
    })();
  }, [styles]);

  useEffect(() => {
    if (style && splice) {
      setActiveStyle(new ActiveStyle(style, splice.getStyleNFT()));
    }
  }, [style, splice]);

  return (
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
      {style &&
        (chainId === 31337 ? (
          <ChainStyleDetailPage style={style} activeStyle={activeStyle} />
        ) : (
          <SubgraphStyleDetailPage style={style} activeStyle={activeStyle} />
        ))}
    </Container>
  );
};

export default StyleDetailPage;
