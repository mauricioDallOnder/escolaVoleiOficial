import type { NextApiRequest, NextApiResponse } from "next";
import admin from "../../config/firebaseAdmin";

// Importe suas funções. Exemplo:
//  - gerarPresencasParaAlunoSemestre(diaDaSemana, semestre, ano)
//  - se precisar de extrairDiaDaSemana, mesclarPresencas, etc. Ajuste os caminhos:
import {
  gerarPresencasParaAlunoSemestre,
  // extrairDiaDaSemana,  // só se for preciso
} from "@/utils/Constants";

const db = admin.database();

/**
 * Função utilitária para "mesclar" (fazer merge) de objetos de presenças
 * gerados para cada dia da semana.
 */
function mesclarPresencas(
  base: Record<string, Record<string, boolean>>,
  other: Record<string, Record<string, boolean>>
): Record<string, Record<string, boolean>> {
  for (const mes of Object.keys(other)) {
    if (!base[mes]) {
      base[mes] = {};
    }
    for (const dataStr of Object.keys(other[mes])) {
      base[mes][dataStr] = other[mes][dataStr];
    }
  }
  return base;
}

/**
 * Esta rota recebe via POST algo como:
 * {
 *   ano: 2025,
 *   semestre: "primeiro" | "segundo",
 *   modalidade: {
 *     nome: "volei",
 *     turmas: [...] // chunk de turmas
 *   }
 * }
 *
 * E para cada turma:
 * 1) Obtem a array `diaDaSemana` (ou fallback se for uma string).
 * 2) Gera as presenças do semestre para cada dia, mesclando.
 * 3) Atualiza todos os alunos dessa turma no Realtime Database,
 *    substituindo "presencas" anteriores.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  // Espera-se que o body contenha { ano, semestre, modalidade: { nome, turmas } }
  const { ano, semestre, modalidade } = req.body;

  if (!modalidade || !ano || !semestre) {
    return res
      .status(400)
      .json({ error: 'Dados incompletos. Exemplo de body: { ano, semestre, modalidade }' });
  }

  try {
    console.log("Processando modalidade:", modalidade.nome);

    // Percorre cada turma da modalidade
    for (const turma of modalidade.turmas) {
      console.log("Processando turma:", turma.nome_da_turma);

      // Se a turma tiver array "diaDaSemana", usamos ela;
      // se for apenas uma string "diaDaSemana", podemos fallback:
      let arrayDeDias: string[];
      if (Array.isArray(turma.diaDaSemana)) {
        arrayDeDias = turma.diaDaSemana;
      } else if (turma.diaDaSemana) {
        // Se mantiver a lógica antiga de extrair do nome, use extrairDiaDaSemana:
        // const diaExtraido = extrairDiaDaSemana(turma.nome_da_turma);
        // arrayDeDias = [diaExtraido];
        // Mas se "diaDaSemana" for direto, use:
        arrayDeDias = [turma.diaDaSemana];
      } else {
        console.error("Não há dias da semana definidos para a turma:", turma.nome_da_turma);
        continue;
      }

      // Gera presenças (true) para cada diaDaSemana e mescla num objeto final
      let novasPresencas: Record<string, Record<string, boolean>> = {};
      for (const diaDaSemana of arrayDeDias) {
        // Gera as presenças para o semestre e ano solicitados
        const presencasUmDia = gerarPresencasParaAlunoSemestre(
          diaDaSemana.toUpperCase(),
          semestre,
          ano
        );
        // Faz merge no objeto "novasPresencas"
        novasPresencas = mesclarPresencas(novasPresencas, presencasUmDia);
      }

      // Agora "novasPresencas" tem as datas de todos os dias da semana daquela turma

      // Busca a turma no Firebase
      const turmaSnapshot = await db
        .ref(`modalidades/${modalidade.nome}/turmas`)
        .orderByChild("nome_da_turma")
        .equalTo(turma.nome_da_turma)
        .once("value");

      const turmaData = turmaSnapshot.val();
      if (!turmaData) {
        console.error("Turma não encontrada no DB:", turma.nome_da_turma);
        continue;
      }

      const turmaKey = Object.keys(turmaData)[0];
      console.log("Turma encontrada com key:", turmaKey);

      // Obtém os alunos como objeto
      const alunosObj = turmaData[turmaKey].alunos || {};
      console.log("Chaves dos alunos:", Object.keys(alunosObj));

      // Atualiza cada aluno definindo "presencas" como "novasPresencas"
      for (const alunoKey of Object.keys(alunosObj)) {
        const aluno = alunosObj[alunoKey];
        if (!aluno) continue;

        console.log(
          "Atualizando presenças para o aluno:",
          aluno.nome,
          "Chave:",
          alunoKey
        );
        await db
          .ref(
            `modalidades/${modalidade.nome}/turmas/${turmaKey}/alunos/${alunoKey}`
          )
          .update({ presencas: novasPresencas });
      }
    }

    return res.status(200).json({ message: "Presenças atualizadas com sucesso!" });
  } catch (error: any) {
    console.error("Erro ao atualizar presenças:", error);
    return res
      .status(500)
      .json({ error: error.message || "Erro ao atualizar presenças" });
  }
}
