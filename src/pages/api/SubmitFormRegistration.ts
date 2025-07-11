import type { NextApiRequest, NextApiResponse } from "next";
import admin from "../../config/firebaseAdmin";

// Importe a função que gera presenças de acordo com o semestre
import { gerarPresencasSemestre } from "@/utils/Constants";
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

  const itensRecebidos = Array.isArray(req.body) ? req.body : [req.body];
  const resultados: any[] = [];

  for (const item of itensRecebidos) {
    const { turmaSelecionada, aluno, modalidade = "volei" } = item; // Definimos "volei" como padrão

    if (!turmaSelecionada) {
      resultados.push({ sucesso: false, erro: "Turma não informada.", aluno });
      continue;
    }

    try {
      const turmaRef = db
        .ref(`modalidades/${modalidade}/turmas`)
        .orderByChild("nome_da_turma")
        .equalTo(turmaSelecionada);

      const snapshot = await turmaRef.once("value");
      if (!snapshot.exists()) {
        resultados.push({ sucesso: false, erro: "Turma não encontrada", aluno });
        continue;
      }

      const turmaData = snapshot.val();
      const turmaKey = Object.keys(turmaData)[0];
      const turmaEncontrada = turmaData[turmaKey];

      if (
        turmaEncontrada.capacidade_atual_da_turma >=
        turmaEncontrada.capacidade_maxima_da_turma
      ) {
        resultados.push({ sucesso: false, erro: `Não há vagas na turma ${turmaEncontrada.nome_da_turma}.`, aluno });
        continue;
      }
      
      const alunosRef = db.ref(`modalidades/${modalidade}/turmas/${turmaKey}/alunos`);
      const alunosSnapshot = await alunosRef.once("value");
      const alunosExistentes = alunosSnapshot.val() || [];
      const nomeAlunoNormalizado = aluno.nome.trim().toLowerCase();
      
      const duplicado = Object.values(alunosExistentes).some(
        (alunoExistente: any) =>
          alunoExistente && alunoExistente.nome && alunoExistente.nome.trim().toLowerCase() === nomeAlunoNormalizado
      );

      if (duplicado) {
        resultados.push({ sucesso: false, erro: `Aluno já cadastrado na turma ${turmaEncontrada.nome_da_turma}.`, aluno });
        continue;
      }

      // 2. LÓGICA ATUALIZADA: Usamos a nova função de forma direta.
      const diasDaTurma = turmaEncontrada.diaDaSemana;

      if (!Array.isArray(diasDaTurma) || diasDaTurma.length === 0) {
        throw new Error(`A turma ${turmaEncontrada.nome_da_turma} não possui dias da semana válidos definidos.`);
      }

      const currentDate = new Date();
      const anoAtual = currentDate.getFullYear();
      const semestreAtual = currentDate.getMonth() < 6 ? 'primeiro' : 'segundo';
      
      // Chamamos a função UMA VEZ, passando o array completo de dias.
      const presencasGeradas = gerarPresencasSemestre(
        diasDaTurma,
        semestreAtual,
        anoAtual
      );

      // 3. Atribuímos os dados gerados ao aluno
      aluno.presencas = presencasGeradas;
      aluno.dataMatricula = currentDate.toLocaleDateString("pt-BR");
      
      if (!aluno.informacoesAdicionais) {
        aluno.informacoesAdicionais = {};
      }
      aluno.informacoesAdicionais.IdentificadorUnico = uuidv4();
      
      // Lógica para obter o novo ID do aluno de forma segura
      const novoIndex = alunosExistentes.length;
      aluno.id = novoIndex; // IDs em arrays são baseados no índice

      // Salva o novo aluno no final do array de alunos da turma
      await alunosRef.child(String(novoIndex)).set(aluno);

      // Atualiza os contadores da turma
      await db.ref(`modalidades/${modalidade}/turmas/${turmaKey}`).update({
        capacidade_atual_da_turma: turmaEncontrada.capacidade_atual_da_turma + 1,
        contadorAlunos: (turmaEncontrada.contadorAlunos || 0) + 1,
      });

      resultados.push({ sucesso: true, aluno });

    } catch (erro: any) {
      console.error("Erro ao processar aluno:", erro);
      resultados.push({ sucesso: false, erro: erro.message, aluno });
    }
  }

  return res.status(200).json({ resultados });
}