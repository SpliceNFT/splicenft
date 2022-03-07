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
import { useStyles } from '../../context/StyleContext';

export const ArtworkStyleChooser = ({
  selectedStyle,
  onStyleChanged,
  disabled = false
}: {
  selectedStyle?: Style;
  onStyleChanged: (style: Style) => void;
  disabled?: boolean;
}) => {
  const { styles } = useStyles();

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
          {styles.map((style: Style) => (
            <MenuItem
              key={`style-${style.tokenId}`}
              onClick={() => onStyleChanged(style)}
              alignItems="center"
              justifyContent="space-between"
              gridGap={3}
            >
              <Text>{style.getMetadata().name}</Text>
              <Text fontSize="xs" fontStyle="italic">
                {' by '} {style.getMetadata().splice.creator_name}
              </Text>
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
    </Flex>
  );
};
