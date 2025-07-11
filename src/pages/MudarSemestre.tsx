import React, { useState, useContext, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  MenuItem,
  Select,
  TextField,
  Typography,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]';
import { DataContext } from '@/context/context';
import axios from 'axios';
import { BoxStyleCadastro } from '@/utils/Styles';
import ResponsiveAppBar from '@/components/TopBarComponents/TopBar';
import ExportFaltasSemestre from '@/components/ExportFaltasDoSemestre/ExportFaltasDoSemestre';
import { Aluno, Turma } from '@/interface/interfaces';

// Função para dividir um array em pedaços (chunks)
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
}

export default function AtualizarSemestre() {
  const { modalidades, fetchModalidades } = useContext(DataContext);
  const [ano, setAno] = useState<number>(new Date().getFullYear());
  const [semestre, setSemestre] = useState<'primeiro' | 'segundo'>('primeiro');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [openConfirmation, setOpenConfirmation] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');

  useEffect(() => {
    fetchModalidades().finally(() => setIsLoading(false));
  }, [fetchModalidades]);

  const handleAtualizarPresencas = async () => {
    if (isLoading || isProcessing) return;

    setIsProcessing(true);
    setOpenConfirmation(false);
    setProcessingStatus('Iniciando atualização...');

    try {
      for (const modalidade of modalidades) {
        let turmaCount = 0;
        for (const turma of modalidade.turmas) {
          turmaCount++;

          // Divide os alunos desta turma em lotes de 5
          const lotesDeAlunos = chunkArray(turma.alunos, 5);
          
          let loteCount = 0;
          for (const lote of lotesDeAlunos) {
            loteCount++;
            const statusMessage = `Turma ${turmaCount}/${modalidade.turmas.length}: Processando lote de alunos ${loteCount}/${lotesDeAlunos.length}`;
            console.log(statusMessage, `(${turma.nome_da_turma})`);
            setProcessingStatus(statusMessage);

            // Cria um payload com a turma, mas SÓ com o lote atual de alunos
            const turmaComLoteDeAlunos = { ...turma, alunos: lote };

            const payload = {
              ano,
              semestre,
              modalidade: { 
                id: modalidade.nome, 
                turmas: [turmaComLoteDeAlunos] // Envia um array com a turma contendo apenas o lote de alunos
              },
            };
            
            await axios.post('/api/TrocarSemestre', payload, { timeout: 60000 });
          }
        }
      }

      setProcessingStatus('Finalizando e buscando dados atualizados...');
      await fetchModalidades();
      alert("Semestre atualizado com sucesso para todas as turmas!");

    } catch (error) {
      console.error("ERRO CRÍTICO no frontend!", error);
      const errorMessage = axios.isAxiosError(error) ? error.response?.data?.message || error.message : "Um erro inesperado ocorreu.";
      alert(`Erro: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const handleOpenConfirmation = () => setOpenConfirmation(true);
  const handleCloseConfirmation = () => setOpenConfirmation(false);

  return (
    <>
      <ResponsiveAppBar />
      <Container>
        <Box sx={BoxStyleCadastro}>
          <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold', color: "black" }}>
            Atualização de Semestre
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, color: "red" }}>
            Atenção: Esta operação irá substituir TODAS as presenças do semestre atual.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
            <TextField
              label="Ano"
              type="number"
              value={ano}
              onChange={(e) => setAno(parseInt(e.target.value, 10))}
            />
            <Select
              value={semestre}
              onChange={(e) => setSemestre(e.target.value as 'primeiro' | 'segundo')}
            >
              <MenuItem value="primeiro">Primeiro Semestre</MenuItem>
              <MenuItem value="segundo">Segundo Semestre</MenuItem>
            </Select>
          </Box>
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenConfirmation}
            disabled={isLoading || isProcessing}
            sx={{ position: 'relative', width: '100%', mb: 2 }}
          >
            {isProcessing ? "Atualizando..." : "Trocar o Semestre!"}
            {isProcessing && (
              <CircularProgress
                size={24}
                sx={{ position: 'absolute', top: '50%', left: '50%', marginTop: '-12px', marginLeft: '-12px' }}
              />
            )}
          </Button>
          {isProcessing && (
            <Typography variant="body2" sx={{ color: 'primary.main', textAlign: 'center' }}>
              {processingStatus}
            </Typography>
          )}
          <Dialog open={openConfirmation} onClose={handleCloseConfirmation}>
            <DialogTitle>Confirmação</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Tem certeza que deseja substituir os dados de presença pelo {semestre} semestre de {ano}?
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button variant="contained" onClick={handleCloseConfirmation} color="secondary">
                Cancelar
              </Button>
              <Button variant="contained" onClick={handleAtualizarPresencas} color="primary" autoFocus>
                Confirmar e Atualizar
              </Button>
            </DialogActions>
          </Dialog>
          <ExportFaltasSemestre />
        </Box>
      </Container>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session || session.user.role !== 'admin') {
    return {
      redirect: {
        destination: '/NotAllowPage',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};