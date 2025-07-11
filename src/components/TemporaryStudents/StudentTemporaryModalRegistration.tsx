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
  Snackbar,
} from "@mui/material";
import { v4 as uuidv4 } from "uuid";
import { TituloSecaoStyle, modalStyleTemporaly } from "@/utils/Styles";

// 1. IMPORTAÇÃO ATUALIZADA: Usamos a função correta para gerar presenças.
import { extrairDiaDaSemana, gerarPresencasParaAluno } from "@/utils/Constants";

// Importamos o contexto e tipos necessários
import { useData } from "@/context/context";
import { FormValuesStudent, Turma, AlunoParaForm } from "@/interface/interfaces";

// A função de corrigir dados é mantida, pois é útil após o cadastro.
import { CorrigirDadosDefinitivos } from "@/utils/CorrigirDadosTurmasEmComponetes";

// Tipagem para o formulário local
type LocalFormValues = {
  turmaSelecionada: string;
};

interface TemporaryStudentRegistrationProps {
  handleCloseModal: () => void;
}

export default function TemporaryStudentRegistration({
  handleCloseModal,
}: TemporaryStudentRegistrationProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<LocalFormValues>(); // Usamos um tipo local para o formulário simples

  const { modalidades, fetchModalidades, sendDataToApi } = useData();

  const [turmasDisponiveis, setTurmasDisponiveis] = useState<Turma[]>([]);
  const [studentName, setStudentName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Efeito para carregar as turmas da modalidade "volei" ao montar o componente
  useEffect(() => {
    fetchModalidades().then((mods) => {
      const modalidadeVolei = mods.find((mod) => mod.nome.toLowerCase() === "volei");
      if (modalidadeVolei?.turmas) {
        setTurmasDisponiveis(modalidadeVolei.turmas);
      }
    });
  }, [fetchModalidades]);

  const onFormSubmit: SubmitHandler<LocalFormValues> = async (data) => {
    setIsUpdating(true);

    const turmaEncontrada = turmasDisponiveis.find(
      (turma) => turma.nome_da_turma === data.turmaSelecionada
    );

    if (!turmaEncontrada || !turmaEncontrada.diaDaSemana) {
      alert("Erro: A turma selecionada não foi encontrada ou não possui dias de aula definidos.");
      setIsUpdating(false);
      return;
    }

    // 2. LÓGICA ATUALIZADA: Determinamos ano e semestre para a nova função
     const currentDate = new Date();
    const presencasGeradas = gerarPresencasParaAluno(extrairDiaDaSemana(data.turmaSelecionada));

  

    // 4. CONSTRUÇÃO DO OBJETO CORRIGIDA: Alinhada com as suas interfaces
    const alunoParaApi: AlunoParaForm = {
      id: Date.now(), // ID temporário, o backend pode gerar um definitivo
      alunoId: Date.now(), // `alunoId` agora é number, conforme a correção
      nome: studentName.trim(),
      anoNascimento: "2000-01-01",
      dataMatricula: currentDate.toLocaleDateString("pt-BR"),
      telefoneComWhatsapp: "00000000000",
      informacoesAdicionais: {
        IdentificadorUnico: uuidv4(),
        Nome__do_responsavel: "Responsável Temporário",
        Possui_alergia: "Não",
        bairro: "Bairro Temporário",
        cep: "00000-000",
        complemento: "",
        data_de_nascimento_responsavel: "2000-01-01",
        documento_do_responsavel: "000.000.000-00",
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
        uniforme: "P",
      },
      presencas: presencasGeradas,
      foto: "", // Foto vazia por padrão para alunos temporários
    };

    const finalPayload: FormValuesStudent = {
      turmaSelecionada: data.turmaSelecionada,
      aluno: alunoParaApi,
      modalidade: "volei", // Especificamos a modalidade
    };

    try {
      await sendDataToApi([finalPayload]);
      await CorrigirDadosDefinitivos();
      setSuccessMessage("Aluno temporário cadastrado com sucesso!");
      reset();
      handleCloseModal();
    } catch (error) {
      console.error("Erro ao enviar os dados do aluno temporário:", error);
      alert("Ocorreu um erro ao cadastrar o aluno. Verifique o console.");
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
                onChange={(e) => setStudentName(e.target.value)}
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
                error={!!errors.turmaSelecionada}
                helperText={errors.turmaSelecionada?.message}
              >
                {turmasDisponiveis.map((turma) => (
                  <MenuItem key={turma.uuidTurma} value={turma.nome_da_turma}>
                    {turma.nome_da_turma}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Button type="submit" variant="contained" disabled={isSubmitting || isUpdating} fullWidth>
                {isUpdating ? "Cadastrando..." : "Cadastrar Aluno"}
              </Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button variant="contained" color="error" onClick={handleCloseModal} fullWidth>
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