// pages/api/checkAvisoInDatabase.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import admin from '../../config/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { alunoNome, nomeDaTurma, modalidade } = req.body;

    try {
        const turmasRef = admin.database().ref(`modalidades/${modalidade}/turmas`);
        const snapshot = await turmasRef.once('value');
        const turmas = snapshot.val();

        if (!turmas) {
            return res.status(404).json({ error: 'Modalidade ou turmas não encontradas' });
        }

        let avisoEncontrado = null;
        Object.keys(turmas).forEach(turmaKey => {
            const turma = turmas[turmaKey];
            if (turma.nome_da_turma.trim() === nomeDaTurma.trim()) {
                const alunos = turma.alunos || {};
                Object.keys(alunos).forEach(alunoKey => {
                    const aluno = alunos[alunoKey];
                    if (aluno.nome.trim() === alunoNome.trim()) {
                        if (aluno.avisos) {
                            avisoEncontrado = aluno.avisos;
                        }
                    }
                });
            }
        });

        if (avisoEncontrado) {
            return res.status(200).json(avisoEncontrado);
        } else {
            return res.status(404).json({ error: 'Aviso não encontrado' });
        }
    } catch (error) {
        console.error('Erro ao verificar aviso no banco de dados:', error);
        return res.status(500).json({ error: 'Erro ao verificar aviso no banco de dados' });
    }
}
