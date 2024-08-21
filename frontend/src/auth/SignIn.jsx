import React, { useState } from 'react';
import { TextField, Button, Container, Typography, Box, Paper } from '@mui/material';

const SignIn = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = async () => {
    // Fetch existing users from users.json
    const response = await fetch('users.json');
    const users = await response.json();

    // Check if the user exists
    const user = users.find((u) => u.username === username && u.password === password);
    if (user) {
      alert('Sign in successful!');
    } else {
      alert('Invalid username or password');
    }

    // Reset the form
    setUsername('');
    setPassword('');
  };

  return (
    <Container
      component="main"
      maxWidth="xs"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: 400,
        }}
      >
        <Typography variant="h5" gutterBottom>
          Sign In
        </Typography>
        <Box component="form" sx={{ mt: 1 }}>
          <TextField
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            fullWidth
            margin="normal"
            variant="outlined"
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            margin="normal"
            variant="outlined"
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleSignIn}
            fullWidth
            sx={{ mt: 2 }}
          >
            Sign In
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default SignIn;
