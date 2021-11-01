import { ChevronDownIcon } from '@chakra-ui/icons';
import {
  Button,
  Flex,
  Menu,
  Text,
  MenuButton,
  MenuItem,
  MenuList
} from '@chakra-ui/react';
import { StyleNFTResponse } from '@splicenft/common';
import React from 'react';
import { useSplice } from '../../context/SpliceContext';

export const ArtworkStyleChooser = ({
  selectedStyle,
  onStyleChanged,
  disabled = false
}: {
  selectedStyle?: StyleNFTResponse;
  onStyleChanged: (style: StyleNFTResponse) => void;
  disabled?: boolean;
}) => {
  const { spliceStyles } = useSplice();

  return (
    <Flex direction="row">
      <Menu>
        <MenuButton
          as={Button}
          variant="white"
          disabled={disabled}
          boxShadow="md"
          textAlign="left"
          rightIcon={<ChevronDownIcon />}
        >
          <Text fontWeight="normal" fontSize={selectedStyle ? 'xs' : 'md'}>
            choose a style
          </Text>
          {selectedStyle && selectedStyle.metadata.name}
        </MenuButton>
        <MenuList>
          {spliceStyles.map((style: StyleNFTResponse) => (
            <MenuItem
              key={`style-${style.style_token_id}`}
              onClick={() => onStyleChanged(style)}
            >
              {style.metadata.name}
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
    </Flex>
  );
};
