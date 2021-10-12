import { ChevronDownIcon } from '@chakra-ui/icons';
import {
  Button,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  MenuList
} from '@chakra-ui/react';

import React from 'react';
import { RendererNames } from '@splicenft/common';

export const ArtworkStyleChooser = ({
  selectedRenderer,
  onRendererChanged,
  disabled = false
}: {
  selectedRenderer?: string;
  onRendererChanged: (rendererName: string) => void;
  disabled?: boolean;
}) => (
  <Flex direction="row">
    <Menu>
      <MenuButton
        as={Button}
        variant="black"
        disabled={disabled}
        rightIcon={<ChevronDownIcon />}
      >
        {selectedRenderer ? selectedRenderer : 'choose a style'}
      </MenuButton>
      <MenuList>
        {RendererNames.map((name) => (
          <MenuItem
            key={`renderer-${name}`}
            onClick={() => onRendererChanged(name)}
          >
            {name}
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  </Flex>
);
