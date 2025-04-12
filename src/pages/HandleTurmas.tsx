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
  Autocomplete,
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

/**
 * Componente principal para criar / atualizar / excluir turmas,
 * com a categoria livre (mas com sugestões).
 * Ao final, forçamos underscores e uppercase (dos dias) no front,
 * e também repetimos a higiene no back-end.
 */
export default function ManageTurmas() {
  // Pega a função do contexto que busca modalidades
  const { fetchModalidades } = useData();

  // Controle de abas
  const [tabIndex, setTabIndex] = useState(0);

  // Lista de modalidades e turmas
  const [modalidades, setModalidades] = useState<Modalidade[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);

  // Turma selecionada (para atualizar/excluir)
  const [selectedTurma, setSelectedTurma] = useState<Turma | undefined>(
    undefined
  );

  // Formulário de criação/edição
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

  // Nome final da turma (meramente para exibir)
  const [nomeTurma, setNomeTurma] = useState("");
  // Loading e mensagem de sucesso
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  // Verificar se capacidade é inválida
  const [capacidadeInvalida, setCapacidadeInvalida] = useState(false);

  // SUGESTÕES de categorias
  const categoriasSugeridas = [
    "Infanto Imigrante",
    "Mirim Imigrante",
    "Mini",
    "Kvôlei_Infantil",
    "Kvôlei_Mirim",
    "Kvôlei_Infanto",
    "Kvôlei_Masculino_Infanto",
    "Kvôlei_Mirim_Masculino",
    "Kvôlei_juvenil_Masculino",
    "Kvôlei_Adulto_Feminino",
    "Kvôlei_Adulto_Masculino",
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

  // Carrega as modalidades do back-end, filtrando "volei"
  useEffect(() => {
    fetchModalidades().then((data) => {
      const volei = data.find((mod) => mod.nome.toLowerCase() === "volei");
      if (volei) {
        setModalidades([volei]);
      } else {
        setModalidades([]);
      }
    });
  }, [fetchModalidades]);

  // Depois que temos "modalidades", extraímos as turmas (supondo uma só, "volei")
  useEffect(() => {
    if (modalidades.length === 0) {
      setTurmas([]);
      return;
    }
    const voleiModalidade = modalidades[0];
    if (!voleiModalidade.turmas) {
      setTurmas([]);
      return;
    }

    if (Array.isArray(voleiModalidade.turmas)) {
      setTurmas(voleiModalidade.turmas);
    } else {
      setTurmas(Object.values(voleiModalidade.turmas) as Turma[]);
    }
  }, [modalidades]);

  // Se já tem turma selecionada e o form "capacidade" mudar
  useEffect(() => {
    if (selectedTurma) {
      const invalido =
        formValues.capacidade_maxima_da_turma <
        selectedTurma.capacidade_atual_da_turma;
      setCapacidadeInvalida(invalido);
    }
  }, [formValues.capacidade_maxima_da_turma, selectedTurma]);

  // Recalcula "nomeTurma" toda vez que formValues mudar
  useEffect(() => {
    updateNomeTurma(formValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formValues]);

  // Troca de aba
  function handleTabChange(_event: React.SyntheticEvent, newValue: number) {
    setTabIndex(newValue);
  }

  // Campo "diaDaSemana" multiple
  function handleDiaDaSemanaChange(event: SelectChangeEvent<string[]>) {
    const valor = event.target.value as string[];
    setFormValues((prev) => ({ ...prev, diaDaSemana: valor }));
  }

  // Campo "capacidade", "horario" etc.
  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    const newValues = {
      ...formValues,
      [name]: name === "capacidade_maxima_da_turma" ? Number(value) : value,
    };
    setFormValues(newValues);
  }

  // Monta nome final para exibição local
  function updateNomeTurma(values: typeof formValues) {
    const { categoria, diaDaSemana, horario } = values;
    // Forçamos underscores e uppercase para dias
    const cat = categoria.replace(/\s+/g, "_");
    const dias = diaDaSemana.map((d) => d.replace(/\s+/g, "_").toUpperCase());
    const hora = horario.replace(/\s+/g, "_");
    const finalNome = `${cat}_${dias.join("_")}_${hora}`;
    setNomeTurma(finalNome);
  }

  // Ao selecionar turma no combo
  function handleTurmaSelectChange(event: SelectChangeEvent<string>) {
    const turmaUuid = event.target.value;
    const foundTurma = turmas.find((t) => t.uuidTurma === turmaUuid);
    if (!foundTurma) {
      setSelectedTurma(undefined);
      return;
    }

    setSelectedTurma(foundTurma);
    // Montar array de dias
    let daysArray: string[] = [];
    if (Array.isArray(foundTurma.diaDaSemana)) {
      daysArray = foundTurma.diaDaSemana;
    } else if (typeof foundTurma.diaDaSemana === "string") {
      daysArray = [foundTurma.diaDaSemana];
    }

    // Preenche form
    setFormValues({
      categoria: foundTurma.categoria || "",
      diaDaSemana: daysArray,
      horario: foundTurma.horario || "",
      capacidade_maxima_da_turma: foundTurma.capacidade_maxima_da_turma || 1,
    });
    setNomeTurma(foundTurma.nome_da_turma || "");
  }

  // Submeter create/update
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage("");

    try {
      // Forçamos novamente no front-end (apesar de no back tbm fazermos)
      const cat = formValues.categoria.replace(/\s+/g, "_");
      const dias = formValues.diaDaSemana.map((d) =>
        d.replace(/\s+/g, "_").toUpperCase()
      );
      const hora = formValues.horario.replace(/\s+/g, "_");

      const finalNome = `${cat}_${dias.join("_")}_${hora}`;

      if (selectedTurma && tabIndex === 1) {
        // UPDATE
        await axios.put("/api/HandleNewTurmas", {
          uuidTurma: selectedTurma.uuidTurma,
          nome_da_turma: finalNome, // passamos nome final
          capacidade_maxima_da_turma: formValues.capacidade_maxima_da_turma,
          categoria: cat,
          diaDaSemana: formValues.diaDaSemana, // array de dias sem underscore
          horario: formValues.horario,
          modalidade: "volei",
        });
        setSuccessMessage("Turma atualizada com sucesso!");
      } else if (tabIndex === 0) {
        // CREATE
        await axios.post("/api/HandleNewTurmas", {
          categoria: cat,
          diaDaSemana: dias, // passamos array já uppercase e underscores
          horario: hora,
          capacidade_maxima_da_turma: formValues.capacidade_maxima_da_turma,
        });
        setSuccessMessage("Turma criada com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao criar/atualizar turma:", error);
      alert("Falha ao criar/atualizar turma. Ver console para detalhes.");
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

  // Excluir
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
      // Remove local
      setTurmas((prev) =>
        prev.filter((t) => t.uuidTurma !== selectedTurma.uuidTurma)
      );
    } catch (error) {
      console.error("Erro ao deletar turma:", error);
      alert("Falha ao deletar turma. Ver console.");
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
          <AppBar position="static" sx={{ backgroundColor: "#2e3b55", mt: "10px" }}>
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

          {/* Aba 0 - Criar Turma */}
          <TabPanel value={tabIndex} index={0}>
            <form onSubmit={handleSubmit}>
              <Typography variant="subtitle1" sx={{ mt: 2 }}>
                Categoria (livre, sugerida, mas não obrigatória)
              </Typography>
              <Autocomplete
                freeSolo
                options={categoriasSugeridas}
                value={formValues.categoria}
                onInputChange={(event, newVal) => {
                  setFormValues((prev) => ({ ...prev, categoria: newVal }));
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Categoria" fullWidth />
                )}
              />

              <FormControl fullWidth margin="normal" required sx={{ mt: 2 }}>
                <InputLabel>Dias da Semana</InputLabel>
                <Select
                  multiple
                  name="diaDaSemana"
                  value={formValues.diaDaSemana}
                  onChange={handleDiaDaSemanaChange}
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

              <TextField
                label="Nome da Turma (preview)"
                value={nomeTurma}
                fullWidth
                margin="normal"
                disabled
              />

              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
              >
                Criar Turma
              </Button>
            </form>
          </TabPanel>

          {/* Aba 1 - Atualizar Turma */}
          <TabPanel value={tabIndex} index={1}>
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Selecione a Turma (Atualizar)</InputLabel>
              <Select
                value={selectedTurma?.uuidTurma || ""}
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
                <Typography variant="subtitle1" sx={{ mt: 2 }}>
                  Categoria (livre, sugerida, mas não obrigatória)
                </Typography>
                <Autocomplete
                  freeSolo
                  options={categoriasSugeridas}
                  value={formValues.categoria}
                  onInputChange={(event, newVal) => {
                    setFormValues((prev) => ({ ...prev, categoria: newVal }));
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Categoria" fullWidth />
                  )}
                />

                <FormControl fullWidth margin="normal" required sx={{ mt: 2 }}>
                  <InputLabel>Dias da Semana</InputLabel>
                  <Select
                    multiple
                    name="diaDaSemana"
                    value={formValues.diaDaSemana}
                    onChange={handleDiaDaSemanaChange}
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
                {capacidadeInvalida && (
                  <Typography color="error" variant="body2">
                    A capacidade máxima não pode ser menor que o número atual de alunos (
                    {selectedTurma.capacidade_atual_da_turma}).
                  </Typography>
                )}

                <TextField
                  label="Nome da Turma (preview)"
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

          {/* Aba 2 - Excluir Turma */}
          <TabPanel value={tabIndex} index={2}>
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Selecione a Turma (Excluir)</InputLabel>
              <Select
                value={selectedTurma?.uuidTurma || ""}
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
