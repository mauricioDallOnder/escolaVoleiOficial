import type { NextApiRequest, NextApiResponse } from 'next';
import admin from '../../config/firebaseAdmin';
import { Aluno } from '@/interface/interfaces';
import { v4 as uuidv4 } from 'uuid';

const db = admin.database();
// Como existe apenas uma modalidade, definimos uma constante para ela
const modalidadeDefault = "default"; // Ajuste esse valor conforme sua estrutura

async function atualizarTurma(modalidade: string, nomeTurma: string, aluno: Aluno | null, incremento: number) {
  const turmaRef = db.ref(`modalidades/volei/turmas`)
    .orderByChild('nome_da_turma')
    .equalTo(nomeTurma);
  const snapshot = await turmaRef.once('value');
  if (snapshot.exists()) {
    const turmaData = snapshot.val();
    const turmaKey = Object.keys(turmaData)[0];
    const turma = turmaData[turmaKey];

    if (incremento > 0 && aluno !== null) { // Adiciona aluno
      const novoIdAluno = turma.contadorAlunos ? turma.contadorAlunos + 1 : 1;
      aluno.id = novoIdAluno;
      turma.alunos = turma.alunos || {};
      turma.alunos[novoIdAluno] = aluno;
      aluno.informacoesAdicionais.IdentificadorUnico = uuidv4();
    }

    await db.ref(`modalidades/${modalidade}/turmas/${turmaKey}`).update({
      alunos: turma.alunos,
      contadorAlunos: turma.contadorAlunos ? turma.contadorAlunos + incremento : 1,
      capacidade_atual_da_turma: turma.capacidade_atual_da_turma + incremento
    });
  }
}

export default async function copyStudent(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  // Novo payload: somente alunoNome, nomeDaTurmaOrigem e nomeDaTurmaDestino
  const { alunoNome, nomeDaTurmaOrigem, nomeDaTurmaDestino } = req.body;
  if (!alunoNome || !nomeDaTurmaOrigem || !nomeDaTurmaDestino) {
    return res.status(400).json({ error: `Campos inválidos: ${alunoNome}, ${nomeDaTurmaOrigem}, ${nomeDaTurmaDestino}` });
  }

  try {
    console.log(req.body);

    // Buscando o aluno na turma de origem usando a modalidade padrão
    const turmaRefOrigem = db.ref(`modalidades/${modalidadeDefault}/turmas`)
      .orderByChild('nome_da_turma')
      .equalTo(nomeDaTurmaOrigem);
    const snapshotOrigem = await turmaRefOrigem.once('value');
    let alunoDados: Aluno | null = null;

    if (snapshotOrigem.exists()) {
      const turmaDataOrigem = snapshotOrigem.val();
      const turmaKeyOrigem = Object.keys(turmaDataOrigem)[0];
      const turmaOrigem = turmaDataOrigem[turmaKeyOrigem];

      for (const [id, alunoObject] of Object.entries(turmaOrigem.alunos || {})) {
        const aluno = alunoObject as Aluno;
        if (aluno.nome === alunoNome) {
          alunoDados = { ...aluno, id: parseInt(id) };
          break;
        }
      }
    }

    if (alunoDados) {
      // Copiando o aluno para a nova turma usando a modalidade padrão
      await atualizarTurma(modalidadeDefault, nomeDaTurmaDestino, alunoDados, 1);
      return res.status(200).json({ message: 'Aluno copiado com sucesso!' });
    } else {
      return res.status(404).json({ error: 'Aluno não encontrado na turma de origem' });
    }
  } catch (error: any) {
    console.error('Erro ao copiar aluno', error);
    return res.status(500).json({ error: 'Erro ao copiar aluno', details: error.message });
  }
}
