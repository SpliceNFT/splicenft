const Button = {
  baseStyle: {
    borderRadius: 'base' // <-- border radius is same for all variants and sizes
  },
  variants: {
    login: {
      borderRadius: '2em',

      paddingLeft: '2em',
      paddingRight: '2em',
      paddingTop: '1.5em',
      paddingBottom: '1.5em',
      color: 'white',
      bg: 'black',
      _hover: {
        boxShadow: 'xl'
      }
    },

    outline: {
      border: '2px solid'
    },
    solid: {
      //bg: 'purple.500',
      color: 'white'
    },
    link: {}
  },
  // The default size and variant values
  defaultProps: {}
};

export default Button;
