import { extendTheme } from '@chakra-ui/react';

import Button from './Button';

export default extendTheme({
  initialColorMode: 'light',
  useSystemColorMode: true,
  styles: {
    global: {
      body: {
        bg: 'white'
      }
    }
  },
  colors: {},
  fonts: {
    // body: 'Roboto',
    // heading: 'Roboto'
  },
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
