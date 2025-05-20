import React, { useState, useMemo, useEffect } from "react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
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
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material"
import { AdminTableProps, Aluno } from "@/interface/interfaces"

interface ControleFrequenciaTableProfessorProps extends AdminTableProps {
  isOpen: boolean
  onClose: () => void
  initialMonth: string
}

const FIRST_SEMESTER_MONTHS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
]
const SECOND_SEMESTER_MONTHS = [
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
]

export default function ControleFrequenciaTableProfessor({
  alunosDaTurma,
  nomeDaTurma,
  isOpen,
  onClose,
  initialMonth,
}: ControleFrequenciaTableProfessorProps) {
  const theme = useTheme()
  const isFullScreen = useMediaQuery(theme.breakpoints.down("md"))

  // 1) monta os estados com o valor inicial
  const initialSemester = FIRST_SEMESTER_MONTHS.includes(initialMonth)
    ? "primeiro"
    : "segundo"

  const [selectedSemester, setSelectedSemester] = useState<
    "primeiro" | "segundo"
  >(initialSemester)
  const [selectedMonth, setSelectedMonth] = useState<string>(initialMonth)

  // 2) sincroniza sempre que abrir o modal ou mudar initialMonth
  useEffect(() => {
    if (isOpen) {
      setSelectedMonth(initialMonth)
      setSelectedSemester(
        FIRST_SEMESTER_MONTHS.includes(initialMonth)
          ? "primeiro"
          : "segundo"
      )
    }
  }, [isOpen, initialMonth])

  // 3) quando o usuário mudar o mês manualmente, ajusta o semestre
  useEffect(() => {
    setSelectedSemester(
      FIRST_SEMESTER_MONTHS.includes(selectedMonth) ? "primeiro" : "segundo"
    )
  }, [selectedMonth])

  // 4) meses disponíveis no dropdown
  const semesterMonths = useMemo(
    () =>
      selectedSemester === "primeiro"
        ? FIRST_SEMESTER_MONTHS
        : SECOND_SEMESTER_MONTHS,
    [selectedSemester]
  )

  // 5) coleta todos os dias do mês para todos os alunos
  const allDayKeysInMonth = useMemo(() => {
    const daySet = new Set<string>()
    alunosDaTurma.forEach((aluno) => {
      const presMes = aluno.presencas[selectedMonth] || {}
      Object.keys(presMes).forEach((d) => daySet.add(d))
    })
    return Array.from(daySet).sort((a, b) => {
      const da = parseInt(a.split("-")[0], 10)
      const db = parseInt(b.split("-")[0], 10)
      return da - db
    })
  }, [alunosDaTurma, selectedMonth])

  // 6) monta as linhas da tabela
const tableData = useMemo(() => {
  return alunosDaTurma.map((aluno) => {
    const presMes = aluno.presencas[selectedMonth] || {}
    let totalPresencas = 0
    let totalFaltas = 0
    const daysRecord: Record<string, boolean> = {}

    allDayKeysInMonth.forEach((day) => {
      const presente = !!presMes[day]
      daysRecord[day] = presente

      if (presente) {
        totalPresencas++
      } else {
        totalFaltas++
      }
    })

    const totalDias = totalPresencas + totalFaltas
    const frequency =
      totalDias > 0
        ? ((totalPresencas / totalDias) * 100).toFixed(1)
        : "0.0"

    return {
      nome: aluno.nome,
      days: daysRecord,
      totalFaltas,
      totalPresencas,
      frequency,
    }
  })
}, [alunosDaTurma, selectedMonth, allDayKeysInMonth])


  // Exporta PDF
  function handleExportPDF() {
    const doc = new jsPDF({ orientation: "landscape" })
    doc.setFontSize(14)
    doc.text(
      `Frequência Mensal — ${nomeDaTurma} (${selectedMonth})`,
      14,
      16
    )
    const head = [
      [
        "Aluno",
        ...allDayKeysInMonth,
        "Total de Faltas",
        "Total de Presenças",
        "Frequência (%)",
      ],
    ]
    const body = tableData.map((r) => [
      r.nome,
      ...allDayKeysInMonth.map((d) => (r.days[d] ? "." : "F")),
      r.totalFaltas,
      r.totalPresencas,
      r.frequency,
    ])
    autoTable(doc, {
      startY: 22,
      head,
      body,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [25, 118, 210] },
      theme: "grid",
      margin: { left: 12, right: 12 },
    })
    const fileName = `frequencia_${nomeDaTurma.replace(
      /\s+/g,
      "_"
    )}_${selectedMonth}.pdf`
    doc.save(fileName)
  }

  // Handlers
  const handleMonthChange = (e: SelectChangeEvent<string>) => {
    setSelectedMonth(e.target.value)
  }
  const handleSemesterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedSemester(
      (e.target as HTMLInputElement).value as "primeiro" | "segundo"
    )
  }

  return (
    <Modal open={isOpen} onClose={onClose} aria-labelledby="modal-title">
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          width: isFullScreen ? "90%" : "80%",
          bgcolor: "background.paper",
          boxShadow: 24,
          p: 4,
          maxHeight: "90vh",
          overflowY: "auto",
          borderRadius: 2,
        }}
      >
        <Typography id="modal-title" variant="h6" gutterBottom sx={{color:"black"}}>
          Frequência Mensal na Turma: {nomeDaTurma}
        </Typography>

        <FormControl component="fieldset" sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1,color:"black" }}>
            Selecione o Semestre:
          </Typography>
          <RadioGroup
            row
            value={selectedSemester}
            onChange={handleSemesterChange}
          >
            <FormControlLabel
              value="primeiro"
              control={<Radio />}
              label="1º Semestre"
              sx={{color:"black"}}
              disabled
            />
            <FormControlLabel
              value="segundo"
              control={<Radio />}
              label="2º Semestre"
              sx={{color:"black"}}
              disabled
            />
          </RadioGroup>
        </FormControl>

       

        <FormControl fullWidth sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1,color:"black" }}>
            Mês do Semestre:
          </Typography>
          <Select value={selectedMonth} onChange={handleMonthChange} disabled>
            {semesterMonths.map((m) => (
              <MenuItem key={m} value={m}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </MenuItem>
            ))}
            
          </Select>
        </FormControl>
         <Box sx={{ mb: 2, textAlign: "center" }}>
          <Button onClick={handleExportPDF} variant="contained">
            Exportar Tabela de Frequência
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: "bold",
                    bgcolor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    borderRight: "2px solid white",
                  }}
                >
                  Aluno
                </TableCell>
                {allDayKeysInMonth.map((day, i) => (
                  <TableCell
                    key={day}
                    align="center"
                    sx={{
                      fontWeight: "bold",
                      bgcolor: theme.palette.primary.main,
                      color: theme.palette.primary.contrastText,
                      whiteSpace: "nowrap",
                      borderRight:
                        i === allDayKeysInMonth.length - 1
                          ? "2px solid white"
                          : "1px solid white",
                    }}
                  >
                    {day}
                  </TableCell>
                ))}
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    bgcolor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    borderLeft: "2px solid white",
                  }}
                >
                  Total de Faltas
                </TableCell>
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
              {tableData.length ? (
                tableData.map((row, ri) => (
                  <TableRow
                    key={ri}
                    sx={{
                      bgcolor:
                        ri % 2 === 0 ? "background.default" : "grey.100",
                    }}
                  >
                    <TableCell sx={{ borderRight: "2px solid #ccc" }}>
                      {row.nome}
                    </TableCell>
                    {allDayKeysInMonth.map((day, di) => (
                      <TableCell
                        key={day}
                        align="center"
                        sx={{
                          borderRight:
                            di === allDayKeysInMonth.length - 1
                              ? "2px solid #ccc"
                              : "1px solid #ccc",
                        }}
                      >
                        {row.days[day] ? "." : "F"}
                      </TableCell>
                    ))}
                    <TableCell
                      align="center"
                      sx={{ borderLeft: "2px solid #ccc" }}
                    >
                      {row.totalFaltas}
                    </TableCell>
                    <TableCell align="center">
                      {row.totalPresencas}
                    </TableCell>
                    <TableCell align="center">
                      {row.frequency}
                    </TableCell>
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
  )
}
