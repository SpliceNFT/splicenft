import { ChevronDownIcon } from '@chakra-ui/icons';
import {
  Button,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text
} from '@chakra-ui/react';
import { Style } from '@splicenft/common';
import React from 'react';
import { useSplice } from '../../context/SpliceContext';

export const ArtworkStyleChooser = ({
  selectedStyle,
  onStyleChanged,
  disabled = false
}: {
  selectedStyle?: Style;
  onStyleChanged: (style: Style) => void;
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
          {selectedStyle && selectedStyle.getMetadata().name}
        </MenuButton>
        <MenuList>
          {spliceStyles.map((style: Style) => (
            <MenuItem
              key={`style-${style.tokenId}`}
              onClick={() => onStyleChanged(style)}
            >
              {style.getMetadata().name}
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
    </Flex>
  );
};
