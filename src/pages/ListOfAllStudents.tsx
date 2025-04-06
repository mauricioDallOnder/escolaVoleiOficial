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

// Definição do tamanho da página
const PAGE_SIZE = 30;

// Componente principal
export default function StudantTableGeral() {
  const { fetchStudantsTableData } = useData(); // Ajuste conforme seu contexto
  const [alunosComTurma, setAlunosComTurma] = useState<AlunoComTurma[]>([]);
  const [modifiedRows, setModifiedRows] = useState<
    Record<GridRowId, AlunoComTurma>
  >({});
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [copiedText, copyToClipboard] = useCopyToClipboard();
  const [openSnackbar, setOpenSnackbar] = useState(false);

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
        dataMatricula: normalizeText(aluno.dataMatricula),
        telefoneComWhatsapp: normalizeText(aluno.telefoneComWhatsapp),

        // Campos em informacoesAdicionais
        Nome__do_responsavel: normalizeText(info.Nome__do_responsavel),
        data_de_nascimento_responsavel: normalizeText(
          info.data_de_nascimento_responsavel
        ),
        documento_do_responsavel: normalizeText(info.documento_do_responsavel),
        email_do_responsavel: normalizeText(info.email_do_responsavel),
        local_de_trabalho_do_responsavel: normalizeText(
          info.local_de_trabalho_do_responsavel
        ),
        funcao_do_responsavel: normalizeText(info.funcao_do_responsavel),
        primeiro_telefone_do_responsavel: normalizeText(
          info.primeiro_telefone_do_responsavel
        ),
        segundo_telefone_do_responsavel: normalizeText(
          info.segundo_telefone_do_responsavel
        ),
        telefone_comercial_do_responsavel: normalizeText(
          info.telefone_comercial_do_responsavel
        ),
        nome_contato_emergencia: normalizeText(info.nome_contato_emergencia),
        telefone_contato_emergencia: normalizeText(
          info.telefone_contato_emergencia
        ),

        endereco: normalizeText(info.endereco),
        numero_endereço: normalizeText(info.numero_endereço),
        complemento: normalizeText(info.complemento),
        bairro: normalizeText(info.bairro),
        cep: normalizeText(info.cep),

        Possui_alergia: normalizeText(info.Possui_alergia),
        plano_de_saude: normalizeText(info.plano_de_saude),
        hasUniforme: info.hasUniforme ? "Sim" : "Não",
        uniforme_do_aluno: normalizeText(info.uniforme_do_aluno),

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
      width: 200,
      cellClassName: "cell-wrap",
    },
    // Ano de Nascimento
    {
      field: "anoNascimento",
      headerName: "Data Nasc.",
      width: 120,
      cellClassName: "cell-wrap",
    },
    // Data de Matrícula
    {
      field: "dataMatricula",
      headerName: "Data Matrícula",
      width: 130,
      cellClassName: "cell-wrap",
    },
    // Telefone do Aluno (WhatsApp)
    {
      field: "telefoneComWhatsapp",
      headerName: "Tel. (Aluno)",
      width: 130,
      cellClassName: "cell-wrap",
    },
    // Nome do Responsável
    {
      field: "Nome__do_responsavel",
      headerName: "Nome Responsável",
      width: 200,
      cellClassName: "cell-wrap",
    },
    // Documento do Responsável
    {
      field: "documento_do_responsavel",
      headerName: "Doc. Responsável",
      width: 160,
      cellClassName: "cell-wrap",
    },
    // E-mail do Responsável
    {
      field: "email_do_responsavel",
      headerName: "Email Responsável",
      width: 200,
      cellClassName: "cell-wrap",
    },
    // Telefone(s) do Responsável
    {
      field: "primeiro_telefone_do_responsavel",
      headerName: "Tel. Principal Resp.",
      width: 160,
      cellClassName: "cell-wrap",
    },
    {
      field: "segundo_telefone_do_responsavel",
      headerName: "Tel. Secundário Resp.",
      width: 160,
      cellClassName: "cell-wrap",
    },
    {
      field: "telefone_comercial_do_responsavel",
      headerName: "Tel. Comercial Resp.",
      width: 160,
      cellClassName: "cell-wrap",
    },
    // Nome e Telefone Contato de Emergência
    {
      field: "nome_contato_emergencia",
      headerName: "Contato Emerg.",
      width: 150,
      cellClassName: "cell-wrap",
    },
    {
      field: "telefone_contato_emergencia",
      headerName: "Tel. Emergência",
      width: 150,
      cellClassName: "cell-wrap",
    },
    // Endereço
    {
      field: "endereco",
      headerName: "Endereço",
      width: 200,
      cellClassName: "cell-wrap",
    },
    {
      field: "numero_endereço",
      headerName: "Nº",
      width: 60,
      cellClassName: "cell-wrap",
    },
    {
      field: "complemento",
      headerName: "Complemento",
      width: 150,
      cellClassName: "cell-wrap",
    },
    {
      field: "bairro",
      headerName: "Bairro",
      width: 150,
      cellClassName: "cell-wrap",
    },
    {
      field: "cep",
      headerName: "CEP",
      width: 120,
      cellClassName: "cell-wrap",
    },
    // Saúde
    {
      field: "Possui_alergia",
      headerName: "Alergia?",
      width: 100,
      cellClassName: "cell-wrap",
    },
    {
      field: "plano_de_saude",
      headerName: "Plano Saúde",
      width: 130,
      cellClassName: "cell-wrap",
    },
    // Uniforme
    {
      field: "hasUniforme",
      headerName: "Possui Uniforme?",
      width: 130,
      cellClassName: "cell-wrap",
    },
    {
      field: "uniforme_do_aluno",
      headerName: "Tamanho Uniforme",
      width: 130,
      cellClassName: "cell-wrap",
    },
    // Turma (modalidade)
    {
      field: "modalidade_turma",
      headerName: "Turma",
      width: 200,
      cellClassName: "cell-wrap",
    },
    {
      field: "categoria",
      headerName: "Categoria",
      width: 150,
      cellClassName: "cell-wrap",
    },
    // Criar Aviso (se quiser manter)
    {
      field: "CriarAviso",
      headerName: "Criar Aviso",
      width: 130,
      renderCell: (params) => {
        const data: IIAvisos = {
          alunoNome: params.row.nome,
          modalidade: "volei", // ou "default" se preferir
          nomeDaTurma: params.row.modalidade_turma,
          textaviso: "",
          dataaviso: new Date().toISOString(),
          IsActive: false,
        };
        return (
          <AvisoStudents
            alunoNome={data.alunoNome}
            nomeDaTurma={data.nomeDaTurma}
            modalidade={data.modalidade}
          />
        );
      },
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
            disableRowSelectionOnClick
            checkboxSelection={false}
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
