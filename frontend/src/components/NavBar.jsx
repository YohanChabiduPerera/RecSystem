import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';

const NavBar = () => {
  const location = useLocation();
  const username = localStorage.getItem('username');

  const handleLogout = () => {
    localStorage.removeItem('username');
    window.location.reload(); 
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Recommendation System
        </Typography>
        {!username && location.pathname === '/signin' && (
          <Link to="/signup" style={{ textDecoration: 'none' }}>
            <Button color="inherit">Sign Up</Button>
          </Link>
        )}
        {!username && location.pathname === '/signup' && (
          <Link to="/signin" style={{ textDecoration: 'none' }}>
            <Button color="inherit">Sign In</Button>
          </Link>
        )}
        {username && (
          <Box display="flex" alignItems="center">
            <Typography variant="body1" sx={{ marginRight: 2 }}>
              Logged in as: {username}
            </Typography>
            <Link to="/signin" style={{ textDecoration: 'none' }}>
              <Button color="inherit" onClick={handleLogout}>
                Logout
              </Button>
            </Link>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;
