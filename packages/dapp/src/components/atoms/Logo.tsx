import { Box, Image } from '@chakra-ui/react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import spliceBox from '../../img/splice_box.svg';
import splicePlain from '../../img/splice_plain.svg';

const Logo = () => {
  const [logo, setLogo] = useState(splicePlain);

  return (
    <Box
      maxHeight="80px"
      onMouseOver={() => setLogo(splicePlain)}
      onMouseOut={() => setLogo(spliceBox)}
    >
      <Link to="/">
        <Image src={logo} maxH={14} />
      </Link>
    </Box>
  );
};

export default Logo;
