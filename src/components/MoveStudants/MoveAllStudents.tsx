/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import * as React from "react";
import { TextField, Button, Box, Autocomplete, Typography, Modal } from "@mui/material";
import { useForm, SubmitHandler } from "react-hook-form";
import { DataContext } from "@/context/context";
import { TemporaryMoveStudentsPayload, Turma } from "@/interface/interfaces";
import { BoxStyleCadastro } from "@/utils/Styles";
import { CorrigirDadosDefinitivos } from "@/utils/CorrigirDadosTurmasEmComponetes";

function MoveAllStudents({
  alunoNome,
  nomeDaTurmaOrigem,
}: {
  alunoNome: string;
  nomeDaTurmaOrigem: string;
}) {
  const { moveStudentTemp, modalidades, fetchModalidades } = React.useContext(DataContext);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<TemporaryMoveStudentsPayload>();
  const [turmasDestinoOptions, setTurmasDestinoOptions] = React.useState<Turma[]>([]);
  const [open, setOpen] = React.useState<boolean>(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  // Buscar modalidades (única modalidade) para obter as turmas disponíveis
  React.useEffect(() => {
    fetchModalidades().catch(console.error);
  }, [fetchModalidades]);

  // Quando as modalidades são atualizadas, define as opções de turmas de destino
  React.useEffect(() => {
    if (modalidades && modalidades.length > 0) {
      setTurmasDestinoOptions(modalidades[0].turmas || []);
    }
  }, [modalidades]);

  const onSubmit: SubmitHandler<TemporaryMoveStudentsPayload> = React.useCallback(
    async (data) => {
      try {
        const payload: TemporaryMoveStudentsPayload = {
          alunoNome: data.alunoNome,
          nomeDaTurmaOrigem: data.nomeDaTurmaOrigem,
          nomeDaTurmaDestino: watch("nomeDaTurmaDestino"),
        };
        await moveStudentTemp(payload);

        // Ajustar dados da turma de origem e destino
        await CorrigirDadosDefinitivos();

        reset();
      } catch (error) {
        console.error("Erro ao mover aluno", error);
        alert("Erro ao mover aluno.");
      }
    },
    [moveStudentTemp, reset, watch]
  );

  return (
    <>
      <Button variant="contained" color="error" onClick={handleOpen}>
        Trocar turma
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
            MUDAR TURMA DO ATLETA
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
            {isSubmitting ? "Enviando dados, aguarde..." : "Mudar turma"}
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

export const MoveAllStudentsMemo = React.memo(MoveAllStudents, areEqual);
