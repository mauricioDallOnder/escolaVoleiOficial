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

// 1. IMPORTAÇÃO ATUALIZADA: Trocamos a função antiga pela nova.
import { gerarPresencasSemestre } from "@/utils/Constants";

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
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValuesStudent>();

  const { modalidades, fetchModalidades, sendDataToApi } = useData();

  const [turmasDisponiveis, setTurmasDisponiveis] = useState<Turma[]>([]);
  const [studentName, setStudentName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // Carrega as turmas quando o componente é montado
    fetchModalidades().then((mods) => {
      const modalidadeVolei = mods.find(m => m.nome.toLowerCase() === 'volei');
      if (modalidadeVolei?.turmas) {
        setTurmasDisponiveis(modalidadeVolei.turmas);
      }
    });
  }, [fetchModalidades]);

  const handleStudentNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStudentName(event.target.value);
  };

  const onFormSubmit: SubmitHandler<FormValuesStudent> = async (formData) => {
    setIsUpdating(true);
    
    const turmaEncontrada = turmasDisponiveis.find(
      (turma) => turma.nome_da_turma === formData.turmaSelecionada
    );

    if (!turmaEncontrada) {
      console.error("Turma selecionada não foi encontrada.");
      setIsUpdating(false);
      return;
    }

    // 2. LÓGICA ATUALIZADA: Determinamos o ano e semestre atuais.
    const currentDate = new Date();
    const anoAtual = currentDate.getFullYear();
    // (Janeiro=0 a Junho=5 são o primeiro semestre)
    const semestreAtual = currentDate.getMonth() < 6 ? 'primeiro' : 'segundo';
    
    // 3. GERAÇÃO DE PRESENÇAS ATUALIZADA: Usamos a nova função.
    const presencasGeradas = gerarPresencasSemestre(
      turmaEncontrada.diaDaSemana,
      semestreAtual,
      anoAtual
    );

    // Montamos o objeto final do aluno
    const alunoData = {
      // Usamos um ID alto para evitar conflitos, mas o backend deve gerir isso
      id: Date.now(), 
      alunoId: Date.now().toString(),
      nome: studentName,
      anoNascimento: "2000-01-01",
      dataMatricula: currentDate.toLocaleDateString(),
      telefoneComWhatsapp: "00000000000",
      informacoesAdicionais: {
        IdentificadorUnico: uuidv4(),
        Nome__do_responsavel: "Responsável Temporário",
        Possui_alergia: "Não",
        bairro: "Bairro Temporário",
        cep: "00000-000",
        complemento: "",
        data_de_nascimento_responsavel: "2000-01-01",
        documento_do_responsavel: "00000000000",
        email_do_responsavel: "temporary@example.com",
        endereco: "Endereço Temporário",
        funcao_do_responsavel: "N/A",
        hasUniforme: false,
        local_de_trabalho_do_responsavel: "N/A",
        nome_contato_emergencia: "N/A",
        numero_endereço: "0",
        plano_de_saude: "Nenhum",
        primeiro_telefone_do_responsavel: "00000000000",
        segundo_telefone_do_responsavel: "",
        telefone_comercial_do_responsavel: "",
        telefone_contato_emergencia: "00000000000",
        uniforme_do_aluno: "P",
        uniforme: "P" // Mantido por consistência, se usado em algum lugar
      },
      presencas: presencasGeradas,
      foto: "",
    };

    // O payload enviado para a API precisa corresponder à estrutura esperada
    const finalPayload: FormValuesStudent = {
      ...formData,
      aluno: alunoData,
      modalidade: 'volei' // Especifica a modalidade
    };

    try {
      await sendDataToApi([finalPayload]);
      CorrigirDadosDefinitivos(); // Função para atualizar contadores da turma
      setSuccessMessage("Aluno temporário cadastrado com sucesso!");
      reset();
      handleCloseModal(); // Fecha o modal após o sucesso
    } catch (error) {
      console.error("Erro ao enviar os dados do aluno temporário:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Container>
      <Paper sx={modalStyleTemporaly}>
        <form onSubmit={handleSubmit(onFormSubmit)}>
          <Typography sx={TituloSecaoStyle}>
            Cadastro de Aluno Temporário
          </Typography>

          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome do Aluno"
                variant="outlined"
                required
                value={studentName}
                onChange={handleStudentNameChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                select
                label="Turma Selecionada"
                {...register("turmaSelecionada", { required: "Selecione uma turma" })}
                defaultValue=""
                fullWidth
                required
                variant="outlined"
                
              >
                {turmasDisponiveis.map((turma) => (
                  <MenuItem key={turma.uuidTurma} value={turma.nome_da_turma}>
                    {turma.nome_da_turma}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting || isUpdating}
                fullWidth
              >
                {isUpdating ? "Cadastrando..." : "Cadastrar Aluno"}
              </Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                variant="contained"
                color="error"
                onClick={handleCloseModal}
                fullWidth
              >
                Fechar
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage(null)}
        message={successMessage}
      />
    </Container>
  );
}