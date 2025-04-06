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
  // Pega a função do contexto que busca modalidades
  const { fetchModalidades } = useData();

  // Aba selecionada: 0=criar, 1=atualizar, 2=excluir
  const [tabIndex, setTabIndex] = useState(0);

  // Lista de modalidades e lista de turmas
  const [modalidades, setModalidades] = useState<Modalidade[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);

  // Turma selecionada (para atualizar ou excluir)
  const [selectedTurma, setSelectedTurma] = useState<Turma | undefined>(
    undefined
  );

  // Formulário para criar/editar turma
  const [formValues, setFormValues] = useState<{
    categoria: string;
    diaDaSemana: string[]; // array de strings
    horario: string;
    capacidade_maxima_da_turma: number;
  }>({
    categoria: "",
    diaDaSemana: [],
    horario: "",
    capacidade_maxima_da_turma: 1,
  });

  const [nomeTurma, setNomeTurma] = useState(""); // nome da turma final
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [capacidadeInvalida, setCapacidadeInvalida] = useState(false);

  // Categorias disponíveis
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

  // Dias da semana possíveis
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
  // 1) Buscar modalidades do back-end (fetchModalidades) ao montar o componente
  // --------------------------------------------------------------------------
  useEffect(() => {
    fetchModalidades("volei").then((data) => {
      // Filtrar modalidades "arquivados" ou "excluidos"
      const validModalidades = data.filter(
        (mod) => mod.nome !== "arquivados" && mod.nome !== "excluidos"
      );
      setModalidades(validModalidades);
    });
  }, [fetchModalidades]);

  // --------------------------------------------------------------------------
  // 2) Assim que temos "modalidades", pegamos as turmas (por ex., "volei" em [0])
  // --------------------------------------------------------------------------
  useEffect(() => {
    // Se não houver nada em modalidades, não faz nada
    if (modalidades.length === 0) {
      setTurmas([]);
      return;
    }

    // Pega a primeira (ou a que você preferir)
    const primeiraModalidade = modalidades[0];

    // Se "primeiraModalidade" ou "primeiraModalidade.turmas" não existir, evita erro
    if (!primeiraModalidade || !primeiraModalidade.turmas) {
      setTurmas([]);
      return;
    }

    const turmaData = primeiraModalidade.turmas;

    // Se for array, mantemos como está; se for objeto, convertemos
    if (Array.isArray(turmaData)) {
      setTurmas(turmaData);
    } else {
      // Converte para array de Turma
      setTurmas(Object.values(turmaData) as Turma[]);
    }
  }, [modalidades]);

  // --------------------------------------------------------------------------
  // 3) Se há uma turma selecionada, verifica se a capacidade é válida
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (selectedTurma) {
      const invalido =
        formValues.capacidade_maxima_da_turma <
        selectedTurma.capacidade_atual_da_turma;
      setCapacidadeInvalida(invalido);
    }
  }, [formValues.capacidade_maxima_da_turma, selectedTurma]);

  // --------------------------------------------------------------------------
  // 4) Toda vez que "formValues" muda, recalculamos "nome_da_turma"
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

  // Para inputs simples (categoria, horario, capacidade)
  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    const newValues = {
      ...formValues,
      [name]: name === "capacidade_maxima_da_turma" ? Number(value) : value,
    };
    setFormValues(newValues);
  }

  // Ao selecionar uma turma no combo (atualizar/excluir)
  function handleTurmaSelectChange(event: SelectChangeEvent<string>) {
    const turmaUuid = event.target.value;
    const turmaEncontrada = turmas.find((t) => t.uuidTurma === turmaUuid);

    if (turmaEncontrada) {
      setSelectedTurma(turmaEncontrada);

      // Monta o array de dias da semana
      let daysArray: string[] = [];
      if (Array.isArray(turmaEncontrada.diaDaSemana)) {
        daysArray = turmaEncontrada.diaDaSemana;
      } else if (typeof turmaEncontrada.diaDaSemana === "string") {
        // fallback se só tiver "diaDaSemana"
        daysArray = [turmaEncontrada.diaDaSemana];
      }

      // Preenche o form
      const values = {
        categoria: turmaEncontrada.categoria || "",
        diaDaSemana: daysArray,
        horario: turmaEncontrada.horario || "",
        capacidade_maxima_da_turma:
          turmaEncontrada.capacidade_maxima_da_turma || 1,
      };

      setFormValues(values);
      setNomeTurma(turmaEncontrada.nome_da_turma || "");
    } else {
      setSelectedTurma(undefined);
    }
  }

  // Para múltiplos dias da semana
  function handlediaDaSemanaChange(event: SelectChangeEvent<string[]>) {
    const valor = event.target.value as string[];
    setFormValues((prev) => ({ ...prev, diaDaSemana: valor }));
  }

  // Monta o nome da turma
  function updateNomeTurma(values: typeof formValues) {
    const { categoria, diaDaSemana, horario } = values;
    const novoNomeTurma = `${categoria}_${diaDaSemana.join("_")}_${horario}`;
    setNomeTurma(novoNomeTurma);
  }

  // Submit (criar/atualizar)
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage("");

    try {
      if (selectedTurma) {
        // Atualizar
        await axios.put("/api/HandleNewTurmas", {
          uuidTurma: selectedTurma.uuidTurma,
          nome_da_turma: nomeTurma,
          capacidade_maxima_da_turma: formValues.capacidade_maxima_da_turma,
          categoria: formValues.categoria,
          diaDaSemana: formValues.diaDaSemana,
          horario: formValues.horario,
          modalidade: "volei",
        });
        setSuccessMessage("Turma atualizada com sucesso!");
      } else {
        // Criar
        await axios.post("/api/HandleNewTurmas", {
          categoria: formValues.categoria,
          diaDaSemana: formValues.diaDaSemana,
          horario: formValues.horario,
          capacidade_maxima_da_turma: formValues.capacidade_maxima_da_turma,
        });
        setSuccessMessage("Turma criada com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao criar/atualizar turma:", error);
    } finally {
      setLoading(false);

      // Reseta tudo
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

  // Excluir Turma
  async function handleDelete() {
    if (!selectedTurma) return;
    setLoading(true);
    setSuccessMessage("");

    try {
      await axios.delete("/api/HandleNewTurmas", {
        data: {
          uuidTurma: selectedTurma.uuidTurma,
          modalidade: "volei",
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

  // Render
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
                  name="diaDaSemana"
                  value={formValues.diaDaSemana}
                  onChange={handlediaDaSemanaChange}
                  renderValue={(selected) => (selected as string[]).join(", ")}
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

              {/* Caso queira exibir alguma validação de capacidade */}
              {capacidadeInvalida && selectedTurma && (
                <Typography color="error" variant="body2">
                  A capacidade máxima não pode ser menor que o número atual de
                  alunos ({selectedTurma.capacidade_atual_da_turma}).
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
                    name="diaDaSemana"
                    value={formValues.diaDaSemana}
                    onChange={handlediaDaSemanaChange}
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
                    alunos ({selectedTurma.capacidade_atual_da_turma}).
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
