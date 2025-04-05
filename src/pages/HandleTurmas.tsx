'use client';
import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import {
  Container,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Box,
  AppBar,
  Tabs,
  Tab,
  Snackbar,
  Alert,
  Divider,
  SelectChangeEvent,
} from '@mui/material';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { Modalidade, Turma } from '@/interface/interfaces';
import { useData } from '@/context/context';
import { BoxStyleCadastro } from '@/utils/Styles';
import Layout from '@/components/TopBarComponents/Layout';

// TabPanel para organizar as seções
interface TabPanelProps {
  children?: React.ReactNode;
  value: number;
  index: number;
}
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3, bgcolor: 'background.paper' }}>{children}</Box>}
    </div>
  );
}

export default function ManageTurmas() {
  const { fetchModalidades } = useData();
  const [tabIndex, setTabIndex] = useState(0);
  const [modalidades, setModalidades] = useState<Modalidade[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [selectedTurma, setSelectedTurma] = useState<Turma | undefined>(undefined);
  // Estado do formulário sem os campos "modalidade" e "nucleo"
  const [formValues, setFormValues] = useState<Pick<Turma, 'categoria' | 'diaDaSemana' | 'horario' | 'capacidade_maxima_da_turma'>>({
    categoria: '',
    diaDaSemana: '',
    horario: '',
    capacidade_maxima_da_turma: 1,
  });
  const [nomeTurma, setNomeTurma] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [capacidadeInvalida, setCapacidadeInvalida] = useState(false);

  const categorias = ['SUB07', 'SUB08', 'SUB09', 'SUB10', 'SUB11', 'SUB12', 'SUB13', 'SUB14', 'SUB15_17'];

  // Busca as modalidades; aqui, filtramos para remover as "arquivados" e "excluidos"
  useEffect(() => {
    fetchModalidades().then((data) => {
      const validModalidades = data.filter(
        (mod) => mod.nome !== 'arquivados' && mod.nome !== 'excluidos'
      );
      setModalidades(validModalidades);
    });
  }, [fetchModalidades]);

  // Como há apenas uma modalidade, definimos as turmas a partir do primeiro item
  useEffect(() => {
    if (modalidades.length > 0) {
      const turmaData = modalidades[0].turmas;
      const turmasArray = Array.isArray(turmaData)
        ? turmaData
        : (Object.values(turmaData) as Turma[]);
      setTurmas(turmasArray);
    }
  }, [modalidades]);

  // Valida a capacidade se uma turma já estiver selecionada
  useEffect(() => {
    if (selectedTurma) {
      setCapacidadeInvalida(
        formValues.capacidade_maxima_da_turma < selectedTurma.capacidade_atual_da_turma
      );
    }
  }, [formValues.capacidade_maxima_da_turma, selectedTurma]);

  // Atualiza o nome da turma a partir dos campos do formulário
  useEffect(() => {
    updateNomeTurma(formValues);
  }, [formValues]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedValues = {
      ...formValues,
      [name]: name === 'capacidade_maxima_da_turma' ? Number(value) : value,
    };
    setFormValues(updatedValues);
    updateNomeTurma(updatedValues);
  };

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const { name, value } = event.target;
    const updatedValues = {
      ...formValues,
      [name]: value,
    };
    setFormValues(updatedValues);
    updateNomeTurma(updatedValues);
  };

  const handleTurmaSelectChange = (event: SelectChangeEvent<string>) => {
    const uuid = event.target.value as string;
    const turma = turmas.find((t) => t.uuidTurma === uuid);
    if (turma) {
      setSelectedTurma(turma);
      // Preenche os campos do formulário com os dados da turma selecionada
      const updatedValues = {
        categoria: turma.categoria,
        diaDaSemana: turma.diaDaSemana,
        horario: turma.horario,
        capacidade_maxima_da_turma: turma.capacidade_maxima_da_turma,
      };
      setFormValues(updatedValues);
      setNomeTurma(turma.nome_da_turma);
    } else {
      setSelectedTurma(undefined);
    }
  };

  const updateNomeTurma = (values: typeof formValues) => {
    const { categoria, diaDaSemana, horario } = values;
    const nome_da_turma = `${categoria}_${diaDaSemana}_${horario}`;
    setNomeTurma(nome_da_turma);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (selectedTurma) {
        // Atualiza a turma existente
        await axios.put('/api/HandleNewTurmas', {
          uuidTurma: selectedTurma.uuidTurma,
          nome_da_turma: nomeTurma,
          capacidade_maxima_da_turma: formValues.capacidade_maxima_da_turma,
          // Enviamos o valor fixo para modalidade e uma string vazia para nucleo
          modalidade: 'default',
          nucleo: '',
          categoria: formValues.categoria,
        });
        setSuccessMessage('Turma atualizada com sucesso!');
      } else {
        // Cria uma nova turma
        await axios.post('/api/HandleNewTurmas', {
          ...formValues,
          nome_da_turma: nomeTurma,
          modalidade: 'default',
          nucleo: '',
        });
        setSuccessMessage('Turma criada com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao realizar operação:', error);
    } finally {
      setLoading(false);
      // Reseta o formulário
      setFormValues({
        categoria: '',
        diaDaSemana: '',
        horario: '',
        capacidade_maxima_da_turma: 1,
      });
      setNomeTurma('');
      setSelectedTurma(undefined);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      if (selectedTurma && selectedTurma.uuidTurma) {
        await axios.delete('/api/HandleNewTurmas', {
          data: { uuidTurma: selectedTurma.uuidTurma, modalidade: 'default' },
        });
        setSuccessMessage('Turma deletada com sucesso!');
        setTurmas(turmas.filter((t) => t.uuidTurma !== selectedTurma.uuidTurma));
      }
    } catch (error) {
      console.error('Erro ao deletar turma:', error);
    } finally {
      setLoading(false);
      setFormValues({
        categoria: '',
        diaDaSemana: '',
        horario: '',
        capacidade_maxima_da_turma: 1,
      });
      setNomeTurma('');
      setSelectedTurma(undefined);
    }
  };

  return (
    <Layout>
      <Container sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 0 }}>
        <Box sx={BoxStyleCadastro}>
          <AppBar position="static" sx={{ backgroundColor: '#2e3b55', mt: '10px' }}>
            <Tabs
              value={tabIndex}
              onChange={handleTabChange}
              variant="fullWidth"
              textColor="inherit"
              indicatorColor="secondary"
            >
              <Tab label="Criar Turma" />
              <Tab label="Atualizar Turma" />
              <Tab label="Excluir Turma" />
            </Tabs>
          </AppBar>
          {/* Tab Criar Turma */}
          <TabPanel value={tabIndex} index={0}>
            <form onSubmit={handleSubmit}>
              {/* Removidos os controles de Modalidade e Núcleo */}
              <FormControl fullWidth margin="normal">
                <InputLabel>Categoria</InputLabel>
                <Select name="categoria" value={formValues.categoria} onChange={handleSelectChange} required>
                  {categorias.map((categoria) => (
                    <MenuItem key={categoria} value={categoria}>
                      {categoria}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal">
                <InputLabel>Dia da Semana</InputLabel>
                <Select name="diaDaSemana" value={formValues.diaDaSemana} onChange={handleSelectChange} required>
                  {['SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO'].map((dia) => (
                    <MenuItem key={dia} value={dia}>
                      {dia}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Horário"
                name="horario"
                value={formValues.horario}
                onChange={handleInputChange}
                required
                fullWidth
                margin="normal"
              />
              <TextField
                type="number"
                label="Capacidade Máxima"
                name="capacidade_maxima_da_turma"
                value={formValues.capacidade_maxima_da_turma.toString()}
                onChange={handleInputChange}
                required
                fullWidth
                margin="normal"
              />
              {capacidadeInvalida && (
                <Typography color="error" variant="body2">
                  A capacidade máxima não pode ser menor que o número atual de alunos.
                </Typography>
              )}
              <TextField
                label="Nome da Turma"
                value={nomeTurma}
                fullWidth
                margin="normal"
                disabled
              />
              <Button type="submit" variant="contained" color="primary" disabled={loading || capacidadeInvalida}>
                Criar Turma
              </Button>
            </form>
          </TabPanel>

          {/* Tab Atualizar Turma */}
          <TabPanel value={tabIndex} index={1}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Turma</InputLabel>
              <Select value={selectedTurma ? selectedTurma.uuidTurma : ''} onChange={handleTurmaSelectChange} required>
                {turmas.map((turma) => (
                  <MenuItem key={turma.uuidTurma} value={turma.uuidTurma}>
                    {turma.nome_da_turma}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {selectedTurma && (
              <form onSubmit={handleSubmit}>
                {/* Removido o campo Núcleo */}
                <FormControl fullWidth margin="normal">
                  <InputLabel>Categoria</InputLabel>
                  <Select name="categoria" value={formValues.categoria} onChange={handleSelectChange} required>
                    {categorias.map((categoria) => (
                      <MenuItem key={categoria} value={categoria}>
                        {categoria}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Dia da Semana</InputLabel>
                  <Select name="diaDaSemana" value={formValues.diaDaSemana} onChange={handleSelectChange} required>
                    {['SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO'].map((dia) => (
                      <MenuItem key={dia} value={dia}>
                        {dia}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Horário"
                  name="horario"
                  value={formValues.horario}
                  onChange={handleInputChange}
                  required
                  fullWidth
                  margin="normal"
                />
                <TextField
                  type="number"
                  label="Capacidade Máxima"
                  name="capacidade_maxima_da_turma"
                  value={formValues.capacidade_maxima_da_turma.toString()}
                  onChange={handleInputChange}
                  required
                  fullWidth
                  margin="normal"
                />
                {capacidadeInvalida && (
                  <Typography color="error" variant="body2">
                    A capacidade máxima não pode ser menor que o número atual de alunos (
                    {selectedTurma.capacidade_atual_da_turma}).
                  </Typography>
                )}
                <TextField
                  label="Nome da Turma"
                  value={nomeTurma}
                  fullWidth
                  margin="normal"
                  disabled
                />
                <Button type="submit" variant="contained" color="primary" disabled={loading || capacidadeInvalida}>
                  Atualizar Turma
                </Button>
              </form>
            )}
          </TabPanel>

          {/* Tab Excluir Turma */}
          <TabPanel value={tabIndex} index={2}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Turma</InputLabel>
              <Select value={selectedTurma ? selectedTurma.uuidTurma : ''} onChange={handleTurmaSelectChange} required>
                {turmas.map((turma) => (
                  <MenuItem key={turma.uuidTurma} value={turma.uuidTurma}>
                    {turma.nome_da_turma}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {selectedTurma && (
              <Button variant="contained" color="secondary" onClick={handleDelete} disabled={loading}>
                {loading ? 'Aguarde, deletando turma' : 'Deletar Turma'}
              </Button>
            )}
          </TabPanel>
          <Snackbar open={!!successMessage} autoHideDuration={6000} onClose={() => setSuccessMessage('')}>
            <Alert onClose={() => setSuccessMessage('')} severity="success" sx={{ width: '100%' }}>
              {successMessage}
            </Alert>
          </Snackbar>
        </Box>
      </Container>
    </Layout>
  );
}

export { ManageTurmas };
