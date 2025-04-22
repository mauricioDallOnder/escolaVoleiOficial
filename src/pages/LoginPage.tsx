import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Typography from "@mui/material/Typography";
import { useSession, signOut, signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/router";
import Layout from '@/components/TopBarComponents/Layout';

interface LoginFormInputs {
  username: string;
  password: string;
}

export default function SignInSide() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LoginFormInputs>();

  const router = useRouter();
  const { data: session } = useSession();
  const isUserLoggedIn = !!session;

  React.useEffect(() => {
    if (isUserLoggedIn) {
      reset();
    }
  }, [isUserLoggedIn, reset]);

  const handleLogin = async (data: LoginFormInputs) => {
    const result = await signIn("credentials", {
      redirect: false,
      username: data.username,
      password: data.password,
    });

    if (result?.error) {
      alert(result.error);
    }

    if (result?.url) {
      router.push(result.url);
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
   
  };

  return (
    <Layout>
      <Grid container component="main" sx={{ height: "100vh" }}>
        <CssBaseline />
        <Grid
          item
          xs={12}
          sm={8}
          md={5}
          component={Paper}
          elevation={6}
          square
        >
          <Box
            sx={{
              my: 8,
              mx: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
              <LockOutlinedIcon />
            </Avatar>
            <Typography component="h1" variant="h5">
              Login
            </Typography>
            <Box
              component="form"
              noValidate
              onSubmit={handleSubmit(handleLogin)}
              sx={{ mt: 1 }}
            >
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Usuário"
                autoFocus
                {...register("username", { required: "Username required" })}
                error={!!errors.username}
                helperText={errors.username?.message}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Senha"
                type="password"
                id="password"
                {...register("password", { required: "Password required" })}
                error={!!errors.password}
                helperText={errors.password?.message}
              />
              {!isUserLoggedIn && (
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                >
                  Fazer Login
                </Button>
              )}
              {isUserLoggedIn && (
                <>
                  <Button
                    fullWidth
                    variant="contained"
                    color="error"
                    sx={{ mt: 3, mb: 2 }}
                    onClick={handleLogout}
                  >
                    Deslogar
                  </Button>
                  <Typography variant="body1" sx={{ mt: 2 }}>
                  {isUserLoggedIn ? `Logado como: ${session.user?.name}` : ""}
                  </Typography>
                </>
              )}
            </Box>
          </Box>
        </Grid>
        <Grid
          item
          xs={false}
          sm={4}
          md={7}
          sx={{
            backgroundImage:  "url(https://firebasestorage.googleapis.com/v0/b/banco-de-dados-abc12.firebasestorage.app/o/volei.jpg?alt=media&token=387bea29-2253-4f09-90e8-e899c2de05ba)",
            backgroundRepeat: "no-repeat",
            backgroundColor: (t) =>
              t.palette.mode === 'light' ? t.palette.grey[50] : t.palette.grey[900],
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      </Grid>
    </Layout>
  );
}
