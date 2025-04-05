/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'
import {
  Modalidade,
  FormValuesStudent,
  ModalidadesData,
  AlunoPresencaUpdate,
  IIAlunoUpdate,
  DeleteStudants,
  TemporaryMoveStudentsPayload,
  Turma,
  IIAvisos
} from '../interface/interfaces'
import axios from 'axios'
import React, {
  createContext,
  useState,
  ReactNode,
  useContext,
  useCallback,
} from 'react'

interface ChildrenProps {
  children: ReactNode
}

interface DataContextType {
  ContextData: FormValuesStudent[]
  sendDataToApi: (data: FormValuesStudent[]) => Promise<{ resultados: any[] }>
  updateDataInApi: (data: IIAlunoUpdate) => Promise<void>
  modalidades: Modalidade[]
  fetchModalidades: (filtro?: string) => Promise<Modalidade[]> 
  fetchStudantsTableData: (filtro?: string, limit?: number, offset?: number) => Promise<Modalidade[]>
  updateAttendanceInApi: (data: AlunoPresencaUpdate) => Promise<void>
  moveStudentTemp: (payload: TemporaryMoveStudentsPayload) => Promise<void>
  copyStudentTemp: (payload: TemporaryMoveStudentsPayload) => Promise<void>
  updateUniformeInApi: (data: { nomeDaTurma: string; alunoNome: string; hasUniforme: boolean }) => Promise<void>;
  deleteStudentFromApi: (payload: { alunoId: string; nomeDaTurma: string; }) => Promise<void>
  avisoStudent: (payload: IIAvisos, method: 'POST' | 'PUT' | 'DELETE') => Promise<void>;
}

const DataContext = createContext<DataContextType>({
  ContextData: [],
  sendDataToApi: async (data: FormValuesStudent[]) => {
    return { resultados: [] }
  },
  updateDataInApi: async () => {},
  modalidades: [],
  fetchModalidades: async (filtro?: string): Promise<Modalidade[]> => {
    return []
  },
  fetchStudantsTableData: async () => [],
  updateAttendanceInApi: async (data: AlunoPresencaUpdate) => {},
  updateUniformeInApi: async (data: { nomeDaTurma: string; alunoNome: string; hasUniforme: boolean }) => {
    console.warn('updateUniformeInApi not implemented', data);
  },
  deleteStudentFromApi: async (payload: { alunoId: string; nomeDaTurma: string; }) => {
    console.warn('deleteStudentFromApi not implemented', payload)
  },
  moveStudentTemp: async (payload: TemporaryMoveStudentsPayload) => {
    console.warn('moveStudentTemp not implemented', payload)
  },
  copyStudentTemp: async (payload: TemporaryMoveStudentsPayload) => {
    console.warn('copyStudentTemp not implemented', payload)
  },
  avisoStudent: async (payload: IIAvisos) => {
    console.warn('avisoStudent not implemented', payload)
  },
})

const useData = () => {
  const context = useContext(DataContext)
  return context
}

const DataProvider: React.FC<ChildrenProps> = ({ children }) => {
  const [DataStudents, setDataStudents] = useState<FormValuesStudent[]>([])
  const [modalidades, setModalidades] = useState<Modalidade[]>([])
  const [dataTable, setdataTable] = useState<Modalidade[]>([])

  // Função para buscar dados da tabela de forma otimizada
  const fetchStudantsTableData = useCallback(async (filtro?: string, limit: number = 10, offset: number = 0): Promise<Modalidade[]> => {
    try {
      const url = filtro
        ? `/api/GetStudantTableData?modalidade=${filtro}&limit=${limit}&offset=${offset}`
        : `/api/GetStudantTableData?limit=${limit}&offset=${offset}`
      const response = await fetch(url, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      if (!response.ok) throw new Error('Falha ao buscar modalidades')
      const data: ModalidadesData = await response.json()
      const modalidadesArray: Modalidade[] = Object.entries(data).map(
        ([nome, valor]) => ({
          nome,
          turmas: (valor as any).turmas as Turma[]
        })
      )
      setdataTable(modalidadesArray)
      return modalidadesArray
    } catch (error) {
      console.error('Erro ao buscar modalidades:', error)
      return []
    }
  }, [])

  // Buscar as modalidades (a única modalidade existente)
  const fetchModalidades = useCallback(
    async (filtro?: string): Promise<Modalidade[]> => {
      try {
        const url = filtro
          ? `/api/GetDataFirebase?modalidade=${filtro}`
          : '/api/GetDataFirebase'
        const response = await fetch(url)
        if (!response.ok) throw new Error('Falha ao buscar modalidades')
        const data: ModalidadesData = await response.json()
        const modalidadesArray: Modalidade[] = Object.entries(data).map(
          ([nome, valor]) => ({
            nome,
            turmas: valor.turmas,
          }),
        )
        setModalidades(modalidadesArray)
        return modalidadesArray
      } catch (error) {
        console.error('Erro ao buscar modalidades:', error)
        return []
      }
    },
    [],
  )

  const sendDataToApi = async (
    data: FormValuesStudent[],
  ): Promise<{ resultados: any[] }> => {
    try {
      const responses = await Promise.all(
        data.map((aluno) => axios.post('/api/SubmitFormRegistration', aluno)),
      )
      const combinedResults = responses.flatMap(
        (response) => response.data.resultados,
      )
      return { resultados: combinedResults }
    } catch (error) {
      console.error('Ocorreu um erro ao enviar dados para a API:', error)
      throw new Error('Falha ao enviar dados para a API.')
    }
  }

  const updateDataInApi = async (data: IIAlunoUpdate) => {
    if (!data.informacoesAdicionais.IdentificadorUnico) {
      console.error("IdentificadorUnico não encontrado no aluno selecionado.");
      return;
    }
    const payload = {
      identificadorUnico: data.informacoesAdicionais.IdentificadorUnico,
      novosDados: {
        anoNascimento: data.anoNascimento,
        telefoneComWhatsapp: data.telefoneComWhatsapp,
        nome: data.nome,
        informacoesAdicionais: data.informacoesAdicionais,
        foto: data.foto,
      },
    };
    try {
      const response = await fetch('/api/updateStudent', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Erro ao atualizar informações do aluno em todas as turmas:', error);
    }
  };

  // Atualizado: removida a propriedade "modalidade" do payload
  const updateAttendanceInApi = async (data: AlunoPresencaUpdate) => {
    try {
      const payload = {
        nomeDaTurma: data.nomeDaTurma,
        alunoNome: data.nome, 
        presencas: data.presencas,
      }
      const response = await fetch('/api/updateAttendance', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        throw new Error('Falha ao atualizar dados de presença')
      }
    } catch (error) {
      console.error('Erro ao atualizar presença:', error)
    }
  }

  // Função para mover aluno entre turmas (payload atualizado para não incluir modalidade)
  const moveStudentTemp = async (payload: TemporaryMoveStudentsPayload) => {
    try {
      const response = await fetch('/api/moveTempStudents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao mover aluno');
      }
      alert("Aluno movido com sucesso!");
    } catch (error: any) {
      console.error('Erro ao mover aluno:', error);
      alert("Erro ao mover aluno: " + error.message);
    }
  }

  // Função para copiar aluno entre turmas (payload atualizado para não incluir modalidade)
  const copyStudentTemp = async (payload: TemporaryMoveStudentsPayload) => {
    try {
      const response = await fetch('/api/CopyStudant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao copiar aluno');
      }
      alert("Aluno copiado com sucesso!");
    } catch (error: any) {
      console.error('Erro ao copiar aluno:', error);
      alert("Erro ao copiar aluno: " + error.message);
    }
  }

  const avisoStudent = async (payload: IIAvisos, method: 'POST' | 'PUT' | 'DELETE' = 'POST') => {
    try {
      const response = await fetch('/api/ApiAvisos', {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao manipular aviso');
      }
      alert(`Aviso ${method === 'DELETE' ? 'deletado' : 'processado'} com sucesso!`);
    } catch (error: any) {
      console.error('Erro ao manipular aviso:', error);
      alert(`Erro ao manipular aviso: ${error.message}`);
    }
  }

  // Atualizado: remoção da propriedade "modalidade" do payload
  async function deleteStudentFromApi(data: { alunoId: string; nomeDaTurma: string; }) {
    if (!data.alunoId || !data.nomeDaTurma) {
      throw new Error('Dados incompletos para excluir o aluno.');
    }
    const response = await fetch('/api/deleteStudent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao excluir o aluno.');
    }
    return response.json();
  }

  // Atualizado: remoção da propriedade "modalidade" do payload
  const updateUniformeInApi = async (data: { nomeDaTurma: string; alunoNome: string; hasUniforme: boolean }) => {
    try {
      const payload = {
        nomeDaTurma: data.nomeDaTurma,
        alunoNome: data.alunoNome,
        hasUniforme: data.hasUniforme,
      };
      const response = await fetch('/api/updateUniforme', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.log(response)
        throw new Error(errorData.error || 'Falha ao atualizar o status do uniforme');
      }
      console.log('Status do uniforme atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar o status do uniforme:', error);
    }
  };

  return (
    <DataContext.Provider
      value={{
        ContextData: DataStudents,
        sendDataToApi,
        updateDataInApi,
        modalidades,
        fetchModalidades,
        fetchStudantsTableData,
        updateAttendanceInApi,
        updateUniformeInApi,
        deleteStudentFromApi, 
        moveStudentTemp,
        copyStudentTemp,
        avisoStudent 
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export { DataContext, DataProvider, useData }
