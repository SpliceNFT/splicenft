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
import { FaPaintBrush } from 'react-icons/fa';
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
          leftIcon={<FaPaintBrush />}
          disabled={disabled}
          boxShadow="md"
          textAlign="left"
          size="lg"
          rightIcon={<ChevronDownIcon />}
        >
          <Text
            fontWeight={selectedStyle ? 'bold' : 'medium'}
            fontSize={selectedStyle ? 'lg' : 'xl'}
          >
            {selectedStyle ? 'Change the style' : 'Choose a style'}
          </Text>
          {selectedStyle && (
            <Text fontWeight="medium" fontSize="md">
              {selectedStyle.getMetadata().name}
            </Text>
          )}
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
