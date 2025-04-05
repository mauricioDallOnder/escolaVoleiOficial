import React, { useCallback, useContext, useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import {
  TextField,
  Button,
  Box,
  Autocomplete,
  Container,
  Typography,
  Modal,
} from "@mui/material";
import { DataContext } from "@/context/context";
import {
  TemporaryMoveStudentsPayload,
  Turma,
} from "@/interface/interfaces";
import { BoxStyleCadastro } from "@/utils/Styles";
import { CorrigirDadosDefinitivos } from "@/utils/CorrigirDadosTurmasEmComponetes";

function CopyStudent({
  alunoNome,
  nomeDaTurmaOrigem,
}: {
  alunoNome: string;
  nomeDaTurmaOrigem: string;
}) {
  const { copyStudentTemp, modalidades, fetchModalidades } = useContext(DataContext);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<TemporaryMoveStudentsPayload>();
  const [turmasDestinoOptions, setTurmasDestinoOptions] = useState<Turma[]>([]);
  const [open, setOpen] = useState<boolean>(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  useEffect(() => {
    fetchModalidades().catch(console.error);
  }, [fetchModalidades]);

  // Como há apenas uma modalidade, define as opções de turma de destino a partir da primeira modalidade
  useEffect(() => {
    if (modalidades && modalidades.length > 0) {
      setTurmasDestinoOptions(modalidades[0].turmas || []);
    }
  }, [modalidades]);

  const onSubmit: SubmitHandler<TemporaryMoveStudentsPayload> = useCallback(
    async (data) => {
      try {
        const payload: TemporaryMoveStudentsPayload = {
          alunoNome: data.alunoNome,
          nomeDaTurmaOrigem: data.nomeDaTurmaOrigem,
          nomeDaTurmaDestino: watch("nomeDaTurmaDestino"),
        };
        await copyStudentTemp(payload);
        await CorrigirDadosDefinitivos();
        reset();
        alert("Aluno copiado com sucesso.");
      } catch (error) {
        console.error("Erro ao copiar aluno", error);
        alert("Erro ao copiar aluno.");
      }
    },
    [copyStudentTemp, reset, watch]
  );

  return (
    <>
      <Button variant="contained" color="success" onClick={handleOpen}>
        Copiar Aluno
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          sx={BoxStyleCadastro}
        >
          <Typography
            variant="h6"
            sx={{ color: "black", fontWeight: "bold", textAlign: "center" }}
          >
            COPIAR ALUNO PARA OUTRA TURMA
          </Typography>
          <TextField
            margin="normal"
            fullWidth
            label="Nome"
            value={alunoNome}
            {...register("alunoNome")}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            margin="normal"
            fullWidth
            {...register("nomeDaTurmaOrigem")}
            label="Turma de Origem (não alterar!)"
            value={nomeDaTurmaOrigem}
            InputLabelProps={{ shrink: true }}
          />
          <Autocomplete
            options={turmasDestinoOptions}
            getOptionLabel={(option) => option.nome_da_turma}
            onChange={(_, newValue) =>
              setValue("nomeDaTurmaDestino", newValue?.nome_da_turma ?? "")
            }
            renderInput={(params) => (
              <TextField
                {...params}
                {...register("nomeDaTurmaDestino")}
                label="Nome da Turma de Destino"
                margin="normal"
                required
                fullWidth
                error={!!errors.nomeDaTurmaDestino}
                helperText={
                  errors.nomeDaTurmaDestino?.message ||
                  "Selecione a turma de destino"
                }
              />
            )}
          />
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? "Enviando dados, aguarde..." : "COPIAR ALUNO"}
          </Button>
        </Box>
      </Modal>
    </>
  );
}

interface MoveAllStudentsProps {
  alunoNome: string;
  nomeDaTurmaOrigem: string;
}

function areEqual(
  prevProps: MoveAllStudentsProps,
  nextProps: MoveAllStudentsProps
) {
  return (
    prevProps.alunoNome === nextProps.alunoNome &&
    prevProps.nomeDaTurmaOrigem === nextProps.nomeDaTurmaOrigem
  );
}

export const CopyStudentMemo = React.memo(CopyStudent, areEqual);
