import type { NextApiRequest, NextApiResponse } from "next";
import admin from "../../config/firebaseAdmin";
import { gerarPresencasSemestre } from '@/utils/Constants';
import { Turma, Aluno } from "@/interface/interfaces";

// Aumenta o limite de tamanho do corpo do pedido para esta API específica.
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Aumenta o limite para 10MB (pode ajustar se necessário)
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  console.log("\n--- [TERMINAL LOG] API /api/TrocarSemestre RECEBEU UM PEDIDO ---");
  const { ano, semestre, modalidade } = req.body;

  // --- VALIDAÇÃO DETALHADA ---
  if (!ano) {
    console.error("### FALHA NA VALIDAÇÃO: O campo 'ano' está em falta.");
    return res.status(400).json({ message: "Dados inválidos: O campo 'ano' é obrigatório." });
  }
  if (!semestre) {
    console.error("### FALHA NA VALIDAÇÃO: O campo 'semestre' está em falta.");
    return res.status(400).json({ message: "Dados inválidos: O campo 'semestre' é obrigatório." });
  }
  if (!modalidade || !modalidade.id || !modalidade.turmas) {
    console.error("### FALHA NA VALIDAÇÃO: O objeto 'modalidade' está incompleto.");
    return res.status(400).json({ message: "Dados inválidos: O objeto 'modalidade' deve conter 'id' e 'turmas'." });
  }
  
  console.log("--- VALIDAÇÃO CONCLUÍDA COM SUCESSO. A processar os dados... ---");
  const modalidadeNome = modalidade.id;

  try {
    const db = admin.database();
    const turmasRef = db.ref(`modalidades/${modalidadeNome}/turmas`);
    const turmasSnapshot = await turmasRef.once('value');
    const turmasDoBanco: (Turma | null)[] = turmasSnapshot.val() || [];

    const updates: { [key: string]: any } = {};

    for (const turmaDoPayload of modalidade.turmas) {
      // Usamos findIndex para encontrar a posição da turma no array do banco de dados
      const turmaIndexNoBanco = turmasDoBanco.findIndex(
        (t) => t && t.uuidTurma === turmaDoPayload.uuidTurma
      );

      if (turmaIndexNoBanco === -1) {
        console.warn(`[TERMINAL LOG] Aviso: Turma com UUID ${turmaDoPayload.uuidTurma} não encontrada no DB. Esta turma será ignorada.`);
        continue;
      }

      const novasPresencas = gerarPresencasSemestre(turmaDoPayload.diaDaSemana, semestre, ano);

      if (turmaDoPayload.alunos && turmaDoPayload.alunos.length > 0) {
        turmaDoPayload.alunos.forEach((_aluno: Aluno, indexDoAluno: number) => {
          // Construímos o caminho exato para a propriedade 'presencas' de cada aluno
          const path = `/modalidades/${modalidadeNome}/turmas/${turmaIndexNoBanco}/alunos/${indexDoAluno}/presencas`;
          updates[path] = novasPresencas;
        });
      }
    }

    if (Object.keys(updates).length > 0) {
      console.log("[TERMINAL LOG] A preparar para atualizar o Firebase com os seguintes caminhos:", Object.keys(updates));
      await db.ref().update(updates);
      console.log("[TERMINAL LOG] Sucesso: O banco de dados foi atualizado.");
    } else {
      console.log("[TERMINAL LOG] Aviso: Nenhuma atualização foi preparada.");
    }

    res.status(200).json({ message: 'Operação de atualização de semestre concluída com sucesso!' });

  } catch (error) {
    console.error('[TERMINAL LOG] ERRO CRÍTICO no processamento da API:', error);
    res.status(500).json({ message: 'Erro interno do servidor.', error: (error as Error).message });
  }
}