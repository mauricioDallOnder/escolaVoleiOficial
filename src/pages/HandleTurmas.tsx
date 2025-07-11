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
    <div role="tabpanel" hidden={value !== index} id={`tabpanel-${index}`} {...other}>
      {value === index && (
        <Box sx={{ p: 3, bgcolor: "background.paper" }}>{children}</Box>
      )}
    </div>
  );
}

// ==================================================================
// CORREÇÃO: Definindo a interface para o estado do formulário
// ==================================================================
interface TurmaFormState {
  categoria: string;
  diaDaSemana: string[];
  horario: string;
  capacidade_maxima_da_turma: number;
}

// CORREÇÃO: Aplicando a interface ao estado inicial
const initialFormState: TurmaFormState = {
  categoria: "",
  diaDaSemana: [], // Agora o TypeScript sabe que isso é um string[]
  horario: "",
  capacidade_maxima_da_turma: 30,
};
// ==================================================================

export default function ManageTurmas() {
  const { fetchModalidades } = useData();

  const [tabIndex, setTabIndex] = useState(0);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [selectedTurma, setSelectedTurma] = useState<Turma | undefined>(undefined);
  
  // O useState agora infere o tipo correto a partir do initialFormState tipado
  const [formValues, setFormValues] = useState(initialFormState);

  const [nomeTurma, setNomeTurma] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [capacidadeInvalida, setCapacidadeInvalida] = useState(false);

  const categoriasSugeridas = ["Infanto Imigrante", "Mirim Imigrante", "Mini", "Kvôlei_Infantil", "Kvôlei_Mirim", "Kvôlei_Infanto", "Kvôlei_Masculino_Infanto", "Kvôlei_Mirim_Masculino", "Kvôlei_juvenil_Masculino", "Kvôlei_Adulto_Feminino", "Kvôlei_Adulto_Masculino"];
  const diasSemanaPossiveis = ["SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO", "DOMINGO"];

   const carregarDados = async () => {
    try {
        const data = await fetchModalidades();
        const volei = data.find((mod) => mod.nome.toLowerCase() === "volei");
    
        if (volei && volei.turmas) {
          // A lógica para converter objeto em array continua a mesma
          const turmasArray = Array.isArray(volei.turmas)
            ? volei.turmas
            : Object.values(volei.turmas);
    
          // ==================================================================
          // CORREÇÃO APLICADA AQUI
          // Adicionamos 'as Turma[]' para garantir a tipagem correta do array.
          // Isso informa ao TypeScript que `t` dentro do filter é do tipo `Turma`.
          // ==================================================================
          const turmasValidas = (turmasArray as Turma[]).filter(t => t); 
    
          setTurmas(turmasValidas);
    
        } else {
          setTurmas([]);
        }
    } catch (error) {
        console.error("Falha ao carregar dados das turmas:", error);
        setTurmas([]); 
    }
  };

  useEffect(() => {
    carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (selectedTurma) {
      const invalido = formValues.capacidade_maxima_da_turma < (selectedTurma.capacidade_atual_da_turma || 0);
      setCapacidadeInvalida(invalido);
    } else {
      setCapacidadeInvalida(false);
    }
  }, [formValues.capacidade_maxima_da_turma, selectedTurma]);

  useEffect(() => {
    const { categoria, diaDaSemana, horario } = formValues;
    const cat = categoria.replace(/\s+/g, "_");
    const dias = diaDaSemana.map((d) => d.toUpperCase());
    const hora = horario.replace(/\s+/g, "_");
    const finalNome = `${cat}_${dias.join("_")}_${hora}`;
    setNomeTurma(finalNome);
  }, [formValues]);

  function handleTabChange(_event: React.SyntheticEvent, newValue: number) {
    setTabIndex(newValue);
    resetForm();
  }
  
  const resetForm = () => {
      setFormValues(initialFormState);
      setSelectedTurma(undefined);
      setNomeTurma("");
  }

  function handleDiaDaSemanaChange(event: SelectChangeEvent<string[]>) {
    setFormValues((prev) => ({ ...prev, diaDaSemana: event.target.value as string[] }));
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: name === "capacidade_maxima_da_turma" ? Number(value) : value,
    }));
  }

  function handleTurmaSelectChange(event: SelectChangeEvent<string>) {
    const turmaUuid = event.target.value;
    const foundTurma = turmas.find((t) => t.uuidTurma === turmaUuid);

    setSelectedTurma(foundTurma);

    if (foundTurma) {
      setFormValues({
        categoria: foundTurma.categoria || "",
        diaDaSemana: foundTurma.diaDaSemana || [],
        horario: foundTurma.horario || "",
        capacidade_maxima_da_turma: foundTurma.capacidade_maxima_da_turma || 1,
      });
      setNomeTurma(foundTurma.nome_da_turma || "");
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formValues,
        modalidade: "volei",
        nome_da_turma: nomeTurma,
        diaDaSemana: formValues.diaDaSemana,
        horario: formValues.horario,
      };

      if (tabIndex === 1 && selectedTurma) { 
        await axios.put("/api/HandleNewTurmas", { ...payload, uuidTurma: selectedTurma.uuidTurma });
        setSuccessMessage("Turma atualizada com sucesso!");
      } else { 
        await axios.post("/api/HandleNewTurmas", payload);
        setSuccessMessage("Turma criada com sucesso!");
      }
      resetForm();
      await carregarDados(); 
    } catch (error) {
      console.error("Erro:", error);
      alert("Falha na operação. Verifique o console.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!selectedTurma) return;
    if (!window.confirm(`Tem certeza que deseja excluir a turma: ${selectedTurma.nome_da_turma}?`)) {
        return;
    }
    setLoading(true);

    try {
      await axios.delete(`/api/HandleNewTurmas?uuidTurma=${selectedTurma.uuidTurma}&modalidade=volei`);
      setSuccessMessage("Turma excluída com sucesso!");
      resetForm();
      await carregarDados(); 
    } catch (error) {
      console.error("Erro ao deletar turma:", error);
      alert("Falha ao deletar turma.");
    } finally {
      setLoading(false);
    }
  }

  const TurmaForm = ({ isUpdate = false }: { isUpdate?: boolean }) => (
    <form onSubmit={handleSubmit}>
      <Autocomplete
        freeSolo
        options={categoriasSugeridas}
        value={formValues.categoria}
        onInputChange={(_event, newVal) => setFormValues((prev) => ({ ...prev, categoria: newVal || '' }))}
        renderInput={(params) => <TextField {...params} label="Categoria" fullWidth margin="normal" required />}
      />
      <FormControl fullWidth margin="normal" required>
        <InputLabel>Dias da Semana</InputLabel>
        <Select
          multiple
          name="diaDaSemana"
          value={formValues.diaDaSemana}
          onChange={handleDiaDaSemanaChange}
          renderValue={(selected) => selected.join(", ")}
        >
          {diasSemanaPossiveis.map((dia) => (
            <MenuItem key={dia} value={dia}>{dia}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField label="Horário" name="horario" value={formValues.horario} onChange={handleInputChange} required fullWidth margin="normal" />
      <TextField type="number" label="Capacidade Máxima" name="capacidade_maxima_da_turma" value={formValues.capacidade_maxima_da_turma} onChange={handleInputChange} required fullWidth margin="normal" InputProps={{ inputProps: { min: 1 } }} />
      {capacidadeInvalida && (
        <Typography color="error" variant="body2">
          A capacidade máxima não pode ser menor que o número atual de alunos ({selectedTurma?.capacidade_atual_da_turma || 0}).
        </Typography>
      )}
      <TextField label="Nome da Turma (preview)" value={nomeTurma} fullWidth margin="normal" disabled />
      
      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Button type="submit" variant="contained" color="primary" disabled={loading || capacidadeInvalida}>
          {isUpdate ? "Salvar Alterações" : "Criar Turma"}
        </Button>
        {isUpdate && (
            <Button variant="contained" color="error" onClick={handleDelete} disabled={loading}>
                Excluir Turma
            </Button>
        )}
      </Box>
    </form>
  );

  return (
    <Layout>
      <Container sx={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 0 }}>
        <Box sx={BoxStyleCadastro}>
          <AppBar position="static" sx={{ backgroundColor: "#2e3b55", mt: "10px" }}>
            <Tabs value={tabIndex} onChange={handleTabChange} variant="fullWidth" textColor="inherit" indicatorColor="secondary">
              <Tab label="Criar Nova Turma" />
              <Tab label="Gerenciar Turma Existente" />
            </Tabs>
          </AppBar>
          
          <TabPanel value={tabIndex} index={0}>
            <TurmaForm />
          </TabPanel>
          
          <TabPanel value={tabIndex} index={1}>
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Selecione a Turma</InputLabel>
              <Select value={selectedTurma?.uuidTurma || ""} onChange={handleTurmaSelectChange}>
                <MenuItem value="" disabled><em>Nenhuma</em></MenuItem>
                {turmas.map((turma) => (
                  <MenuItem key={turma.uuidTurma} value={turma.uuidTurma}>
                    {turma.nome_da_turma}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {selectedTurma && <TurmaForm isUpdate={true} />}
          </TabPanel>

          <Snackbar open={!!successMessage} autoHideDuration={6000} onClose={() => setSuccessMessage("")}>
            <Alert onClose={() => setSuccessMessage("")} severity="success" sx={{ width: "100%" }}>
              {successMessage}
            </Alert>
          </Snackbar>
        </Box>
      </Container>
    </Layout>
  );
}