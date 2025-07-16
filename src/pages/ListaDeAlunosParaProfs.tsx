// Importações necessárias
import * as React from "react";
import {
  DataGrid,
  GridColDef,
  GridRowsProp,
  GridToolbar,
  useGridApiContext,
  useGridSelector,
  gridPageSelector,
  gridPageCountSelector,
  gridExpandedSortedRowIdsSelector,
  GridCellParams,
  GridCsvExportOptions,
  GridCsvGetRowsToExportParams,
  GridRowId,
  GridRowSelectionModel,
} from "@mui/x-data-grid";
import Pagination from "@mui/material/Pagination";
import PaginationItem from "@mui/material/PaginationItem";
import { useData } from "@/context/context"; // Ajuste o caminho conforme seu contexto
import { useEffect, useState } from "react";
import { AlunoComTurma, IIAvisos } from "@/interface/interfaces";
import { v4 as uuidv4 } from "uuid";
import {
  Avatar,
  Button,
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Snackbar,
  Alert,
  Typography,
} from "@mui/material";
import DownloadingIcon from "@mui/icons-material/Downloading";
import CloseIcon from "@mui/icons-material/Close";
import ResponsiveAppBar from "@/components/TopBarComponents/TopBar";
import { StyledDataGrid } from "@/utils/Styles";
import { useCopyToClipboard } from "@/hooks/CopyToClipboardHook";
import { AvisoStudents } from "@/components/AvisosModal/Avisos";

// Função para normalizar textos
const normalizeText = (text: any): string => {
  return text ? String(text).trim() : "";
};

// Componente de paginação customizada
function CustomPagination({ selectedRows, allRows }: { selectedRows: GridRowSelectionModel, allRows: GridRowsProp }) {
  const apiRef = useGridApiContext();
  const page = useGridSelector(apiRef, gridPageSelector);
  const pageCount = useGridSelector(apiRef, gridPageCountSelector);

  // Função para exportar apenas as linhas selecionadas
  const getSelectedRows = ({ apiRef }: GridCsvGetRowsToExportParams) => {
    // Se não há linhas selecionadas, exporta todas as linhas filtradas
    if (selectedRows.length === 0) {
      return gridExpandedSortedRowIdsSelector(apiRef);
    }
    // Retorna apenas as linhas selecionadas
    return selectedRows as GridRowId[];
  };

  const handleExport = (options: GridCsvExportOptions) => {
    // Define as colunas que devem ser exportadas (excluindo a coluna 'foto')
    const fieldsToExport = [
      'nome',
      'anoNascimento', 
      'alunoDocumento',
      'modalidade_turma',
      'categoria'
    ];

    // Combina as opções passadas com a configuração de campos
    const exportOptions: GridCsvExportOptions = {
      ...options,
      fields: fieldsToExport, // Especifica quais colunas incluir na exportação
    };

    apiRef.current.exportDataAsCsv(exportOptions);
  };

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
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
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {selectedRows.length > 0 
              ? `${selectedRows.length} linha(s) selecionada(s)`
              : 'Nenhuma linha selecionada'
            }
          </Typography>
          
          <Button
            onClick={() => handleExport({ getRowsToExport: getSelectedRows })}
            sx={{ gap: "2px", display: "flex", alignItems: "center" }}
            variant="contained"
            color="secondary"
            disabled={selectedRows.length === 0}
          >
            <DownloadingIcon />
            {selectedRows.length > 0 
              ? `Exportar ${selectedRows.length} selecionada(s)`
              : 'Exportar selecionadas'
            }
          </Button>
        </Box>
      </Box>
    </>
  );
}

// Definição do tamanho da página
const PAGE_SIZE = 30;

// Componente principal
export default function ListaDeAlunosProfs() {
  const { fetchStudantsTableData } = useData(); // Ajuste conforme seu contexto
  const [alunosComTurma, setAlunosComTurma] = useState<AlunoComTurma[]>([]);
  const [modifiedRows, setModifiedRows] = useState<
    Record<GridRowId, AlunoComTurma>
  >({});
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [copiedText, copyToClipboard] = useCopyToClipboard();
  const [openSnackbar, setOpenSnackbar] = useState(false);
  
  // Estado para gerenciar as linhas selecionadas
  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>([]);

  const [paginationModel, setPaginationModel] = useState({
    pageSize: PAGE_SIZE,
    page: 0,
  });

  // Efeito para buscar os dados dos alunos
  useEffect(() => {
    fetchStudantsTableData(undefined, PAGE_SIZE, paginationModel.page * PAGE_SIZE).then(
      (modalidadesFetched) => {
        // Filtra modalidades indesejadas (se existirem)
        const modalidadesValidas = modalidadesFetched.filter(
          (modalidade) =>
            !["temporarios", "arquivados", "excluidos"].includes(
              modalidade.nome.toLowerCase()
            )
        );

        // Monta o array de alunos
        const alunosComTurmaTemp: AlunoComTurma[] = modalidadesValidas.flatMap(
          (modalidade) =>
            modalidade.turmas.flatMap((turma) => {
              const alunosArray = Array.isArray(turma.alunos) ? turma.alunos : [];
              return alunosArray.filter(Boolean).map((aluno): AlunoComTurma => ({
                aluno: {
                  ...aluno,
                  // Se IdentificadorUnico não existir, gera um
                  informacoesAdicionais: {
                    ...aluno.informacoesAdicionais,
                    IdentificadorUnico:
                      aluno.informacoesAdicionais?.IdentificadorUnico ?? uuidv4(),
                  },
                },
                nomeDaTurma: turma.nome_da_turma,
                categoria: turma.categoria,
                // Se quiser exibir "hasUniforme" ou "uniforme_do_aluno":
                uniforme: aluno.informacoesAdicionais?.hasUniforme ?? false,
              }));
            })
        );

        setAlunosComTurma(alunosComTurmaTemp);
      }
    );
  }, [fetchStudantsTableData, paginationModel.page]);

  // Fechar o modal de foto
  const handleClose = () => {
    setSelectedPhoto(null);
  };

  // Mostrar foto em modal
  const handlePhotoClick = (photoUrl: string) => {
    setSelectedPhoto(photoUrl);
  };

  // Copiar conteúdo da célula ao clicar (se não for a coluna 'CriarAviso')
  const handleCellClick = async (params: GridCellParams) => {
    if (params.field === "CriarAviso") {
      return;
    }
    const cellContent = params.value ? String(params.value) : "";
    const success = await copyToClipboard(cellContent);
    if (success) {
      console.log(
        `Texto "${cellContent}" copiado para a área de transferência com sucesso.`
      );
      setOpenSnackbar(true);
    } else {
      console.error("Falha ao copiar texto para a área de transferência.");
    }
  };

  const handleSnackbarClose = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setOpenSnackbar(false);
  };

  // Função para lidar com mudanças na seleção de linhas
  const handleRowSelectionModelChange = (newRowSelectionModel: GridRowSelectionModel) => {
    setRowSelectionModel(newRowSelectionModel);
  };

  // Preparação das linhas da tabela
  const rows: GridRowsProp = alunosComTurma.map(
    ({ aluno, nomeDaTurma, categoria }) => {
      const info = aluno.informacoesAdicionais || {};
      return {
        // Usa IdentificadorUnico (ou fallback com uuid)
        id: info.IdentificadorUnico ?? uuidv4(),

        foto: aluno.foto, // se existir
        nome: normalizeText(aluno.nome),
        anoNascimento: normalizeText(aluno.anoNascimento),
        
        alunoDocumento: normalizeText(aluno.documento),

        // Turma e/ou categoria
        modalidade_turma: nomeDaTurma,
        categoria: categoria,
      };
    }
  );

  // Se houve modificações de uniforme etc., mescla (se for preciso)
  const mergedRows = rows.map((row) => ({
    ...row,
    ...(modifiedRows[row.id] ? { uniforme: modifiedRows[row.id].uniforme } : {}),
  }));

  // Definição das colunas da tabela conforme sua estrutura
  const columns: GridColDef[] = [
    // Foto
    {
      field: "foto",
      headerName: "Foto",
      width: 70,
      renderCell: (params) => (
        <Avatar
          src={params.value}
          sx={{
            backgroundColor: "white",
            marginTop: "5px",
            marginBottom: "5px",
            cursor: "pointer",
          }}
          onClick={() => handlePhotoClick(params.value)}
        />
      ),
    },
    // Nome do Aluno
    {
      field: "nome",
      headerName: "Nome do Aluno",
      // ocupa 1.5 "partes" do espaço flexível, mas não fica menor que 150px
      flex: 1.5,
      minWidth: 150,
    },
    {
      field: "anoNascimento",
      headerName: "Data Nasc.",
      width: 120,
    },
    {
      field: "alunoDocumento",
      headerName: "Doc. do Aluno",
      // ocupa 2 partes do espaço flexível, mínimo 200px
      flex: 1.5,
      minWidth: 150,
    },
    {
      field: "modalidade_turma",
      headerName: "Turma",
      flex: 1,
      minWidth: 120,
    },
    {
      field: "categoria",
      headerName: "Categoria",
      // ocupa 1 parte do espaço flexível, mínimo 120px
      flex: 1,
      minWidth: 120,
    },
  ];

  return (
    <>
      <ResponsiveAppBar />
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
        }}
      >
        <Box sx={{ height: 800, width: "95%", position: "relative", marginTop: "10px" }}>
          <StyledDataGrid
            disableRowSelectionOnClick={false} // Permite seleção ao clicar na linha
            checkboxSelection={true} // Habilita os checkboxes
            rowSelectionModel={rowSelectionModel} // Estado da seleção
            onRowSelectionModelChange={handleRowSelectionModelChange} // Handler para mudanças na seleção
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[PAGE_SIZE]}
            slots={{
              pagination: () => <CustomPagination selectedRows={rowSelectionModel} allRows={mergedRows} />,
              toolbar: GridToolbar,
            }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
              },
            }}
            rows={mergedRows}
            columns={columns}
            onCellClick={handleCellClick}
            sx={{
              "& .MuiDataGrid-columnHeaders": {
                position: "sticky",
                top: 0,
                zIndex: 1,
              },
              "& .MuiDataGrid-cell": {
                whiteSpace: "normal",
                wordWrap: "break-word",
                overflow: "visible",
              },
            }}
          />
        </Box>

        {/* Modal para exibir foto em tamanho maior */}
        <Dialog open={!!selectedPhoto} onClose={handleClose} maxWidth="sm" fullWidth>
          <DialogTitle>
            <IconButton edge="end" color="inherit" onClick={handleClose} aria-label="close">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <img src={selectedPhoto!} alt="Aluno" style={{ width: "100%" }} />
          </DialogContent>
        </Dialog>

        {/* Snackbar ao copiar texto de uma célula */}
        <Snackbar open={openSnackbar} autoHideDuration={3000} onClose={handleSnackbarClose}>
          <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: "100%" }}>
            Conteúdo copiado com sucesso!
          </Alert>
        </Snackbar>
      </Box>
    </>
  );
}

