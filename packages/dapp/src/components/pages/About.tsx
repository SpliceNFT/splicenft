import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Icon,
  Image,
  Link,
  SimpleGrid,
  Text
} from '@chakra-ui/react';
import {
  CarouselProvider,
  Image as SlImage,
  Slide,
  Slider
} from 'pure-react-carousel';
import 'pure-react-carousel/dist/react-carousel.es.css';
import React from 'react';
import { FaTwitter } from 'react-icons/fa';
import { NavLink } from 'react-router-dom';
import extractsColorsAndMetadataImg from '../../img/SpliceExtractsColorsAndMetadata.png';
import emily from '../../img/team/emily.jpg';
import stefan from '../../img/team/stefan.jpg';
import timothy from '../../img/team/timothy.jpg';
import { ContainerHero, Hero } from '../atoms/Hero';

const Tagline = ({ children }: { children: React.ReactNode }) => {
  return (
    <Flex
      color="white"
      position="absolute"
      right={5}
      bottom={5}
      background="black"
      px={3}
      py={2}
    >
      {children}
    </Flex>
  );
};
export const AboutPage = () => {
  const buttonGradient =
    'linear(to-r, red.300, yellow.300, green.300, blue.300)';
  const buttonGradientWhite = 'linear(to-r, white, white)';
  return (
    <>
      <Hero bg="black" color="white" py={12}>
        <Container maxW="container.lg">
          <Flex direction="column" mb={6}>
            <Heading as="h1" size="3xl" mb={5} fontWeight="800">
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
              totalSlides={6}
              interval={3500}
              visibleSlides={1}
              infinite={true}
              isPlaying={true}
            >
              <Slider>
                <Slide index={0}>
                  <Tagline>
                    <Text>
                      <b>Ethscape Metropolis</b> by{' '}
                      <Link href="https://twitter.com/emilyaweil" isExternal>
                        Emily Weil
                      </Link>
                    </Text>
                  </Tagline>
                  <SlImage
                    src="/samples/bb_ethscape.png"
                    hasMasterSpinner={false}
                  />
                </Slide>
                <Slide index={1}>
                  <Tagline>
                    <Text>
                      <b>Terrain</b> by{' '}
                      <Link href="https://twitter.com/LorenBednar" isExternal>
                        Loren Bednar
                      </Link>
                    </Text>
                  </Tagline>
                  <SlImage
                    src="/samples/azuki_terrain.jpg"
                    hasMasterSpinner={false}
                  />
                </Slide>
                <Slide index={2}>
                  <Tagline>
                    <Text>
                      <b>Amazeing Fields</b> by{' '}
                      <Link href="https://twitter.com/ferjerez3d" isExternal>
                        Fernando Jerez
                      </Link>
                    </Text>{' '}
                  </Tagline>
                  <SlImage
                    src="/samples/rob_amazeing.jpg"
                    hasMasterSpinner={false}
                  />
                </Slide>
                <Slide index={3}>
                  <Tagline>
                    <Text>
                      <b>Patchwork</b> by{' '}
                      <Link
                        href="https://twitter.com/lisaorthstudio"
                        isExternal
                      >
                        Lisa Orth
                      </Link>
                    </Text>
                  </Tagline>
                  <SlImage
                    src="/samples/coolman_patchwork.jpg"
                    hasMasterSpinner={false}
                  />
                </Slide>
                <Slide index={4}>
                  <Tagline>
                    <Text>
                      <b>Waves</b> by{' '}
                      <Link href="https://twitter.com/rvig_art" isExternal>
                        RVig
                      </Link>
                    </Text>
                  </Tagline>
                  <SlImage
                    src="/samples/bean_waves.jpg"
                    hasMasterSpinner={false}
                  />
                </Slide>
                <Slide index={5}>
                  <Tagline>
                    <Text>
                      <b>District 1618</b> by{' '}
                      <Link href="https://twitter.com/splicenft" isExternal>
                        Splice Genesis
                      </Link>
                    </Text>
                  </Tagline>
                  <SlImage
                    src="/samples/wow_district.jpg"
                    hasMasterSpinner={false}
                  />
                </Slide>
              </Slider>
            </CarouselProvider>
          </Box>
        </Container>

        <Button
          w="60%"
          as={NavLink}
          to="/my-assets"
          bgGradient={buttonGradientWhite}
          transition="all .25s ease"
          _hover={{
            color: 'white',

            fontWeight: 'bolder',
            transform: 'scale(1.05)',
            bgGradient: buttonGradient
          }}
          size="md"
          fontSize="xl"
        >
          Get your own Splice
        </Button>
      </Hero>

      <ContainerHero bg="white">
        <Flex justify="center">
          <Image
            my={10}
            display={{ base: 'flex', md: 'none' }}
            src={extractsColorsAndMetadataImg}
            maxH="600pt"
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
              workplaces, tools, gifts, accessories, etc.
            </Text>
            <Text>
              Eventually, Splice will generate all sorts of digital assets.{' '}
              <Link href="https://discord.gg/JhtT87y2BA" isExternal>
                Join our Discord
              </Link>{' '}
              and{' '}
              <Link href="https://twitter.com/splicenft" isExternal>
                follow us on Twitter
              </Link>{' '}
              to determine what we Splice next.
            </Text>
            <Text>
              If you're an artist interested in creating a Splice,{' '}
              <Link
                href="https://splicenft.github.io/splicenft/artists/"
                isExternal
              >
                here's how to do that.
              </Link>
            </Text>
          </Flex>
          <Flex flex={{ base: 0, md: 1 }} justify="center">
            <Image
              display={{ base: 'none', md: 'flex' }}
              src={extractsColorsAndMetadataImg}
              maxH="600pt"
            />
          </Flex>
        </HStack>
      </ContainerHero>

      <ContainerHero bg="gray.100">
        <Flex direction="column" gridGap={10} align="center">
          <Heading size="2xl">Team</Heading>
          <SimpleGrid columns={[1, null, 3]} spacing={10}>
            <Flex direction="column" flex="1" align="center" gridGap={2}>
              <Image src={stefan} rounded="full" w="70%" />
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
                  <Icon
                    as={FaTwitter}
                    boxSize="6"
                    title="@stadolf"
                    color="twitter.500"
                  />
                  <Text fontSize="md">@stadolf</Text>
                </Flex>
              </Link>
            </Flex>
            <Flex direction="column" flex="1" align="center" gridGap={2}>
              <Image src={emily} rounded="full" w="70%" />
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
                  <Icon
                    as={FaTwitter}
                    boxSize="6"
                    title="@emilyaweil"
                    color="twitter.500"
                  />
                  <Text fontSize="md">@emilyaweil</Text>
                </Flex>
              </Link>
            </Flex>
            <Flex direction="column" flex="1" align="center" gridGap={2}>
              <Image src={timothy} rounded="full" w="70%" />
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
                  <Icon
                    as={FaTwitter}
                    boxSize="6"
                    title="@timothycbkr"
                    color="twitter.500"
                  />
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
