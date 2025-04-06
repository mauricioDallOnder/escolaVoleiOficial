import React, { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import {
  Button,
  Container,
  Grid,
  TextField,
  Typography,
  MenuItem,
  Paper,
  Snackbar
} from "@mui/material";
import { v4 as uuidv4 } from "uuid";
import {
  TituloSecaoStyle,
  modalStyleTemporaly,
} from "@/utils/Styles";

// Importamos a função para gerar presenças em vários dias
import { gerarPresencasParaVariosDias } from "@/utils/Constants";

// Importamos o contexto e tipos necessários
import { useData } from "@/context/context";
import { FormValuesStudent, Turma } from "@/interface/interfaces";

// Se você precisa corrigir dados após cadastrar, mantenha; senão pode remover
import { CorrigirDadosDefinitivos } from "@/utils/CorrigirDadosTurmasEmComponetes";

// Propriedades do componente
interface TemporaryStudentRegistrationProps {
  handleCloseModal: () => void;
}

// Componente principal
export default function TemporaryStudentRegistration({
  handleCloseModal,
}: TemporaryStudentRegistrationProps) {
  // useForm do React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<FormValuesStudent>();

  // Funções e dados vindos do contexto
  const { modalidades, fetchModalidades, sendDataToApi } = useData();

  // Estado para turmas disponíveis
  const [turmasDisponiveis, setTurmasDisponiveis] = useState<Turma[]>([]);
  // Estado para armazenar o nome do aluno digitado
  const [studentName, setStudentName] = useState("");
  // Estado para controlar se estamos aguardando alguma atualização
  const [isUpdating, setIsUpdating] = useState(false);
  // Estado para mensagem de sucesso (SnackBar)
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Efeito para carregar as modalidades (e as turmas da modalidade "volei")
  useEffect(() => {
    fetchModalidades().then(() => {
      // Aqui supomos que você só tem "volei"; se tiver outra, adapte
      const modalidadeVolei = modalidades.find(
        (mod) => mod.nome.toLowerCase() === "volei"
      );
      if (modalidadeVolei && Array.isArray(modalidadeVolei.turmas)) {
        setTurmasDisponiveis(modalidadeVolei.turmas);
      }
    });
  }, [fetchModalidades, modalidades]);

  // Callback para atualizar o nome do aluno digitado
  const handleStudentNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStudentName(event.target.value);
  };

  // Função chamada ao enviar o formulário (React Hook Form)
  const onFormSubmit: SubmitHandler<FormValuesStudent> = async (formData) => {
    setIsUpdating(true);

    // Data de matrícula atual
    const currentDateString = new Date().toLocaleDateString();

    // 1) Precisamos saber os dias da semana da turma selecionada
    //    Então buscamos no array `turmasDisponiveis` a turma escolhida
    const turmaEncontrada = turmasDisponiveis.find(
      (turma) => turma.nome_da_turma === formData.turmaSelecionada
    );

    // 2) Extraímos o array de dias da semana ou fallback se não existir
    let arrayDediaDaSemana: string[] = ["SEGUNDA"]; // fallback
    if (turmaEncontrada && Array.isArray(turmaEncontrada.diaDaSemana)) {
      arrayDediaDaSemana = turmaEncontrada.diaDaSemana;
    }

    // 3) Geramos as presenças para todos esses dias (SEM abreviações)
    const presencasGeradas = gerarPresencasParaVariosDias(arrayDediaDaSemana);

    // 4) Montamos o objeto final do aluno
    formData.aluno = {
      // Precisamos do 'id' para corresponder ao tipo que exige 'id' ou 'alunoId'
      id: 50, // ou outro valor se seu back-end atualizar
      alunoId:50,
      // caso exija 'alunoId', inclua aqui:
      // alunoId: 0,
      nome: studentName,
      anoNascimento: "2000-01-01", // Ajuste se quiser capturar de outro campo
      dataMatricula: currentDateString,
      telefoneComWhatsapp: "00000000000", // Ajuste se for capturado do form

      // informacoesAdicionais com todos os campos que fazem parte da sua estrutura
      informacoesAdicionais: {
        IdentificadorUnico: uuidv4(),
        Nome__do_responsavel: "Responsável Temporário",
        Possui_alergia: "Não",
        bairro: "Bairro Temporário",
        cep: "00000000",
        complemento: "",
        data_de_nascimento_responsavel: "2000-01-01",
        documento_do_responsavel: "00000000000",
        email_do_responsavel: "temporaryEmail@example.com",
        endereco: "Endereço Temporário",
        funcao_do_responsavel: "Função Responsável",
        hasUniforme: false,
        local_de_trabalho_do_responsavel: "Local de Trabalho Temporário",
        nome_contato_emergencia: "Contato Emergência Temporário",
        numero_endereço: "0",
        plano_de_saude: "Nenhum",
        primeiro_telefone_do_responsavel: "00000000000",
        segundo_telefone_do_responsavel: "00000000000",
        telefone_comercial_do_responsavel: "00000000000",
        telefone_contato_emergencia: "00000000000",
        uniforme_do_aluno: "P",
        uniforme:"p"
      },
      presencas: presencasGeradas,
      foto: "-",
    };

    try {
      // Envia para a API, usando seu método do contexto
      await sendDataToApi([formData]);

      // Se precisar corrigir dados da turma no DB (contadores, etc.), chame
      // Caso não precise, remova
      CorrigirDadosDefinitivos();

      // Exibe mensagem e limpa formulário
      setSuccessMessage("Aluno temporário cadastrado com sucesso.");
      reset();
    } catch (erro) {
      console.error("Erro ao enviar os dados do aluno temporário:", erro);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Container>
      <Paper sx={modalStyleTemporaly}>
        <form onSubmit={handleSubmit(onFormSubmit)}>
          <Typography sx={TituloSecaoStyle}>
            Cadastro de Alunos Temporários
          </Typography>

          <Grid container spacing={2} justifyContent="center" alignItems="center">
            {/* Campo: Nome do Aluno */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome do Aluno"
                variant="standard"
                required
                onChange={handleStudentNameChange}
              />
            </Grid>

            {/* Campo: Turma (Select) */}
            <Grid item xs={12}>
              <TextField
                select
                label="Turma Selecionada"
                {...register("turmaSelecionada")}
                fullWidth
                required
                variant="outlined"
              >
                {turmasDisponiveis.map((turma) => (
                  <MenuItem key={turma.nome_da_turma} value={turma.nome_da_turma}>
                    {turma.nome_da_turma}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Botões de ação */}
            <Grid item xs={12} sm={6}>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting || isUpdating}
                fullWidth
              >
                {isUpdating ? "Cadastrando... Aguarde" : "Cadastrar Aluno"}
              </Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                variant="contained"
                color="error"
                onClick={handleCloseModal}
                fullWidth
              >
                Fechar Cadastro
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Snackbar de sucesso */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        message={successMessage}
      />
    </Container>
  );
}
