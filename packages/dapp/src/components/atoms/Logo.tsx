import { Box, Image } from '@chakra-ui/react';
import React from 'react';
import { Link } from 'react-router-dom';
import splicePlain from '../../img/splice_plain.svg';

const Logo = () => {
  return (
    <Box maxHeight="80px" flex="2">
      <Link to="/">
        <Image src={splicePlain} h={20} />
      </Link>
    </Box>
  );
};

export default Logo;
