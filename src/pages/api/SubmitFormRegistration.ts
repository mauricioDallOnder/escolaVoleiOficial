import type { NextApiRequest, NextApiResponse } from "next";
import admin from "../../config/firebaseAdmin";

// Importe a função que gera presenças de acordo com o semestre
import { gerarPresencasParaAlunoSemestre } from "@/utils/Constants";
import { v4 as uuidv4 } from "uuid";

const db = admin.database();

/**
 * Função para unir (merge) dois objetos de presenças em um só.
 * Se um mês ou dia não existe em 'base', adicionamos de 'other'.
 */
function mesclarPresencas(
  base: Record<string, Record<string, boolean>>,
  other: Record<string, Record<string, boolean>>
): Record<string, Record<string, boolean>> {
  for (const nomeMes of Object.keys(other)) {
    if (!base[nomeMes]) {
      base[nomeMes] = {};
    }
    for (const dataStr of Object.keys(other[nomeMes])) {
      base[nomeMes][dataStr] = other[nomeMes][dataStr];
    }
  }
  return base;
}

/**
 * Rota de cadastro de aluno em uma turma:
 *  1. Busca a turma pelo nome_da_turma.
 *  2. Verifica se há vagas e se o aluno já existe.
 *  3. Gera presenças para o SEMESTRE ATUAL (com base no mês do sistema) para TODOS os dias da semana da turma.
 *  4. Mescla presenças de cada dia em um objeto final (se a turma tiver vários dias).
 *  5. Salva o aluno no DB e atualiza a capacidade da turma.
 */
export default async function submitForm(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  // Pode chegar 1 objeto ou um array de objetos
  const itensRecebidos = Array.isArray(req.body) ? req.body : [req.body];
  const resultados: any[] = [];

  for (const item of itensRecebidos) {
    const { turmaSelecionada, aluno } = item;
    const modalidade = "volei"; // fixo ou conforme sua lógica

    if (!turmaSelecionada) {
      resultados.push({
        sucesso: false,
        erro: "Turma não informada.",
        aluno,
      });
      continue;
    }

    try {
      // 1) Localiza a turma "nome_da_turma = turmaSelecionada"
      const turmaRef = db
        .ref(`modalidades/${modalidade}/turmas`)
        .orderByChild("nome_da_turma")
        .equalTo(turmaSelecionada);

      const snapshot = await turmaRef.once("value");
      if (!snapshot.exists()) {
        resultados.push({
          sucesso: false,
          erro: "Turma não encontrada",
          aluno,
        });
        continue;
      }

      const turmaData = snapshot.val();
      const turmaKey = Object.keys(turmaData)[0];
      const turmaEncontrada = turmaData[turmaKey];

      // 2) Verifica capacidade
      if (
        turmaEncontrada.capacidade_atual_da_turma >=
        turmaEncontrada.capacidade_maxima_da_turma
      ) {
        resultados.push({
          sucesso: false,
          erro: `Não há vagas disponíveis na turma ${turmaEncontrada.nome_da_turma}.`,
          aluno,
        });
        continue;
      }

      // 3) Verifica duplicidade de aluno (pelo nome normalizado)
      const alunosSnapshot = await db
        .ref(`modalidades/${modalidade}/turmas/${turmaKey}/alunos`)
        .once("value");
      const alunosExistentes = alunosSnapshot.val() || {};
      const nomeAlunoNormalizado = aluno.nome.trim().toLowerCase();

      const duplicado = Object.values(alunosExistentes).some(
        (alunoExistente: any) =>
          alunoExistente.nome.trim().toLowerCase() === nomeAlunoNormalizado
      );
      if (duplicado) {
        resultados.push({
          sucesso: false,
          erro: `Aluno já cadastrado na turma ${turmaEncontrada.nome_da_turma}.`,
          aluno,
        });
        continue;
      }

      // 4) Gera presenças para cada dia da semana
      const diasDaTurma = Array.isArray(turmaEncontrada.diaDaSemana)
        ? turmaEncontrada.diaDaSemana
        : [turmaEncontrada.diaDaSemana]; // fallback

      // Checa se "diasDaTurma" é pelo menos um array com strings válidas
      if (!diasDaTurma || diasDaTurma.length === 0) {
        throw new Error(
          `A turma ${turmaEncontrada.nome_da_turma} não possui diaDaSemana válidos.`
        );
      }

      // Determina o semestre com base no mês atual
      const mesAtual = new Date().getMonth() + 1; // 1..12
      const semestreDetectado = mesAtual < 7 ? "primeiro" : "segundo";
      const anoAtual = new Date().getFullYear();

      // Objeto final de presenças
      let presencasFinais: Record<string, Record<string, boolean>> = {};

      // Array de dias válidos para .toUpperCase():
      const diasValidos = [
        "SEGUNDA",
        "TERÇA",
        "QUARTA",
        "QUINTA",
        "SEXTA",
        "SÁBADO",
        "DOMINGO",
      ];

      for (const diaSemana of diasDaTurma) {
        // Verifica se "diaSemana" é string
        if (typeof diaSemana !== "string") {
          throw new Error(
            `diaSemana inválido na turma: ${JSON.stringify(diaSemana)}`
          );
        }
        // Verifica se é um dos dias válidos
        if (!diasValidos.includes(diaSemana.toUpperCase())) {
          throw new Error(
            `Dia da semana inválido: "${diaSemana}". Esperava algo como SEGUNDA, TERÇA, etc.`
          );
        }

        // Gera presenças para esse dia
        const presencasUmDia = gerarPresencasParaAlunoSemestre(
          diaSemana.toUpperCase(),
          semestreDetectado,
          anoAtual
        );

        // Mesclamos
        presencasFinais = mesclarPresencas(presencasFinais, presencasUmDia);
      }

      // 5) Atribui no aluno
      aluno.presencas = presencasFinais;
      aluno.dataMatricula = new Date().toLocaleDateString("pt-BR");

      if (!aluno.informacoesAdicionais) {
        aluno.informacoesAdicionais = {};
      }
      aluno.informacoesAdicionais.IdentificadorUnico = uuidv4();

      // 6) Gera ID incremental
      const novoIdAluno = Object.keys(alunosExistentes).length + 1;
      aluno.id = novoIdAluno;

      // 7) Salva no DB
      await db
        .ref(
          `modalidades/${modalidade}/turmas/${turmaKey}/alunos/${novoIdAluno}`
        )
        .set(aluno);

      // 8) Atualiza contadores da turma
      await db.ref(`modalidades/${modalidade}/turmas/${turmaKey}`).update({
        capacidade_atual_da_turma:
          turmaEncontrada.capacidade_atual_da_turma + 1,
        contadorAlunos: novoIdAluno,
      });

      // 9) Sucesso
      resultados.push({ sucesso: true, aluno });
    } catch (erro: any) {
      resultados.push({ sucesso: false, erro: erro.message, aluno });
    }
  }

  return res.status(200).json({ resultados });
}
