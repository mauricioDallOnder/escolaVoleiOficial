import type { NextApiRequest, NextApiResponse } from "next";
import admin from "../../config/firebaseAdmin";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { gerarPresencasParaVariosDias } from "@/utils/Constants"; // Importe do arquivo onde está a função

// Inicializa o Database do Firebase
const database = admin.database();

/**
 * Schemas de validação Zod
 * - Um para criar turma (POST)
 * - Outro para atualizar turma (PUT)
 * - Outro para deletar turma (DELETE)
 */
const createTurmaSchema = z.object({
  categoria: z.string().min(1),
  diaDaSemana: z.array(z.string()).nonempty(),
  horario: z.string().min(1),
  capacidade_maxima_da_turma: z.number().min(1),
});


const updateTurmaSchema = z.object({
  uuidTurma: z.string().uuid({ message: "O uuidTurma deve ser um UUID válido." }),
  nome_da_turma: z.string().min(1, { message: "O nome da turma é obrigatório." }),
  capacidade_maxima_da_turma: z.number().min(1, { message: "A capacidade máxima deve ser pelo menos 1." }),
  categoria: z.string().min(1, { message: "A categoria é obrigatória." }),

  // Se quiser atualizar também os dias da semana e horário, inclua aqui
  diaDaSemana: z.array(z.string()).optional(),
  horario: z.string().optional(),

  // Neste exemplo, vou supor que a modalidade é sempre "volei" ou "default"
  modalidade: z.string().min(1),
});

const deleteTurmaSchema = z.object({
  modalidade: z.string().min(1, { message: "A modalidade é obrigatória." }),
  uuidTurma: z.string().uuid({ message: "O uuidTurma deve ser um UUID válido." }),
});

/**
 * Rota principal: /api/HandleNewTurmas
 * Redireciona para handlePost, handlePut e handleDelete
 */
export default async function handleTurmasApi(
  request: NextApiRequest,
  response: NextApiResponse
) {
  try {
    switch (request.method) {
      case "POST":
        return await handlePost(request, response);
      case "PUT":
        return await handlePut(request, response);
      case "DELETE":
        return await handleDelete(request, response);
      default:
        response.setHeader("Allow", ["POST", "PUT", "DELETE"]);
        return response.status(405).end("Method Not Allowed");
    }
  } catch (error) {
    console.error("Erro no handler principal de turmas:", error);
    return response.status(500).json({ message: "Erro no servidor" });
  }
}

/**
 * Cria uma nova turma (POST)
 * Agora aceita vários dias da semana em 'diaDaSemana: string[]'.
 */
async function handlePost(request: NextApiRequest, response: NextApiResponse) {
  try {
    // Valida o corpo com Zod
    const { categoria, diaDaSemana, horario, capacidade_maxima_da_turma } =
      createTurmaSchema.parse(request.body);

    // Monte o nome da turma. Exemplo:
    // "Mirim Imigrante_SEGUNDA_QUARTA_SEXTA_18h"
    const nomeDaTurma = `${categoria}_${diaDaSemana.join("_")}_${horario}`;

    // Gere o objeto de presenças para esses múltiplos dias
    const presencasGeradas = gerarPresencasParaVariosDias(diaDaSemana);

    // Exemplo: podemos criar um "aluno de teste" só para demonstrar.
    // Se não quiser, remova.
    const alunoTeste = {
      id: 1,
      nome: "Teste",
      anoNascimento: "2000-01-01",
      dataMatricula: new Date().toLocaleDateString(),
      telefoneComWhatsapp: "00000000000",
      presencas: presencasGeradas,
      informacoesAdicionais: {
        Nome__do_responsavel: "Teste",
        data_de_nascimento_responsavel: "2000-01-01",
        documento_do_responsavel: "00000000000",
        email_do_responsavel: "teste@teste.com",
        endereco: "Teste",
        bairro: "Teste",
        cep: "00000000",
        complemento: "",
        numero_endereço: "0",
        plano_de_saude: "Nenhum",
        Possui_alergia: "Não",
        nome_contato_emergencia: "Teste",
        telefone_contato_emergencia: "00000000000",
        primeiro_telefone_do_responsavel: "00000000000",
        segundo_telefone_do_responsavel: "00000000000",
        telefone_comercial_do_responsavel: "00000000000",
        local_de_trabalho_do_responsavel: "Teste",
        funcao_do_responsavel: "Teste",
        uniforme_do_aluno: "P",
        IdentificadorUnico: uuidv4(),
        hasUniforme: false,
      },
    };

    // Define a modalidade, caso seja fixa. Exemplo: "volei" ou "default".
    const modalidade = "volei";

    // Referência no Realtime Database
    const turmasReference = database.ref(`modalidades/${modalidade}/turmas`);
    const snapshot = await turmasReference.once("value");
    const novoIndice = snapshot.exists() ? snapshot.numChildren() : 0;

    const uuidTurma = uuidv4();

    // Objeto da nova turma
    const novaTurma = {
      nome_da_turma: nomeDaTurma,
      uuidTurma: uuidTurma,
      categoria: categoria,
      diaDaSemana: diaDaSemana, // array
      horario: horario,
      capacidade_maxima_da_turma: capacidade_maxima_da_turma,
      capacidade_atual_da_turma: 1, // começa com 1 se já tiver um aluno
      contadorAlunos: 1,
      alunos: [alunoTeste],
    };

    // Grava no DB em um novo índice
    await turmasReference.child(String(novoIndice)).set(novaTurma);

    return response.status(201).json({
      message: "Turma criada com sucesso",
      turma: novaTurma,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return response
        .status(400)
        .json({ message: "Dados inválidos", errors: error.errors });
    }
    console.error("Erro ao criar turma:", error);
    return response.status(500).json({ message: "Erro no servidor" });
  }
}

/**
 * Atualiza uma turma existente (PUT).
 * Exemplo de corpo esperado:
 * {
 *   uuidTurma: "...",
 *   nome_da_turma: "Infanto Imigrante_SEGUNDA_SEXTA_18h",
 *   capacidade_maxima_da_turma: 50,
 *   categoria: "Infanto Imigrante",
 *   diaDaSemana: ["SEGUNDA","SEXTA"], // se quiser atualizar
 *   horario: "18h", // se quiser atualizar
 *   modalidade: "volei"
 * }
 */
async function handlePut(request: NextApiRequest, response: NextApiResponse) {
  try {
    const {
      uuidTurma,
      nome_da_turma,
      capacidade_maxima_da_turma,
      categoria,
      diaDaSemana,
      horario,
      modalidade,
    } = updateTurmaSchema.parse(request.body);

    // Localiza a turma pelo uuidTurma
    const turmasReference = database
      .ref(`modalidades/${modalidade}/turmas`)
      .orderByChild("uuidTurma")
      .equalTo(uuidTurma);
    const snapshot = await turmasReference.once("value");

    if (!snapshot.exists()) {
      return response
        .status(404)
        .json({ message: "Turma não encontrada para esse uuidTurma." });
    }

    // Pega a chave do item dentro do array ou objeto
    const turmaKey = Object.keys(snapshot.val())[0];
    const turmaAntiga = snapshot.val()[turmaKey];

    // Atualiza os campos desejados
    const atualizacoes: any = {
      nome_da_turma,
      capacidade_maxima_da_turma,
      categoria,
    };

    // Se "diaDaSemana" foi informado, atualizamos
    if (diaDaSemana && Array.isArray(diaDaSemana)) {
      atualizacoes.diaDaSemana = diaDaSemana;
    }

    // Se "horario" foi informado, atualizamos
    if (horario) {
      atualizacoes.horario = horario;
    }

    // Faz o update
    await database
      .ref(`modalidades/${modalidade}/turmas/${turmaKey}`)
      .update(atualizacoes);

    // Se você quiser regenerar as presenças dos alunos, precisaria de lógica adicional aqui:
    // - Buscar cada aluno
    // - Regenerar presencas com gerarPresencasParaVariosDias(diaDaSemana)
    // - Atualizar DB. (Opcional, depende da sua regra de negócio)

    return response.status(200).json({
      message: "Turma atualizada com sucesso",
      atualizado: atualizacoes,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return response
        .status(400)
        .json({ message: "Dados inválidos", errors: error.errors });
    }
    console.error("Erro ao atualizar turma:", error);
    return response.status(500).json({ message: "Erro no servidor" });
  }
}

/**
 * Exclui uma turma existente (DELETE).
 * Corpo esperado:
 * {
 *   uuidTurma: "...",
 *   modalidade: "volei"
 * }
 */
async function handleDelete(request: NextApiRequest, response: NextApiResponse) {
  try {
    const { uuidTurma, modalidade } = deleteTurmaSchema.parse(request.body);

    const turmasReference = database.ref(`modalidades/${modalidade}/turmas`);
    const snapshot = await turmasReference.once("value");
    if (!snapshot.exists()) {
      return response.status(404).json({
        message: "Nenhuma turma encontrada para esta modalidade",
      });
    }

    const turmasData = snapshot.val();
    // Transforma em array ou pega a lista (dependendo de como está salvo)
    const arrayDeTurmas = Array.isArray(turmasData)
      ? turmasData
      : Object.values(turmasData);

    // Filtra removendo a turma que tem o uuid
    const novoArrayDeTurmas = arrayDeTurmas.filter((turma: any) => {
      if (!turma) return false;
      return turma.uuidTurma !== uuidTurma;
    });

    // Define novamente no DB
    await turmasReference.set(novoArrayDeTurmas);

    return response.status(200).json({ message: "Turma excluída com sucesso" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return response
        .status(400)
        .json({ message: "Dados inválidos", errors: error.errors });
    }
    console.error("Erro ao remover turma:", error);
    return response.status(500).json({ message: "Erro no servidor" });
  }
}
