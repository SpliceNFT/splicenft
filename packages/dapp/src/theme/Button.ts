const Button = {
  baseStyle: {
    rounded: 'lg',
    color: 'white',
    bg: 'black',
    py: '1.5em',
    _hover: {
      transform: 'translateY(-2px)',
      boxShadow: 'xl'
    }
  },
  variants: {
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
