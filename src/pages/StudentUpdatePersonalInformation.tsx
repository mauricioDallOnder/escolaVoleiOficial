/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useContext, useEffect, useState } from "react";
import {
  Autocomplete,
  TextField,
  Button,
  Box,
  Container,
  Grid,
  List,
  Typography,
  Paper,
  Snackbar,
  Alert,
} from "@mui/material";
import { v4 as uuidv4 } from "uuid";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { DataContext } from "@/context/context";
import { IIAlunoUpdate } from "@/interface/interfaces";
import { HeaderForm } from "@/components/HeaderDefaultForm";
import Layout from "@/components/TopBarComponents/Layout";
import {
  BoxStyleCadastro,
  ListStyle,
  TituloSecaoStyle,
} from "@/utils/Styles";
import axios from "axios";
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]";

// Import de Firebase storage (caso use)
import { storage } from "../config/firestoreConfig";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

// Exemplo de interface com a nova estrutura
// "endereco", "numero_endereço", "complemento", "bairro", "cep", etc.
interface StudentUpdateProps {
  handleCloseModal?: () => void; // Se precisar
}

export default function StudentUpdatePersonalInformation() {
  // Busca do contexto as funções de update e fetch
  const { updateDataInApi, modalidades, fetchModalidades } = useContext(DataContext);

  // Estado do aluno selecionado no autocomplete
  const [selectedAluno, setSelectedAluno] = useState<IIAlunoUpdate | null>(null);

  // Lista de alunos disponíveis para autocomplete
  const [alunosOptions, setAlunosOptions] = useState<IIAlunoUpdate[]>([]);

  // Para upload de foto
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [photoURL, setPhotoURL] = useState<string | null>(null);

  // Para feedback ao usuário
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // React Hook Form
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { isSubmitting },
  } = useForm<IIAlunoUpdate>();

  // Carrega modalidades ao montar
  useEffect(() => {
    fetchModalidades().catch(console.error);
  }, [fetchModalidades]);

  // Quando `modalidades` mudar, construímos a lista de alunos
  useEffect(() => {
    const alunosTemp: IIAlunoUpdate[] = [];
    modalidades.forEach((modalidade) => {
      modalidade.turmas.forEach((turma) => {
        const alunosArray = Array.isArray(turma.alunos)
          ? turma.alunos.filter(Boolean)
          : [];
        alunosArray.forEach((aluno) => {
          // Monta um IIAlunoUpdate com os dados que você precisa
          alunosTemp.push({
            ...aluno,
            // Se precisar: nomeDaTurma e modalidade
            nomeDaTurma: turma.nome_da_turma,
            modalidade: modalidade.nome,
          });
        });
      });
    });
    setAlunosOptions(alunosTemp);
  }, [modalidades]);

  // Lida com troca de arquivo (para foto)
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    setSelectedFile(file);
    if (file) {
      const preview = URL.createObjectURL(file);
      setPhotoURL(preview);
    }
  };

  // Faz upload e retorna a URL final
  const uploadPhoto = async (): Promise<string | null> => {
    if (!selectedFile) return null;

    const storageRef = ref(storage, `${selectedFile.name}`);
    const uploadTask = uploadBytesResumable(storageRef, selectedFile);

    return new Promise<string | null>((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
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
            resolve(null); // se falhar, retorna null
          }
        }
      );
    });
  };

  // Ao submeter o form
  const onSubmit: SubmitHandler<IIAlunoUpdate> = async (data) => {
    try {
      let finalPhotoUrl = photoURL;
      if (selectedFile) {
        finalPhotoUrl = await uploadPhoto();
      }

      // Monta o "updatedData"
      const updatedData: IIAlunoUpdate = {
        ...data,
        foto: finalPhotoUrl || data.foto, // Se tinha foto antiga e não fez upload
      };

      // Chamamos a função do contexto para atualizar
      await updateDataInApi({
        ...updatedData,
        alunoId: selectedAluno?.alunoId, 
      });

      alert("Cadastro atualizado com sucesso!");
      reset();
      setSelectedFile(null);
      setPhotoURL(null);
      setSuccessMessage("Aluno atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao enviar os dados do formulário:", error);
      alert("Falha ao atualizar dados do aluno.");
    }
  };

  // Ao selecionar um aluno no autocomplete
  const handleAlunoChange = (_event: any, value: IIAlunoUpdate | null) => {
    setSelectedAluno(value);

    if (!value) {
      // Se nenhum aluno, limpa form
      reset();
      setPhotoURL(null);
      return;
    }

    // Preenchemos campos com base no "value"
    setValue("nome", value.nome || "");
    setValue("foto", value.foto || "");
    setValue("anoNascimento", value.anoNascimento || "");
    setValue(
      "telefoneComWhatsapp",
      value.telefoneComWhatsapp ? value.telefoneComWhatsapp.toString() : ""
    );

    // Se não existir "informacoesAdicionais", cria. (Nova estrutura)
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

    // Agora preenchemos cada campo da "nova estrutura"
    setValue(
      "informacoesAdicionais.endereco",
      value.informacoesAdicionais.endereco || ""
    );
    setValue(
      "informacoesAdicionais.numero_endereço",
      value.informacoesAdicionais.numero_endereço || ""
    );
    setValue(
      "informacoesAdicionais.complemento",
      value.informacoesAdicionais.complemento || ""
    );
    setValue(
      "informacoesAdicionais.bairro",
      value.informacoesAdicionais.bairro || ""
    );
    setValue(
      "informacoesAdicionais.cep",
      value.informacoesAdicionais.cep || ""
    );
    setValue(
      "informacoesAdicionais.plano_de_saude",
      value.informacoesAdicionais.plano_de_saude || ""
    );
    setValue(
      "informacoesAdicionais.Possui_alergia",
      value.informacoesAdicionais.Possui_alergia || ""
    );
    setValue(
      "informacoesAdicionais.nome_contato_emergencia",
      value.informacoesAdicionais.nome_contato_emergencia || ""
    );
    setValue(
      "informacoesAdicionais.telefone_contato_emergencia",
      value.informacoesAdicionais.telefone_contato_emergencia || ""
    );
    setValue(
      "informacoesAdicionais.Nome__do_responsavel",
      value.informacoesAdicionais.Nome__do_responsavel || ""
    );
    setValue(
      "informacoesAdicionais.data_de_nascimento_responsavel",
      value.informacoesAdicionais.data_de_nascimento_responsavel || ""
    );
    setValue(
      "informacoesAdicionais.documento_do_responsavel",
      value.informacoesAdicionais.documento_do_responsavel || ""
    );
    setValue(
      "informacoesAdicionais.email_do_responsavel",
      value.informacoesAdicionais.email_do_responsavel || ""
    );
    setValue(
      "informacoesAdicionais.endereco",
      value.informacoesAdicionais.endereco || ""
    );
    setValue(
      "informacoesAdicionais.funcao_do_responsavel",
      value.informacoesAdicionais.funcao_do_responsavel || ""
    );
    setValue(
      "informacoesAdicionais.hasUniforme",
      value.informacoesAdicionais.hasUniforme || false
    );
    setValue(
      "informacoesAdicionais.local_de_trabalho_do_responsavel",
      value.informacoesAdicionais.local_de_trabalho_do_responsavel || ""
    );
    setValue(
      "informacoesAdicionais.nome_contato_emergencia",
      value.informacoesAdicionais.nome_contato_emergencia || ""
    );
    setValue(
      "informacoesAdicionais.numero_endereço",
      value.informacoesAdicionais.numero_endereço || ""
    );
    setValue(
      "informacoesAdicionais.plano_de_saude",
      value.informacoesAdicionais.plano_de_saude || ""
    );
    setValue(
      "informacoesAdicionais.primeiro_telefone_do_responsavel",
      value.informacoesAdicionais.primeiro_telefone_do_responsavel || ""
    );
    setValue(
      "informacoesAdicionais.segundo_telefone_do_responsavel",
      value.informacoesAdicionais.segundo_telefone_do_responsavel || ""
    );
    setValue(
      "informacoesAdicionais.telefone_comercial_do_responsavel",
      value.informacoesAdicionais.telefone_comercial_do_responsavel || ""
    );
    setValue(
      "informacoesAdicionais.telefone_contato_emergencia",
      value.informacoesAdicionais.telefone_contato_emergencia || ""
    );
    setValue(
      "informacoesAdicionais.uniforme_do_aluno",
      value.informacoesAdicionais.uniforme_do_aluno || ""
    );
    setValue(
      "informacoesAdicionais.uniforme",
      value.informacoesAdicionais.uniforme || ""
    );

    setPhotoURL(value.foto || null);
  };

  return (
    <Layout>
      <Container>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Box sx={BoxStyleCadastro}>
            {/* Cabeçalho */}
            <HeaderForm titulo={"Atualização de dados do Aluno"} />

            {/* Autocomplete de Alunos */}
            <Autocomplete
              options={alunosOptions}
              getOptionLabel={(option) => option.nome || ""}
              onChange={handleAlunoChange}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Nome do Aluno"
                  margin="normal"
                  required
                  fullWidth
                />
              )}
              // personaliza a forma de renderizar as opções
              renderOption={(props, option) => {
                const key = `${option.informacoesAdicionais?.IdentificadorUnico}-${option.nomeDaTurma}`;
                return (
                  <li {...props} key={key}>
                    {option.nome} – {option.nomeDaTurma}
                  </li>
                );
              }}
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
                    label="Ano de Nascimento"
                    fullWidth
                    variant="filled"
                    InputLabelProps={{ shrink: true }}
                    {...register("anoNascimento")}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Telefone com WhatsApp"
                    fullWidth
                    variant="filled"
                    InputLabelProps={{ shrink: true }}
                    {...register("telefoneComWhatsapp")}
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
                          alt="Foto"
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
                  </Box>
                </Grid>
              </Grid>
            </List>

            <List sx={ListStyle}>
              <Typography sx={TituloSecaoStyle}>
                Seção 2 - Endereço e Responsável
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
              </Grid>
            </List>

            <List sx={ListStyle}>
              <Typography sx={TituloSecaoStyle}>
                Seção 3 - Saúde e Outros
              </Typography>
              <Grid container spacing={2}>
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

            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Enviando dados..." : "Atualizar Aluno"}
            </Button>

            {/* Snackbar de sucesso */}
            <Snackbar
              open={!!successMessage}
              autoHideDuration={6000}
              onClose={() => setSuccessMessage(null)}
            >
              <Alert
                onClose={() => setSuccessMessage(null)}
                severity="success"
                sx={{ width: "100%" }}
              >
                {successMessage}
              </Alert>
            </Snackbar>
          </Box>
        </form>
      </Container>
    </Layout>
  );
}

// Exemplo de SSR se precisar checar login
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

  return {
    props: {},
  };
};
