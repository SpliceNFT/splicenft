const Button = {
  baseStyle: {
    rounded: 'full',

    py: '1.5em',
    _hover: {
      transform: 'translateY(-2px)',
      boxShadow: 'lg'
    }
  },
  variants: {
    black: {
      color: 'white',
      bg: 'black'
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
