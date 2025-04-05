import React, { useState, useEffect, useCallback } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import {
  Box,
  Grid,
  TextField,
  MenuItem,
  Button,
  List,
  Container,
  Modal,
} from "@mui/material";
import { useData } from "@/context/context";
import { Aluno, FormValuesStudent, Turma } from "@/interface/interfaces";
import { BoxStyleFrequencia, ListStyle } from "@/utils/Styles";
import { ListaDeChamada } from "@/components/ListaDeChamada";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]";
import { GetServerSideProps } from "next";
import { HeaderForm } from "@/components/HeaderDefaultForm";
import Layout from "@/components/TopBarComponents/Layout";
import TemporaryStudentRegistration from "@/components/TemporaryStudents/StudentTemporaryModalRegistration";

export default function StudentPresenceTable() {
  const { modalidades, fetchModalidades } = useData();
  const { handleSubmit, setValue } = useForm<FormValuesStudent>({
    defaultValues: {
      turmaSelecionada: "",
    },
  });
  const [turmasDisponiveis, setTurmasDisponiveis] = useState<Turma[]>([]);
  const [selectedTurma, setSelectedTurma] = useState<string>("");
  const [alunosDaTurma, setAlunosDaTurma] = useState<Aluno[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Buscar modalidades ao montar o componente
  useEffect(() => {
    fetchModalidades().catch(console.error);
  }, [fetchModalidades]);

  // Como só existe uma modalidade, usamos a primeira para obter as turmas disponíveis
  useEffect(() => {
    if (modalidades && modalidades.length > 0) {
      const firstModalidade = modalidades[0];
      setTurmasDisponiveis(firstModalidade.turmas);
    }
  }, [modalidades]);

  const handleTurmaChange = useCallback(
    (event: React.ChangeEvent<{ value: unknown }>) => {
      const value = event.target.value as string;
      setSelectedTurma(value);
      setValue("turmaSelecionada", value);
    },
    [setValue]
  );

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const onSubmit: SubmitHandler<FormValuesStudent> = async (data) => {
    const turmaEscolhida =
      modalidades && modalidades[0]?.turmas.find(
        (t) => t.nome_da_turma === data.turmaSelecionada
      );

    if (turmaEscolhida && Array.isArray(turmaEscolhida.alunos)) {
      setAlunosDaTurma(turmaEscolhida.alunos);
    }
  };

  const refreshPage = () => {
    alert("Dados salvos com sucesso");
    window.location.reload();
  };

  // Nome da modalidade única (se houver)
  const singleModalidadeName =
    modalidades && modalidades.length > 0 ? modalidades[0].nome : "";

  return (
    <Layout>
      <Container>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Box sx={BoxStyleFrequencia}>
            <HeaderForm titulo={"Lista de Chamada"} />
            <List sx={ListStyle}>
              <Grid container spacing={2}>
                {/* Campo para selecionar a turma */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    required
                    label="Turma"
                    value={selectedTurma}
                    onChange={handleTurmaChange}
                    fullWidth
                    variant="outlined"
                    sx={{ marginBottom: 2 }}
                  >
                    {turmasDisponiveis.map((turma) => (
                      <MenuItem
                        key={turma.nome_da_turma}
                        value={turma.nome_da_turma}
                      >
                        {turma.nome_da_turma}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>

              {alunosDaTurma.length > 0 && (
                <ListaDeChamada
                  alunosDaTurma={alunosDaTurma}
                  setAlunosDaTurma={setAlunosDaTurma}
                  nomeDaTurma={selectedTurma}
                />
              )}
            </List>
            <Button
              sx={{ width: "100%", marginBottom: "8px" }}
              type="submit"
              variant="contained"
            >
              Pesquisar Turma
            </Button>
            <Button
              sx={{ fontSize: "12px" }}
              color="error"
              variant="contained"
              onClick={handleOpenModal}
            >
              Adicionar aluno temporário
            </Button>
            <Button
              sx={{ fontSize: "12px", mt: "8px" }}
              color="success"
              variant="contained"
              onClick={refreshPage}
            >
              Salvar Dados/Atualizar Pagina
            </Button>
          </Box>
        </form>
        <Modal
          open={isModalOpen}
          onClose={handleCloseModal}
          aria-labelledby="modal-title"
          aria-describedby="modal-description"
        >
          <TemporaryStudentRegistration handleCloseModal={handleCloseModal} />
        </Modal>
      </Container>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(
    context.req,
    context.res,
    authOptions
  );

  // Permitir acesso se o usuário for admin ou professor
  if (
    !session ||
    (session.user.role !== "admin" && session.user.role !== "professor")
  ) {
    return {
      redirect: {
        destination: "/NotAllowPage",
        permanent: false,
      },
    };
  }

  return { props: {} };
};
