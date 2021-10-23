import React, { ReactNode, useEffect, useState } from 'react';
import {
  Text,
  Link,
  Icon,
  Container,
  Button,
  Flex,
  Center,
  Image,
  Heading,
  HStack,
  SimpleGrid,
  SystemProps
} from '@chakra-ui/react';
import { NavLink } from 'react-router-dom';
import { FaTwitter } from 'react-icons/fa';

import flyFrog from '../../img/flyfrog_plain.png';
import flyFrogSample from '../../img/frog_sample_bg.png';

import stefan from '../../img/team/stefan.jpg';
import emily from '../../img/team/emily.jpg';
import timothy from '../../img/team/timothy.jpg';
import { P5Sketch } from '../molecules/P5Sketch';
import { Renderers, RGB } from '@splicenft/common';

const Hero = (props: { children: ReactNode } & SystemProps) => {
  const { children, ...rest } = props;
  return (
    <Flex
      width="100%"
      bg="black"
      pt={5}
      align="center"
      fontSize="large"
      direction="column"
      {...rest}
    >
      {children}
    </Flex>
  );
};

const ContainerHero = (props: { children: ReactNode } & SystemProps) => {
  const { children, ...rest } = props;
  return (
    <Hero py={12} {...rest}>
      <Container maxW="container.lg">{children}</Container>
    </Hero>
  );
};

export const AboutPage = () => {
  const dominantColors: RGB[] = [
    [168, 35, 33],
    [240, 239, 122],
    [242, 176, 174],
    [145, 202, 242],
    [39, 114, 168]
  ];
  const renderers = Object.keys(Renderers);

  const [currentRenderer, setCurrentRenderer] = useState<{
    randomness: number;
    idx: number;
    key: string;
  }>({
    randomness: Math.PI * 100_000_000,
    idx: 0,
    key: renderers[0]
  });

  useEffect(() => {
    const iv = setInterval(() => {
      const idx = (currentRenderer.idx + 1) % renderers.length;
      const randomness = (currentRenderer.randomness += 1);
      setCurrentRenderer({ idx, key: renderers[idx], randomness });
    }, 5000);
    return () => {
      clearInterval(iv);
    };
  }, [currentRenderer]);
  return (
    <>
      <Hero bg="black" color="white" py={12}>
        <Container maxW="container.lg">
          <Flex direction="column" my={12}>
            <Heading size="4xl" mb={5} fontWeight="800">
              Generative Art for your NFT
            </Heading>
            <Heading size="lg">
              Choose one of your NFTs, select a style, and Splice will generate
              a unique header image for you.
            </Heading>
          </Flex>
        </Container>
        <Center mb={12} overflow="hidden" maxW="100%">
          <P5Sketch
            randomness={currentRenderer.randomness}
            dim={{ w: 1500, h: 500 }}
            colors={dominantColors}
            onSketched={() => {
              return false;
            }}
            rendererName={currentRenderer.key}
          />
        </Center>
        <Container maxW="container.lg">
          <Button
            w="full"
            as={NavLink}
            to="/my-assets"
            variant="white"
            size="lg"
            fontSize="2xl"
          >
            try it yourself.
          </Button>
        </Container>
      </Hero>

      <ContainerHero bg="white">
        <Flex justify="center">
          <Image
            my={10}
            display={{ base: 'flex', md: 'none' }}
            src={flyFrog}
            rounded="full"
            border="4px solid white"
            maxH="200pt"
            align="center"
          />
        </Flex>
        <HStack>
          <Flex direction="column" gridGap={5} flex="1">
            <Heading size="xl">
              NFTs make great <b>profile pictures</b>.
            </Heading>
            <Text>
              Showing off your NFT as a profile picture makes you part of the
              gang! Large communities grow around NFT collections and have
              derivative value on their roadmaps - like{' '}
              <Link
                href="https://discord.com/channels/845608239013167104/850356675993927701/898681968147955732"
                isExternal
              >
                $MILK tokens for creature breeding on cool cats
              </Link>
              ,{' '}
              <Link
                href="https://opensea.io/collection/mutant-ape-yacht-club"
                isExternal
              >
                BAYC spinoffs
              </Link>
              ,{' '}
              <Link
                href="https://opensea.io/collection/doge-pound-puppies-real"
                isExternal
              >
                Dogepound Puppies
              </Link>{' '}
              or{' '}
              <Link href="https://www.lootproject.com/" isExternal>
                Loot tokens as unique seed for new creations
              </Link>
              .
            </Text>
            <Text>
              Derivative arts form a metaverse where NFT communities flourish –
              a world of playspaces, workplaces, games, tools, accessories,
              weapons, etc. So that’s a great vision, but currently there aren’t
              great, generic tools to make it happen.
            </Text>
            <Text fontSize="larger" fontWeight="bold">
              That’s where Splice comes in.
            </Text>
          </Flex>
          <Flex flex={{ base: 0, md: 1 }} justify="center">
            <Image
              display={{ base: 'none', md: 'flex' }}
              src={flyFrog}
              rounded="full"
              border="4px solid white"
              maxH="250pt"
            />
          </Flex>
        </HStack>
      </ContainerHero>

      <ContainerHero bg="black">
        <Flex direction="column" gridGap={10} color="white">
          <Heading size="xl">
            Splice generates building blocks for metaverse creation.
          </Heading>
          <Text>
            When you input your NFT, Splice extracts its{' '}
            <b>features and metadata</b> to build derivative elements based on
            them. For the start{' '}
            <Link
              href="https://showcase.ethglobal.com/ethonline2021/splice"
              isExternal
            >
              at EthOnline 21
            </Link>{' '}
            we've built an MVP to address an immediate need:{' '}
            <b>header images</b> for places like Twitter and Discord where the
            NFT community currently lives. Anyone who owns an NFT in a
            collection that we've onboarded can create a matching header image
            on Splice.
          </Text>
          <Image src={flyFrogSample} />
        </Flex>
      </ContainerHero>
      <ContainerHero bg="cyan.500">
        <Flex direction="column" gridGap={10} align="center" color="white">
          <Heading size="2xl">Meet the team</Heading>
          <SimpleGrid columns={[1, 3]} spacing={100}>
            <Flex direction="column" flex="1" align="center" gridGap={2}>
              <Image src={stefan} rounded="full" />
              <Text fontSize="2xl">Stefan "elmariachi"</Text>
              <Text fontSize="xl">Code</Text>
              <Link
                href="https://twitter.com/stadolf"
                isExternal
                fontStyle="bold"
              >
                <Icon as={FaTwitter} boxSize="6" title="@stadolf" />
              </Link>
            </Flex>
            <Flex direction="column" flex="1" align="center" gridGap={2}>
              <Image src={emily} rounded="full" />
              <Text fontSize="2xl">Emily</Text>
              <Text fontSize="xl">Art</Text>
              <Link
                href="https://twitter.com/emilyaweil"
                isExternal
                fontStyle="bold"
              >
                <Icon as={FaTwitter} boxSize="6" title="@emilyaweil" />
              </Link>
            </Flex>
            <Flex direction="column" flex="1" align="center" gridGap={2}>
              <Image src={timothy} rounded="full" />
              <Text fontSize="2xl">Tim</Text>
              <Text fontSize="xl">Strategy</Text>
              <Link
                href="https://twitter.com/TimothyCDB"
                isExternal
                fontStyle="bold"
              >
                <Icon as={FaTwitter} boxSize="6" title="@TimothyCDB" />
              </Link>
            </Flex>
          </SimpleGrid>
        </Flex>
      </ContainerHero>
    </>
  );
};
