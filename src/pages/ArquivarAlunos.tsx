"use client";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Autocomplete,
  Button,
  TextField,
  Typography,
  Box,
  Container,
  Snackbar,
  Alert,
} from "@mui/material";
import { v4 as uuidv4 } from "uuid";
import { DataContext } from "@/context/context";
import { ArchiveAluno } from "@/interface/interfaces";
import Layout from "@/components/TopBarComponents/Layout";
import { BoxStyleCadastro } from "@/utils/Styles";
import axios from "axios";
import { HeaderForm } from "@/components/HeaderDefaultForm";
import { CorrigirDadosDefinitivos } from "@/utils/CorrigirDadosTurmasEmComponetes";

export default function ArquivarAlunos() {
  const { deleteStudentFromApi, modalidades, fetchModalidades } = useContext(DataContext);
  const { handleSubmit, control } = useForm();
  const [selectedAluno, setSelectedAluno] = useState<ArchiveAluno | null>(null);
  const [alunosOptions, setAlunosOptions] = useState<ArchiveAluno[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Carrega as modalidades ao montar o componente
  useEffect(() => {
    if (!dataLoaded) {
      fetchModalidades()
        .then(() => {
          setDataLoaded(true);
        })
        .catch(console.error);
    }
  }, [dataLoaded, fetchModalidades]);

  // Extrai alunos das modalidades
  useEffect(() => {
    if (modalidades.length > 0 && dataLoaded) {
      const alunosExtraidos = modalidades
        .filter(Boolean)
        .flatMap((modalidade) => {
          if (!modalidade.turmas) return [];
          return modalidade.turmas
            .filter(Boolean)
            .flatMap((turma) => {
              if (!Array.isArray(turma.alunos)) return [];
              return turma.alunos
                .filter(Boolean)
                .map((aluno) => {
                  let identificadorUnico = aluno.informacoesAdicionais?.IdentificadorUnico;
                  if (!identificadorUnico) {
                    identificadorUnico = uuidv4();
                    aluno.informacoesAdicionais = {
                      ...aluno.informacoesAdicionais,
                      IdentificadorUnico: identificadorUnico,
                    };
                  }
                  return {
                    ...aluno,
                    // Usamos 'alunoId' para operações futuras; se não existir, definimos igual ao IdentificadorUnico.
                    alunoId: identificadorUnico,
                    nome: aluno.nome ?? "",
                    anoNascimento: aluno.anoNascimento ?? "",
                    telefoneComWhatsapp: aluno.telefoneComWhatsapp ?? "",
                    informacoesAdicionais: aluno.informacoesAdicionais ?? {},
                    modalidade: "volei",
                    nomeDaTurma: turma.nome_da_turma,
                    dataMatricula: aluno.dataMatricula ?? "",
                    foto: aluno.foto ?? "",
                    IdentificadorUnico: identificadorUnico,
                  };
                });
            });
        });
      setAlunosOptions(alunosExtraidos);
    }
  }, [modalidades, dataLoaded]);

  // Função para gerar o conteúdo TXT sem as presenças
  function gerarConteudoTxt(aluno: ArchiveAluno): string {
    let conteudo = `--- Dados do Aluno Arquivado ---\n`;
    conteudo += `ID / alunoId: ${aluno.alunoId}\n`;
    conteudo += `Nome: ${aluno.nome}\n`;
    conteudo += `Ano de Nascimento: ${aluno.anoNascimento}\n`;
    conteudo += `Telefone: ${aluno.telefoneComWhatsapp}\n`;
    conteudo += `Turma: ${aluno.nomeDaTurma}\n`;
    conteudo += `Data de Matrícula: ${aluno.dataMatricula}\n`;
    conteudo += `Foto: ${aluno.foto}\n\n`;
    conteudo += `--- Informações Adicionais ---\n`;
    for (const key in aluno.informacoesAdicionais) {
      Object.entries(aluno.informacoesAdicionais).forEach(([key, value]) => {
        conteudo += `${key}: ${value}\n`;
      });
      
    }
    // A parte de presenças foi removida.
    return conteudo;
  }

  // Função para criar e baixar arquivo TXT
  function downloadTxtFile(conteudo: string, nomeArquivo: string) {
    const blob = new Blob([conteudo], { type: "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // Envio do formulário para arquivar o aluno
  const onSubmit = useCallback(async () => {
    if (!selectedAluno) {
      alert("Selecione um aluno para arquivar.");
      return;
    }

    if (!selectedAluno.IdentificadorUnico || !selectedAluno.nomeDaTurma) {
      alert("Dados do aluno incompletos. Não é possível arquivar.");
      return;
    }

    setIsDeleting(true);
    try {
      // Gerar e baixar arquivo TXT com os dados do aluno (sem presenças)
      const conteudoTxt = gerarConteudoTxt(selectedAluno);
      const nomeArquivo = `${selectedAluno.nome.replace(/\s+/g, "_")}_arquivado.txt`;
      downloadTxtFile(conteudoTxt, nomeArquivo);

      // Remove o aluno do banco de dados via API
      await deleteStudentFromApi({
        alunoId: selectedAluno.IdentificadorUnico as string,
        nomeDaTurma: selectedAluno.nomeDaTurma,
      });

      // Corrige os dados da turma, se necessário
      try {
        await CorrigirDadosDefinitivos();
      } catch (error) {
        console.error("Erro ao corrigir dados da turma:", error);
      }

      // Atualiza a lista de alunos disponíveis removendo o arquivado
      setAlunosOptions((prev) =>
        prev.filter(
          (aluno) =>
            aluno.IdentificadorUnico !== selectedAluno.IdentificadorUnico
        )
      );
      alert("Aluno arquivado com sucesso.");
    } catch (error: any) {
      console.error(error);
      alert(`Ocorreu um erro ao arquivar o aluno: ${error.message}`);
    } finally {
      setIsDeleting(false);
      setSelectedAluno(null);
    }
  }, [selectedAluno, deleteStudentFromApi]);

  return (
    <Layout>
      <Container>
        <Box component="form" sx={BoxStyleCadastro} onSubmit={handleSubmit(onSubmit)} noValidate>
          <HeaderForm titulo={"Arquivar Alunos"} />
          <Typography sx={{ color: "black", fontWeight: "bold" }}>
            Ao arquivar um aluno,ele será deletado do banco de dados e um arquivo de texto será baixado com todos os dados dele.
          </Typography>
          <br />
          <Controller
            name="alunoId"
            control={control}
            render={({ field }) => (
              <Autocomplete
                {...field}
                value={selectedAluno}
                options={alunosOptions}
                getOptionLabel={(option) => `${option.nome} - ${option.nomeDaTurma}`}
                onChange={(_event, value) => setSelectedAluno(value)}
                renderInput={(params) => (
                  <TextField {...params} label="Selecione o Aluno" variant="outlined" fullWidth />
                )}
                isOptionEqualToValue={(option, value) =>
                  option.alunoId === value?.alunoId
                }
                filterSelectedOptions
                autoComplete
                autoHighlight
              />
            )}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 3, mb: 2 }}
            disabled={isDeleting}
          >
            {isDeleting
              ? "Arquivando aluno... aguarde..."
              : "Arquivar Aluno"}
          </Button>
        </Box>
      </Container>
    </Layout>
  );
}
