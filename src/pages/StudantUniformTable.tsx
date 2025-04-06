/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import * as React from "react";
import {
  DataGrid,
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
import { useEffect, useState } from "react";
import { AlunoComTurma, IUpdateUniformeApiData } from "@/interface/interfaces";
import { v4 as uuidv4 } from "uuid";
import { Button, Container } from "@mui/material";
import DownloadingIcon from "@mui/icons-material/Downloading";
import Layout from "@/components/TopBarComponents/Layout";
import { CustomCheckboxEdit } from "@/components/CustomEditableCheckbox"; // checkbox customizado
import { StyledDataGrid } from "@/utils/Styles";

// Componente de paginação customizada
function CustomPagination() {
  const apiRef = useGridApiContext();
  const page = useGridSelector(apiRef, gridPageSelector);
  const pageCount = useGridSelector(apiRef, gridPageCountSelector);

  // Filtra as linhas que devem ser exportadas (todas expandidas/visíveis)
  const getFilteredRows = ({ apiRef }: GridCsvGetRowsToExportParams) =>
    gridExpandedSortedRowIdsSelector(apiRef);

  // Exporta dados como CSV (apenas colunas selecionadas)
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

/**
 * Componente principal: Exibe tabela de alunos com checkbox "possui uniforme"
 * e permite salvar a atualização de "hasUniforme" no DB via updateUniformeInApi.
 */
export default function StudantUniformTable() {
  const { fetchModalidades, updateUniformeInApi } = useData();

  // Estado com lista de AlunoComTurma
  const [alunosComTurma, setAlunosComTurma] = useState<AlunoComTurma[]>([]);
  // Armazena linhas que já foram salvas (para colorir o botão)
  const [savedRows, setSavedRows] = useState<Record<string, boolean>>({});
  // Caso precise armazenar mudanças não salvas
  const [modifiedRows, setModifiedRows] = useState<Record<GridRowId, AlunoComTurma>>({});

  // Paginação
  const [paginationModel, setPaginationModel] = useState({
    pageSize: PAGE_SIZE,
    page: 0,
  });

  // Carrega dados do back-end
  useEffect(() => {
    fetchModalidades().then((modalidadesFetched) => {
      // Filtra se existirem modalidades "temporarios", "arquivados", "excluidos"
      const modalidadesValidas = modalidadesFetched.filter(
        (modalidade) =>
          !["temporarios", "arquivados", "excluidos"].includes(
            modalidade.nome.toLowerCase()
          )
      );

      // Constrói o array final de AlunoComTurma
      const alunosComTurmaTemp: AlunoComTurma[] = modalidadesValidas.flatMap(
        (modalidade) =>
          modalidade.turmas.flatMap((turma) => {
            const alunosArray = Array.isArray(turma.alunos) ? turma.alunos : [];
            return alunosArray.filter(Boolean).map((aluno): AlunoComTurma => ({
              aluno: {
                ...aluno,
                // Se IdentificadorUnico não existir, gera
                informacoesAdicionais: {
                  ...aluno.informacoesAdicionais,
                  IdentificadorUnico:
                    aluno.informacoesAdicionais?.IdentificadorUnico ?? uuidv4(),
                },
              },
              nomeDaTurma: turma.nome_da_turma,
              categoria: turma.categoria,
              modalidade: turma.modalidade,
              // "uniforme" para conveniência: hasUniforme no informacoesAdicionais
              uniforme: aluno.informacoesAdicionais?.hasUniforme ?? false,
            }));
          })
      );

      setAlunosComTurma(alunosComTurmaTemp);
    });
  }, [fetchModalidades]);

  // Mapeia AlunoComTurma para rows do DataGrid
  const rows: GridRowsProp = alunosComTurma.map((item) => {
    const { aluno, nomeDaTurma, categoria, modalidade, uniforme } = item;
    const info = aluno.informacoesAdicionais || {};
    return {
      // ID baseado em IdentificadorUnico ou gerado
      id: info.IdentificadorUnico ?? uuidv4(),
      nome: aluno.nome,
      anoNascimento: aluno.anoNascimento,
      nomeDaTurma: nomeDaTurma,
      categoria: categoria,
      modalidade: modalidade,
      uniforme: uniforme,
    };
  });

  // Caso existam mudanças (modifiedRows), mescla com as rows
  const mergedRows = rows.map((row) => {
    const modified = modifiedRows[row.id];
    if (modified) {
      return {
        ...row,
        uniforme: modified.uniforme,
      };
    }
    return row;
  });

  // Definição das colunas
  const columns: GridColDef[] = [
    {
      field: "nome",
      headerName: "Nome do Aluno",
      width: 250,
    },
    {
      field: "anoNascimento",
      headerName: "Nascimento",
      width: 130,
    },
    {
      field: "nomeDaTurma",
      headerName: "Turma",
      width: 250,
    },
    {
      field: "categoria",
      headerName: "Categoria",
      width: 150,
    },
    {
      field: "modalidade",
      headerName: "Modalidade",
      width: 150,
    },
    {
      field: "uniforme",
      headerName: "Possui Uniforme",
      width: 150,
      type: "boolean",
      editable: true,
      renderEditCell: (params) => <CustomCheckboxEdit {...params} />,
    },
    {
      field: "actions",
      headerName: "Ações",
      width: 150,
      renderCell: (params) => {
        // Verifica se esta linha já foi "salva"
        const isSaved = savedRows[params.row.id];

        // Função para salvar "hasUniforme" no back-end
        const onSave = async () => {
          const data: IUpdateUniformeApiData = {
            modalidade: params?.row.modalidade, // <-- Precisamos ter esse campo
            nomeDaTurma: params.row.nomeDaTurma,
            alunoNome: params.row.nome,
            hasUniforme: params.row.uniforme,       // valor boolean
          };

          try {
            await updateUniformeInApi(data);
            console.log("Uniforme atualizado com sucesso!");

            // Marca a linha como salva
            setSavedRows((prev) => ({
              ...prev,
              [params.row.id]: true,
            }));

            // Atualiza no estado local
            setModifiedRows((prev) => ({
              ...prev,
              [params.row.id]: {
                ...prev[params.row.id],
                uniforme: data.hasUniforme,
              },
            }));
          } catch (error) {
            console.error("Erro ao atualizar o uniforme:", error);
          }
        };

        return (
          <Button
            onClick={onSave}
            variant="contained"
            sx={{
              bgcolor: isSaved ? "green" : "red",
              "&:hover": {
                bgcolor: isSaved ? "darkgreen" : "darkred",
              },
            }}
          >
            {isSaved ? "Salvo" : "Salvar"}
          </Button>
        );
      },
    },
  ];

  return (
    <Layout>
      <Container
        style={{ marginTop: "10px", height: "auto", width: "fit-content" }}
      >
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
    </Layout>
  );
}
