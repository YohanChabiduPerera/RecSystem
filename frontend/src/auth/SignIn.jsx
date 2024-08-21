import React, { useState, useContext } from "react";
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
// import { VenueHistoryContext } from "../context/VenueHistoryContext";

const SignIn = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  // const { venueHistory, setVenueHistory } = useContext(VenueHistoryContext); // Use context here
  const [venueHistory, setVenueHistory] = useState([]);
  const theme = useTheme();
  const navigate = useNavigate();

  const handleSignIn = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });
  
      const data = await response.json();
  
      if (data.username === username && data.password === password) {
        localStorage.setItem("username", username);
        localStorage.setItem("user_id", data.user_id || ""); 
        setVenueHistory(data.venue_history); 
        navigate("/");
      } else {
        alert("Invalid username or password");
      }
  
      setUsername("");
      setPassword("");
    } catch (error) {
      console.error("There was a problem with the fetch operation:", error);
    }
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
