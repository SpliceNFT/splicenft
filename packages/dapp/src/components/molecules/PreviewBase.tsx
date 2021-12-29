import { Flex, Center, AspectRatio } from '@chakra-ui/react';

export const PreviewBase = ({
  nftImage,
  children
}: {
  nftImage: React.ReactNode;
  children: React.ReactNode;
}) => (
  <Flex
    position="relative"
    minHeight="20vw"
    borderBottomWidth="1px"
    borderBottomStyle="solid"
    borderBottomColor="gray.200"
  >
    <Center width="100%" height="100%" position="relative">
      {children}
    </Center>
    <Center position="absolute" width="100%" height="100%">
      <AspectRatio
        ratio={1}
        rounded="full"
        border="4px solid white"
        w="15%"
        overflow="hidden"
      >
        {nftImage}
      </AspectRatio>
    </Center>
  </Flex>
);
