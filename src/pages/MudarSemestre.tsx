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

// Função utilitária: divide um array em chunks de tamanho definido,
// retornando o último chunk com os itens restantes (mesmo que menor).
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
}

export default function AtualizarSemestre() {
  const { modalidades, fetchModalidades } = useContext(DataContext);
  const [ano, setAno] = useState<number>(2025);
  const [semestre, setSemestre] = useState<'primeiro' | 'segundo'>('primeiro');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [openConfirmation, setOpenConfirmation] = useState(false);

  // Buscar modalidades ao carregar o componente
  useEffect(() => {
    const fetchData = async () => {
      await fetchModalidades();
      setIsLoading(false);
    };
    fetchData();
  }, [fetchModalidades]);

  const handleAtualizarPresencas = async () => {
    if (isLoading || isProcessing) {
      return;
    }

    setIsProcessing(true);
    setOpenConfirmation(false);

    // Para cada modalidade, dividimos as turmas em lotes de 10 e atualizamos
    for (const modalidade of modalidades) {
      const lotesDeTurmas = chunkArray(modalidade.turmas, 10);
      for (const lote of lotesDeTurmas) {
        try {
          const response = await axios.post('/api/TrocarSemestre', {
            ano,
            semestre,
            modalidade: { ...modalidade, turmas: lote },
          });
          if (response.status === 200) {
            console.log(`Presenças da modalidade ${modalidade.nome} atualizadas com sucesso!`);
          } else {
            console.error(`Erro ao atualizar presenças da modalidade ${modalidade.nome}.`);
          }
        } catch (error) {
          console.error(`Erro ao atualizar presenças da modalidade ${modalidade.nome}:`, error);
        }
      }
    }

    setIsProcessing(false);
    alert("Presenças atualizadas com sucesso!");
  };

  const handleOpenConfirmation = () => {
    setOpenConfirmation(true);
  };

  const handleCloseConfirmation = () => {
    setOpenConfirmation(false);
  };

  return (
    <>
      <ResponsiveAppBar />
      <Container>
        <Box sx={BoxStyleCadastro}>
          <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold', color: "black" }}>
            Atualização de Semestre
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, color: "red" }}>
            Certifique-se de ter salvo os dados atuais antes de proceder, pois esta operação substituirá o semestre inteiro em todas as turmas, apagando as presenças anteriores!
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
            <TextField
              label="Ano"
              type="number"
              value={ano}
              onChange={(e) => setAno(parseInt(e.target.value, 10))}
            />
            <Select
              label="Semestre"
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
            sx={{ position: 'relative' }}
          >
            {isProcessing ? "Atualizando..." : "Trocar o Semestre!"}
            {isProcessing && (
              <CircularProgress
                size={24}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  marginTop: '-12px',
                  marginLeft: '-12px',
                }}
              />
            )}
          </Button>
          <Dialog open={openConfirmation} onClose={handleCloseConfirmation}>
            <DialogTitle>Confirmação</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Esta operação substituirá o semestre inteiro em todas as turmas. Certifique-se de ter salvo os dados antes de prosseguir.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button variant="contained" onClick={handleCloseConfirmation} color="error">
                Cancelar
              </Button>
              <Button variant="contained" onClick={handleAtualizarPresencas} color="success" autoFocus>
                Confirmar
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

  // Se não tiver sessão ou não for admin, redirecione
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