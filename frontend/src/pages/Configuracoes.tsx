import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { corCabeloService, corLinhaService, estadoCabeloService, servicoService, tipoCabeloService } from '../services/api';

interface EstadoCabelo {
  id: number;
  nome: string;
  valor: string;
  ativo: boolean;
  ordem: number;
}

interface TipoCabelo {
  id: number;
  nome: string;
  valor: string;
  ativo: boolean;
  ordem: number;
}

interface CorCabelo {
  id: number;
  nome: string;
  ativo: boolean;
  ordem: number;
}

interface CorLinha {
  id: number;
  nome: string;
  ativo: boolean;
  ordem: number;
}

interface Servico {
  id: number;
  nome: string;
  descricao?: string;
  ativo?: boolean;
}

export const Configuracoes = () => {

  // Estados para cada tipo de configuração
  const [estadosCabelo, setEstadosCabelo] = useState<EstadoCabelo[]>([]);
  const [tiposCabelo, setTiposCabelo] = useState<TipoCabelo[]>([]);
  const [coresCabelo, setCoresCabelo] = useState<CorCabelo[]>([]);
  const [coresLinha, setCoresLinha] = useState<CorLinha[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);

  // Estados para novos valores
  const [novoEstadoCabelo, setNovoEstadoCabelo] = useState({ nome: '' });
  const [novoTipoCabelo, setNovoTipoCabelo] = useState({ nome: '' });
  const [novaCorCabelo, setNovaCorCabelo] = useState({ nome: '' });
  const [novaCorLinha, setNovaCorLinha] = useState({ nome: '' });
  const [novoServico, setNovoServico] = useState({ nome: '', descricao: '' });

  // Carregar dados ao montar
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [estados, tipos, cores, linhas, servicosData] = await Promise.all([
        estadoCabeloService.getAll({ ativo: true }),
        tipoCabeloService.getAll({ ativo: true }),
        corCabeloService.getAll({ ativo: true }),
        corLinhaService.getAll({ ativo: true }),
        servicoService.getAll({ ativo: true }),
      ]);
      setEstadosCabelo(estados);
      setTiposCabelo(tipos);
      setCoresCabelo(cores);
      setCoresLinha(linhas);
      // Mapear servicos para garantir que tenham a propriedade ativo
      setServicos(servicosData.map((s: any) => ({ ...s, ativo: s.ativo ?? true })));
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const handleAddEstadoCabelo = async () => {
    if (!novoEstadoCabelo.nome.trim()) {
      toast.error('Preencha o nome');
      return;
    }

    try {
      // Gerar valor automaticamente: lowercase, sem espaços, com underscore
      const valor = novoEstadoCabelo.nome.toLowerCase().trim().replace(/\s+/g, '_');

      await estadoCabeloService.create({
        nome: novoEstadoCabelo.nome,
        valor: valor,
        ativo: true,
        ordem: estadosCabelo.length,
      });
      toast.success('Estado do cabelo adicionado!');
      setNovoEstadoCabelo({ nome: '' });
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.nome?.[0] || 'Erro ao adicionar estado do cabelo');
    }
  };

  const handleDeleteEstadoCabelo = async (id: number) => {
    if (!confirm('Deseja realmente excluir este item?')) return;

    try {
      await estadoCabeloService.delete(id);
      toast.success('Estado do cabelo excluído!');
      loadData();
    } catch (error) {
      toast.error('Erro ao excluir estado do cabelo');
    }
  };

  const handleAddTipoCabelo = async () => {
    if (!novoTipoCabelo.nome.trim()) {
      toast.error('Preencha o nome');
      return;
    }

    try {
      // Gerar valor automaticamente: lowercase, sem espaços, com underscore
      const valor = novoTipoCabelo.nome.toLowerCase().trim().replace(/\s+/g, '_');

      await tipoCabeloService.create({
        nome: novoTipoCabelo.nome,
        valor: valor,
        ativo: true,
        ordem: tiposCabelo.length,
      });
      toast.success('Tipo de cabelo adicionado!');
      setNovoTipoCabelo({ nome: '' });
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.nome?.[0] || 'Erro ao adicionar tipo de cabelo');
    }
  };

  const handleDeleteTipoCabelo = async (id: number) => {
    if (!confirm('Deseja realmente excluir este item?')) return;

    try {
      await tipoCabeloService.delete(id);
      toast.success('Tipo de cabelo excluído!');
      loadData();
    } catch (error) {
      toast.error('Erro ao excluir tipo de cabelo');
    }
  };

  const handleAddCorCabelo = async () => {
    if (!novaCorCabelo.nome.trim()) {
      toast.error('Preencha o nome da cor');
      return;
    }

    try {
      await corCabeloService.create({
        nome: novaCorCabelo.nome,
        ativo: true,
        ordem: coresCabelo.length,
      });
      toast.success('Cor do cabelo adicionada!');
      setNovaCorCabelo({ nome: '' });
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.nome?.[0] || 'Erro ao adicionar cor do cabelo');
    }
  };

  const handleDeleteCorCabelo = async (id: number) => {
    if (!confirm('Deseja realmente excluir este item?')) return;

    try {
      await corCabeloService.delete(id);
      toast.success('Cor do cabelo excluída!');
      loadData();
    } catch (error) {
      toast.error('Erro ao excluir cor do cabelo');
    }
  };

  const handleAddCorLinha = async () => {
    if (!novaCorLinha.nome.trim()) {
      toast.error('Preencha o nome da cor');
      return;
    }

    try {
      await corLinhaService.create({
        nome: novaCorLinha.nome,
        ativo: true,
        ordem: coresLinha.length,
      });
      toast.success('Cor da linha adicionada!');
      setNovaCorLinha({ nome: '' });
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.nome?.[0] || 'Erro ao adicionar cor da linha');
    }
  };

  const handleDeleteCorLinha = async (id: number) => {
    if (!confirm('Deseja realmente excluir este item?')) return;

    try {
      await corLinhaService.delete(id);
      toast.success('Cor da linha excluída!');
      loadData();
    } catch (error) {
      toast.error('Erro ao excluir cor da linha');
    }
  };

  const handleAddServico = async () => {
    if (!novoServico.nome.trim()) {
      toast.error('Preencha o nome do serviço');
      return;
    }

    try {
      await servicoService.create({
        nome: novoServico.nome,
        descricao: novoServico.descricao || undefined,
      });
      toast.success('Serviço adicionado!');
      setNovoServico({ nome: '', descricao: '' });
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.nome?.[0] || 'Erro ao adicionar serviço');
    }
  };

  const handleDeleteServico = async (id: number) => {
    if (!confirm('Deseja realmente excluir este item?')) return;

    try {
      await servicoService.delete(id);
      toast.success('Serviço excluído!');
      loadData();
    } catch (error) {
      toast.error('Erro ao excluir serviço');
    }
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Configurações</h1>

        <div className="space-y-6">
          {/* Seção: Informações Gerais */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Informações Gerais</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Empresa
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Barra Confecções"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CNPJ
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="contato@barraconfeccoes.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone
                </label>
                <input
                  type="tel"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="(00) 0000-0000"
                />
              </div>
            </div>
          </div>

          {/* Seção: Ajustes Criação de OS */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Ajustes Criação de OS</h2>

            {/* Estado do Cabelo */}
            <div className="mb-6">
              <h3 className="text-md font-semibold text-gray-700 mb-3">Estado do Cabelo</h3>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={handleAddEstadoCabelo}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
                >
                  + Adicionar
                </button>
                <input
                  type="text"
                  placeholder="Nome (ex: Novo)"
                  value={novoEstadoCabelo.nome}
                  onChange={(e) => setNovoEstadoCabelo({ nome: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {estadosCabelo.map((estado) => (
                  <div key={estado.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm text-gray-700">{estado.nome}</span>
                    <button
                      onClick={() => handleDeleteEstadoCabelo(estado.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-bold ml-2"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Tipo de Cabelo */}
            <div className="mb-6">
              <h3 className="text-md font-semibold text-gray-700 mb-3">Tipo de Cabelo</h3>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={handleAddTipoCabelo}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
                >
                  + Adicionar
                </button>
                <input
                  type="text"
                  placeholder="Nome (ex: Liso)"
                  value={novoTipoCabelo.nome}
                  onChange={(e) => setNovoTipoCabelo({ nome: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {tiposCabelo.map((tipo) => (
                  <div key={tipo.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm text-gray-700">{tipo.nome}</span>
                    <button
                      onClick={() => handleDeleteTipoCabelo(tipo.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-bold ml-2"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Cor do Cabelo */}
            <div className="mb-6">
              <h3 className="text-md font-semibold text-gray-700 mb-3">Cor do Cabelo</h3>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={handleAddCorCabelo}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
                >
                  + Adicionar
                </button>
                <input
                  type="text"
                  placeholder="Nome da cor (ex: Preto)"
                  value={novaCorCabelo.nome}
                  onChange={(e) => setNovaCorCabelo({ nome: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {coresCabelo.map((cor) => (
                  <div key={cor.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm text-gray-700">{cor.nome}</span>
                    <button
                      onClick={() => handleDeleteCorCabelo(cor.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-bold ml-2"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Cor da Linha */}
            <div className="mb-6">
              <h3 className="text-md font-semibold text-gray-700 mb-3">Cor da Linha</h3>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={handleAddCorLinha}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
                >
                  + Adicionar
                </button>
                <input
                  type="text"
                  placeholder="Nome da cor (ex: Preta)"
                  value={novaCorLinha.nome}
                  onChange={(e) => setNovaCorLinha({ nome: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {coresLinha.map((cor) => (
                  <div key={cor.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm text-gray-700">{cor.nome}</span>
                    <button
                      onClick={() => handleDeleteCorLinha(cor.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-bold ml-2"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Serviços */}
            <div className="mb-6">
              <h3 className="text-md font-semibold text-gray-700 mb-3">Serviços</h3>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={handleAddServico}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
                >
                  + Adicionar
                </button>
                <input
                  type="text"
                  placeholder="Nome do serviço (ex: Extensão)"
                  value={novoServico.nome}
                  onChange={(e) => setNovoServico({ ...novoServico, nome: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Descrição (opcional)"
                  value={novoServico.descricao}
                  onChange={(e) => setNovoServico({ ...novoServico, descricao: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {servicos.map((servico) => (
                  <div key={servico.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm text-gray-700">{servico.nome}</span>
                    <button
                      onClick={() => handleDeleteServico(servico.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-bold ml-2"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
