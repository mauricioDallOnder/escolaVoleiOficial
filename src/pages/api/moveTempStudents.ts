import type { NextApiRequest, NextApiResponse } from 'next';
import admin from '../../config/firebaseAdmin';
import { Aluno } from '@/interface/interfaces';
import { v4 as uuidv4 } from 'uuid';

const db = admin.database();
// Definindo a modalidade fixa (ajuste conforme necessário)
const modalidadeDefault = "default";

async function atualizarTurma(
  nomeTurma: string,
  aluno: Aluno | null,
  incremento: number
) {
  const turmaRef = db
    .ref(`modalidades/${modalidadeDefault}/turmas`)
    .orderByChild('nome_da_turma')
    .equalTo(nomeTurma);
  const snapshot = await turmaRef.once('value');

  if (snapshot.exists()) {
    const turmaData = snapshot.val();
    const turmaKey = Object.keys(turmaData)[0];
    const turma = turmaData[turmaKey];

    if (incremento > 0 && aluno !== null) {
      // Adiciona aluno
      const novoIdAluno = turma.contadorAlunos ? turma.contadorAlunos + 1 : 1;
      aluno.id = novoIdAluno;
      turma.alunos = turma.alunos || {};
      turma.alunos[novoIdAluno] = aluno;
      aluno.informacoesAdicionais.IdentificadorUnico = uuidv4();
    }

    await db.ref(`modalidades/${modalidadeDefault}/turmas/${turmaKey}`).update({
      alunos: turma.alunos,
      contadorAlunos: turma.contadorAlunos ? turma.contadorAlunos + incremento : 1,
      capacidade_atual_da_turma: turma.capacidade_atual_da_turma + incremento,
    });
  }
}

async function encontrarEremoverAluno(
  nomeDaTurma: string,
  alunoNome: string
): Promise<Aluno | null> {
  const turmaRef = db
    .ref(`modalidades/${modalidadeDefault}/turmas`)
    .orderByChild('nome_da_turma')
    .equalTo(nomeDaTurma);
  const snapshot = await turmaRef.once('value');

  if (snapshot.exists()) {
    const turmaData = snapshot.val();
    const turmaKey = Object.keys(turmaData)[0];
    const turma = turmaData[turmaKey];

    for (const [id, alunoObject] of Object.entries(turma.alunos || {})) {
      const aluno = alunoObject as Aluno;
      if (aluno.nome === alunoNome) {
        delete turma.alunos[id];
        await db
          .ref(`modalidades/${modalidadeDefault}/turmas/${turmaKey}/alunos`)
          .set(turma.alunos || {});
        return { ...aluno, id: parseInt(id) };
      }
    }
  }
  return null;
}

export default async function moveStudent(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  // Novo payload: somente alunoNome, nomeDaTurmaOrigem e nomeDaTurmaDestino
  const { alunoNome, nomeDaTurmaOrigem, nomeDaTurmaDestino } = req.body;
  if (!alunoNome || !nomeDaTurmaOrigem || !nomeDaTurmaDestino) {
    return res.status(400).json({
      error: `Campos inválidos: ${alunoNome}, ${nomeDaTurmaOrigem}, ${nomeDaTurmaDestino}`,
    });
  }

  try {
    console.log(req.body);
    const alunoDados = await encontrarEremoverAluno(
      nomeDaTurmaOrigem,
      alunoNome
    );

    if (alunoDados) {
      // Adiciona o aluno na turma de destino
      await atualizarTurma(nomeDaTurmaDestino, alunoDados, 1);
      // Remove o aluno da turma de origem (atualiza os contadores)
      await atualizarTurma(nomeDaTurmaOrigem, null, -1);
      return res.status(200).json({ message: 'Aluno movido com sucesso!' });
    } else {
      return res
        .status(404)
        .json({ error: 'Aluno não encontrado na turma de origem' });
    }
  } catch (error: any) {
    console.error('Erro ao mover aluno', error);
    return res.status(500).json({
      error: 'Erro ao mover aluno',
      details: error.message,
    });
  }
}
