const Button = {
  baseStyle: {
    borderRadius: '.8em',
    paddingLeft: '2em',
    paddingRight: '2em',
    paddingTop: '1.5em',
    paddingBottom: '1.5em',
    color: 'white',
    bg: 'black',
    _hover: {
      transform: 'translate(0,-2px)'
    }
  },
  variants: {
    login: {
      borderRadius: '2em',
      _hover: {
        boxShadow: 'xl'
      }
    },

    outline: {
      border: '2px solid'
    },
    solid: {
      //bg: 'purple.500',
      bg: 'white',
      color: 'black'
    },
    link: {}
  },
  // The default size and variant values
  defaultProps: {}
};

export default Button;
