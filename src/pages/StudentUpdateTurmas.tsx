/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import * as React from "react";
import {
  GridColDef,
  GridCsvExportOptions,
  GridCsvGetRowsToExportParams,
  GridRowId,
  GridRowsProp,
  GridToolbar,
  gridExpandedSortedRowIdsSelector,
  gridPageCountSelector,
  gridPageSelector,
  useGridApiContext,
  useGridSelector,
} from "@mui/x-data-grid";
import Pagination from "@mui/material/Pagination";
import PaginationItem from "@mui/material/PaginationItem";
import { useData } from "@/context/context";
import { useEffect, useState, useCallback } from "react";
import { AlunoComTurma, TemporaryMoveStudentsPayload } from "@/interface/interfaces";
import { v4 as uuidv4 } from "uuid";
import { Button, Container, Snackbar, Typography, CircularProgress } from "@mui/material";
import Layout from "@/components/TopBarComponents/Layout";
import DownloadingIcon from "@mui/icons-material/Downloading";
import { StyledDataGrid } from "@/utils/Styles";
import { MoveAllStudentsMemo } from "@/components/MoveStudants/MoveAllStudents";
import { CopyStudentMemo } from "@/components/MoveStudants/CopyStudant";

function CustomPagination() {
  const apiRef = useGridApiContext();
  const page = useGridSelector(apiRef, gridPageSelector);
  const pageCount = useGridSelector(apiRef, gridPageCountSelector);

  const getFilteredRows = ({ apiRef }: GridCsvGetRowsToExportParams) =>
    gridExpandedSortedRowIdsSelector(apiRef);

  const handleExport = (options: GridCsvExportOptions) =>
    apiRef.current.exportDataAsCsv(options);

  return (
    <>
      <Pagination
        color="primary"
        variant="outlined"
        shape="rounded"
        page={page + 1}
        count={pageCount}
        // @ts-expect-error
        renderItem={(props2) => <PaginationItem {...props2} disableRipple />}
        onChange={(event: React.ChangeEvent<unknown>, value: number) =>
          apiRef.current.setPage(value - 1)
        }
      />
      <Button
        onClick={() => handleExport({ getRowsToExport: getFilteredRows })}
        sx={{ gap: "2px", display: "flex", alignItems: "center" }}
        variant="contained"
        color="secondary"
      >
        <DownloadingIcon />
        Exportar colunas selecionadas
      </Button>
    </>
  );
}

const PAGE_SIZE = 10;

export default function MoveStudantsTurma() {
  const { fetchModalidades } = useData();
  const [alunosComTurma, setAlunosComTurma] = useState<AlunoComTurma[]>([]);
  const [modifiedRows, setModifiedRows] = useState<Record<GridRowId, AlunoComTurma>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchAndSetModalidades = useCallback(async () => {
    const modalidadesFetched = await fetchModalidades();
    const modalidadesValidas = modalidadesFetched.filter(
      (modalidade) =>
        !["temporarios", "arquivados", "excluidos"].includes(modalidade.nome.toLowerCase())
    );

    const alunosComTurmaTemp: AlunoComTurma[] = modalidadesValidas.flatMap((modalidade) =>
      modalidade.turmas.flatMap((turma) => {
        const alunosArray = Array.isArray(turma.alunos) ? turma.alunos : [];
        return alunosArray.filter(Boolean).map((aluno): AlunoComTurma => ({
          aluno: {
            ...aluno,
            informacoesAdicionais: {
              ...aluno.informacoesAdicionais,
              IdentificadorUnico:
                aluno.informacoesAdicionais?.IdentificadorUnico ?? uuidv4(),
            },
          },
          nomeDaTurma: turma.nome_da_turma,
          categoria: turma.categoria,
          uniforme: aluno.informacoesAdicionais?.hasUniforme ?? false,
        }));
      })
    );

    setAlunosComTurma(alunosComTurmaTemp);
  }, [fetchModalidades]);

  useEffect(() => {
    fetchAndSetModalidades();
  }, [fetchAndSetModalidades]);

  const [paginationModel, setPaginationModel] = useState({
    pageSize: PAGE_SIZE,
    page: 0,
  });

  const rows: GridRowsProp = alunosComTurma.map(({ aluno, nomeDaTurma, categoria }) => {
    return {
      id: aluno.informacoesAdicionais?.IdentificadorUnico ?? uuidv4(),
      col1: aluno.nome,
      col2: aluno.anoNascimento,
      col3: nomeDaTurma,
      col4: categoria,
      col5: aluno.informacoesAdicionais.escolaEstuda,
    };
  });

  const mergedRows = rows.map((row) => ({
    ...row,
    ...(modifiedRows[row.id] ? { uniforme: modifiedRows[row.id].uniforme } : {}),
  }));

  const columns: GridColDef[] = [
    { field: "col1", headerName: "Nome", width: 250 },
    { field: "col2", headerName: "Nascimento", width: 100 },
    { field: "col3", headerName: "Turma", width: 250 },
    { field: "col4", headerName: "Categoria", width: 100 },
    { field: "col5", headerName: "Escola que estuda", width: 150 },
    {
      field: "MudarTurma",
      headerName: "Mudar Turma",
      width: 150,
      renderCell: (params) => {
        const data: TemporaryMoveStudentsPayload = {
          alunoNome: params.row.col1,
          nomeDaTurmaOrigem: params.row.col3,
          nomeDaTurmaDestino: "",
        };
        return (
          <MoveAllStudentsMemo
            alunoNome={data.alunoNome}
            nomeDaTurmaOrigem={data.nomeDaTurmaOrigem}
          />
        );
      },
    },
    {
      field: "CopiarAluno",
      headerName: "Copiar Aluno",
      width: 150,
      renderCell: (params) => {
        const data: TemporaryMoveStudentsPayload = {
          alunoNome: params.row.col1,
          nomeDaTurmaOrigem: params.row.col3,
          nomeDaTurmaDestino: "",
        };
        return (
          <CopyStudentMemo
            alunoNome={data.alunoNome}
            nomeDaTurmaOrigem={data.nomeDaTurmaOrigem}
          />
        );
      },
    },
  ];

  return (
    <Layout>
      <Container style={{ marginTop: "10px", height: "auto", width: "fit-content" }}>
        {isProcessing && (
          <Typography
            variant="h6"
            align="center"
            sx={{
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              color: "#FFFFFF",
              padding: "10px",
              borderRadius: "5px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            Ajustando dados da turma, por favor aguarde...
            <CircularProgress size={24} sx={{ ml: 2 }} />
          </Typography>
        )}
        <StyledDataGrid
          checkboxSelection
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[PAGE_SIZE]}
          slots={{
            pagination: CustomPagination,
            toolbar: GridToolbar,
          }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
            },
          }}
          rows={mergedRows}
          columns={columns}
        />
      </Container>
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        message={successMessage}
      />
    </Layout>
  );
}
