/* eslint-disable @typescript-eslint/no-unused-vars */
import { useForm, SubmitHandler } from "react-hook-form";
import {
  FormValuesStudent,
  Turma,
  formValuesStudentSchema,
} from "@/interface/interfaces";
import React, { useEffect, useState } from "react";
import {
  fieldsDadosGeraisAtleta,
  fieldsEndereco,
  fieldsIdentificacao,
  fieldsResponsavelMensalidade,
  fieldsTermosAvisos,
  getErrorMessage,
  opcoesTermosAvisos,
  vinculosempresasparceiras,
} from "@/utils/Constants";
import {
  Box,
  Button,
  Container,
  Divider,
  FormControlLabel,
  Grid,
  List,
  MenuItem,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import { BoxStyleCadastro, ListStyle, TituloSecaoStyle } from "@/utils/Styles";
import { useData } from "@/context/context";
import { HeaderForm } from "@/components/HeaderDefaultForm";
import Layout from "@/components/TopBarComponents/Layout";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import "react-image-crop/dist/ReactCrop.css";
import { storage } from "../config/firestoreConfig";
import resizeImage from "../utils/Constants";
import { v4 as uuidv4 } from "uuid";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { CorrigirDadosDefinitivos } from "@/utils/CorrigirDadosTurmasEmComponetes";

export default function StudentRegistration() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<FormValuesStudent>({
    resolver: zodResolver(formValuesStudentSchema),
    defaultValues: {
      turmaSelecionada: "",
      aluno: {
        informacoesAdicionais: {
          uniforme: "",
        },
      },
    },
  });
  const { modalidades, fetchModalidades, sendDataToApi } = useData();

  // Upload de imagem
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("onFileChange - Início");
    const file = event.target.files![0];
    try {
      const resizedImageUrl = await resizeImage(file);
      setFile(
        new File([await (await fetch(resizedImageUrl)).blob()], file.name)
      );
      setAvatarUrl(resizedImageUrl);
      console.log("onFileChange - Imagem processada");
    } catch (error) {
      console.error("onFileChange - Erro", error);
    }
  };

  useEffect(() => {
    fetchModalidades();
  }, [fetchModalidades]);

  // Como só existe uma modalidade, pegamos a primeira
  const singleModalidade = modalidades && modalidades[0];
  const turmasDisponiveis: Turma[] = singleModalidade ? singleModalidade.turmas : [];

  const onSubmit: SubmitHandler<FormValuesStudent> = async (formData) => {
    console.log("onSubmit - Início");

    if (!formData.turmaSelecionada) {
      alert("Por favor, selecione uma turma.");
      return;
    }

    let fotoUrl = "";
    if (file) {
      setIsUploading(true);
      try {
        const fileName = uuidv4() + file.name;
        const fileRef = ref(storage, fileName);
        const uploadTask = uploadBytesResumable(fileRef, file);

        await new Promise((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              // opcional: atualizar o progresso do upload aqui
            },
            (error) => {
              console.error("Erro no upload:", error);
              reject(error);
            },
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              setIsUploading(false);
              fotoUrl = downloadURL;
              resolve(downloadURL);
            }
          );
        });
      } catch (error) {
        console.error("Falha no upload:", error);
        setIsUploading(false);
        return;
      }
    }

    const mydate = new Date(Date.now()).toLocaleString().split(",")[0];
    const uniforme = false;
    formData.aluno.dataMatricula = mydate;
    formData.aluno.informacoesAdicionais.hasUniforme = uniforme;
    formData.aluno.informacoesAdicionais.IdentificadorUnico = uuidv4();

    // Prepara os dados para envio. Incluímos a modalidade fixa (a única disponível) e a turma selecionada.
    const dataParaProcessar = [
      {
        ...formData,
        modalidade: singleModalidade ? singleModalidade.nome : "",
        aluno: {
          ...formData.aluno,
          foto: fotoUrl,
        },
      },
    ];

    try {
      const { resultados } = await sendDataToApi(dataParaProcessar);
      const todosSucessos = resultados.every((resultado) => resultado.sucesso);
      if (todosSucessos) {
        alert("Todos os cadastros foram efetuados com sucesso!");
        resetFormulario();
      } else {
        const mensagensErro = resultados
          .filter((resultado) => !resultado.sucesso)
          .map((resultado) => resultado.erro)
          .join("\n");
        alert(`O cadastro falhou, motivo:\n${mensagensErro}`);
      }
    } catch (error) {
      console.error("Erro ao enviar dados dos alunos: ", error);
      alert(
        "Ocorreu um erro ao tentar realizar o cadastro. Por favor, tente novamente."
      );
    }
  };

  const resetFormulario = () => {
    reset();
    setFile(null);
    setAvatarUrl("");
    setIsUploading(false);
    setUploadProgress(0);
    CorrigirDadosDefinitivos();
  };

  return (
    <Layout>
      <Container>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Box sx={BoxStyleCadastro}>
            <Box sx={{ display: "table", width: "100%" }}>
              <HeaderForm titulo={"Cadastro de Atletas"} />
            </Box>
            <List sx={ListStyle}>
              <Typography sx={TituloSecaoStyle}>
                Seção 1 - Identificação do Aluno
              </Typography>
              <Grid container spacing={2}>
                {fieldsIdentificacao.map(({ label, id }) => (
                  <Grid item xs={12} sm={6} key={id}>
                    <TextField
                      fullWidth
                      label={label}
                      variant="standard"
                      error={Boolean(getErrorMessage(errors, id))}
                      helperText={getErrorMessage(errors, id)}
                      {...register(id as keyof FormValuesStudent)}
                    />
                  </Grid>
                ))}
                <Grid item xs={12} sm={6}>
                  <Box
                    sx={{
                      border: "1px dashed grey",
                      borderRadius: "4px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "100%",
                      height: "200px",
                      overflow: "hidden",
                      position: "relative",
                      "&:hover": {
                        backgroundColor: "#f0f0f0",
                        cursor: "pointer",
                      },
                    }}
                  >
                    {avatarUrl ? (
                      <>
                        <img
                          src={avatarUrl}
                          alt="Avatar"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                        <Box
                          sx={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            width: "100%",
                            backgroundColor: "rgba(0, 0, 0, 0.5)",
                            color: "white",
                            textAlign: "center",
                            p: "8px",
                          }}
                        >
                          <Button
                            variant="contained"
                            component="label"
                            size="small"
                            color="primary"
                          >
                            Alterar Foto do Atleta
                            <input
                              type="file"
                              hidden
                              accept="image/*"
                              onChange={onFileChange}
                            />
                          </Button>
                        </Box>
                      </>
                    ) : (
                      <Button
                        variant="contained"
                        component="label"
                        size="small"
                        color="primary"
                      >
                        Carregar Foto do Atleta
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={onFileChange}
                        />
                      </Button>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </List>

            <List sx={ListStyle}>
              <Typography sx={TituloSecaoStyle}>
                Seção 2 - Informações Pessoais e de Saúde do Aluno
              </Typography>
              <Grid container spacing={2}>
                {fieldsDadosGeraisAtleta.map(({ label, id }) => (
                  <Grid item xs={12} sm={6} key={id}>
                    <TextField
                      fullWidth
                      id={id}
                      label={label}
                      variant="standard"
                      sx={{ borderRadius: "4px" }}
                      error={Boolean(getErrorMessage(errors, id))}
                      helperText={getErrorMessage(errors, id)}
                      {...register(id as keyof FormValuesStudent)}
                    />
                  </Grid>
                ))}
              </Grid>
            </List>

            <List sx={ListStyle}>
              <Typography sx={TituloSecaoStyle}>
                Seção 3 - Endereço Residencial do Aluno
              </Typography>
              <Grid container spacing={2}>
                {fieldsEndereco.map(({ label, id }) => (
                  <Grid item xs={12} sm={6} key={id}>
                    <TextField
                      fullWidth
                      id={id}
                      label={label}
                      variant="standard"
                      sx={{ borderRadius: "4px" }}
                      required
                      error={Boolean(getErrorMessage(errors, id))}
                      helperText={getErrorMessage(errors, id)}
                      {...register(id as keyof FormValuesStudent)}
                    />
                  </Grid>
                ))}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Complemento"
                    variant="standard"
                    sx={{ borderRadius: "4px" }}
                    {...register("aluno.informacoesAdicionais.endereco.complemento")}
                  />
                </Grid>
              </Grid>
            </List>

            <List sx={ListStyle}>
              <Typography sx={TituloSecaoStyle}>
                Seção 4 - Informações do Responsável Financeiro
              </Typography>
              <Grid container spacing={2}>
                {fieldsResponsavelMensalidade.map(({ label, id }) => (
                  <Grid item xs={12} sm={6} key={id}>
                    <TextField
                      fullWidth
                      id={id}
                      label={label}
                      variant="standard"
                      sx={{ borderRadius: "4px" }}
                      error={Boolean(getErrorMessage(errors, id))}
                      helperText={getErrorMessage(errors, id)}
                      required
                      {...register(id as keyof FormValuesStudent)}
                    />
                  </Grid>
                ))}
              </Grid>
            </List>

            <List sx={ListStyle}>
              <Typography sx={TituloSecaoStyle}>
                Seção 5 - Conexões com Empresas Parceiras
              </Typography>
              <Grid container spacing={2}>
                {vinculosempresasparceiras.map(({ label, id }) => (
                  <Grid item xs={12} sm={6} key={id}>
                    <TextField
                      fullWidth
                      id={id}
                      label={label}
                      variant="standard"
                      sx={{ borderRadius: "4px" }}
                      error={Boolean(getErrorMessage(errors, id))}
                      helperText={getErrorMessage(errors, id)}
                      required
                      {...register(id as keyof FormValuesStudent)}
                    />
                  </Grid>
                ))}
              </Grid>
            </List>

            <List sx={ListStyle}>
              <Typography sx={TituloSecaoStyle}>
                Seção 6 - Especificações sobre o Uniforme
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    select
                    defaultValue={""}
                    label="Tamanho do Uniforme"
                    variant="outlined"
                    fullWidth
                    required
                    {...register("aluno.informacoesAdicionais.uniforme")}
                    helperText="Selecione o tamanho do uniforme"
                    error={!!errors.aluno?.informacoesAdicionais?.uniforme}
                  >
                    {[
                      { value: "Pi - 6", label: "Pi - 6" },
                      { value: "Mi - 8", label: "Mi - 8" },
                      { value: "Gi - 10", label: "Gi - 10" },
                      { value: "GGi - 12", label: "GGi - 12" },
                      { value: "PP - 14", label: "PP - 14" },
                      { value: "P adulto", label: "P adulto" },
                      { value: "M adulto", label: "M adulto" },
                      { value: "G adulto", label: "G adulto" },
                      { value: "GG adulto", label: "GG adulto" },
                      { value: "Outro", label: "Outro (informar pelo Whatsapp)" },
                    ].map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
            </List>

            <List sx={ListStyle}>
              <Typography sx={TituloSecaoStyle}>
                Seção 8 - Escolha da Turma
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Turma"
                    fullWidth
                    variant="outlined"
                    defaultValue=""
                    {...register("turmaSelecionada", { required: true })}
                  >
                    {turmasDisponiveis.map((turma, index) => (
                      <MenuItem
                        key={`${turma.nome_da_turma}-${index}`}
                        value={turma.nome_da_turma}
                      >
                        {turma.nome_da_turma}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
            </List>

            <List sx={ListStyle}>
              <Typography sx={TituloSecaoStyle}>
                Seção 9 - Acordos e Termos de Responsabilidade
              </Typography>
              <Grid container spacing={2}>
                {fieldsTermosAvisos.map(({ label, id }) => (
                  <Grid
                    item
                    xs={12}
                    key={id}
                    sx={{
                      padding: 2,
                      border: "1px solid #e0e0e0",
                      borderRadius: "4px",
                      boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.05)",
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: "bold",
                        color: "#333",
                        marginBottom: 1,
                        textAlign: "center",
                      }}
                    >
                      {label}
                    </Typography>
                    <RadioGroup
                      row
                      aria-labelledby={id}
                      {...register(id as keyof FormValuesStudent)}
                    >
                      {opcoesTermosAvisos[id.split(".")[2]].map(
                        (opcao, index) => (
                          <FormControlLabel
                            key={index}
                            value={opcao}
                            control={<Radio required />}
                            label={opcao}
                            sx={{
                              color: "#333",
                              marginRight: 2,
                              textAlign: "center",
                            }}
                          />
                        )
                      )}
                    </RadioGroup>
                  </Grid>
                ))}
              </Grid>
            </List>
            {avatarUrl === "" ? (
              <Button variant="contained" color="error" disabled>
                É necessário adicionar uma foto do atleta para concluir o cadastro!
              </Button>
            ) : (
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting || isUploading || avatarUrl === ""}
              >
                {isSubmitting || isUploading
                  ? "Enviando dados, aguarde..."
                  : "Cadastrar Atleta"}
              </Button>
            )}
          </Box>
        </form>
      </Container>
    </Layout>
  );
}
