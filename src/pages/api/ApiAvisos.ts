import type { NextApiRequest, NextApiResponse } from 'next';
import admin from '../../config/firebaseAdmin';

export default async function handleAvisos(req: NextApiRequest, res: NextApiResponse) {
  const { alunoNome, modalidade, nomeDaTurma } = req.body;

  const turmasRef = admin.database().ref(`modalidades/${modalidade}/turmas`);
  const snapshot = await turmasRef.once('value');
  const turmas = snapshot.val();

  if (!turmas) {
    return res.status(404).json({ error: 'Modalidade ou turmas não encontradas' });
  }

  let found = false;
  let alunoAvisoPath = '';

  // Iteração para encontrar a turma e o aluno especificado
  Object.keys(turmas).forEach(turmaKey => {
    const turma = turmas[turmaKey];
    if (turma.nome_da_turma.trim() === nomeDaTurma.trim()) {
      const alunos = turma.alunos || {};
      Object.keys(alunos).forEach(alunoKey => {
        const aluno = alunos[alunoKey];
       if (aluno.nome.trim() === alunoNome.trim()) {
          alunoAvisoPath = `${turmaKey}/alunos/${alunoKey}/avisos`;
          found = true;
        }
      });
    }
  });

  if (!found) {
    return res.status(404).json({ error: 'Turma ou aluno não encontrado' });
  }

  try {
    const { textaviso, dataaviso, IsActive } = req.body;
    const avisoData = { textaviso, dataaviso, IsActive };
    console.log('Construindo alunoAvisoPath:', alunoAvisoPath);

    if (req.method === 'POST' || req.method === 'PUT') {
      await turmasRef.child(alunoAvisoPath).set(avisoData);
      return res.status(200).json({ message: 'Aviso salvo com sucesso' });
    } else if (req.method === 'DELETE') {
      await turmasRef.child(alunoAvisoPath).remove();
      return res.status(200).json({ message: 'Aviso deletado com sucesso' });
    } else {
      res.setHeader('Allow', ['POST', 'PUT', 'DELETE']);
      res.status(405).end('Method Not Allowed');
    }
  } catch (error) {
    console.error('Erro ao manipular aviso', error);
    return res.status(500).json({ error: 'Erro ao manipular aviso' });
  }
}
