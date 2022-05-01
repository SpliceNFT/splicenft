import { extendTheme } from '@chakra-ui/react';
import Alert from './Alert';
import Button from './Button';

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
      },
      '.footer': {
        a: {
          color: 'gray.200'
        }
      },
      '.subfooter': {
        a: {
          color: 'gray.500'
        }
      }
    }
  },
  colors: {},
  components: {
    Alert,
    Button,
    Link: {
      baseStyle: {
        color: 'twitter.500'
      },
      variants: {
        navlink: {
          color: 'black',
          textDecoration: 'none',
          _hover: {
            textDecoration: 'none',
            //textShadow: '0 0 .85px #333, 0 0 .85px #333;',
            borderBottom: '2px solid'
          }
        }
      }
    },
    Input: {
      variants: {
        filled: {
          field: {
            background: 'white',
            _focus: {
              background: 'gray.100'
            },
            _hover: {
              bg: 'white'
            }
          }
        },
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
