import type { NextApiRequest, NextApiResponse } from "next";
import admin from "../../config/firebaseAdmin";

// Importe as funções que você tem em "constants" (ajuste o caminho se necessário).
// Aqui precisamos:
//  - gerarPresencasParaAlunoSemestre(diaDaSemana, semestre, ano)
//  - um tipo "Presencas" e se quiser "DiasDaSemanaMap"
//  - se tiver "normalizeName" ou outras, adapte.
import { gerarPresencasParaAlunoSemestre } from "@/utils/Constants";

import { v4 as uuidv4 } from "uuid";

// Inicializa o database do Firebase Admin
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
      // Se "nomeMes" não existe em "base", cria
      base[nomeMes] = {};
    }
    // Percorre cada data (ex.: "1-7-2025") em "other[nomeMes]"
    for (const dataStr of Object.keys(other[nomeMes])) {
      // Atribui no base
      base[nomeMes][dataStr] = other[nomeMes][dataStr];
    }
  }
  return base;
}

/**
 * Endpoint que cadastra um aluno em uma turma:
 *  1) Localiza a turma pelo "nome_da_turma".
 *  2) Verifica vagas e duplicidade.
 *  3) Gera presenças para o SEMESTRE ATUAL (com base no mês do sistema).
 *  4) Mescla as presenças de cada dia da semana (caso haja vários).
 *  5) Salva aluno no DB e atualiza contador.
 */
export default async function submitForm(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  // Pode chegar um array ou um único objeto no "req.body"
  const itensRecebidos = Array.isArray(req.body) ? req.body : [req.body];
  const resultados: any[] = [];

  for (const item of itensRecebidos) {
    const { turmaSelecionada, aluno } = item;

    // Modalidade fixa, ex.: "volei"
    const modalidade = "volei";

    // Se não foi informada a turma, erro.
    if (!turmaSelecionada) {
      resultados.push({
        sucesso: false,
        erro: "Turma não informada.",
        aluno,
      });
      continue;
    }

    try {
      // 1) Localiza a turma que tenha "nome_da_turma = turmaSelecionada"
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

      // Extrai a key e os dados da turma
      const turmaData = snapshot.val();
      const turmaKey = Object.keys(turmaData)[0];
      const turmaEncontrada = turmaData[turmaKey];

      // 2) Verifica se a turma está cheia
      if (
        turmaEncontrada.capacidade_atual_da_turma >=
        turmaEncontrada.capacidade_maxima_da_turma
      ) {
        resultados.push({
          sucesso: false,
          erro: `Não há vagas na turma ${turmaEncontrada.nome_da_turma}.`,
          aluno,
        });
        continue;
      }

      // 3) Verifica se o aluno já está cadastrado (nome normalizado)
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

      // 4) Gera presenças para cada dia da semana (array "turmaEncontrada.diasDaSemana").
      //    Se for string, converte para array de 1 dia.
      const diasDaTurma = Array.isArray(turmaEncontrada.diasDaSemana)
        ? turmaEncontrada.diasDaSemana
        : [turmaEncontrada.diaDaSemana]; // fallback

      // Detecta o semestre com base no mês atual
      const mesAtual = new Date().getMonth() + 1; // 1..12
     const semestreDetectado = mesAtual < 7 ? "primeiro" : "segundo";
    // const semestreDetectado = "segundo";
      const anoAtual = new Date().getFullYear();

      // Precisamos mesclar as presenças de cada dia. Iniciamos um objeto vazio.
      let presencasFinais: Record<string, Record<string, boolean>> = {};

      for (const diaSemana of diasDaTurma) {
        // Gera presenças para esse dia, nesse semestre e ano
        const presencasUmDia = gerarPresencasParaAlunoSemestre(
          diaSemana,          // ex.: "SEGUNDA"
          semestreDetectado,  // "primeiro" ou "segundo"
          anoAtual
        );

        // Mesclamos no objeto final
        presencasFinais = mesclarPresencas(presencasFinais, presencasUmDia);
      }

      // 5) Atribui no aluno
      aluno.presencas = presencasFinais;

      // Define data de matrícula e UUID
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
        .ref(`modalidades/${modalidade}/turmas/${turmaKey}/alunos/${novoIdAluno}`)
        .set(aluno);

      // 8) Atualiza contadores da turma
      await db.ref(`modalidades/${modalidade}/turmas/${turmaKey}`).update({
        capacidade_atual_da_turma:
          turmaEncontrada.capacidade_atual_da_turma + 1,
        contadorAlunos: novoIdAluno,
      });

      // 9) Sucesso: empurra no array de resultados
      resultados.push({ sucesso: true, aluno });
    } catch (erro: any) {
      resultados.push({ sucesso: false, erro: erro.message, aluno });
    }
  }

  return res.status(200).json({ resultados });
}
