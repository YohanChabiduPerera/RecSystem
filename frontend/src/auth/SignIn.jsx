import React, { useState } from "react";
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  useTheme,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const SignIn = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const theme = useTheme();
  const navigate = useNavigate();

  const handleSignIn = async () => {
    const response = await fetch("users.json");
    const users = await response.json();

    const user = users.find(
      (u) => u.username === username && u.password === password
    );
    if (user) {
      localStorage.setItem("username", username);
      // alert('Sign in successful!');
      navigate("/");
    } else {
      alert("Invalid username or password");
    }

    setUsername("");
    setPassword("");
  };

  return (
    <Container
      component="main"
      maxWidth="xs"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: theme.palette.background.default,
      }}
    >
      <Paper
        elevation={6}
        sx={{
          padding: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          maxWidth: 400,
          borderRadius: 4,
        }}
      >
        <Typography
          variant="h4"
          gutterBottom
          color={theme.palette.primary.main}
        >
          Sign In
        </Typography>
        <Box component="form" sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                fullWidth
                variant="outlined"
                InputProps={{
                  style: {
                    borderRadius: 8,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                variant="outlined"
                InputProps={{
                  style: {
                    borderRadius: 8,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSignIn}
                fullWidth
                sx={{
                  padding: 1.5,
                  borderRadius: 8,
                  textTransform: "none",
                  fontSize: 16,
                }}
              >
                Sign In
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default SignIn;
