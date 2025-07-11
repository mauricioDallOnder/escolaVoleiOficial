import type { NextApiRequest, NextApiResponse } from "next";
import admin from "../../config/firebaseAdmin";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { gerarPresencasParaSemestreVariosDias } from "@/utils/Constants";

const database = admin.database();

// Schema de criação - sem alterações
const createTurmaSchema = z.object({
  categoria: z.string().min(1),
  diaDaSemana: z.array(z.string()).nonempty(),
  horario: z.string().min(1),
  capacidade_maxima_da_turma: z.number().min(1),
});

// Schema de atualização - sem alterações
const updateTurmaSchema = z.object({
  uuidTurma: z.string().uuid({ message: "O uuidTurma deve ser um UUID válido." }),
  nome_da_turma: z.string().min(1),
  capacidade_maxima_da_turma: z.number().min(1),
  categoria: z.string().min(1),
  diaDaSemana: z.array(z.string()).optional(),
  horario: z.string().optional(),
  modalidade: z.string().min(1),
});

// Schema de exclusão - sem alterações
const deleteTurmaSchema = z.object({
  modalidade: z.string().min(1),
  uuidTurma: z.string().uuid(),
});


export default async function handleTurmasApi(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case "POST":
        return await handlePost(req, res);
      case "PUT":
        return await handlePut(req, res);
      case "DELETE":
        // MODIFICADO: Passando a requisição inteira para extrair o query param
        return await handleDelete(req, res);
      default:
        res.setHeader("Allow", ["POST", "PUT", "DELETE"]);
        return res.status(405).end("Method Not Allowed");
    }
  } catch (error) {
    console.error("Erro no handler principal de turmas:", error);
    return res.status(500).json({ message: "Erro no servidor" });
  }
}

// POST => cria turma
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { categoria, diaDaSemana, horario, capacidade_maxima_da_turma } =
      createTurmaSchema.parse(req.body);

    const safeCat = categoria.replace(/\s+/g, "_");
    const safeDias = diaDaSemana.map((d) => d.replace(/\s+/g, "_").toUpperCase());
    const safeHora = horario.replace(/\s+/g, "_");

    const nomeDaTurma = `${safeCat}_${safeDias.join("_")}_${safeHora}`;

    // Modalidade fixa: "volei"
    const modalidade = "volei";
    const turmasRef = database.ref(`modalidades/${modalidade}/turmas`);
    
    const uuidTurma = uuidv4();
    const novaTurma = {
      nome_da_turma: nomeDaTurma,
      uuidTurma,
      categoria: safeCat,
      diaDaSemana: diaDaSemana, // Salva os dias originais, sem formatação
      horario: horario, // Salva o horário original
      capacidade_maxima_da_turma,
      // MODIFICADO: Turma começa vazia
      capacidade_atual_da_turma: 0, 
      contadorAlunos: 0,
      alunos: [],
    };
    
    // Usa push() para gerar um ID único e seguro no Firebase, evitando problemas de índice
    await turmasRef.push(novaTurma);

    return res.status(201).json({
      message: "Turma criada com sucesso",
      turma: novaTurma,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
    }
    console.error("Erro ao criar turma:", error);
    return res.status(500).json({ message: "Erro no servidor" });
  }
}

// PUT => atualiza turma (sem grandes alterações, já era robusto)
async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      uuidTurma,
      nome_da_turma,
      capacidade_maxima_da_turma,
      categoria,
      diaDaSemana,
      horario,
      modalidade,
    } = updateTurmaSchema.parse(req.body);

    const turmasRef = database.ref(`modalidades/${modalidade}/turmas`);
    const snapshot = await turmasRef.orderByChild("uuidTurma").equalTo(uuidTurma).once("value");

    if (!snapshot.exists()) {
      return res.status(404).json({ message: "Turma não encontrada." });
    }

    const turmaKey = Object.keys(snapshot.val())[0];
    const turmaPath = `modalidades/${modalidade}/turmas/${turmaKey}`;
    
    await database.ref(turmaPath).update({
      nome_da_turma: nome_da_turma,
      capacidade_maxima_da_turma,
      categoria: categoria,
      diaDaSemana: diaDaSemana,
      horario: horario
    });

    return res.status(200).json({ message: "Turma atualizada com sucesso" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
    }
    console.error("Erro ao atualizar turma:", error);
    return res.status(500).json({ message: "Erro no servidor" });
  }
}

// DELETE => exclui turma
async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  try {
    // MODIFICADO: Extrai os dados do query string da URL
    const { uuidTurma, modalidade } = deleteTurmaSchema.parse(req.query);

    const turmasRef = database.ref(`modalidades/${modalidade}/turmas`);
    const snapshot = await turmasRef.orderByChild("uuidTurma").equalTo(uuidTurma).once("value");

    if (!snapshot.exists()) {
      return res.status(404).json({ message: "Turma não encontrada para exclusão." });
    }
    
    // MODIFICADO: Pega a chave da turma e a remove diretamente, sem reescrever o array
    const turmaKey = Object.keys(snapshot.val())[0];
    const turmaPath = `modalidades/${modalidade}/turmas/${turmaKey}`;

    await database.ref(turmaPath).remove();

    return res.status(200).json({ message: "Turma excluída com sucesso" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
    }
    console.error("Erro ao remover turma:", error);
    return res.status(500).json({ message: "Erro no servidor" });
  }
}