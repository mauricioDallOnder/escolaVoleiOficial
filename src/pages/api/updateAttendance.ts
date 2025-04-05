import type { NextApiRequest, NextApiResponse } from 'next';
import admin from '../../config/firebaseAdmin';
import { Turma } from '@/interface/interfaces';

const db = admin.database();
// Modalidade fixa definida para a nova estrutura
const modalidadeDefault = "default";

export default async function updateAttendance(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'PUT') {
    try {
      // Agora o payload deve conter apenas nomeDaTurma, alunoNome e presencas
      const { nomeDaTurma, alunoNome, presencas } = req.body;

      // Caminho para as turmas na modalidade fixa
      const turmasRef = admin.database().ref(`modalidades/${modalidadeDefault}/turmas`);
      const snapshot = await turmasRef.once('value');
      const turmas = snapshot.val();

      // Encontrar a turma e o aluno pelo nome
      let turmaIndex = -1;
      let alunoIndex = -1;

      // Supondo que as turmas estejam armazenadas como um array
      turmas.forEach((turma: Turma, idx: number) => {
        if (turma.nome_da_turma === nomeDaTurma) {
          turmaIndex = idx;
          if (turma.alunos) {
            turma.alunos.forEach((aluno: any, index: number) => {
              if (aluno.nome === alunoNome) {
                alunoIndex = index;
              }
            });
          }
        }
      });

      if (turmaIndex === -1 || alunoIndex === -1) {
        return res.status(404).json({ error: 'Turma ou aluno não encontrado' });
      }

      // Referência para as presenças do aluno
      const presencasRef = turmasRef.child(`${turmaIndex}/alunos/${alunoIndex}/presencas`);

      // Atualiza as presenças conforme os dados recebidos
      await presencasRef.update(presencas);

      return res.status(200).json({ message: 'Presença atualizada com sucesso' });
    } catch (error) {
      console.error('Erro ao atualizar presença', error);
      return res.status(500).json({ error: 'Erro ao atualizar presença' });
    }
  } else {
    res.setHeader('Allow', 'PUT');
    res.status(405).end('Method Not Allowed');
  }
}
