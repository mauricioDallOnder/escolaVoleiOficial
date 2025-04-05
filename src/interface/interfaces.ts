import { anoNascimentoSchema } from '@/utils/Constants'
import { Key } from 'react'
import { z } from 'zod'

// Definindo schema para os campos do formulário de registro

// Esquema para Endereço
const enderecoSchema = z.object({
  ruaAvenida: z
    .string()
    .min(5, { message: 'A rua deve ter pelo menos 5 caracteres.' })
    .transform((str) => str.trim()),
  numeroResidencia: z.union([
    z.string().min(1, { message: 'O número obrigatório' }),
    z.number().min(1, { message: 'O número obrigatório' }),
  ]),
  bairro: z
    .string()
    .min(3, { message: 'O bairro deve ter pelo menos 3 caracteres.' })
    .transform((str) => str.trim()),
  cep: z.union([
    z.string().min(8, { message: 'O CEP deve ter pelo menos 8 dígitos.' }),
    z.number().min(8, { message: 'O CEP deve ter pelo menos 8 dígitos.' }),
  ]),
  complemento: z.string().optional(),
})

// Esquema para Pagador de Mensalidades
const pagadorMensalidadesSchema = z.object({
  nomeCompleto: z
    .string()
    .min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' })
    .transform((str) => str.trim()),
  cpf: z.union([
    z
      .string()
      .min(11, { message: 'O CPF deve ter conter 11 dígitos.' })
      .transform((str) => str.trim()),
    z.number().min(11, { message: 'O CPF deve ter conter 11 dígitos.' }),
  ]),
  email: z
    .string()
    .email({ message: 'E-mail inválido' })
    .transform((str) => str.trim()),
  celularWhatsapp: z.union([
    z.string().min(11, { message: 'O telefone deve conter 11 dígitos.' }),
    z.number().min(11, { message: 'O telefone deve conter 11 dígitos.' }),
  ]),
})

// Esquema para Informações Adicionais, com os campos completos
const informacoesAdicionaisSchema = z.object({
  endereco: enderecoSchema,
  pagadorMensalidades: pagadorMensalidadesSchema,
  cobramensalidade: z.string().optional(),
  escolaEstuda: z.string().optional(),
  irmaos: z.string().min(3, { message: 'Escreva (sim) ou (não)' }),
  problemasaude: z.string().optional(),
  tipomedicacao: z.string().optional(),
  convenio: z.string().optional(),
  competicao: z.string().min(3, { message: 'Escreva (sim) ou (não)' }),
  imagem: z.string(),
  rg: z
    .string()
    .min(5, { message: 'O RG deve conter no mínimo 5 números' })
    .transform((str) => str.trim()),
  filhofuncionarioJBS: z
    .string()
    .min(3, { message: 'Escreva (sim) ou (não)' })
    .transform((str) => str.trim()),
  socioJBS: z
    .string()
    .min(3, { message: 'Escreva (sim) ou (não)' })
    .transform((str) => str.trim()),
  nomefuncionarioJBS: z
    .string()
    .min(3, { message: 'Escreva o nome do funcionário' })
    .transform((str) => str.trim()),
  filhofuncionariomarcopolo: z
    .string()
    .min(3, { message: 'Escreva (sim) ou (não)' })
    .transform((str) => str.trim()),
  nomefuncionariomarcopolo: z
    .string()
    .min(3, { message: 'Escreva o nome do funcionário' })
    .transform((str) => str.trim()),
  uniforme: z.string(),
})

// Esquema para Aluno, incluindo todos os campos necessários
const alunoSchema = z.object({
  informacoesAdicionais: informacoesAdicionaisSchema,
  nome: z
    .string()
    .min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' })
    .transform((str) => str.trim()),
  anoNascimento: anoNascimentoSchema,
  telefoneComWhatsapp: z.union([
    z.string().min(11, { message: 'O telefone deve conter 11 dígitos.' }),
    z.number().min(11, { message: 'O telefone deve conter 11 dígitos.' }),
  ]),
})

// Esquema para FormValuesStudent (apenas aluno e turmaSelecionada)
export const formValuesStudentSchema = z.object({
  aluno: alunoSchema,
  turmaSelecionada: z.string(),
})

// Definindo interfaces para os tipos de dados

export interface Endereco {
  ruaAvenida: string
  numeroResidencia: number | string
  bairro: string
  cep: number | string
  complemento: string
}

export interface PagadorMensalidades {
  nomeCompleto: string
  cpf: number | string
  email: string
  celularWhatsapp: number | string
}

export interface InformacoesAdicionais {
  endereco: Endereco
  pagadorMensalidades: PagadorMensalidades
  cobramensalidade: string
  escolaEstuda: string
  irmaos: string
  saude?: string
  problemasaude: string
  medicacao?: string
  tipomedicacao: string
  convenio: string
  // Removido: nucleoTreinamento
  competicao: string
  comprometimentoMensalidade: string
  copiaDocumento: string
  imagem: string
  avisaAusencia: string
  desconto: string
  rg: string
  filhofuncionarioJBS: string
  socioJBS: string
  nomefuncionarioJBS: string
  filhofuncionariomarcopolo: string
  nomefuncionariomarcopolo: string
  uniforme: string
  hasUniforme?: boolean
  IdentificadorUnico?: string
}

export interface IIAvisos {
  alunoNome: string;
  modalidade: string;
  nomeDaTurma: string;
  textaviso: string;
  dataaviso: string; // Alterado de Date para string
  IsActive: boolean;
}

export interface Aluno {
  id: number
  informacoesAdicionais: InformacoesAdicionais
  nome: string
  anoNascimento: string
  telefoneComWhatsapp: number | string
  presencas: Record<string, Record<string, boolean>>
  foto?: string
  dataMatricula?: string
  avisos?: IIAvisos
}

export interface Turma {
  nome_da_turma: string
  // Removidos: modalidade e nucleo, pois a modalidade é única
  categoria: string
  capacidade_maxima_da_turma: number
  capacidade_atual_da_turma: number
  alunos: Aluno[]
  uuidTurma?: string
  diaDaSemana?: string
  horario?: string
}

export interface AlunoComTurma {
  aluno: Aluno; 
  nomeDaTurma: string;
  categoria: string;
  // Removida a propriedade modalidade, pois é única
  uniforme: boolean;
}

export interface IUpdateUniformeApiData {
  // Removida a propriedade modalidade, pois é única
  nomeDaTurma: string;
  alunoNome: string;
  hasUniforme: boolean;
}

export interface Modalidade {
  nome: string // Identificador da modalidade, por exemplo "futebol", "vôlei", etc.
  turmas: Turma[]
}

// Na versão atual, a seleção de modalidade não é feita no formulário, portanto:
export interface AlunoPresencaUpdate extends Aluno {
  alunoId: string | number;
  nomeDaTurma: string; // Adicione esta propriedade
}


export interface MoveStudentsPayload {
  alunosNomes: string[];
  alunosModalidadesOrigem: string[];
  alunosTurmasOrigem: string[];
  // Removida a propriedade modalidadeDestino, pois é única
  nomeDaTurmaDestino: string;
}

export interface TemporaryMoveStudentsPayload {
  alunoNome: string;
  // Removida a propriedade modalidadeOrigem, pois é única
  nomeDaTurmaOrigem: string;
  // Removida a propriedade modalidadeDestino, pois é única
  nomeDaTurmaDestino: string;
}

export interface StudentPresenceTableProps {
  alunosDaTurma: Aluno[]
  setAlunosDaTurma: React.Dispatch<React.SetStateAction<Aluno[]>>
  // Removida a propriedade modalidade, pois é única
  nomeDaTurma: string
  alunoId?: number
}

export interface AdminTableProps {
  alunosDaTurma: Aluno[]
  modalidades?: Modalidade[]
  nomeDaTurma: string
}

// Tipagem para as props da página
export interface AdminPageProps {
  modalidades: Modalidade[]
}

// Atualizado para remover os campos de seleção de modalidade e núcleo
export type FormValuesStudent = {
  aluno: Omit<AlunoPresencaUpdate, 'modalidade' | 'nomeDaTurma'>;
  turmaSelecionada: string; // Nome da turma selecionada
}

export interface ModalidadesData {
  [modalidade: string]: {
    turmas: Turma[]
  }
}

export interface AttendanceModalContentProps {
  aluno: Aluno
  month: string
}

export interface IIAlunoUpdate extends Omit<Aluno, 'id' | 'presencas'> {
  // Removidas as propriedades modalidade e nomeDaTurma; serão definidas automaticamente
  alunoId?: string | number // O ID do aluno
  anoNascimento: string // A data de nascimento a ser atualizada
  telefoneComWhatsapp: string | number
  nome: string
  informacoesAdicionais: InformacoesAdicionais;
  dataMatricula?: string
}

export interface ArchiveAluno extends Omit<Aluno, 'id' | 'presencas'> {
  IdentificadorUnico: string | undefined
  alunoId?: string | number
  // Removida a propriedade modalidade, pois é única
  nomeDaTurma: string
  anoNascimento: string // A data de nascimento a ser atualizada
  telefoneComWhatsapp: string | number
  nome: string
  informacoesAdicionais: InformacoesAdicionais;
  dataMatricula?: string;
}

export interface IIUpdateStudantModal {
  isOpen: boolean
  onClose: () => void
  alunosDaTurma: string
}

export interface Semana {
  start: number
  end: number
}

export interface TurmaPresencaSemanalProps {
  isOpen: boolean
  onClose: () => void
  alunosDaTurma: Aluno[]
  nomeDaTurma: string
}

export interface AlunoAutocompleteOption {
  [x: string]: Key | null | undefined
  id: string 
  nome: string;
  // Removida a propriedade modalidade, pois é única
  turma: string;
  // Removida a propriedade nucleo, pois não é mais utilizada
}

export interface DeleteStudants {
  alunoId: string 
  // Removida a propriedade modalidade, pois é única
  nomeDaTurma: string
  alunosNomes?: string
}

export interface DeleteAlunoAutocompleteOption {
  [x: string]: Key | null | undefined
  alunoId: string 
  alunosNomes?: string;
  // Removida a propriedade modalidade, pois é única
  nomeDaTurma: string;
}
