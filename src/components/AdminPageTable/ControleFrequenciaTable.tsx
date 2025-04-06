import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  Modal,
  Paper,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Radio,
  RadioGroup,
  FormControl,
  FormControlLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  RadioProps,
} from "@mui/material";
import { AdminTableProps, Aluno } from "@/interface/interfaces";

/**
 * Props adicionais para o modal:
 * - isOpen: se o modal está aberto
 * - onClose: função para fechar o modal
 */
interface ControleFrequenciaTableProps extends AdminTableProps {
  isOpen: boolean;
  onClose: () => void;
}

// Listas de meses para 1º e 2º semestres
const FIRST_SEMESTER_MONTHS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
];
const SECOND_SEMESTER_MONTHS = [
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

/**
 * Componente que exibe colunas para cada dia do mês escolhido,
 * marcando "." (presença) ou "F" (falta),
 * e colunas finais com Totais e Frequência.
 */
export default function ControleFrequenciaTable({
  alunosDaTurma,
  nomeDaTurma,
  isOpen,
  onClose,
}: ControleFrequenciaTableProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));

  // Estado para "primeiro" (jan..jun) ou "segundo" (jul..dez)
  const [selectedSemester, setSelectedSemester] = useState<"primeiro" | "segundo">("primeiro");
  // Mês selecionado dentro do semestre
  const [selectedMonth, setSelectedMonth] = useState<string>("janeiro");

  // Define a lista de meses do semestre escolhido
  const semesterMonths = useMemo(() => {
    return selectedSemester === "primeiro"
      ? FIRST_SEMESTER_MONTHS
      : SECOND_SEMESTER_MONTHS;
  }, [selectedSemester]);

  // Ao mudar "primeiro"/"segundo", redefinimos um mês padrão
  function handleSemesterChange(event: React.ChangeEvent<HTMLInputElement>) {
    const newSemester = event.target.value as "primeiro" | "segundo";
    setSelectedSemester(newSemester);
    if (newSemester === "primeiro") {
      setSelectedMonth("janeiro");
    } else {
      setSelectedMonth("julho");
    }
  }

  // Ao mudar o mês no <Select>
  function handleMonthChange(event: SelectChangeEvent<string>) {
    setSelectedMonth(event.target.value as string);
  }

  /**
   * Extrai o dia (parte inteira) de uma string "dia-mes-ano"
   * Ex.: "3-3-2025" => 3.
   * Retorna Infinity se não conseguir parsear.
   */
  function parseDayNumber(dateStr: string): number {
    const parts = dateStr.split("-");
    if (parts.length < 3) return Infinity;
    const day = parseInt(parts[0], 10);
    return isNaN(day) ? Infinity : day;
  }

  // Lista de todos os dias (strings "1-3-2025", etc.) existentes no "selectedMonth" para TODOS os alunos
  const allDayKeysInMonth = useMemo(() => {
    const daySet = new Set<string>();

    alunosDaTurma.forEach((aluno) => {
      const presencasMes = aluno.presencas?.[selectedMonth];
      if (presencasMes) {
        Object.keys(presencasMes).forEach((dia) => daySet.add(dia));
      }
    });

    // Ordena pelo número do dia
    const allDaysArray = Array.from(daySet);
    allDaysArray.sort((a, b) => parseDayNumber(a) - parseDayNumber(b));
    return allDaysArray;
  }, [alunosDaTurma, selectedMonth]);

  /**
   * Monta dados da tabela: para cada aluno, criamos:
   * - row.nome
   * - row.days[dayKey] = true/false (se presente/falta)
   * - row.totalFaltas
   * - row.totalPresencas
   * - row.freq
   */
  const tableData = useMemo(() => {
    return alunosDaTurma.map((aluno) => {
      const row = {
        nome: aluno.nome,
        days: {} as Record<string, boolean>,
        totalFaltas: 0,
        totalPresencas: 0,
        freq: "0.0",
      };
      if (!aluno.presencas || !aluno.presencas[selectedMonth]) {
        return row; // sem dados para esse mês
      }

      const presencasMes = aluno.presencas[selectedMonth];
      let totalDias = 0;
      let totalFaltas = 0;

      // Para cada dayKey, verificamos se é true (presente) ou false (falta)
      allDayKeysInMonth.forEach((dayKey) => {
        const presenceValue = presencasMes[dayKey];
        // Caso seja undefined, vamos considerar FALTA
        if (presenceValue === undefined) {
          row.days[dayKey] = false;
        } else {
          row.days[dayKey] = presenceValue; // boolean
        }

        // Se é boolean, conta
        if (row.days[dayKey] === true || row.days[dayKey] === false) {
          totalDias++;
        }
        if (row.days[dayKey] === false) {
          totalFaltas++;
        }
      });

      const totalPresencas = totalDias - totalFaltas;
      // Formata frequência com 1 casa decimal
      const freqVal = totalDias > 0 ? ((totalPresencas / totalDias) * 100).toFixed(1) : "0.0";

      row.totalFaltas = totalFaltas;
      row.totalPresencas = totalPresencas;
      row.freq = freqVal;
      return row;
    });
  }, [alunosDaTurma, selectedMonth, allDayKeysInMonth]);

  return (
    <Modal open={isOpen} onClose={onClose} aria-labelledby="modal-title">
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: fullScreen ? "90%" : "80%",
          bgcolor: "background.paper",
          boxShadow: 24,
          p: 4,
          overflowY: "auto",
          maxHeight: "90vh",
          borderRadius: 2,
        }}
      >
        <Typography
          id="modal-title"
          variant="h6"
          gutterBottom
          sx={{ color: "black", mb: 2 }}
        >
          Frequência Mensal na Turma: {nomeDaTurma}
        </Typography>

        {/* Seletor de Semestre */}
        <FormControl component="fieldset" sx={{ mb: 2 }}>
          <Typography sx={{ color: "black", mb: 1 }} variant="subtitle1">
            Selecione o Semestre:
          </Typography>
          <RadioGroup
            row
            value={selectedSemester}
            onChange={handleSemesterChange}
          >
            <FormControlLabel
              sx={{ color: "black" }}
              value="primeiro"
              control={<Radio />}
              label="1º Semestre"
            />
            <FormControlLabel
              sx={{ color: "black" }}
              value="segundo"
              control={<Radio />}
              label="2º Semestre"
            />
          </RadioGroup>
        </FormControl>

        {/* Seletor de Mês */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <Typography sx={{ color: "black", mb: 1 }} variant="subtitle1">
            Mês do Semestre:
          </Typography>
          <Select value={selectedMonth} onChange={handleMonthChange}>
            {semesterMonths.map((month) => (
              <MenuItem key={month} value={month}>
                {month.charAt(0).toUpperCase() + month.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Tabela */}
        <TableContainer component={Paper}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {/* Coluna do Aluno */}
                <TableCell
                  sx={{
                    fontWeight: "bold",
                    bgcolor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    minWidth: 160,
                    borderRight: "2px solid #fff",
                  }}
                >
                  Aluno
                </TableCell>

                {/* Colunas dos Dias */}
                {allDayKeysInMonth.map((dayKey, idx) => (
                  <TableCell
                    key={dayKey}
                    align="center"
                    sx={{
                      fontWeight: "bold",
                      bgcolor: theme.palette.primary.main,
                      color: theme.palette.primary.contrastText,
                      whiteSpace: "nowrap",
                      // Linha à direita de cada coluna
                      borderRight: idx === allDayKeysInMonth.length - 1 ? "2px solid #fff" : "1px solid #fff",
                    }}
                  >
                    {dayKey}
                  </TableCell>
                ))}

                {/* Coluna Faltas */}
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    bgcolor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    borderLeft: "2px solid #fff",
                  }}
                >
                 Total de Faltas
                </TableCell>

                {/* Coluna Presenças */}
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    bgcolor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                  }}
                >
               Total de Presenças
                </TableCell>

                {/* Coluna Frequência */}
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    bgcolor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                  }}
                >
                  Frequência Geral (%)
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tableData.length > 0 ? (
                tableData.map((row, rowIndex) => (
                  <TableRow
                    key={rowIndex}
                    sx={{
                      bgcolor: rowIndex % 2 === 0 ? "background.default" : "grey.100",
                    }}
                  >
                    {/* Nome do Aluno */}
                    <TableCell
                      sx={{
                        borderRight: "2px solid #ccc", // linha divisória forte
                      }}
                    >
                      {row.nome}
                    </TableCell>

                    {/* Colunas para cada dia ( "." ou "F" ) */}
                    {allDayKeysInMonth.map((dayKey, dayIdx) => {
                      const isPresent = row.days[dayKey] === true;
                      return (
                        <TableCell
                          key={dayKey}
                          align="center"
                          sx={{
                            borderRight:
                              dayIdx === allDayKeysInMonth.length - 1
                                ? "2px solid #ccc"
                                : "1px solid #ccc",
                          }}
                        >
                          {isPresent ? "." : "F"}
                        </TableCell>
                      );
                    })}

                    {/* Faltas */}
                    <TableCell
                      align="center"
                      sx={{ borderLeft: "2px solid #ccc" }}
                    >
                      {row.totalFaltas}
                    </TableCell>
                    {/* Presenças */}
                    <TableCell align="center">{row.totalPresencas}</TableCell>
                    {/* Frequência */}
                    <TableCell align="center">{row.freq}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={allDayKeysInMonth.length + 4}
                    align="center"
                  >
                    Nenhum aluno encontrado nesta turma.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <Button onClick={onClose} variant="contained" color="error">
            Fechar
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}
