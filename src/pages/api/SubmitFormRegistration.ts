import type { NextApiRequest, NextApiResponse } from "next";
import admin from "../../config/firebaseAdmin";
import axios from "axios";
// Substitua "extrairDiaDaSemana" e "gerarPresencasParaAluno" pela nova função
// import { extrairDiaDaSemana, gerarPresencasParaAluno, normalizeName } from "@/utils/Constants";
import { normalizeName, gerarPresencasParaVariosDias } from "@/utils/Constants"; 
// ^ Se "normalizeName" for outra função sua. Ajuste conforme necessário.

import { v4 as uuidv4 } from "uuid";

const db = admin.database();

export default async function submitForm(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  // Pode chegar um array ou um único objeto
  const alunos = Array.isArray(req.body) ? req.body : [req.body];
  const resultados: any[] = [];

  for (const alunoData of alunos) {
    const { turmaSelecionada, aluno } = alunoData;
    const modalidade = "volei"; // Modalidade fixa

    if (!turmaSelecionada) {
      resultados.push({ sucesso: false, erro: "Turma não informada", aluno });
      continue;
    }

    try {
      // 1) Localiza a turma no DB
      //    Buscando pelo campo "nome_da_turma" igual a turmaSelecionada
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

      // 2) Pega os dados da turma (Key e conteúdo)
      const turmaData = snapshot.val();
      const turmaKey = Object.keys(turmaData)[0];
      const turma = turmaData[turmaKey];

      // Se a turma está cheia
      if (turma.capacidade_atual_da_turma >= turma.capacidade_maxima_da_turma) {
        resultados.push({
          sucesso: false,
          erro: `Não há vagas disponíveis na turma ${turma.nome_da_turma}.`,
          aluno,
        });
        continue;
      }

      // 3) Verifica se esse aluno já está cadastrado (nome normalizado)
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
          erro: "Aluno já cadastrado nesta turma.",
          aluno,
        });
        continue;
      }

      // 4) Gera as presenças para TODOS os dias da semana da turma
      //    Observando que "turma.diasDaSemana" deve ser um array, ex: ["SEGUNDA","QUARTA"]
      const diasTurma = Array.isArray(turma.diasDaSemana)
        ? turma.diasDaSemana
        : [turma.diaDaSemana]; // fallback se for string
      const presencasGeradas = gerarPresencasParaVariosDias(diasTurma);
      aluno.presencas = presencasGeradas;

      // 5) Define data de matrícula, foto e Identificador único
      aluno.dataMatricula = new Date().toLocaleDateString();
      if (!aluno.informacoesAdicionais) {
        aluno.informacoesAdicionais = {};
      }
      aluno.informacoesAdicionais.IdentificadorUnico = uuidv4();

      // 6) Gera um ID incremental
      const novoIdAluno = Object.keys(alunosExistentes).length + 1;
      aluno.id = novoIdAluno;

      // 7) Salva o aluno na turma
      await db
        .ref(`modalidades/${modalidade}/turmas/${turmaKey}/alunos/${novoIdAluno}`)
        .set(aluno);

      // 8) Atualiza capacidade_atual e contadorAlunos
      await db.ref(`modalidades/${modalidade}/turmas/${turmaKey}`).update({
        capacidade_atual_da_turma: turma.capacidade_atual_da_turma + 1,
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
