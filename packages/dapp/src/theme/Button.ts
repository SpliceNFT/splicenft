const Button = {
  baseStyle: {
    rounded: 'full',

    py: '1.5em',
    _hover: {
      transform: 'translateY(-2px)',
      boxShadow: 'lg',
      _disabled: {
        opacity: 0.8,
        bg: 'intial',
        boxShadow: 'none',
        transform: 'none'
      }
    },
    _disabled: {
      opacity: 0.7,
      cursor: 'not-allowed',
      boxShadow: 'none'
    }
  },
  variants: {
    black: {
      color: 'white',
      bg: 'black',
      _disabled: {
        background: 'gray.500'
      }
    },
    white: {
      color: 'black',
      bg: 'white'
    },
    outline: {
      border: '2px solid'
    },
    solid: {
      //bg: 'purple.500',
      bg: 'white',
      color: 'black'
    }
  },
  // The default size and variant values
  defaultProps: {}
};

export default Button;
