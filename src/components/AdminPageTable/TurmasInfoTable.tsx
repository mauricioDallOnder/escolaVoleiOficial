/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { Modalidade, Turma } from '@/interface/interfaces';
import {
  TableRow,
  TableCell,
  Table,
  TableHead,
  TableBody,
  TableContainer,
  Paper,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
  Button,
} from '@mui/material';

import { ControleFrequenciaTableNoSSR } from './DynamicComponents';
import { BoxStyleCadastro, BoxStyleTurmaInfoTable, TituloSecaoStyle } from '@/utils/Styles';
import { useData } from '@/context/context';
import { TurmaPresencaSemanal } from './TurmaPresencaSemanal';

export default function TurmasInfoTable() {
  const { fetchModalidades } = useData();
  const [modalidades, setModalidades] = useState<Modalidade[]>([]);
  const [selectedModalidade, setSelectedModalidade] = useState<string>('');
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [selectedTurma, setSelectedTurma] = useState<Turma | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado para o modal ControleFrequenciaTableNoSSR
  const [isPresencaSemanalModalOpen, setIsPresencaSemanalModalOpen] =
    useState(false); // Estado para o modal TurmaPresencaSemanal
  const [searchTerm, setSearchTerm] = useState<string>('');

  const handleOpenModal = (turma: Turma) => {
    if (turma.capacidade_atual_da_turma > 0) {
      setSelectedTurma(turma);
      setIsModalOpen(true);
    } else {
      alert('Essa turma não possui alunos');
    }
  };

  const handleOpenPresencaSemanalModal = (turma: Turma) => {
    if (turma.capacidade_atual_da_turma > 0) {
      setSelectedTurma(turma);
      setIsPresencaSemanalModalOpen(true);
    } else {
      alert('Esta turma não possui alunos');
    }
  };

  const filteredTurmas = turmas.filter((turma) =>
    turma.nome_da_turma.toLowerCase().includes(searchTerm),
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  useEffect(() => {
    fetchModalidades().then((data) => {
      const validModalidades = data.filter(
        (mod) => mod.nome !== 'arquivados' && mod.nome !== 'excluidos',
      );
      setModalidades(validModalidades);
    });
  }, [fetchModalidades]);

  useEffect(() => {
    if (selectedModalidade) {
      const modalidadeEscolhida = modalidades.find(
        (modalidade) => modalidade.nome === selectedModalidade,
      );

      setTurmas(modalidadeEscolhida ? modalidadeEscolhida.turmas : []);
    }
  }, [selectedModalidade, modalidades]);

  const handleModalidadeChange = (event: SelectChangeEvent<string>) => {
    setSelectedModalidade(event.target.value);
  };

  return (
    <Box sx={BoxStyleTurmaInfoTable}>
      <Typography sx={TituloSecaoStyle}>
        Informações Gerais das Turmas
      </Typography>
      <FormControl fullWidth margin="normal">
        <InputLabel id="modalidade-select-label">Modalidade</InputLabel>
        <Select
          labelId="modalidade-select-label"
          id="modalidade-select"
          value={selectedModalidade}
          label="Modalidade"
          onChange={handleModalidadeChange}
        >
          {modalidades.map((modalidade) => (
            <MenuItem key={modalidade.nome} value={modalidade.nome}>
              {modalidade.nome}
            </MenuItem>
          ))}
        </Select>
        <TextField
          label="Pesquisar pelo nome da turma"
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={handleSearchChange}
          margin="normal"
        />
      </FormControl>
      <Divider sx={{ my: 2 }} />
      <TableContainer component={Paper} sx={{ boxShadow: 3, borderRadius: 2 }}>
        <Table aria-label="simple table">
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.main' }}>
              <TableCell sx={{ color: 'primary.contrastText'}}>Nome da Turma</TableCell>
              <TableCell sx={{ color: 'primary.contrastText', textAlign:"center" }}>Categoria</TableCell>
              <TableCell sx={{ color: 'primary.contrastText', textAlign:"center" }}>Capacidade Máxima</TableCell>
              <TableCell sx={{ color: 'primary.contrastText', textAlign:"center" }}>Capacidade Atual</TableCell>
              <TableCell sx={{ color: 'primary.contrastText', textAlign:"center" }}>Presença Semanal</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTurmas.map((turma, index) => {
              const modalidade = selectedModalidade;
              let nomeDaTurmaDisplay = turma.nome_da_turma;

              // Verifica se o nome da turma já inclui a modalidade
              if (!turma.nome_da_turma.toLowerCase().includes(modalidade.toLowerCase())) {
                nomeDaTurmaDisplay = `${modalidade}_${turma.nome_da_turma}`;
              }

              return (
                <TableRow
                  key={nomeDaTurmaDisplay}
                  sx={{
                    '&:last-child td, &:last-child th': { border: 0 },
                    bgcolor: index % 2 === 0 ? 'background.default' : 'grey.100',
                  }}
                >
                  <TableCell
                    component="th"
                    scope="row"
                    onClick={() => handleOpenModal(turma)}
                    sx={{ cursor: 'pointer', color: 'text.primary' }}
                  >
                    {nomeDaTurmaDisplay}
                  </TableCell>
                  <TableCell sx={{ color: 'text.primary', textAlign:"center" }}>{turma.categoria}</TableCell>
                  <TableCell sx={{ color: 'text.primary', textAlign:"center" }}>{turma.capacidade_maxima_da_turma}</TableCell>
                  <TableCell sx={{ color: 'text.primary', textAlign:"center" }}>{turma.capacidade_atual_da_turma}</TableCell>
                  <TableCell>
                    <Button variant="contained" color="secondary" onClick={() => handleOpenPresencaSemanalModal(turma)}>
                      Presença Semanal
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      {selectedTurma && (
        <ControleFrequenciaTableNoSSR
          alunosDaTurma={selectedTurma.alunos}
          nomeDaTurma={
            !selectedTurma.nome_da_turma.toLowerCase().includes(selectedModalidade.toLowerCase())
              ? `${selectedModalidade}_${selectedTurma.nome_da_turma}`
              : selectedTurma.nome_da_turma
          }
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
      {selectedTurma && isPresencaSemanalModalOpen && (
        <TurmaPresencaSemanal
          alunosDaTurma={selectedTurma.alunos}
          nomeDaTurma={
            !selectedTurma.nome_da_turma.toLowerCase().includes(selectedModalidade.toLowerCase())
              ? `${selectedModalidade}_${selectedTurma.nome_da_turma}`
              : selectedTurma.nome_da_turma
          }
          isOpen={isPresencaSemanalModalOpen}
          onClose={() => setIsPresencaSemanalModalOpen(false)}
        />
      )}
    </Box>
  );
}
