import { FieldValues, FieldErrors } from 'react-hook-form';
import { z } from 'zod';
// Campos de Identificação (dados principais do aluno)

export const fieldsIdentificacao = [
  { label: "Nome Completo do Aluno(a)", id: "aluno.nome" },
  { label: "Data de Nascimento do Aluno(a)", id: "aluno.anoNascimento" },
  { label: "Documento", id: "aluno.documento" },
];

// Campos de Endereço (dados complementares)
export const fieldsEndereco = [
  { label: "Endereço", id: "aluno.informacoesAdicionais.endereco" },
  { label: "Número", id: "aluno.informacoesAdicionais.numero_endereço" },
  { label: "Complemento", id: "aluno.informacoesAdicionais.complemento" },
  { label: "Bairro", id: "aluno.informacoesAdicionais.bairro" },
  { label: "CEP", id: "aluno.informacoesAdicionais.cep" },
];

// Campos de Saúde
export const fieldsSaude = [
  { label: "Plano de Saúde", id: "aluno.informacoesAdicionais.plano_de_saude" },
  { label: "Possui Alergia", id: "aluno.informacoesAdicionais.Possui_alergia" },
  { label: "Nome Contato Emergência", id: "aluno.informacoesAdicionais.nome_contato_emergencia" },
  { label: "Telefone Contato Emergência", id: "aluno.informacoesAdicionais.telefone_contato_emergencia" },
];


// Dados do Responsável
export const fieldsResponsavel = [
  { label: "Nome do Responsável", id: "aluno.informacoesAdicionais.Nome__do_responsavel" },
  { label: "Data de Nascimento do Responsável", id: "aluno.informacoesAdicionais.data_de_nascimento_responsavel" },
  { label: "Documento do Responsável", id: "aluno.informacoesAdicionais.documento_do_responsavel" },
  { label: "Primeiro Telefone do Responsável", id: "aluno.informacoesAdicionais.primeiro_telefone_do_responsavel" },
  { label: "Segundo Telefone do Responsável", id: "aluno.informacoesAdicionais.segundo_telefone_do_responsavel" },
  { label: "Email do Responsável", id: "aluno.informacoesAdicionais.email_do_responsavel" },
  { label: "Local de Trabalho do Responsável", id: "aluno.informacoesAdicionais.local_de_trabalho_do_responsavel" },
  { label: "Função do Responsável", id: "aluno.informacoesAdicionais.funcao_do_responsavel" },
  { label: "Telefone Comercial do Responsável", id: "aluno.informacoesAdicionais.telefone_comercial_do_responsavel" },
];

// Uniforme
export const fieldsUniforme = [
  { label: "Uniforme do Aluno", id: "aluno.informacoesAdicionais.uniforme_do_aluno" },
];
/*
export const fieldsTermosAvisos = [
  {
    label:
      "Li e estou ciente que o contrato é de um ano, de março até fevereiro do ano seguinte.",
    id: "aluno.informacoesAdicionais.termo_contrato",
  },
  {
    label:
      "Li e estou ciente que o vencimento da mensalidade é no dia 12 de cada mês.",
    id: "aluno.informacoesAdicionais.termo_vencimento",
  },
  {
    label:
      "A ausência do aluno não isenta das obrigações de pagamento, sem reposições de aulas.",
    id: "aluno.informacoesAdicionais.termo_ausencia",
  },
  {
    label:
      "Em caso de cancelamento, será cobrado o valor equivalente a uma mensalidade mais R$10,00 por boleto.",
    id: "aluno.informacoesAdicionais.termo_cancelamento",
  },
  {
    label:
      "Comprometo-me a avisar antecipadamente a ausência do aluno e informar sobre problemas de saúde.",
    id: "aluno.informacoesAdicionais.termo_aviso_saude",
  },
  {
    label: "Estou de acordo com o desconto *",
    id: "aluno.informacoesAdicionais.termo_desconto",
  },
  {
    label:
      "Declaro que o menor está em perfeitas condições de saúde para participar de treinos e competições.",
    id: "aluno.informacoesAdicionais.termo_condicoes_saude",
  },
  {
    label: "Sim, declaro. *",
    id: "aluno.informacoesAdicionais.termo_declaracao",
  },
  {
    label:
      "Concordo que a imagem e o nome do atleta serão utilizados para divulgação e promoção.",
    id: "aluno.informacoesAdicionais.termo_imagem",
  },
] 

type OpcoesTermosAvisos = {
  [key: string]: string[];
};

export const opcoesTermosAvisos: OpcoesTermosAvisos = {
  cobramensalidade: ["Ciente"],
  avisaAusencia: ["Sim, avisarei sobre ausências aos treinos."],
  comprometimentoMensalidade: [
    "Concordo em realizar o pagamento antecipado até dia 10 de cada mês.",
  ],
  copiaDocumento: [
    "Comprometo-me a providenciar cópia autenticada do RG e atestado médico.",
  ],
  desconto: ["Estou de acordo com o desconto"],
  condicaosaude: ["Sim, declaro."],
  imagem:["Ciente"]
};
*/
//----------------------------------------------------------------------------------------------
// src/utils/Constants.ts
export interface Presencas {
  [mes: string]: {
    [data: string]: boolean;
  };
}

interface diaDaSemanaMap {
  [dia: string]: number;
}

// Função auxiliar para gerar datas de UM dia no mês
export function gerarDiasDoMes(
  ano: number,
  mes: number,
  diaDaSemana: number
): string[] {
  const datas: string[] = [];
  let data = new Date(ano, mes - 1, 1);

  // Ajusta para o primeiro "diaDaSemana" do mês
  while (data.getDay() !== diaDaSemana) {
    data.setDate(data.getDate() + 1);
  }

  // Enquanto ainda estiver no mesmo mês, avança de 7 em 7 dias
  while (data.getMonth() === mes - 1) {
    datas.push(`${data.getDate()}-${mes}-${data.getFullYear()}`);
    data.setDate(data.getDate() + 7);
  }
  return datas;
}

/**
 * Extrai o dia da semana de um nome de turma que contém algo como
 * "SUB09_AZ_QUARTA_17H30".
 * Se não encontrar, retorna "SEGUNDA" por padrão.
 */
export function extrairDiaDaSemana(nomeDaTurma: string): string {
  const partes = nomeDaTurma.split("_");
  const diasValidos = [
    "SEGUNDA",
    "TERÇA",
    "QUARTA",
    "QUINTA",
    "SEXTA",
    "SÁBADO",
    "DOMINGO",
  ];

  const diaEncontrado = partes.find((parte) =>
    diasValidos.includes(parte.toUpperCase())
  );

  return diaEncontrado?.toUpperCase() || "SEGUNDA";
}


/**
 * Gera um objeto de presenças para um aluno, considerando:
 *  - Ano corrente (new Date().getFullYear()).
 *  - Se o mês atual < 7 => gera de janeiro a junho.
 *  - Caso contrário => gera de julho a dezembro.
 */
// ---------- NOVA FUNÇÃO para lidar com vários dias ----------
export function gerarPresencasParaVariosDias(diaDaSemana: string[]): Presencas {
  // Mapeia string => número do JavaScript
  const diaDaSemanaMap: diaDaSemanaMap = {
    SEGUNDA: 1,
    TERÇA: 2,
    QUARTA: 3,
    QUINTA: 4,
    SEXTA: 5,
    SÁBADO: 6,
    DOMINGO: 0,
  };

  const anoCorrente = new Date().getFullYear();
  const mesAtual = new Date().getMonth() + 1;

  // Se o mês atual < 7, geramos presenças de janeiro(1) a junho(6).
  // Caso contrário, julho(7) a dezembro(12).
  const inicio = mesAtual < 7 ? 1 : 7;
  const fim = mesAtual < 7 ? 6 : 12;

  const presencas: Presencas = {};

  // Percorre cada mês do semestre
  for (let mes = inicio; mes <= fim; mes++) {
    // Nome do mês em pt-BR (tudo minúsculo, ou ajusta se preferir)
    const nomeMes = new Date(anoCorrente, mes - 1, 1).toLocaleString("pt-BR", {
      month: "long",
    });
    presencas[nomeMes] = presencas[nomeMes] || {};

    // Para cada dia da semana escolhido, gera as datas e adiciona no objeto
    diaDaSemana.forEach((diaSemanaString) => {
      const diaJs = diaDaSemanaMap[diaSemanaString.toUpperCase()];
      if (diaJs === undefined) return; // ignora se não for válido

      const datasDoMes = gerarDiasDoMes(anoCorrente, mes, diaJs);
      datasDoMes.forEach((dataStr) => {
        presencas[nomeMes][dataStr] = true;
      });
    });
  }

  return presencas;
}
/**
 * Gera um objeto de presenças para um aluno, considerando um semestre específico:
 *  - "primeiro": meses jan..jun
 *  - "segundo": meses jul..dez
 * Usa o ano fornecido no parâmetro (ou poderia usar new Date().getFullYear()).
 */
export function gerarPresencasParaAlunoSemestre(
  diaDaSemana: string,
  semestre: "primeiro" | "segundo",
  ano: number
): Presencas {
  const diaDaSemana: diaDaSemanaMap = {
    SEGUNDA: 1,
    TERÇA: 2,
    QUARTA: 3,
    QUINTA: 4,
    SEXTA: 5,
    SÁBADO: 6,
    DOMINGO: 0,
  };

  let presencasSemestre: Presencas = {};

  // Ajuste conforme desejar (ex.: "Janeiro" etc.)
  const mesesPrimeiroSemestre = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
  ];
  const mesesSegundoSemestre = [
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];
  const meses =
    semestre === "primeiro" ? mesesPrimeiroSemestre : mesesSegundoSemestre;

  meses.forEach((nomeMes, index) => {
    presencasSemestre[nomeMes] = {};
    // Ex.: no primeiro semestre, mesIndex = 1..6
    // no segundo, mesIndex = 7..12
    const mesIndex = semestre === "primeiro" ? index + 1 : index + 7;

    const dias = gerarDiasDoMesSemestre(
      ano,
      mesIndex,
      diaDaSemana[diaDaSemana.toUpperCase()]
    );
    dias.forEach((data) => {
      presencasSemestre[nomeMes][data] = true;
    });
  });

  return presencasSemestre;
}

/**
 * Gera datas (dd-mm-aaaa) para um mês específico (1..12), ano e diaDaSemana,
 * no contexto "semestre". Semelhante a gerarDiasDoMes, porém com outro nome
 * para evitar conflitos.
 */
export function gerarDiasDoMesSemestre(
  ano: number,
  mes: number,
  diaDaSemana: number
): string[] {
  let datas: string[] = [];
  let data = new Date(ano, mes - 1, 1);

  // Ajusta até achar o primeiro diaDaSemana do mês
  while (data.getDay() !== diaDaSemana) {
    data.setDate(data.getDate() + 1);
  }

  // Avança de 7 em 7 dias até mudar de mês
  while (data.getMonth() === mes - 1) {
    const diaFormatado = `${data.getDate()}-${mes}-${ano}`;
    datas.push(diaFormatado);
    data.setDate(data.getDate() + 7);
  }

  return datas;
}




//----------------------------------------------------------------------------------------------

const resizeImage = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const elem = document.createElement('canvas');
          const scaleFactor = Math.min(512 / img.width, 768 / img.height);
          elem.width = img.width * scaleFactor;
          elem.height = img.height * scaleFactor;
          const ctx = elem.getContext('2d');
          ctx?.drawImage(img, 0, 0, img.width * scaleFactor, img.height * scaleFactor);
          const url = elem.toDataURL('image/jpeg', 1);
          resolve(url);
        };
      };
      reader.onerror = error => reject(error);
    });
  };
export default resizeImage


export const normalizeText = (text?: string | number | null) => {
  // Garante que o valor seja convertido para string antes de chamar .normalize()
  const safeText = String(text || ''); // Convertendo para string e lidando com undefined ou null
  return safeText.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};




// Função para validar se a data é válida
export const validateDate = (dateStr: string): boolean => {
  const [day, month, year] = dateStr.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
};

// Esquema para o campo anoNascimento com validação de formato e validade da data
export const anoNascimentoSchema = z.string()
  .regex(/^\d{2}\/\d{2}\/\d{4}$/, { message: "Preencha este campo no formato DD/MM/YYYY." })
  .refine(dateStr => validateDate(dateStr), { message: "Data de nascimento inválida." });



  // Função auxiliar para acessar de forma segura a mensagem de erro de campos aninhados
  export function getErrorMessage<FormValues extends FieldValues>(
    errors: FieldErrors<FormValues>,
    path: string
  ): string | undefined {
    const paths = path.split(".");
    let current: any = errors;

    for (const segment of paths) {
      if (current[segment] === undefined) {
        return undefined;
      }
      current = current[segment];
    }

    // Se chegamos a um objeto que contém a propriedade 'message', retornamos essa mensagem
    if (typeof current === "object" && "message" in current) {
      return current.message;
    }

    return undefined;
  }


  export function normalizeName(name:string) {
    return name.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }
  


  // { label: "Nome Completo do Aluno(a)", id: "aluno.nome" },
  //{ label: "Data de Nascimento do Aluno(a)", id: "aluno.anoNascimento" },