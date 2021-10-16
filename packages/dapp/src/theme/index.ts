import { extendTheme } from '@chakra-ui/react';

import Button from './Button';

export default extendTheme({
  fonts: {
    heading: 'Barlow',
    body: 'Barlow'
  },
  initialColorMode: 'light',
  useSystemColorMode: true,
  styles: {
    global: {
      body: {
        bg: 'gray.100'
      }
    }
  },
  colors: {},
  components: {
    Button,
    Input: {
      variants: {
        outline: {
          field: {
            border: 'none'
          }
        }
      }
    },

    Container: {
      sizes: {
        xl: {
          maxW: '1800px'
        }
      }
    }
  }
});
