// src/components/StudentUpdatePersonalInformation.tsx
"use client";
import React, { useContext, useEffect, useState, ChangeEvent } from "react";
import {
  Autocomplete,
  TextField,
  Button,
  Box,
  Container,
  Grid,
  List,
  Typography,
  Snackbar,
  Alert,
} from "@mui/material";
import { useForm, SubmitHandler } from "react-hook-form";
import { DataContext } from "@/context/context";
import { IIAlunoUpdate } from "@/interface/interfaces";
import { HeaderForm } from "@/components/HeaderDefaultForm";
import Layout from "@/components/TopBarComponents/Layout";
import { BoxStyleCadastro, ListStyle, TituloSecaoStyle } from "@/utils/Styles";
import axios from "axios";
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]";
import { storage } from "../config/firestoreConfig";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import resizeImage from "@/utils/Constants";
import { useRouter } from "next/router";

export default function StudentUpdatePersonalInformation() {
  const { updateDataInApi, modalidades, fetchModalidades } = useContext(DataContext);
  const router = useRouter();

  const [selectedAluno, setSelectedAluno] = useState<IIAlunoUpdate | null>(null);
  const [alunosOptions, setAlunosOptions] = useState<IIAlunoUpdate[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { isSubmitting },
  } = useForm<IIAlunoUpdate>();

  // Carrega as modalidades na montagem
  useEffect(() => {
    fetchModalidades().catch(console.error);
  }, [fetchModalidades]);

  // Constrói a lista de alunos para o Autocomplete
  useEffect(() => {
    const alunosTemp: IIAlunoUpdate[] = [];
    modalidades.forEach((modalidade) => {
      modalidade.turmas.forEach((turma) => {
        const alunosArray = Array.isArray(turma.alunos)
          ? turma.alunos.filter(Boolean)
          : [];
        alunosArray.forEach((aluno) => {
          alunosTemp.push({
            ...aluno,
            nomeDaTurma: turma.nome_da_turma,
            modalidade: modalidade.nome,
          });
        });
      });
    });
    setAlunosOptions(alunosTemp);
  }, [modalidades]);

  // Função para upload de foto
  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const arquivoSelecionado = event.target.files && event.target.files[0];
    if (!arquivoSelecionado) return;
    try {
      const resizedImageUrl = await resizeImage(arquivoSelecionado);
      const blob = await (await fetch(resizedImageUrl)).blob();
      const novoArquivo = new File([blob], arquivoSelecionado.name, {
        type: blob.type,
      });
      setSelectedFile(novoArquivo);
      setPhotoURL(resizedImageUrl);
    } catch (erro) {
      console.error("Erro ao redimensionar a imagem:", erro);
    }
  };

  const uploadPhoto = async (): Promise<string | null> => {
    if (!selectedFile) return null;
    const storageRef = ref(storage, `${selectedFile.name}`);
    const uploadTask = uploadBytesResumable(storageRef, selectedFile);
    return new Promise<string | null>((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Erro no upload da foto:", error);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setPhotoURL(downloadURL);
            resolve(downloadURL);
          } catch (error) {
            console.error("Erro ao obter a URL da foto:", error);
            resolve(null);
          }
        }
      );
    });
  };

  // Quando um aluno é selecionado, preenche o formulário
  const handleAlunoChange = (_event: any, value: IIAlunoUpdate | null) => {
    setSelectedAluno(value);
    if (!value) {
      reset();
      setPhotoURL(null);
      return;
    }
    // Preenche os campos do aluno
    setValue("nome", value.nome || "");
    setValue("foto", value.foto || "");
    setValue("anoNascimento", value.anoNascimento || "");
    setValue("documento", value.documento || "");

    // Se não houver informacoesAdicionais, inicializa com valores padrão (mas sem gerar identificador)
    if (!value.informacoesAdicionais) {
      value.informacoesAdicionais = {
        IdentificadorUnico: "",
        Nome__do_responsavel: "",
        Possui_alergia: "",
        bairro: "",
        cep: "",
        complemento: "",
        data_de_nascimento_responsavel: "",
        documento_do_responsavel: "",
        email_do_responsavel: "",
        endereco: "",
        funcao_do_responsavel: "",
        hasUniforme: false,
        local_de_trabalho_do_responsavel: "",
        nome_contato_emergencia: "",
        numero_endereço: "",
        plano_de_saude: "",
        primeiro_telefone_do_responsavel: "",
        segundo_telefone_do_responsavel: "",
        telefone_comercial_do_responsavel: "",
        telefone_contato_emergencia: "",
        uniforme_do_aluno: "",
        uniforme: "",
      };
    }
    // Verifica se o aluno possui o IdentificadorUnico
    if (!value.informacoesAdicionais.IdentificadorUnico) {
      alert("O aluno selecionado não possui identificador único. É necessário que o cadastro original gere esse valor. Informe o administrador ou recadastre o aluno.");
      // Opcional: você pode impedir a seleção ou forçar o cancelamento
      reset();
      setPhotoURL(null);
      setSelectedAluno(null);
      return;
    }
    setValue("informacoesAdicionais.IdentificadorUnico", value.informacoesAdicionais.IdentificadorUnico);

    // Preenche os demais campos de informacoesAdicionais
    setValue("informacoesAdicionais.endereco", value.informacoesAdicionais.endereco || "");
    setValue("informacoesAdicionais.numero_endereço", value.informacoesAdicionais.numero_endereço || "");
    setValue("informacoesAdicionais.complemento", value.informacoesAdicionais.complemento || "");
    setValue("informacoesAdicionais.bairro", value.informacoesAdicionais.bairro || "");
    setValue("informacoesAdicionais.cep", value.informacoesAdicionais.cep || "");
    setValue("informacoesAdicionais.plano_de_saude", value.informacoesAdicionais.plano_de_saude || "");
    setValue("informacoesAdicionais.Possui_alergia", value.informacoesAdicionais.Possui_alergia || "");
    setValue("informacoesAdicionais.nome_contato_emergencia", value.informacoesAdicionais.nome_contato_emergencia || "");
    setValue("informacoesAdicionais.telefone_contato_emergencia", value.informacoesAdicionais.telefone_contato_emergencia || "");
    setValue("informacoesAdicionais.Nome__do_responsavel", value.informacoesAdicionais.Nome__do_responsavel || "");
    setValue("informacoesAdicionais.data_de_nascimento_responsavel", value.informacoesAdicionais.data_de_nascimento_responsavel || "");
    setValue("informacoesAdicionais.documento_do_responsavel", value.informacoesAdicionais.documento_do_responsavel || "");
    setValue("informacoesAdicionais.email_do_responsavel", value.informacoesAdicionais.email_do_responsavel || "");
    setValue("informacoesAdicionais.primeiro_telefone_do_responsavel", value.informacoesAdicionais.primeiro_telefone_do_responsavel || "");
    setValue("informacoesAdicionais.funcao_do_responsavel", value.informacoesAdicionais.funcao_do_responsavel || "");
    setValue("informacoesAdicionais.hasUniforme", value.informacoesAdicionais.hasUniforme || false);
    setValue("informacoesAdicionais.local_de_trabalho_do_responsavel", value.informacoesAdicionais.local_de_trabalho_do_responsavel || "");
    setValue("informacoesAdicionais.nome_contato_emergencia", value.informacoesAdicionais.nome_contato_emergencia || "");
    setValue("informacoesAdicionais.numero_endereço", value.informacoesAdicionais.numero_endereço || "");
    setValue("informacoesAdicionais.plano_de_saude", value.informacoesAdicionais.plano_de_saude || "");
    setValue("informacoesAdicionais.primeiro_telefone_do_responsavel", value.informacoesAdicionais.primeiro_telefone_do_responsavel || "");
    setValue("informacoesAdicionais.segundo_telefone_do_responsavel", value.informacoesAdicionais.segundo_telefone_do_responsavel || "");
    setValue("informacoesAdicionais.telefone_comercial_do_responsavel", value.informacoesAdicionais.telefone_comercial_do_responsavel || "");
    setValue("informacoesAdicionais.telefone_contato_emergencia", value.informacoesAdicionais.telefone_contato_emergencia || "");
    setValue("informacoesAdicionais.uniforme_do_aluno", value.informacoesAdicionais.uniforme_do_aluno || "");
    setValue("informacoesAdicionais.uniforme", value.informacoesAdicionais.uniforme || "");

    setPhotoURL(value.foto || null);
  };


  const onSubmit: SubmitHandler<IIAlunoUpdate> = async (data) => {
    try {
      let finalPhotoUrl = photoURL;
      if (selectedFile) {
        finalPhotoUrl = await uploadPhoto();
      }
      if (!finalPhotoUrl) {
        alert("A foto é obrigatória para atualizar o cadastro.");
        return;
      }
      // Obtém o identificador único do aluno a partir de informacoesAdicionais
      const identificador = data.informacoesAdicionais?.IdentificadorUnico;
      if (!identificador) {
        alert("O identificador único do aluno não foi encontrado. Atualize os dados corretamente.");
        return;
      }
      const payload = {
        ...data,
        foto: finalPhotoUrl || data.foto,
        identificadorUnico: identificador,
      };

      
      await updateDataInApi(payload);
      setSuccessMessage("Aluno atualizado com sucesso!");
      reset();
      setSelectedFile(null);
      setPhotoURL(null);
      
      //router.reload();
    } catch (error) {
      console.error("Erro ao enviar os dados do formulário:", error);
      alert("Falha ao atualizar dados do aluno.");
    }
  };

  return (
    <Layout>
      <Container>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Box sx={BoxStyleCadastro}>
            <HeaderForm titulo={"Atualização de dados do Aluno"} />
            {/* Autocomplete para pesquisar o aluno pelo nome */}
            <Autocomplete
              options={alunosOptions}
              getOptionLabel={(option) => option.nome || ""}
              onChange={(event, value) => handleAlunoChange(event, value)}
              openOnFocus
              clearOnEscape={false}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Pesquise o Aluno pelo Nome"
                  margin="normal"
                  required
                  fullWidth
                />
              )}
              renderOption={(props, option) => {
                const key = `${option.informacoesAdicionais?.IdentificadorUnico}-${option.nomeDaTurma}`;
                return (
                  <li {...props} key={key}>
                    {option.nome} – {option.nomeDaTurma} ({option.modalidade})
                  </li>
                );
              }}
              isOptionEqualToValue={(option, value) =>
                option.informacoesAdicionais?.IdentificadorUnico === value?.informacoesAdicionais?.IdentificadorUnico
              }
            />

            <List sx={ListStyle}>
              <Typography sx={TituloSecaoStyle}>
                Seção 1 - Informações do Aluno
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Nome do Aluno"
                    fullWidth
                    variant="filled"
                    InputLabelProps={{ shrink: true }}
                    {...register("nome", { required: true })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Data de Nascimento"
                    fullWidth
                    variant="filled"
                    InputLabelProps={{ shrink: true }}
                    {...register("anoNascimento")}
                  />
                </Grid>
              
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Documento do aluno"
                    fullWidth
                    variant="filled"
                    InputLabelProps={{ shrink: true }}
                    {...register("documento")}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="subtitle1">Foto do Aluno</Typography>
                    <Box
                      sx={{
                        border: "1px dashed grey",
                        padding: 2,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        height: 200,
                      }}
                    >
                      {photoURL ? (
                        <img
                          src={photoURL}
                          alt="Foto do Aluno"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <Typography>Nenhuma foto selecionada</Typography>
                      )}
                      <Button variant="contained" component="label" sx={{ mt: 2 }}>
                        {photoURL ? "Alterar Foto" : "Carregar Foto"}
                        <input type="file" hidden onChange={handleFileChange} />
                      </Button>
                    </Box>
                    {!photoURL && (
                      <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                        A foto é obrigatória.
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </List>

            <List sx={ListStyle}>
              <Typography sx={TituloSecaoStyle}>
                Seção 2 - Endereço
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Endereço (rua, etc.)"
                    fullWidth
                    variant="filled"
                    InputLabelProps={{ shrink: true }}
                    {...register("informacoesAdicionais.endereco")}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Número Endereço"
                    fullWidth
                    variant="filled"
                    InputLabelProps={{ shrink: true }}
                    {...register("informacoesAdicionais.numero_endereço")}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Complemento"
                    fullWidth
                    variant="filled"
                    InputLabelProps={{ shrink: true }}
                    {...register("informacoesAdicionais.complemento")}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Bairro"
                    fullWidth
                    variant="filled"
                    InputLabelProps={{ shrink: true }}
                    {...register("informacoesAdicionais.bairro")}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="CEP"
                    fullWidth
                    variant="filled"
                    InputLabelProps={{ shrink: true }}
                    {...register("informacoesAdicionais.cep")}
                  />
                </Grid>
                
              </Grid>
           
            </List>

            <List sx={ListStyle}>
              <Typography sx={TituloSecaoStyle}>
                Seção 3 - Telefones de contato, informações dos responsáveis, questões de saúde.
              </Typography>
              <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                  <TextField
                    label="Nome do Responsável"
                    fullWidth
                    variant="filled"
                    InputLabelProps={{ shrink: true }}
                    {...register("informacoesAdicionais.Nome__do_responsavel")}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Documento do Responsável"
                    fullWidth
                    variant="filled"
                    InputLabelProps={{ shrink: true }}
                    {...register("informacoesAdicionais.documento_do_responsavel")}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="E-mail do Responsável"
                    fullWidth
                    variant="filled"
                    InputLabelProps={{ shrink: true }}
                    {...register("informacoesAdicionais.email_do_responsavel")}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Telefone Principal do Responsável"
                    fullWidth
                    variant="filled"
                    InputLabelProps={{ shrink: true }}
                    {...register("informacoesAdicionais.primeiro_telefone_do_responsavel")}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Telefone Secundário do Responsável"
                    fullWidth
                    variant="filled"
                    InputLabelProps={{ shrink: true }}
                    {...register("informacoesAdicionais.segundo_telefone_do_responsavel")}
                  />
                </Grid>
              
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Telefone Comercial do Responsável"
                    fullWidth
                    variant="filled"
                    InputLabelProps={{ shrink: true }}
                    {...register("informacoesAdicionais.telefone_comercial_do_responsavel")}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Nome do contato de emergência"
                    fullWidth
                    variant="filled"
                    InputLabelProps={{ shrink: true }}
                    {...register("informacoesAdicionais.nome_contato_emergencia")}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Telefone Principal de Emergência"
                    fullWidth
                    variant="filled"
                    InputLabelProps={{ shrink: true }}
                    {...register("informacoesAdicionais.telefone_contato_emergencia")}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Possui Alergia?"
                    fullWidth
                    variant="filled"
                    InputLabelProps={{ shrink: true }}
                    {...register("informacoesAdicionais.Possui_alergia")}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Plano de Saúde"
                    fullWidth
                    variant="filled"
                    InputLabelProps={{ shrink: true }}
                    {...register("informacoesAdicionais.plano_de_saude")}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Nome Contato Emergência"
                    fullWidth
                    variant="filled"
                    InputLabelProps={{ shrink: true }}
                    {...register("informacoesAdicionais.nome_contato_emergencia")}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Telefone Contato Emergência"
                    fullWidth
                    variant="filled"
                    InputLabelProps={{ shrink: true }}
                    {...register("informacoesAdicionais.telefone_contato_emergencia")}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Uniforme do Aluno"
                    fullWidth
                    variant="filled"
                    InputLabelProps={{ shrink: true }}
                    {...register("informacoesAdicionais.uniforme_do_aluno")}
                  />
                </Grid>
              </Grid>
            </List>

            <Button type="submit" variant="contained" disabled={isSubmitting || (!photoURL && !selectedFile)} fullWidth>
              {isSubmitting ? "Enviando dados..." : "Atualizar Aluno"}
            </Button>

            <Snackbar open={!!successMessage} autoHideDuration={6000} onClose={() => setSuccessMessage(null)}>
              <Alert onClose={() => setSuccessMessage(null)} severity="success" sx={{ width: "100%" }}>
                {successMessage}
              </Alert>
            </Snackbar>
          </Box>
        </form>
      </Container>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session || session.user.role !== "admin") {
    return {
      redirect: {
        destination: "/NotAllowPage",
        permanent: false,
      },
    };
  }
  return { props: {} };
};
