import { extendTheme } from '@chakra-ui/react';

import Button from './Button';
import Alert from './Alert';

export default extendTheme({
  fonts: {
    heading: 'Barlow',
    body: 'Barlow'
  },
  sizes: {
    container: {
      xl: '1500px'
    }
  },
  initialColorMode: 'light',
  useSystemColorMode: false,
  styles: {
    global: {
      body: {
        bg: 'gray.100'
      }
    }
  },
  colors: {},
  components: {
    Alert,
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
