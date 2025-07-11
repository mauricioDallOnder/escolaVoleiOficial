import React, { useState, useEffect, useCallback, useContext } from "react";
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
import Link from "next/link";
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]";

import { DataContext } from "@/context/context"; // Corrigido para usar DataContext
import { Aluno, Turma, FormValuesStudent } from "@/interface/interfaces";
import { BoxStyleFrequencia, ListStyle } from "@/utils/Styles";
import Layout from "@/components/TopBarComponents/Layout";
import { HeaderForm } from "@/components/HeaderDefaultForm";
import { ListaDeChamada } from "@/components/ListaDeChamada";
import TemporaryStudentRegistration from "@/components/TemporaryStudents/StudentTemporaryModalRegistration";

// O nome do componente continua o mesmo do seu arquivo original
export default function StudentPresenceTable() {
  // O hook foi renomeado para 'useContext(DataContext)' para refletir o uso padrão
  const { modalidades, fetchModalidades } = useContext(DataContext);
  
  const [turmasDisponiveis, setTurmasDisponiveis] = useState<Turma[]>([]);
  const [selectedTurma, setSelectedTurma] = useState<string>("");
  const [alunosDaTurma, setAlunosDaTurma] = useState<Aluno[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Busca as modalidades ao carregar a página
  useEffect(() => {
    fetchModalidades().catch(console.error);
  }, [fetchModalidades]);

  // Atualiza a lista de turmas disponíveis quando as modalidades são carregadas
  useEffect(() => {
    if (modalidades && modalidades.length > 0) {
      // Assume que todas as turmas estão na primeira modalidade, como no código original
      const todasAsTurmas = modalidades[0]?.turmas || [];
      setTurmasDisponiveis(todasAsTurmas);
    }
  }, [modalidades]);

  // Função para lidar com a mudança da turma selecionada
  const handleTurmaChange = useCallback(
    (event: React.ChangeEvent<{ value: unknown }>) => {
      const nomeDaTurmaSelecionada = event.target.value as string;
      setSelectedTurma(nomeDaTurmaSelecionada);

      // Encontra a turma completa a partir do nome selecionado
      const turmaEscolhida = turmasDisponiveis.find(
        (t) => t.nome_da_turma === nomeDaTurmaSelecionada
      );

      // Define os alunos da turma no estado, ou um array vazio se não encontrar
      if (turmaEscolhida?.alunos) {
        setAlunosDaTurma(turmaEscolhida.alunos);
      } else {
        setAlunosDaTurma([]);
      }
    },
    [turmasDisponiveis] // Depende da lista de turmas disponíveis
  );

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <Layout>
      <Container>
        {/* O formulário não precisa mais de um 'onSubmit' pois a ação é automática */}
        <form>
          <Box sx={BoxStyleFrequencia}>
            <HeaderForm titulo={"Lista de Chamada"} />
            <List sx={ListStyle}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    select
                    required
                    label="Selecione a Turma"
                    value={selectedTurma}
                    onChange={handleTurmaChange}
                    fullWidth
                    variant="outlined"
                    helperText="A lista de chamada será carregada automaticamente."
                    sx={{ marginBottom: 2 }}
                  >
                    <MenuItem value="" disabled>
                      <em>Nenhuma turma selecionada</em>
                    </MenuItem>
                    {turmasDisponiveis.map((turma) => (
                      <MenuItem
                        key={turma.uuidTurma} // Usar uma chave única como uuid é mais seguro
                        value={turma.nome_da_turma}
                      >
                        {turma.nome_da_turma}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>

              {/* A ListaDeChamada é renderizada se uma turma for selecionada e tiver alunos */}
              {selectedTurma && (
                <ListaDeChamada
                  alunosDaTurma={alunosDaTurma}
                  setAlunosDaTurma={setAlunosDaTurma}
                  nomeDaTurma={selectedTurma}
                />
              )}
            </List>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
              <Button
                color="error"
                variant="contained"
                onClick={handleOpenModal}
              >
                Adicionar aluno temporário
              </Button>
              
              <Button
                component={Link}
                href="/ListaDeAlunosParaProfs"
                color="secondary"
                variant="contained"
              >
                Acessar lista Geral de Alunos
              </Button>
            </Box>

          </Box>
        </form>
        
        <Modal
          open={isModalOpen}
          onClose={handleCloseModal}
          aria-labelledby="modal-adicionar-aluno-temporario"
        >
          {/* O componente do modal recebe a função para fechá-lo */}
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

  // A lógica de permissão continua a mesma
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