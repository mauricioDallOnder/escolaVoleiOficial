import React, { useState, useEffect } from "react";
import axios from "axios";
import { useForm, SubmitHandler } from "react-hook-form";
import {
  Box,
  Button,
  Checkbox,
  Container,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  List,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import {
  BoxStyleCadastro,
  ListStyle,
  TituloDaPagina,
  TituloSecaoStyle,
} from "@/utils/Styles";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import resizeImage from "@/utils/Constants";
import { storage } from "@/config/firestoreConfig";
import { PhotoCamera } from "@mui/icons-material";
import Layout from "@/components/TopBarComponents/Layout";
import { useData } from "@/context/context";
import { Turma } from "@/interface/interfaces";
import { HeaderForm } from "@/components/HeaderDefaultForm";
import { CorrigirDadosDefinitivos } from "@/utils/CorrigirDadosTurmasEmComponetes";


// --------------------------------------------------------------
// Interfaces de tipagem
// --------------------------------------------------------------
interface InformacoesAdicionais {
  Nome__do_responsavel: string;
  [key: string]: any; // se quiser campos extras livres
}

interface Aluno {
  nome: string;
  anoNascimento: string;
  documento?: string;
  foto?: string; // aqui definimos a foto
  informacoesAdicionais: InformacoesAdicionais;
}

interface FormularioCadastroAluno {
  turmaSelecionada: string;
  aluno: Aluno;
}

// Campos que não vão ao back-end, mas são obrigatórios no front:
interface TermosContrato {
  liContrato1: boolean; // "Li e estou ciente do contrato de 1 ano..."
  liContrato2: boolean; // "Li e estou ciente que o vencimento..."
  liContrato3: boolean; // "A ausência do aluno não isenta..."
  liContrato4: boolean; // "Cancelamento: Frente à quebra..."
  liContrato5: boolean; // "Você se compromete a avisar..."
  liContrato6: boolean; // "Estou de acordo com o desconto"
  liContrato7: boolean; // "Você declara que o menor está em perfeitas condições..."
  liContrato8: boolean; // "O uso da imagem e nome do(a) atleta..."
}

// --------------------------------------------------------------
// Componente de Cadastro
// --------------------------------------------------------------
export default function CadastrarAlunoPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormularioCadastroAluno & TermosContrato>({
    defaultValues: {
      turmaSelecionada: "",
      aluno: {
        nome: "",
        anoNascimento: "",
        informacoesAdicionais: {
          Nome__do_responsavel: "",
        },
      },
      liContrato1: false,
      liContrato2: false,
      liContrato3: false,
      liContrato4: false,
      liContrato5: false,
      liContrato6: false,
      liContrato7: false,
      liContrato8: false,
    },
  });

  // ESTADOS PARA UPLOAD
  const [file, setFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // FEEDBACK AO USUÁRIO
  const [mensagem, setMensagem] = useState<string>("");
  const [estaCarregando, setEstaCarregando] = useState<boolean>(false);

  // CONTEXTO DE DADOS
  const { modalidades, fetchModalidades } = useData();


  // Vamos guardar as turmas de "volei" ou de outra modalidade
  const [turmas, setTurmas] = useState<any[]>([]);

  // Carrega as turmas ao montar o componente
  useEffect(() => {
    fetchModalidades();
  }, [fetchModalidades]);
  // Como só existe uma modalidade, pegamos a primeira
  const singleModalidade = modalidades && modalidades[0];
  const turmasDisponiveis: Turma[] = singleModalidade ? singleModalidade.turmas : [];
  //setTurmas(turmasDisponiveis)


  /**
   * onFileChange: quando o usuário seleciona um arquivo
   */
  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const arquivoSelecionado = event.target.files && event.target.files[0];
    if (!arquivoSelecionado) return;
    try {
      const resizedImageUrl = await resizeImage(arquivoSelecionado);
      const blob = await (await fetch(resizedImageUrl)).blob();
      const novoArquivo = new File([blob], arquivoSelecionado.name, {
        type: blob.type,
      });

      setFile(novoArquivo);
      setAvatarUrl(resizedImageUrl);
    } catch (erro) {
      console.error("Erro ao redimensionar a imagem:", erro);
    }
  };

  /**
   * Faz o upload da foto para o Firebase Storage e retorna a URL.
   */
  async function uploadFotoParaFirebase(): Promise<string | null> {
    if (!file) return null;
    setIsUploading(true);

    try {
      const nomeUnico = uuidv4() + "_" + file.name;
      const fileRef = ref(storage, nomeUnico);
      const uploadTask = uploadBytesResumable(fileRef, file);

      const downloadURL = await new Promise<string>((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          null,
          (error) => reject(error),
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          }
        );
      });
      return downloadURL;
    } catch (erro) {
      console.error("Falha no upload:", erro);
      return null;
    } finally {
      setIsUploading(false);
    }
  }

  /**
   * cadastrarAluno: submit do formulário
   */
  const cadastrarAluno: SubmitHandler<
    FormularioCadastroAluno & TermosContrato
  > = async (dadosDoFormulario) => {
    setEstaCarregando(true);
    setMensagem("");

    try {
      // 1) Verificamos se todos os checkboxes obrigatórios foram marcados
      //    (Na prática, o "required: true" já impede o submit, mas só para reforçar)
      const obrigatorios = [
        "liContrato1",
        "liContrato2",
        "liContrato3",
        "liContrato4",
        "liContrato5",
        "liContrato6",
        "liContrato7",
        "liContrato8",
      ] as const;

      for (const item of obrigatorios) {
        if (!dadosDoFormulario[item]) {
          setEstaCarregando(false);
          setMensagem(
            "Você precisa ler e concordar com todos os termos obrigatórios."
          );
          return;
        }
      }

      // 2) Faz upload da foto, se houver
      let fotoUrl = "";
      if (file) {
        const url = await uploadFotoParaFirebase();
        if (url) {
          fotoUrl = url;
        }
      }
      dadosDoFormulario.aluno.foto = fotoUrl;

      // 3) Remove do objeto final os campos que não vão ao banco
      //    (liContratoX) para não mandar pro backend
      const { liContrato1, liContrato2, liContrato3, liContrato4, liContrato5, liContrato6, liContrato7, liContrato8, ...objFinal } =
        dadosDoFormulario;

      // 4) Envia para a API
      const resposta = await axios.post(
        "/api/SubmitFormRegistration",
        objFinal // enviamos sem os campos de "liContrato"
      );

      const conteudo = resposta.data;
      if (conteudo.resultados && conteudo.resultados.length > 0) {
        const primeiroResultado = conteudo.resultados[0];
        if (primeiroResultado.sucesso) {
          setMensagem("Aluno cadastrado com sucesso!");
          alert("Aluno cadastrado com sucesso!");
          CorrigirDadosDefinitivos();
        } else {
          const erroEncontrado = primeiroResultado.erro || "Erro desconhecido.";
          setMensagem("Falha ao cadastrar o aluno: " + erroEncontrado);
          alert("Falha ao cadastrar o aluno: " + erroEncontrado);
        }
      } else {
        setMensagem("Retorno inesperado da API.");
      }
    } catch (erro) {
      console.error("Erro ao cadastrar aluno:", erro);
      setMensagem("Ocorreu um erro ao tentar cadastrar o aluno.");
    } finally {
      setEstaCarregando(false);
    }
  };

  return (
    <Layout>
      <Container>
        <Box sx={BoxStyleCadastro}>
          <HeaderForm titulo={"Cadastro de Alunos"} />
          

          {mensagem && (
            <Typography sx={{ color: "blue", textAlign: "center", mt: 2 }}>
              {mensagem}
            </Typography>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit(cadastrarAluno)}
            sx={{ marginTop: 2 }}
          >
            {/* SEÇÃO: DADOS DO ALUNO */}
            <List sx={ListStyle}>
              <Typography sx={TituloSecaoStyle}>
                Seção 1 - Identificação do Aluno
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Nome do Aluno"
                    variant="outlined"
                    fullWidth
                    {...register("aluno.nome", { required: true })}
                    error={!!errors.aluno?.nome}
                    helperText={errors.aluno?.nome && "Campo obrigatório"}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Data de Nascimento do Aluno"
                    variant="outlined"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    {...register("aluno.anoNascimento", { required: true })}
                    error={!!errors.aluno?.anoNascimento}
                    helperText={errors.aluno?.anoNascimento && "Campo obrigatório"}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Nº do documento do aluno (CPF / RG / Certidão)"
                    variant="outlined"
                    fullWidth
                    {...register("aluno.documento", { required: true })}
                    error={!!errors.aluno?.documento}
                    helperText={errors.aluno?.documento && "Campo obrigatório"}
                  />
                </Grid>

                {/* Upload de imagem do atleta */}
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

            {/* SEÇÃO: ENDEREÇO */}
            <List sx={ListStyle}>
              <Typography sx={TituloSecaoStyle}>Seção 2 - Endereço</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Rua"
                    variant="outlined"
                    fullWidth
                    {...register("aluno.informacoesAdicionais.endereco", {
                      required: true,
                    })}
                    error={!!errors.aluno?.informacoesAdicionais?.endereco}
                    helperText={
                      errors.aluno?.informacoesAdicionais?.endereco &&
                      "Campo obrigatório"
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Número"
                    variant="outlined"
                    fullWidth
                    {...register("aluno.informacoesAdicionais.numero_endereço")}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Complemento"
                    variant="outlined"
                    fullWidth
                    {...register("aluno.informacoesAdicionais.complemento")}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Bairro"
                    variant="outlined"
                    fullWidth
                    {...register("aluno.informacoesAdicionais.bairro", {
                      required: true,
                    })}
                    error={!!errors.aluno?.informacoesAdicionais?.bairro}
                    helperText={
                      errors.aluno?.informacoesAdicionais?.bairro &&
                      "Campo obrigatório"
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="CEP"
                    variant="outlined"
                    fullWidth
                    {...register("aluno.informacoesAdicionais.cep", {
                      required: true,
                    })}
                    error={!!errors.aluno?.informacoesAdicionais?.cep}
                    helperText={
                      errors.aluno?.informacoesAdicionais?.cep &&
                      "Campo obrigatório"
                    }
                  />
                </Grid>
              </Grid>
            </List>

            {/* SEÇÃO: CONTATOS */}
            <Box sx={ListStyle}>
              <Typography sx={TituloSecaoStyle}>
                Seção 3 - Informações de Contato
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Telefone Principal do Responsável"
                    variant="outlined"
                    fullWidth
                    {...register(
                      "aluno.informacoesAdicionais.primeiro_telefone_do_responsavel",
                      { required: true }
                    )}
                    error={
                      !!errors.aluno?.informacoesAdicionais
                        ?.primeiro_telefone_do_responsavel
                    }
                    helperText={
                      errors.aluno?.informacoesAdicionais
                        ?.primeiro_telefone_do_responsavel &&
                      "Campo obrigatório"
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Segundo Telefone do Responsável (opcional)"
                    variant="outlined"
                    fullWidth
                    {...register(
                      "aluno.informacoesAdicionais.segundo_telefone_do_responsavel"
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Telefone Comercial do Responsável"
                    variant="outlined"
                    fullWidth
                    {...register(
                      "aluno.informacoesAdicionais.telefone_comercial_do_responsavel"
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Nome do Contato de Emergência"
                    variant="outlined"
                    fullWidth
                    {...register(
                      "aluno.informacoesAdicionais.nome_contato_emergencia"
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Telefone do Contato de Emergência"
                    variant="outlined"
                    fullWidth
                    {...register(
                      "aluno.informacoesAdicionais.telefone_contato_emergencia"
                    )}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* SEÇÃO: RESPONSÁVEL */}
            <Box sx={ListStyle}>
              <Typography sx={TituloSecaoStyle}>
                Seção 4 - Informações do Responsável
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Nome do Responsável"
                    variant="outlined"
                    fullWidth
                    {...register("aluno.informacoesAdicionais.Nome__do_responsavel", {
                      required: true,
                    })}
                    error={
                      !!errors.aluno?.informacoesAdicionais?.Nome__do_responsavel
                    }
                    helperText={
                      errors.aluno?.informacoesAdicionais?.Nome__do_responsavel &&
                      "Campo obrigatório"
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Data de Nascimento do Responsável"
                    variant="outlined"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    {...register(
                      "aluno.informacoesAdicionais.data_de_nascimento_responsavel",
                      { required: true }
                    )}
                    error={
                      !!errors.aluno?.informacoesAdicionais
                        ?.data_de_nascimento_responsavel
                    }
                    helperText={
                      errors.aluno?.informacoesAdicionais
                        ?.data_de_nascimento_responsavel && "Campo obrigatório"
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Documento do Responsável (CPF ou RG)"
                    variant="outlined"
                    fullWidth
                    {...register(
                      "aluno.informacoesAdicionais.documento_do_responsavel",
                      { required: true }
                    )}
                    error={
                      !!errors.aluno?.informacoesAdicionais?.documento_do_responsavel
                    }
                    helperText={
                      errors.aluno?.informacoesAdicionais?.documento_do_responsavel &&
                      "Campo obrigatório"
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="E-mail do Responsável"
                    variant="outlined"
                    fullWidth
                    {...register("aluno.informacoesAdicionais.email_do_responsavel", {
                      required: true,
                      pattern: {
                        value: /\S+@\S+\.\S+/,
                        message: "E-mail inválido",
                      },
                    })}
                    error={
                      !!errors.aluno?.informacoesAdicionais?.email_do_responsavel
                    }
                    helperText={
                      errors.aluno?.informacoesAdicionais?.email_do_responsavel &&
                      "Campo obrigatório"
                    }
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    label="Função (Profissão) do Responsável"
                    variant="outlined"
                    fullWidth
                    {...register(
                      "aluno.informacoesAdicionais.funcao_do_responsavel"
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Local de Trabalho do Responsável"
                    variant="outlined"
                    fullWidth
                    {...register(
                      "aluno.informacoesAdicionais.local_de_trabalho_do_responsavel"
                    )}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* SEÇÃO: SAÚDE / ALERGIA / PLANO */}
            <Box sx={ListStyle}>
              <Typography sx={TituloSecaoStyle}>
                Seção 5 - Informações de Saúde
              </Typography>
              <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                  <TextField
                    label="Possui alergias? Quais?"
                    variant="outlined"
                    fullWidth
                    {...register("aluno.informacoesAdicionais.Possui_alergia")}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Plano de Saúde"
                    variant="outlined"
                    fullWidth
                    {...register("aluno.informacoesAdicionais.plano_de_saude")}
                  />
                </Grid>
              </Grid>
            </Box>
            
            {/* SEÇÃO: UNIFORME */}
            <Box sx={ListStyle}>
              <Typography sx={TituloSecaoStyle}>
                Seção 6 - Informações sobre o Uniforme
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Tamanho do Uniforme</InputLabel>
                    <Select
                      label="Tamanho do Uniforme"
                      defaultValue="P"
                      {...register("aluno.informacoesAdicionais.uniforme_do_aluno")}
                    >
                      <MenuItem value="P">P</MenuItem>
                      <MenuItem value="M">M</MenuItem>
                      <MenuItem value="G">G</MenuItem>
                      <MenuItem value="GG">GG</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>

            {/* SEÇÃO 7: TERMOS / CONTRATO */}
            <Box sx={ListStyle}>
              <Typography sx={TituloSecaoStyle}>Seção 7 - Termos Contratuais</Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1" color="black">
                 1- Li e estou ciente que o contrato é de um ano, tendo seu início em março
                  do ano vigente (mês que iniciou) até fevereiro do ano seguinte.
                </Typography>
                <FormControlLabel
                sx={{color:"black"}}
                  label="Confirmo a leitura e estou ciente desse contrato (obrigatório)."
                  control={
                    <Checkbox
                      {...register("liContrato1", { required: true })}
                      color="primary"
                    />
                  }
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body1" color="black">
                 2- Li e estou ciente que o vencimento da mensalidade é no dia 12 de cada mês.
                  Após essa data, haverá cobrança externa.
                </Typography>
                <FormControlLabel
                  label="Ciente sobre o vencimento (obrigatório)."
                  sx={{color:'black'}}
                  control={
                    <Checkbox
                      {...register("liContrato2", { required: true })}
                      color="primary"
                    />
                  }
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body1" color="black">
                3-  A ausência do aluno e a não utilização dos serviços disponíveis
                  não isentam o mesmo das obrigações de pagamento, e não serão realizadas
                  reposições de aulas.
                </Typography>
                <FormControlLabel
                 sx={{color:'black'}}
                  label="Ciente sobre a ausência e obrigatoriedade de pagamento (obrigatório)."
                  control={
                    <Checkbox
                      {...register("liContrato3", { required: true })}
                      color="primary"
                    />
                  }
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body1" color="black">
                4-  Cancelamento: Frente à quebra contratual será cobrado o valor equivalente
                  a uma mensalidade, acrescido de R$ 10,00 por boleto vincendo. Nenhum valor
                  já pago será reembolsado e, caso haja parcelas vencidas, estas deverão
                  ser quitadas antes do cancelamento.
                </Typography>
                <FormControlLabel
                 sx={{color:'black'}}
                  label="Ciente sobre o cancelamento (obrigatório)."
                  control={
                    <Checkbox
                      {...register("liContrato4", { required: true })}
                      color="primary"
                    />
                  }
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body1" color="black">
                 5- Você se compromete a avisar antecipadamente a ausência de seu filho(a)
                  aos treinos, bem como a informar sobre possíveis problemas de saúde?
                </Typography>
                <FormControlLabel
                 sx={{color:'black'}}
                  label="Estou ciente da necessidade de comunicação prévia (obrigatório)."
                  control={
                    <Checkbox
                      {...register("liContrato5", { required: true })}
                      color="primary"
                    />
                  }
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body1" color="black">
                 6- Estou de acordo com o desconto. (Se for aplicável.)
                </Typography>
                <FormControlLabel
                 sx={{color:'black'}}
                  label="Sim, estou de acordo (obrigatório)."
                  control={
                    <Checkbox
                      {...register("liContrato6", { required: true })}
                      color="primary"
                    />
                  }
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body1" color="black">
                7-  Você declara que o pré-mencionado menor está em perfeitas condições
                  de saúde, podendo participar de treinos e competições?
                </Typography>
                <FormControlLabel
                 sx={{color:'black'}}
                  label="Sim, declaro (obrigatório)."
                  control={
                    <Checkbox
                      {...register("liContrato7", { required: true })}
                      color="primary"
                    />
                  }
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body1" color="black">
                 8- O uso da imagem e nome do(a) atleta será utilizado para fins legítimos
                  de divulgação e promoção da marca, sem ônus.
                </Typography>
                <FormControlLabel
                sx={{color:'black'}}
                  label="Estou ciente sobre o uso de imagem (obrigatório)."
                  control={
                    <Checkbox
                      {...register("liContrato8", { required: true })}
                      color="primary"
                    />
                  }
                />
              </Box>
            </Box>

            {/* SEÇÃO 8: TURMA (AGORA UM SELECT CARREGADO DO CONTEXTO) */}
            <Box sx={ListStyle}>
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
            </Box>

            {/* BOTÃO DE SUBMIT */}
            <Box textAlign="center" marginTop={3}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={estaCarregando || isUploading}
              >
                {estaCarregando
                  ? "Cadastrando..."
                  : isUploading
                  ? "Carregando Imagem..."
                  : "Cadastrar Aluno"}
              </Button>
            </Box>
          </Box>
        </Box>
      </Container>
    </Layout>
  );
}
