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
  Typography, // Adicionado para mensagens
} from "@mui/material";
import Link from "next/link";
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]";

import { DataContext } from "@/context/context";
import { Aluno, Turma } from "@/interface/interfaces";
import { BoxStyleFrequencia, ListStyle } from "@/utils/Styles";
import Layout from "@/components/TopBarComponents/Layout";
import { HeaderForm } from "@/components/HeaderDefaultForm";
import { ListaDeChamada } from "@/components/ListaDeChamada";
import TemporaryStudentRegistration from "@/components/TemporaryStudents/StudentTemporaryModalRegistration";

export default function StudentPresenceTable() {
  const { modalidades, fetchModalidades } = useContext(DataContext);
  
  const [turmasDisponiveis, setTurmasDisponiveis] = useState<Turma[]>([]);
  const [selectedTurma, setSelectedTurma] = useState<string>("");
  
  // NOVO: Estado para o dia da semana selecionado
  const [selectedDiaSemana, setSelectedDiaSemana] = useState<string>(""); 
  
  // NOVO: Estado para armazenar os dias da semana da turma selecionada
  const [diasDaTurma, setDiasDaTurma] = useState<string[]>([]);

  const [alunosDaTurma, setAlunosDaTurma] = useState<Aluno[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchModalidades().catch(console.error);
  }, [fetchModalidades]);

  useEffect(() => {
    if (modalidades.length > 0) {
      // Achatando todas as turmas de todas as modalidades em um único array
      const todasAsTurmas = modalidades.flatMap(m => m.turmas || []);
      setTurmasDisponiveis(todasAsTurmas);
    }
  }, [modalidades]);

  const handleTurmaChange = useCallback(
    (event: React.ChangeEvent<{ value: unknown }>) => {
      const nomeDaTurmaSelecionada = event.target.value as string;
      setSelectedTurma(nomeDaTurmaSelecionada);
      
      // Resetar a seleção de dia e a lista de alunos ao trocar de turma
      setSelectedDiaSemana("");
      setAlunosDaTurma([]);

      const turmaEscolhida = turmasDisponiveis.find(
        (t) => t.nome_da_turma === nomeDaTurmaSelecionada
      );

      if (turmaEscolhida) {
        // Define os dias da semana e os alunos da turma
        setDiasDaTurma(turmaEscolhida.diaDaSemana || []);
        setAlunosDaTurma(turmaEscolhida.alunos || []);
      } else {
        setDiasDaTurma([]);
        setAlunosDaTurma([]);
      }
    },
    [turmasDisponiveis]
  );
  
  // NOVO: Handler para a mudança do dia da semana
  const handleDiaSemanaChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedDiaSemana(event.target.value as string);
  };

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  return (
    <Layout>
      <Container>
        <form>
          <Box sx={BoxStyleFrequencia}>
            <HeaderForm titulo={"Lista de Chamada"} />
            <List sx={ListStyle}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    required
                    label="Selecione a Turma"
                    value={selectedTurma}
                    onChange={handleTurmaChange}
                    fullWidth
                    variant="outlined"
                  >
                    <MenuItem value="" disabled>
                      <em>Selecione...</em>
                    </MenuItem>
                    {turmasDisponiveis.map((turma) => (
                      <MenuItem
                        key={turma.uuidTurma}
                        value={turma.nome_da_turma}
                      >
                        {turma.nome_da_turma}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* NOVO: Seletor de dia da semana, aparece após selecionar a turma */}
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    required
                    label="Selecione o Dia da Chamada"
                    value={selectedDiaSemana}
                    onChange={handleDiaSemanaChange}
                    fullWidth
                    variant="outlined"
                    disabled={!selectedTurma || diasDaTurma.length <= 1}
                    helperText={diasDaTurma.length <= 1 ? "Apenas um dia de aula." : "Escolha o dia."}
                  >
                    <MenuItem value="" disabled>
                      <em>Selecione...</em>
                    </MenuItem>
                    {diasDaTurma.map((dia) => (
                      <MenuItem key={dia} value={dia}>
                        {dia.charAt(0).toUpperCase() + dia.slice(1).toLowerCase()}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>

              {/* A ListaDeChamada só é renderizada se uma turma E um dia da semana forem selecionados (ou se a turma tiver só um dia) */}
              {selectedTurma && (diasDaTurma.length === 1 || selectedDiaSemana) ? (
                <ListaDeChamada
                  alunosDaTurma={alunosDaTurma}
                  setAlunosDaTurma={setAlunosDaTurma}
                  nomeDaTurma={selectedTurma}
                  // Passa o dia selecionado ou o único dia disponível para a lista de chamada
                  diaDaSemanaSelecionado={selectedDiaSemana || (diasDaTurma.length === 1 ? diasDaTurma[0] : "")}
                />
              ) : (
                selectedTurma && <Typography sx={{ mt: 2, textAlign: 'center' }}>Por favor, selecione um dia da semana para ver a chamada.</Typography>
              )}
            </List>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
              <Button color="error" variant="contained" onClick={handleOpenModal}>
                Adicionar aluno temporário
              </Button>
              <Button component={Link} href="/ListaDeAlunosParaProfs" color="secondary" variant="contained">
                Acessar lista Geral de Alunos
              </Button>
            </Box>
          </Box>
        </form>
        
        <Modal open={isModalOpen} onClose={handleCloseModal}>
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