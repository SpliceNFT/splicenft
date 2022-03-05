import type { PartsStyleFunction } from '@chakra-ui/theme-tools';
import { anatomy } from '@chakra-ui/theme-tools';

const alertAnatomy = anatomy('alert')
  .parts('title', 'description', 'container')
  .extend('icon');

const variantBlack: PartsStyleFunction<typeof alertAnatomy> = (props) => {
  const { colorScheme: c } = props;
  return {
    container: {
      bg: 'black'
    },
    title: {
      color: `${c}.400`
    },
    icon: {
      color: `${c}.300`
    },
    description: {
      color: `${c}.500`
    }
  };
};

const Alert = {
  parts: alertAnatomy.keys,
  baseStyle: {
    container: {
      rounded: 'md',
      px: '1.5em',
      py: '.75em',
      boxShadow: 'md',
      flexDirection: 'row'
    },
    title: {}
  },
  variants: {
    black: variantBlack
  },
  // The default size and variant values
  defaultProps: {}
};

export default Alert;
