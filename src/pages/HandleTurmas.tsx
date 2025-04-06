"use client";
import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
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
  SelectChangeEvent,
} from "@mui/material";
import axios from "axios";

// Se você tiver um contexto (useData) para buscar modalidades, importe aqui:

import { Modalidade, Turma } from "@/interface/interfaces";
import Layout from "@/components/TopBarComponents/Layout";
import { BoxStyleCadastro } from "@/utils/Styles";
import { useData } from "@/context/context";

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
      {value === index && (
        <Box sx={{ p: 3, bgcolor: "background.paper" }}>{children}</Box>
      )}
    </div>
  );
}

export default function ManageTurmas() {
  // Se seu contexto disponibiliza a função fetchModalidades, use aqui:
  const { fetchModalidades } = useData();

  // Estado para controlar qual aba está selecionada (Criar, Atualizar, Excluir)
  const [tabIndex, setTabIndex] = useState(0);

  // Lista de modalidades e turmas carregadas do back-end
  const [modalidades, setModalidades] = useState<Modalidade[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);

  // Turma atualmente selecionada (para atualizar/excluir)
  const [selectedTurma, setSelectedTurma] = useState<Turma | undefined>(
    undefined
  );

  // ESTADO do formulário de criação/edição:
  // 'diasDaSemana' é um array de strings
  const [formValues, setFormValues] = useState<{
    categoria: string;
    diaDaSemana: string[];
    horario: string;
    capacidade_maxima_da_turma: number;
  }>({
    categoria: "",
    diaDaSemana: [],
    horario: "",
    capacidade_maxima_da_turma: 1,
  });

  // Nome da turma (concatenado para exibir no TextField)
  const [nomeTurma, setNomeTurma] = useState("");

  // Estados de loading e mensagem de sucesso
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Se a turma tiver alunos já inscritos, não pode reduzir capacidade abaixo disso
  const [capacidadeInvalida, setCapacidadeInvalida] = useState(false);

  // Exemplo de lista de categorias disponíveis
  const categorias = [
    "Infanto Imigrante",
    "Mirim Imigrante",
    "Mini",
    "Kvôlei Infantil",
    "Kvôlei Mirim",
    "Kvôlei Infanto",
    "Kvôlei Masculino Infanto",
    "Kvôlei Mirim Masculino",
    "Kvôlei juvenil Masculino",
    "Kvôlei Adulto Feminino",
    "Kvôlei Adulto Masculino",
  ];

  // Lista de dias da semana que podem ser escolhidos
  const diasSemanaPossiveis = [
    "SEGUNDA",
    "TERÇA",
    "QUARTA",
    "QUINTA",
    "SEXTA",
    "SÁBADO",
    "DOMINGO",
  ];

  // --------------------------------------------------------------------------
  // 1) Carrega as modalidades / turmas do backend (via contexto) ao montar
  // --------------------------------------------------------------------------
  useEffect(() => {
    fetchModalidades("volei").then((data) => {
      // Filtra se existirem modalidades "arquivados" ou "excluidos"
      const validModalidades = data.filter(
        (mod) => mod.nome !== "arquivados" && mod.nome !== "excluidos"
      );
      setModalidades(validModalidades);
    });
  }, [fetchModalidades]);

  // --------------------------------------------------------------------------
  // 2) Assim que carregamos modalidades, pegamos as turmas
  //    (supondo que há apenas 1 "volei" e suas turmas)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (modalidades.length > 0) {
      const turmaData = modalidades[0].turmas;
      const turmasArray = Array.isArray(turmaData)
        ? turmaData
        : (Object.values(turmaData) as Turma[]);
      setTurmas(turmasArray);
    }
  }, [modalidades]);

  // --------------------------------------------------------------------------
  // 3) Se uma turma estiver selecionada, verifica se a capacidade é válida
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (selectedTurma) {
      // Se a capacidade do form < capacidade_atual => é inválido
      setCapacidadeInvalida(
        formValues.capacidade_maxima_da_turma <
          selectedTurma.capacidade_atual_da_turma
      );
    }
  }, [formValues.capacidade_maxima_da_turma, selectedTurma]);

  // --------------------------------------------------------------------------
  // 4) Sempre que formValues muda, recalculamos o nome da turma
  // --------------------------------------------------------------------------
  useEffect(() => {
    updateNomeTurma(formValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formValues]);

  // --------------------------------------------------------------------------
  // Funções Auxiliares
  // --------------------------------------------------------------------------
  function handleTabChange(event: React.SyntheticEvent, newValue: number) {
    setTabIndex(newValue);
  }

  // Atualiza `formValues` para os campos simples (categoria, horario, capacidade)
  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    const newValues = {
      ...formValues,
      [name]: name === "capacidade_maxima_da_turma" ? Number(value) : value,
    };
    setFormValues(newValues);
  }

  // Troca a turma selecionada no Select "Turma" (atualizar/excluir)
  function handleTurmaSelectChange(event: SelectChangeEvent<string>) {
    const uuid = event.target.value;
    const turma = turmas.find((t) => t.uuidTurma === uuid);
    if (turma) {
      setSelectedTurma(turma);

      // Precisamos garantir que "diasDaSemana" seja array
      // Se sua API salvar como array, deve estar em "turma.diasDaSemana"
      // Se estiver em "turma.diaDaSemana" (singular), converta
      // Exemplo:
      let daysArray: string[] = [];
      if (Array.isArray(turma.diaDaSemana)) {
        daysArray = turma. diaDaSemana;
      } else if (typeof turma.diaDaSemana === "string") {
        // fallback se seu db antigo tiver "diaDaSemana" no singular
        daysArray = [turma.diaDaSemana];
      }

      const values = {
        categoria: turma.categoria || "",
        diaDaSemana: daysArray,
        horario: turma.horario || "",
        capacidade_maxima_da_turma:
          turma.capacidade_maxima_da_turma || 1,
      };

      setFormValues(values);
      setNomeTurma(turma.nome_da_turma || "");
    } else {
      setSelectedTurma(undefined);
    }
  }

  // Para o Select multiple de diasDaSemana
  function handleDiasDaSemanaChange(event: SelectChangeEvent<string[]>) {
    const valor = event.target.value as string[];
    setFormValues((prev) => ({ ...prev, diaDaSemana: valor }));
  }

  // Gera o nome da turma concatenando
  function updateNomeTurma(values: typeof formValues) {
    const { categoria, diaDaSemana: diasDaSemana, horario } = values;
    const nome_da_turma = `${categoria}_${diasDaSemana.join("_")}_${horario}`;
    setNomeTurma(nome_da_turma);
  }

  // --------------------------------------------------------------------------
  // handleSubmit: cria ou atualiza a turma
  // --------------------------------------------------------------------------
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage("");

    try {
      if (selectedTurma) {
        // ATUALIZAR
        await axios.put("/api/HandleNewTurmas", {
          uuidTurma: selectedTurma.uuidTurma,
          nome_da_turma: nomeTurma,
          capacidade_maxima_da_turma: formValues.capacidade_maxima_da_turma,
          categoria: formValues.categoria,
          diasDaSemana: formValues.diaDaSemana,
          horario: formValues.horario,
          modalidade: "volei", // Se for sempre "volei"
        });
        setSuccessMessage("Turma atualizada com sucesso!");
      } else {
        // CRIAR
        await axios.post("/api/HandleNewTurmas", {
          categoria: formValues.categoria,
          diasDaSemana: formValues.diaDaSemana,
          horario: formValues.horario,
          capacidade_maxima_da_turma: formValues.capacidade_maxima_da_turma,
        });
        setSuccessMessage("Turma criada com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao criar/atualizar turma:", error);
    } finally {
      setLoading(false);

      // Limpa tudo
      setFormValues({
        categoria: "",
        diaDaSemana: [],
        horario: "",
        capacidade_maxima_da_turma: 1,
      });
      setNomeTurma("");
      setSelectedTurma(undefined);
    }
  }

  // --------------------------------------------------------------------------
  // handleDelete: exclui a turma selecionada
  // --------------------------------------------------------------------------
  async function handleDelete() {
    if (!selectedTurma) return;
    setLoading(true);
    setSuccessMessage("");

    try {
      await axios.delete("/api/HandleNewTurmas", {
        data: {
          uuidTurma: selectedTurma.uuidTurma,
          modalidade: "volei", // ou "default"
        },
      });
      setSuccessMessage("Turma excluída com sucesso!");
      // Remove do array local
      setTurmas((prev) =>
        prev.filter((t) => t.uuidTurma !== selectedTurma.uuidTurma)
      );
    } catch (error) {
      console.error("Erro ao deletar turma:", error);
    } finally {
      setLoading(false);
      setFormValues({
        categoria: "",
        diaDaSemana: [],
        horario: "",
        capacidade_maxima_da_turma: 1,
      });
      setNomeTurma("");
      setSelectedTurma(undefined);
    }
  }

  // --------------------------------------------------------------------------
  // Renderização
  // --------------------------------------------------------------------------
  return (
    <Layout>
      <Container
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: 0,
        }}
      >
        <Box sx={BoxStyleCadastro}>
          <AppBar
            position="static"
            sx={{ backgroundColor: "#2e3b55", mt: "10px" }}
          >
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

          {/* Aba 0: Criar Turma */}
          <TabPanel value={tabIndex} index={0}>
            <form onSubmit={handleSubmit}>
              {/* Categoria */}
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Categoria</InputLabel>
                <Select
                  name="categoria"
                  value={formValues.categoria}
                  onChange={(e) =>
                    setFormValues((prev) => ({
                      ...prev,
                      categoria: e.target.value as string,
                    }))
                  }
                >
                  {categorias.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Múltiplos Dias da Semana */}
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Dias da Semana</InputLabel>
                <Select
                  multiple
                  name="diasDaSemana"
                  value={formValues.diaDaSemana}
                  onChange={handleDiasDaSemanaChange}
                  renderValue={(selected) => (selected as string[]).join(", ")}
                >
                  {diasSemanaPossiveis.map((dia) => (
                    <MenuItem key={dia} value={dia}>
                      {dia}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Horário */}
              <TextField
                label="Horário"
                name="horario"
                value={formValues.horario}
                onChange={handleInputChange}
                required
                fullWidth
                margin="normal"
              />

              {/* Capacidade Máxima */}
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
              {capacidadeInvalida && selectedTurma && (
                <Typography color="error" variant="body2">
                  A capacidade máxima não pode ser menor que o número atual de
                  alunos ({selectedTurma.capacidade_atual_da_turma}).
                </Typography>
              )}

              {/* Nome da Turma (apenas para exibir) */}
              <TextField
                label="Nome da Turma"
                value={nomeTurma}
                fullWidth
                margin="normal"
                disabled
              />

              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading || capacidadeInvalida}
              >
                Criar Turma
              </Button>
            </form>
          </TabPanel>

          {/* Aba 1: Atualizar Turma */}
          <TabPanel value={tabIndex} index={1}>
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Turma</InputLabel>
              <Select
                value={selectedTurma ? selectedTurma.uuidTurma : ""}
                onChange={handleTurmaSelectChange}
              >
                {turmas.map((turma) => (
                  <MenuItem key={turma.uuidTurma} value={turma.uuidTurma}>
                    {turma.nome_da_turma}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedTurma && (
              <form onSubmit={handleSubmit}>
                <FormControl fullWidth margin="normal" required>
                  <InputLabel>Categoria</InputLabel>
                  <Select
                    name="categoria"
                    value={formValues.categoria}
                    onChange={(e) =>
                      setFormValues((prev) => ({
                        ...prev,
                        categoria: e.target.value as string,
                      }))
                    }
                  >
                    {categorias.map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        {cat}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth margin="normal" required>
                  <InputLabel>Dias da Semana</InputLabel>
                  <Select
                    multiple
                    name="diasDaSemana"
                    value={formValues.diaDaSemana}
                    onChange={handleDiasDaSemanaChange}
                    renderValue={(selected) =>
                      (selected as string[]).join(", ")
                    }
                  >
                    {diasSemanaPossiveis.map((dia) => (
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
                    A capacidade máxima não pode ser menor que o número atual de
                    alunos (
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

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading || capacidadeInvalida}
                >
                  Atualizar Turma
                </Button>
              </form>
            )}
          </TabPanel>

          {/* Aba 2: Excluir Turma */}
          <TabPanel value={tabIndex} index={2}>
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Turma</InputLabel>
              <Select
                value={selectedTurma ? selectedTurma.uuidTurma : ""}
                onChange={handleTurmaSelectChange}
              >
                {turmas.map((turma) => (
                  <MenuItem key={turma.uuidTurma} value={turma.uuidTurma}>
                    {turma.nome_da_turma}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedTurma && (
              <Button
                variant="contained"
                color="secondary"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? "Aguarde, deletando turma" : "Deletar Turma"}
              </Button>
            )}
          </TabPanel>

          {/* Snackbar de sucesso */}
          <Snackbar
            open={!!successMessage}
            autoHideDuration={6000}
            onClose={() => setSuccessMessage("")}
          >
            <Alert
              onClose={() => setSuccessMessage("")}
              severity="success"
              sx={{ width: "100%" }}
            >
              {successMessage}
            </Alert>
          </Snackbar>
        </Box>
      </Container>
    </Layout>
  );
}
