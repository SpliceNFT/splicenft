import React, { ReactNode } from 'react';
import {
  Text,
  Link,
  Icon,
  Container,
  Button,
  Flex,
  Image,
  Heading,
  HStack,
  SystemProps
} from '@chakra-ui/react';
import { NavLink } from 'react-router-dom';
import { FaTwitter } from 'react-icons/fa';

import flyFrog from '../../img/flyfrog_plain.png';
import flyFrogSample from '../../img/frog_sample_bg.png';

import stefan from '../../img/team/stefan.jpg';
import emily from '../../img/team/emily.jpg';
import timothy from '../../img/team/timothy.jpg';

const Hero = (props: { children: ReactNode } & SystemProps) => {
  const { children, ...rest } = props;
  return (
    <Flex
      width="100%"
      minH="500pt"
      bg="black"
      pt={5}
      {...rest}
      align="center"
      fontSize="large"
    >
      <Container maxW="container.lg">{children}</Container>
    </Flex>
  );
};

export const AboutPage = () => {
  return (
    <>
      <Hero bg="black" py={10} color="white">
        <Heading size="4xl" mb={5} fontWeight="800">
          {' '}
          Creative building blocks <br /> for the Metaverse
        </Heading>
        <Heading size="lg">
          Splice is a generative art project that renders deterministic,
          validated header images for existing NFTs
        </Heading>
      </Hero>

      <Hero bg="white">
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
        <HStack mb={10}>
          <Flex direction="column" gridGap={5} flex="1">
            <Heading size="xl">
              NFTs make great <b>profile pictures</b>.
            </Heading>
            <Text>
              Showing off your NFT as a profile picture, preferably on the
              collection communities' Discord channels, makes you part of the
              gang! Large communities grow around NFT collections and invent
              derivative value - like $MILK tokens and companion eggs for cool
              cats, spinoffs on BAYC or puppies for Doges.
            </Text>
            <Text>
              These derivative elements can form a metaverse where NFT
              communities flourish – a world of playspaces, workplaces, games,
              tools, accessories, weapons, etc. So that’s a great vision, but
              currently there aren’t good tools to make it happen.
            </Text>
            <Text fontSize="larger">That’s where Splice comes in.</Text>
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
      </Hero>

      <Hero bg="black" py={20}>
        <Flex direction="column" gridGap={10} color="white">
          <Heading size="xl">
            Splice generates building blocks for metaverse creation.
          </Heading>
          <Text>
            When you input your NFT, Splice extracts its features and metadata
            and generates an array of derivative elements. For the start at
            EthOnline we've built an MVP to address an immediate need:{' '}
            <b>header images</b> for places like Twitter and Discord where the
            NFT community currently lives. Anyone who owns an NFT in a
            collection that we've onboarded can create a matching header image
            on Splice.
          </Text>
          <Image src={flyFrogSample} />

          <Button
            as={NavLink}
            to="/my-assets"
            variant="black"
            size="xl"
            boxShadow="lg"
            fontSize="2xl"
            bg="cyan.400"
          >
            try it yourself.
          </Button>
        </Flex>
      </Hero>
      <Hero bg="cyan.500">
        <Flex direction="column" gridGap={10} align="center" color="white">
          <Heading size="2xl">Meet the team</Heading>
          <HStack spacing={100}>
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
          </HStack>
        </Flex>
      </Hero>
    </>
  );
};
