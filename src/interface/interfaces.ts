import { anoNascimentoSchema, Presencas } from '@/utils/Constants'
import { Key } from 'react'
import { z } from 'zod'

// Schema para Informações Adicionais (nova estrutura)
const informacoesAdicionaisSchema = z.object({
  endereco: z.string().min(5, { message: 'O endereço deve ter pelo menos 5 caracteres.' }).transform((str) => str.trim()),
  numero_endereço: z.union([
    z.string().min(1, { message: 'O número é obrigatório.' }),
    z.number().min(1, { message: 'O número é obrigatório.' }),
  ]),
  complemento: z.string().optional(),
  bairro: z.string().min(3, { message: 'O bairro deve ter pelo menos 3 caracteres.' }).transform((str) => str.trim()),
  cep: z.union([
    z.string().min(8, { message: 'O CEP deve ter pelo menos 8 dígitos.' }),
    z.number().min(8, { message: 'O CEP deve ter pelo menos 8 dígitos.' }),
  ]),
  plano_de_saude: z.string().optional(),
  Possui_alergia: z.string().optional(),
  nome_contato_emergencia: z.string().optional(),
  telefone_contato_emergencia: z.union([z.string(), z.number().optional()]),
  Nome__do_responsavel: z.string().optional(),
  data_de_nascimento_responsavel: z.string().optional(),
  documento_do_responsavel: z.string().optional(),
  primeiro_telefone_do_responsavel: z.union([z.string(), z.number().optional()]),
  segundo_telefone_do_responsavel: z.union([z.string(), z.number().optional()]),
  email_do_responsavel: z.string().email().optional(),
  local_de_trabalho_do_responsavel: z.string().optional(),
  funcao_do_responsavel: z.string().optional(),
  telefone_comercial_do_responsavel: z.union([z.string(), z.number().optional()]),
  uniforme_do_aluno: z.string(),
  // Termos: agora são booleanos (eles serão usados apenas para validação no front-end)
  foto:z.string(),
 
});

// Schema para o aluno
const alunoSchema = z.object({
  informacoesAdicionais: informacoesAdicionaisSchema,
  nome: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }).transform((str) => str.trim()),
  anoNascimento: anoNascimentoSchema,
  telefoneComWhatsapp: z.union([
    z.string().min(11, { message: 'O telefone deve conter 11 dígitos.' }),
    z.number().min(11, { message: 'O telefone deve conter 11 dígitos.' }),
  ]),
});

// Schema para os valores do formulário do aluno
export const formValuesStudentSchema = z.object({
  aluno: alunoSchema,
  turmaSelecionada: z.string(),
});

// Interfaces

export interface Endereco {
  endereco: string;
  numero_endereço: number | string;
  complemento?: string;
  bairro: string;
  cep: number | string;
}

// Exemplo de "informacoesAdicionais"
export interface InformacoesAdicionais {
  IdentificadorUnico: string;
  Nome__do_responsavel: string;
  Possui_alergia: string;
  bairro: string;
  cep: string;
  complemento: string;
  data_de_nascimento_responsavel: string;
  documento_do_responsavel: string;
  email_do_responsavel: string;
  endereco: string;
  funcao_do_responsavel: string;
  hasUniforme: boolean;
  local_de_trabalho_do_responsavel: string;
  nome_contato_emergencia: string;
  numero_endereço: string;
  plano_de_saude: string;
  primeiro_telefone_do_responsavel: string;
  segundo_telefone_do_responsavel: string;
  telefone_comercial_do_responsavel: string;
  telefone_contato_emergencia: string;
  uniforme_do_aluno: string;
  uniforme: string;
}

export interface IIAvisos {
  alunoNome: string;
  modalidade: string;
  nomeDaTurma: string;
  textaviso: string;
  dataaviso: string;
  IsActive: boolean;
}

export interface Aluno {
  id: number;
  informacoesAdicionais: InformacoesAdicionais;
  nome: string;
  anoNascimento: string;
  telefoneComWhatsapp: number | string;
  presencas: Record<string, Record<string, boolean>>;
  foto?: string;
  dataMatricula?: string;
  avisos?: IIAvisos;
  telefone_contato_emergencia?:string
  nome_contato_emergencia?:string
  documento?:string
}

export interface Turma {
  modalidade: string | undefined;
  nome_da_turma: string;
  categoria: string;
  capacidade_maxima_da_turma: number;
  capacidade_atual_da_turma: number;
  alunos: Aluno[];
  uuidTurma?: string;
 diaDaSemana: string[];
  horario?: string;
}

export interface AlunoComTurma {
  aluno: Aluno;
  nomeDaTurma: string;
  categoria: string;
  uniforme: boolean;
  modalidade?:string
}

export interface IUpdateUniformeApiData {
  nomeDaTurma: string;
  alunoNome: string;
  hasUniforme: boolean;
  modalidade:string
}

export interface Modalidade {
  nome: string;
  turmas: Turma[];
}

// A seleção de modalidade não é feita no formulário – portanto:
export interface AlunoPresencaUpdate extends Aluno {
  alunoId: string | number;
  nomeDaTurma: string;
}

export interface MoveStudentsPayload {
  alunosNomes: string[];
  alunosModalidadesOrigem: string[];
  alunosTurmasOrigem: string[];
  nomeDaTurmaDestino: string;
}

export interface TemporaryMoveStudentsPayload {
  alunoNome: string;
  nomeDaTurmaOrigem: string;
  nomeDaTurmaDestino: string;
}

export interface StudentPresenceTableProps {
  alunosDaTurma: Aluno[];
  setAlunosDaTurma: React.Dispatch<React.SetStateAction<Aluno[]>>;
  nomeDaTurma: string;
  alunoId?: number;
}

export interface AdminTableProps {
  alunosDaTurma: Aluno[];
  modalidades?: Modalidade[];
  nomeDaTurma: string;
}

export interface AdminPageProps {
  modalidades: Modalidade[];
}

// Exemplo de "aluno"
export interface AlunoParaForm {
  // **CORREÇÃO 2:** alunoId agora aceita string ou number para ser flexível.
  alunoId: number | string;
  id: number;
  nome: string;
  anoNascimento: string;
  dataMatricula: string;
  telefoneComWhatsapp: string;
  informacoesAdicionais: InformacoesAdicionais;
  presencas: Presencas;
  foto: string;
}

// A interface final do form
export interface FormValuesStudent {
  aluno: AlunoParaForm;
  turmaSelecionada: string;
  modalidade: string; // Adicionado para consistência
}

export interface ModalidadesData {
  [modalidade: string]: {
    turmas: Turma[];
  };
}

export interface AttendanceModalContentProps {
  aluno: Aluno;
  month: string;
}

export interface IIAlunoUpdate extends Omit<Aluno, 'id' | 'presencas'> {
  alunoId?: string | number;
  anoNascimento: string;
  telefoneComWhatsapp: string | number;
  nome: string;
  informacoesAdicionais: InformacoesAdicionais;
  dataMatricula?: string;
  nomeDaTurma:string
  modalidade:string
  documento?:string
}

export interface ArchiveAluno extends Omit<Aluno, 'id' | 'presencas'> {
  IdentificadorUnico: string | undefined;
  alunoId?: string | number;
  nomeDaTurma: string;
  anoNascimento: string;
  telefoneComWhatsapp: string | number;
  nome: string;
  informacoesAdicionais: InformacoesAdicionais;
  dataMatricula?: string;
}

export interface IIUpdateStudantModal {
  isOpen: boolean;
  onClose: () => void;
  alunosDaTurma: string;
}

export interface Semana {
  start: number;
  end: number;
}

export interface TurmaPresencaSemanalProps {
  isOpen: boolean;
  onClose: () => void;
  alunosDaTurma: Aluno[];
  nomeDaTurma: string;
}

export interface AlunoAutocompleteOption {
  [x: string]: Key | null | undefined;
  id: string;
  nome: string;
  turma: string;
}

export interface DeleteStudants {
  alunoId: string;
  nomeDaTurma: string;
  alunosNomes?: string;
}

export interface DeleteAlunoAutocompleteOption {
  [x: string]: Key | null | undefined;
  alunoId: string;
  alunosNomes?: string;
  nomeDaTurma: string;
}
