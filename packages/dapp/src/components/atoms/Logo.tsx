import { Box, Image } from '@chakra-ui/react';
import React from 'react';

import spliceSvg from '../../img/splice_logo.svg';
const Logo = () => {
  return (
    <Box maxHeight="100px">
      <Image src={spliceSvg} maxH={20} />
    </Box>
  );
};

export default Logo;
