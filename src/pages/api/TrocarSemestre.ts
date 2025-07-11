import type { NextApiRequest, NextApiResponse } from 'next';
import admin from '../../config/firebaseAdmin';
import {
  extrairDiasDaSemana, // MODIFICADO: Usaremos a nova função
  gerarPresencasParaSemestreVariosDias // MODIFICADO: Usaremos a nova função
} from '@/utils/Constants';

const db = admin.database();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const { ano, semestre, modalidade } = req.body;
  if (!modalidade || !ano || !semestre) {
    return res.status(400).json({ error: 'Dados incompletos. Ex: { ano, semestre, modalidade }' });
  }

  try {
    console.log('Processando modalidade:', modalidade.nome);

    for (const turma of modalidade.turmas) {
      console.log('Processando turma:', turma.nome_da_turma);

      // MODIFICADO: Extrai TODOS os dias da semana a partir do nome da turma
      const diasDaSemana = extrairDiasDaSemana(turma.nome_da_turma);
      console.log('Dias da semana extraídos:', diasDaSemana);

      if (diasDaSemana.length === 0) {
        console.warn(`Nenhum dia da semana válido encontrado para a turma: ${turma.nome_da_turma}. Pulando.`);
        continue;
      }

      // MODIFICADO: Gera presenças para TODOS os dias da semana extraídos
      const novasPresencas = gerarPresencasParaSemestreVariosDias(diasDaSemana, semestre, ano);

      // Busca a turma no Firebase
      const turmaSnapshot = await db.ref(`modalidades/${modalidade.nome}/turmas`)
        .orderByChild('nome_da_turma')
        .equalTo(turma.nome_da_turma)
        .once('value');
      const turmaData = turmaSnapshot.val();

      if (!turmaData) {
        console.error('Turma não encontrada:', turma.nome_da_turma);
        continue;
      }

      const turmaKey = Object.keys(turmaData)[0];
      console.log('Turma encontrada com key:', turmaKey);

      const alunosObj = turmaData[turmaKey].alunos || {};
      console.log('Chaves dos alunos:', Object.keys(alunosObj));

      // Itera sobre todas as chaves dos alunos e atualiza as presenças
      for (const alunoKey of Object.keys(alunosObj)) {
        const aluno = alunosObj[alunoKey];
        if (aluno) {
          console.log('Atualizando presenças para o aluno:', aluno.nome, 'Chave:', alunoKey);
          await db.ref(`modalidades/${modalidade.nome}/turmas/${turmaKey}/alunos/${alunoKey}`)
            .update({ presencas: novasPresencas });
        }
      }
    }
    res.status(200).json({ message: "Presenças atualizadas com sucesso!" });
  } catch (error: any) {
    console.error('Erro ao atualizar presenças:', error);
    res.status(500).json({ error: error.message || 'Erro ao atualizar presenças' });
  }
}