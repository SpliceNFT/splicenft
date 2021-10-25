import React, { ReactNode, useEffect, useState } from 'react';
import {
  Text,
  Link,
  Icon,
  Container,
  Button,
  Flex,
  Center,
  Box,
  Image,
  Heading,
  HStack,
  SimpleGrid,
  SystemProps
} from '@chakra-ui/react';
import { NavLink } from 'react-router-dom';
import { FaTwitter } from 'react-icons/fa';


import extractsColorsAndMetadataImg from '../../img/SpliceExtractsColorsAndMetadata.png';
import stefan from '../../img/team/stefan.jpg';
import emily from '../../img/team/emily.jpg';
import timothy from '../../img/team/timothy.jpg';

import {
  CarouselProvider,
  Slider,
  Slide,
  Image as SlImage
} from 'pure-react-carousel';
import 'pure-react-carousel/dist/react-carousel.es.css';

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
  return (
    <>
      <Hero bg="black" color="white" py={12}>
        <Container maxW="container.lg">
          <Flex direction="column" mb={6}>
            <Heading size="4xl" mb={5} fontWeight="800">
              Generative art for your NFT
            </Heading>
            <Heading size="lg">
              Choose your NFT, select a style, and generate a unique header
              image.
            </Heading>
          </Flex>

          <Box mb={6}>
            <CarouselProvider
              naturalSlideWidth={1500}
              naturalSlideHeight={500}
              totalSlides={4}
              interval={3500}
              visibleSlides={1}
              infinite={true}
              isPlaying={true}
            >
              <Slider>
                <Slide index={0}>
                  <SlImage
                    isBgImage
                    src="/samples/cat_district.png"
                    hasMasterSpinner={false}
                  />
                </Slide>
                <Slide index={1}>
                  <SlImage
                    isBgImage
                    src="/samples/bayc_15.png"
                    hasMasterSpinner={false}
                  />{' '}
                </Slide>
                <Slide index={2}>
                  <SlImage
                    isBgImage
                    src="/samples/doodle_5.png"
                    hasMasterSpinner={false}
                  />
                </Slide>
                <Slide index={3}>
                  <SlImage
                    isBgImage
                    src="/samples/frog_6729.png"
                    hasMasterSpinner={false}
                  />
                </Slide>
              </Slider>
            </CarouselProvider>
          </Box>
        </Container>
        <Container maxW="container.lg">
          <Button
            w="full"
            as={NavLink}
            to="/my-assets"
            variant="white"
            size="lg"
            fontSize="2xl"
          >
            Try it!
          </Button>
        </Container>
      </Hero>

      <ContainerHero bg="white">
        <Flex justify="center">
          <Image
            my={10}
            display={{ base: 'flex', md: 'none' }}
            src={extractsColorsAndMetadataImg}
            rounded="full"
            border="4px solid white"
            maxH="200pt"
            align="center"
          />
        </Flex>
        <HStack>
          <Flex direction="column" gridGap={5} flex="1">
            <Heading size="xl">How does it work?</Heading>
            <Text>
              After you select one of your NFTs, Splice extracts its color
              palette and metadata, uses that as a seed for whichever art
              algorithm you choose, and generates a one-of-a-kind header image
              for you to mint.
            </Text>
            <Heading size="lg">Why Splice?</Heading>
            <Text>
              Splice lets you mint a super-cool header image based on your NFT,
              for places like Twitter and Discord. But that’s just the
              beginning. This kind of derivative art will enrich a metaverse
              where NFT communities flourish – a world of game spaces,
              workplaces, tools, weapons, gifts, accessories, etc.
            </Text>
            <Text>
              Eventually, Splice will generate all sorts of digital assets.{' '}
              <Link
                href="https://discord.gg/JhtT87y2BA"
                isExternal
                color="purple.600"
              >
                Join our Discord
              </Link>{' '}
              and{' '}
              <Link
                href="https://twitter.com/splicenft"
                color="purple.600"
                isExternal
              >
                follow us on Twitter
              </Link>{' '}
              to determine what we Splice next.
            </Text>
          </Flex>
          <Flex flex={{ base: 0, md: 1 }} justify="center">
            <Image
              display={{ base: 'none', md: 'flex' }}
              src={extractsColorsAndMetadataImg}
              rounded="full"
              border="4px solid white"
              maxH="250pt"
            />
          </Flex>
        </HStack>
      </ContainerHero>

      <ContainerHero bg="gray.100">
        <Flex direction="column" gridGap={10} align="center">
          <Heading size="2xl">The team</Heading>
          <SimpleGrid columns={[1, null, 3]} spacing={100}>
            <Flex direction="column" flex="1" align="center" gridGap={2}>
              <Image src={stefan} rounded="full" />
              <Text fontSize="2xl" fontWeight="bold">
                Stefan "elmariachi"
              </Text>
              <Text fontSize="xl">Web3 Coder</Text>
              <Link
                href="https://twitter.com/stadolf"
                isExternal
                fontStyle="bold"
              >
                <Flex gridGap={2}>
                  <Icon as={FaTwitter} boxSize="6" title="@stadolf" />
                  <Text fontSize="md">@stadolf</Text>
                </Flex>
              </Link>
            </Flex>
            <Flex direction="column" flex="1" align="center" gridGap={2}>
              <Image src={emily} rounded="full" />
              <Text fontSize="2xl" fontWeight="bold">
                Emily
              </Text>
              <Text fontSize="xl">Generative Artist</Text>
              <Link
                href="https://twitter.com/emilyaweil"
                isExternal
                fontStyle="bold"
              >
                <Flex gridGap={2}>
                  <Icon as={FaTwitter} boxSize="6" title="@emilyaweil" />
                  <Text fontSize="md">@emilyaweil</Text>
                </Flex>
              </Link>
            </Flex>
            <Flex direction="column" flex="1" align="center" gridGap={2}>
              <Image src={timothy} rounded="full" />
              <Text fontSize="2xl" fontWeight="bold">
                Tim
              </Text>
              <Text fontSize="xl">Strategist</Text>
              <Link
                href="https://twitter.com/timothycbkr"
                isExternal
                fontStyle="bold"
              >
                <Flex gridGap={2}>
                  <Icon as={FaTwitter} boxSize="6" title="@timothycbkr" />
                  <Text fontSize="md">@timothycbkr</Text>
                </Flex>
              </Link>
            </Flex>
          </SimpleGrid>
        </Flex>
      </ContainerHero>
    </>
  );
};
