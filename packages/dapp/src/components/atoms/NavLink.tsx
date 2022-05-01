import { Link } from '@chakra-ui/react';
import React from 'react';
import { NavLink as ReactLink } from 'react-router-dom';

export const NavLink = (props: {
  to: string;
  title: string;
  exact?: boolean;
  isExternal?: boolean;
}) => {
  return props.isExternal ? (
    <Link variant="navlink" href={props.to} isExternal>
      Docs
    </Link>
  ) : (
    <Link
      minHeight={8}
      variant="navlink"
      as={ReactLink}
      to={props.to}
      exact={props.exact}
      activeStyle={{
        textShadow: '0 0 .85px #333, 0 0 .85px #333;',
        borderBottom: '2px solid'
      }}
    >
      {props.title}
    </Link>
  );
};
