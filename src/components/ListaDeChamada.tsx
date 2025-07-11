import React, { useContext, useEffect, useState } from "react";
import {
  Box,
  Container,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
  Modal,
  TableContainer,
  Paper,
  useMediaQuery,
  useTheme,
  Button,
  Typography,
} from "@mui/material";
import Table from "@mui/joy/Table";
import { Aluno, StudentPresenceTableProps } from "@/interface/interfaces";
import { DataContext } from "@/context/context";
import { modalStyle } from "@/utils/Styles";
import { ListaDeChamadaModal } from "./ListaDeChamadaModal";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ControleFrequenciaTableProfessor from "./ProfessorListaGeralDeFaltas";

// FUNÇÃO AUXILIAR 1: Gera dinamicamente a lista de meses disponíveis a partir dos dados dos alunos.
const getAvailableMonths = (alunos: Aluno[]): string[] => {
  const monthSet = new Set<string>();
  alunos.forEach(aluno => {
    if (aluno?.presencas) {
      Object.keys(aluno.presencas).forEach(month => monthSet.add(month));
    }
  });

  // Define a ordem correta dos meses para o ano letivo.
  const monthOrder = ["fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro", "janeiro"];
  return Array.from(monthSet).sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b));
};

// FUNÇÃO AUXILIAR 2: Gera dinamicamente a lista de dias para o mês selecionado, de forma segura.
const getDaysForMonth = (alunos: Aluno[], month: string): string[] => {
  if (!month) return [];
  const daySet = new Set<string>();
  alunos.forEach(aluno => {
    // Acessa os dias do mês de forma segura.
    if (aluno?.presencas?.[month]) {
      Object.keys(aluno.presencas[month]).forEach(day => daySet.add(day));
    }
  });

  // Ordena os dias pela data (número do dia).
  return Array.from(daySet).sort((a, b) => {
    const dayA = parseInt(a.split('-')[0], 10);
    const dayB = parseInt(b.split('-')[0], 10);
    return dayA - dayB;
  });
};

export const ListaDeChamada: React.FC<Omit<StudentPresenceTableProps, "modalidade">> = ({
  alunosDaTurma,
  setAlunosDaTurma,
  nomeDaTurma,
}) => {
  const { updateAttendanceInApi } = useContext(DataContext);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [selectedAluno, setSelectedAluno] = useState<Aluno | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [openFreq, setOpenFreq] = useState<boolean>(false);
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("xs"));

  const availableMonths = getAvailableMonths(alunosDaTurma);
  const daysInMonth = getDaysForMonth(alunosDaTurma, selectedMonth);

  useEffect(() => {
    setSelectedDay("");
  }, [selectedMonth]);
  
  useEffect(() => {
    if (availableMonths.length > 0 && !availableMonths.includes(selectedMonth)) {
      setSelectedMonth(availableMonths[0] || "");
    } else if (availableMonths.length === 0) {
      setSelectedMonth("");
    }
  }, [availableMonths, selectedMonth]);

  const alunosOrdenados = React.useMemo(() => 
    [...alunosDaTurma]
      .filter(Boolean)
      .sort((a, b) => a.nome.localeCompare(b.nome)),
  [alunosDaTurma]);

  const filteredAlunos = React.useMemo(() =>
    alunosOrdenados.filter((aluno) =>
      aluno.nome.toLowerCase().includes(search.toLowerCase())
    ), [alunosOrdenados, search]);

  const toggleAttendance = (alunoId: number, day: string) => {
    setAlunosDaTurma((current) =>
      current.map((student) => {
        if (student?.id === alunoId && student.presencas?.[selectedMonth]?.[day] !== undefined) {
          const updatedAttendance = {
            ...student.presencas,
            [selectedMonth]: {
              ...student.presencas[selectedMonth],
              [day]: !student.presencas[selectedMonth][day],
            },
          };
          const alunoUpdateData = {
            ...student,
            alunoId: alunoId.toString(),
            presencas: updatedAttendance,
            nomeDaTurma: nomeDaTurma,
          };
          updateAttendanceInApi(alunoUpdateData);
          return { ...student, presencas: updatedAttendance };
        }
        return student;
      })
    );
  };

  const countPresentStudents = () => {
    return alunosDaTurma.reduce((count, aluno) => {
      const isPresent = aluno?.presencas?.[selectedMonth]?.[selectedDay];
      return count + (isPresent ? 1 : 0);
    }, 0);
  };

  const handleOpenModal = (aluno: Aluno) => {
    setSelectedAluno(aluno);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAluno(null);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  const isAvisoValid = (aluno: Aluno) => {
    if (aluno.avisos && aluno.avisos.IsActive) {
      const avisoDate = new Date(aluno.avisos.dataaviso);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return avisoDate >= today;
    }
    return false;
  };

  const tableContainerStyles = {
    marginTop: 2,
    marginBottom: 2,
    overflowX: "auto",
    maxWidth: "100%",
    ...(isXs && {
      "& .MuiTableCell-sizeSmall": { padding: "6px 8px" },
      "& .MuiTypography-root": { fontSize: "0.75rem" },
    }),
  };

  return (
    <Container>
      <Box>
        <Modal
          open={isModalOpen}
          onClose={handleCloseModal}
          aria-labelledby="modal-title"
          aria-describedby="modal-description"
        >
          <Box sx={modalStyle}>
            {selectedAluno && (
              <>
                {isAvisoValid(selectedAluno) && selectedAluno.avisos && (
                  <Box sx={{ backgroundColor: "#ffd700", padding: "8px", marginBottom: "16px" }}>
                    <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                      Aviso: {selectedAluno.avisos.textaviso}
                    </Typography>
                  </Box>
                )}
                <ListaDeChamadaModal aluno={selectedAluno} month={selectedMonth} />
              </>
            )}
            <Box sx={{ backgroundColor: "red" }}>
              <Typography sx={{ color: "black", fontWeight: "bold", textAlign: "center", padding: "5px" }}>
                Telefone para Emergência: {selectedAluno?.telefone_contato_emergencia}
              </Typography>
            </Box>
            <Box sx={{ backgroundColor: "red" }}>
              <Typography sx={{ color: "black", fontWeight: "bold", textAlign: "center", padding: "5px" }}>
                Nome do contato para Emergência : {selectedAluno?.nome_contato_emergencia}
              </Typography>
            </Box>
          </Box>
        </Modal>

        <TextField
          select
          label="Selecionar Mês"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          fullWidth
        >
          {availableMonths.map((month) => (
            <MenuItem key={month} value={month}>
              {month.charAt(0).toUpperCase() + month.slice(1)}
            </MenuItem>
          ))}
        </TextField>

        {selectedMonth && (
          <TextField
            select
            label="Selecionar Dia"
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            fullWidth
            margin="normal"
          >
            {daysInMonth.map((day) => (
              <MenuItem key={day} value={day}>
                {day}
              </MenuItem>
            ))}
          </TextField>
        )}
        <TextField
          label="Pesquisar por nome do aluno"
          variant="outlined"
          fullWidth
          margin="normal"
          value={search}
          onChange={handleSearchChange}
        />
        {selectedMonth && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button variant="contained" color='secondary' onClick={() => setOpenFreq(true)}>
              Ver Tabela Frequência Mensal Completa
            </Button>
          </Box>
        )}

        {selectedDay && (
          <TableContainer component={Paper} sx={tableContainerStyles}>
            <Table
              borderAxis="both"
              size="sm"
              aria-label="tabela de presença"
              sx={{ minWidth: 245, "& th, & td": { fontSize: isXs ? "0.75rem" : "0.75rem", padding: isXs ? "8px" : "16px" }, "& tr": { height: isXs ? "40px" : "60px" }, "& thead th": { fontWeight: "bold", backgroundColor: "#eceff1" }, "& tbody tr:nth-of-type(odd)": { backgroundColor: "rgba(247, 247, 247, 1)" } }}
            >
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold", backgroundColor: "#eceff1", textAlign: "center" }}>
                    Nome do Aluno
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: "bold", backgroundColor: "#eceff1", textAlign: "center" }}>
                    Frequência
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: "bold", backgroundColor: "#eceff1", textAlign: "center" }}>
                    Exibir Informações do Atleta
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAlunos.map((aluno) => {
                  const hasValidAviso = isAvisoValid(aluno);
                  const isPresent = aluno?.presencas?.[selectedMonth]?.[selectedDay];
                  return (
                    <TableRow key={aluno.nome} sx={{ "& > *": { borderBottom: "unset" }, backgroundColor: hasValidAviso ? "#ffeb3b" : "inherit" }}>
                      {hasValidAviso ? (
                        <TableCell sx={{ backgroundColor: "inherit" }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <WarningAmberIcon color="error" />
                            <Typography sx={{ color: "red", fontWeight: "bold" }}>
                              {aluno.nome}
                            </Typography>
                            <WarningAmberIcon color="error" />
                          </Box>
                        </TableCell>
                      ) : (
                        <TableCell sx={{ fontWeight: "bold", color: "inherit" }}>
                          {aluno.nome}
                        </TableCell>
                      )}

                      <TableCell
                        align="center"
                        sx={{ color: "black", fontWeight: "bold", cursor: "pointer" }}
                        onClick={() => toggleAttendance(aluno.id, selectedDay)}
                      >
                        {isPresent === true ? "." : isPresent === false ? "F" : "-"}
                      </TableCell>
                      <TableCell align="center" onClick={() => handleOpenModal(aluno)}>
                        <Button
                          sx={{ width: "fit-content", fontSize: "12px", backgroundColor: hasValidAviso ? "#d32f2f" : "#1976d2", color: "white", "&:hover": { backgroundColor: hasValidAviso ? "#b71c1c" : "#1565c0" } }}
                          variant="contained"
                        >
                          {hasValidAviso ? "Ver Aviso" : "Ver Detalhes"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
      {selectedDay && (
        <Typography
          sx={{ color: "black", fontWeight: "bold", mt: 2 }}
          variant="subtitle1"
        >
          Número de alunos presentes: {countPresentStudents()}
        </Typography>
      )}
      <ControleFrequenciaTableProfessor
        isOpen={openFreq}
        onClose={() => setOpenFreq(false)}
        alunosDaTurma={alunosDaTurma}
        nomeDaTurma={nomeDaTurma}
        initialMonth={selectedMonth}
      />
    </Container>
  );
};