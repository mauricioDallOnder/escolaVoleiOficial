import type { NextApiRequest, NextApiResponse } from "next";
import admin from "../../config/firebaseAdmin";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
// 1. IMPORTAÇÃO ATUALIZADA: Trocamos a função antiga pela nova.
import { gerarPresencasSemestre } from "@/utils/Constants";
import { Turma } from "@/interface/interfaces";

const database = admin.database();

const createTurmaSchema = z.object({
  categoria: z.string().min(1),
  diaDaSemana: z.array(z.string()).nonempty(),
  horario: z.string().min(1),
  capacidade_maxima_da_turma: z.number().min(1),
});

const updateTurmaSchema = z.object({
  uuidTurma: z.string().uuid(),
  nome_da_turma: z.string().min(1),
  capacidade_maxima_da_turma: z.number().min(1),
  categoria: z.string().min(1),
  diaDaSemana: z.array(z.string()).optional(),
  horario: z.string().optional(),
  modalidade: z.string().min(1),
});

const deleteTurmaSchema = z.object({
  modalidade: z.string().min(1),
  uuidTurma: z.string().uuid(),
});

export default async function handleTurmasApi(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case "POST":
        return await handlePost(req, res);
      case "PUT":
        return await handlePut(req, res);
      case "DELETE":
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

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { categoria, diaDaSemana, horario, capacidade_maxima_da_turma } =
      createTurmaSchema.parse(req.body);

    const safeCat = categoria.replace(/\s+/g, "_");
    const safeDias = diaDaSemana.map((d) => d.replace(/\s+/g, "_").toUpperCase());
    const safeHora = horario.replace(/\s+/g, "_");
    const nomeDaTurma = `${safeCat}_${safeDias.join("_")}_${safeHora}`;

    // 2. LÓGICA ATUALIZADA: Determinamos o ano e semestre atuais.
    const currentDate = new Date();
    const anoAtual = currentDate.getFullYear();
    const semestreAtual = currentDate.getMonth() < 6 ? 'primeiro' : 'segundo';
    
    // 3. GERAÇÃO DE PRESENÇAS ATUALIZADA: Usamos a nova função.
    const presencasGeradas = gerarPresencasSemestre(safeDias, semestreAtual, anoAtual);

    // O aluno de teste agora também recebe presenças geradas corretamente.
    const alunoTeste = {
      id: 1,
      alunoId: "1",
      nome: "Aluno Teste",
      anoNascimento: "2000-01-01",
      dataMatricula: new Date().toLocaleDateString(),
      telefoneComWhatsapp: "00000000000",
      presencas: presencasGeradas,
      informacoesAdicionais: {
        IdentificadorUnico: uuidv4(),
        Nome__do_responsavel: "Teste",
        data_de_nascimento_responsavel: "2000-01-01",
        documento_do_responsavel: "00000000000",
        email_do_responsavel: "teste@teste.com",
        endereco: "Teste",
        bairro: "Teste",
        cep: "00000-000",
        complemento: "",
        numero_endereço: "0",
        plano_de_saude: "Nenhum",
        Possui_alergia: "Não",
        nome_contato_emergencia: "Teste",
        telefone_contato_emergencia: "00000000000",
        primeiro_telefone_do_responsavel: "00000000000",
        segundo_telefone_do_responsavel: "",
        telefone_comercial_do_responsavel: "",
        local_de_trabalho_do_responsavel: "Teste",
        funcao_do_responsavel: "Teste",
        uniforme_do_aluno: "P",
        uniforme: "P",
        hasUniforme: false,
      },
      foto: "",
    };

    const modalidade = "volei";
    const turmasRef = database.ref(`modalidades/${modalidade}/turmas`);
    const snap = await turmasRef.once("value");
    const turmasExistentes: Turma[] = snap.val() || [];
    const newIndex = Array.isArray(turmasExistentes) ? turmasExistentes.length : 0;

    const novaTurma = {
      nome_da_turma: nomeDaTurma,
      uuidTurma: uuidv4(),
      categoria: safeCat,
      diaDaSemana: safeDias,
      horario: safeHora,
      capacidade_maxima_da_turma,
      capacidade_atual_da_turma: 1,
      contadorAlunos: 1,
      alunos: [alunoTeste],
    };

    await turmasRef.child(String(newIndex)).set(novaTurma);
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

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  // A lógica de PUT não precisa de alterações, pois não mexe com presenças.
  try {
    const { uuidTurma, nome_da_turma, capacidade_maxima_da_turma, categoria, diaDaSemana, horario, modalidade } = updateTurmaSchema.parse(req.body);

    const refBuscada = database.ref(`modalidades/${modalidade}/turmas`).orderByChild("uuidTurma").equalTo(uuidTurma);
    const snap = await refBuscada.once("value");

    if (!snap.exists()) {
      return res.status(404).json({ message: "Turma não encontrada para esse uuidTurma." });
    }

    const turmaKey = Object.keys(snap.val())[0];
    const safeCat = categoria.replace(/\s+/g, "_");
    const safeNome = nome_da_turma.replace(/\s+/g, "_");

    const atualizacoes: any = {
      nome_da_turma: safeNome,
      capacidade_maxima_da_turma,
      categoria: safeCat,
    };
    if (diaDaSemana && Array.isArray(diaDaSemana)) {
      atualizacoes.diaDaSemana = diaDaSemana.map((d) => d.replace(/\s+/g, "_").toUpperCase());
    }
    if (horario) {
      atualizacoes.horario = horario.replace(/\s+/g, "_");
    }

    await database.ref(`modalidades/${modalidade}/turmas/${turmaKey}`).update(atualizacoes);
    return res.status(200).json({ message: "Turma atualizada com sucesso", atualizado: atualizacoes });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
    }
    console.error("Erro ao atualizar turma:", error);
    return res.status(500).json({ message: "Erro no servidor" });
  }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  // A lógica de DELETE também permanece a mesma.
  try {
    const { uuidTurma, modalidade } = deleteTurmaSchema.parse(req.body);

    const turmasRef = database.ref(`modalidades/${modalidade}/turmas`);
    const snap = await turmasRef.once("value");

    if (!snap.exists()) {
      return res.status(404).json({ message: "Nenhuma turma encontrada" });
    }

    const turmasData: (Turma | null)[] = snap.val();
    const novoArray = turmasData.filter((turma) => turma && turma.uuidTurma !== uuidTurma);

    await turmasRef.set(novoArray);
    return res.status(200).json({ message: "Turma excluída com sucesso" });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
    }
    console.error("Erro ao remover turma:", error);
    return res.status(500).json({ message: "Erro no servidor" });
  }
}