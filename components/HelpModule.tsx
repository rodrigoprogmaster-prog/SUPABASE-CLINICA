
import React, { useState, useMemo } from 'react';
import ModuleContainer from './ModuleContainer';
import { View } from '../types';
import HelpCircleIcon from './icons/HelpCircleIcon';
import CheckIcon from './icons/UserCheckIcon';

interface HelpModuleProps {
  onNavigate: (view: View) => void;
}

const faqs = [
    {
        category: 'Agendamento',
        question: 'Como criar uma nova consulta?',
        answer: 'Vá para o menu "Agendamento". Você pode clicar no botão "Nova Consulta" no topo ou clicar em "Calendário" e selecionar o dia desejado. Preencha o paciente, data, hora e tipo de consulta.',
        keywords: ['criar', 'nova', 'consulta', 'agendar']
    },
    {
        category: 'Agendamento',
        question: 'Como reagendar uma consulta?',
        answer: 'Na lista de "Próximas Consultas" no módulo de Agendamento, encontre o paciente e clique no botão "Reagendar". Selecione a nova data e horário no calendário.',
        keywords: ['reagendar', 'mudar', 'data', 'hora']
    },
    {
        category: 'Agendamento',
        question: 'Como enviar lembrete no WhatsApp?',
        answer: 'No módulo de Agendamento, clique no botão "Lembrete" (roxo) ao lado da consulta. Uma pré-visualização da mensagem abrirá. Clique em "Abrir WhatsApp" para enviar. O sistema também avisa sobre lembretes pendentes ao logar.',
        keywords: ['whatsapp', 'lembrete', 'mensagem', 'enviar']
    },
    {
        category: 'Pacientes',
        question: 'Como inativar um paciente?',
        answer: 'Vá para "Pacientes", encontre o nome na lista e clique no ícone de "Status" (usuário com check/x). Confirme a inativação. O paciente não aparecerá nas buscas principais, mas os dados são mantidos.',
        keywords: ['inativar', 'excluir', 'remover', 'paciente']
    },
    {
        category: 'Financeiro',
        question: 'Como lançar uma despesa?',
        answer: 'Vá para o módulo "Financeiro", clique em "Nova Transação". No formulário, selecione o tipo "Despesa", insira a descrição (ex: Aluguel) e o valor.',
        keywords: ['despesa', 'gasto', 'pagamento', 'lançar']
    },
    {
        category: 'Financeiro',
        question: 'Como gerar recibo para o paciente?',
        answer: 'Ao finalizar um atendimento no Prontuário (clicando em Encerrar Atendimento), o sistema perguntará a forma de pagamento. Após confirmar, uma opção para "Emitir Recibo" aparecerá automaticamente.',
        keywords: ['recibo', 'comprovante', 'nota']
    },
    {
        category: 'Prontuário',
        question: 'Como funciona o cronômetro?',
        answer: 'No Prontuário, se houver uma consulta agendada para hoje, aparecerá o botão "Iniciar Consulta". Ao clicar, o cronômetro começa a contar o tempo da sessão no topo da tela.',
        keywords: ['cronômetro', 'tempo', 'iniciar', 'sessão']
    },
    {
        category: 'Prontuário',
        question: 'Onde vejo a evolução do paciente?',
        answer: 'Dentro do Prontuário (ícone de arquivo), clique na aba "Evolução". Lá você verá um gráfico com o progresso baseado nas avaliações (Péssimo a Ótimo) que você registra ao salvar as notas.',
        keywords: ['evolução', 'gráfico', 'progresso', 'melhora']
    },
    {
        category: 'Configurações',
        question: 'Como fazer backup dos dados?',
        answer: 'Vá em "Configurações" > "Gerenciador de Dados". Clique em "Fazer Backup". Será baixado um arquivo JSON seguro com todas as informações do sistema.',
        keywords: ['backup', 'salvar', 'segurança', 'copia']
    }
];

const HelpModule: React.FC<HelpModuleProps> = ({ onNavigate }) => {
  const [viewMode, setViewMode] = useState<'docs' | 'faq'>('docs');
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const filteredFaqs = useMemo(() => {
      if (!searchQuery.trim()) return faqs;
      const lowerQuery = searchQuery.toLowerCase();
      return faqs.filter(item => 
          item.question.toLowerCase().includes(lowerQuery) || 
          item.keywords.some(k => k.includes(lowerQuery)) ||
          item.answer.toLowerCase().includes(lowerQuery)
      );
  }, [searchQuery]);

  const toggleFaq = (index: number) => {
      setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <ModuleContainer title="Central de Ajuda" onBack={() => onNavigate('dashboard')}>
      
      {/* Header Steps */}
      <div className="flex items-center justify-center mb-8">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${viewMode === 'docs' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-slate-200 text-slate-400'}`}>
              <span className="font-bold text-sm">1. Documentação</span>
          </div>
          <div className="w-10 h-px bg-slate-300 mx-2"></div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${viewMode === 'faq' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-slate-200 text-slate-400'}`}>
              <span className="font-bold text-sm">2. Perguntas Frequentes</span>
          </div>
      </div>

      {viewMode === 'docs' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 animate-fade-in max-w-4xl mx-auto">
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full mb-4">
                        <HelpCircleIcon className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">Bem-vinda à Documentação</h3>
                    <p className="text-slate-600">Leia atentamente as instruções gerais antes de prosseguir para as dúvidas específicas.</p>
                </div>

                <div className="space-y-8 text-slate-700 leading-relaxed border-b border-slate-100 pb-8 mb-8">
                    <div>
                        <h4 className="text-lg font-semibold text-indigo-800 mb-2">Visão Geral</h4>
                        <p className="text-sm">
                            O Sistema de Gestão Clínica foi projetado para centralizar as operações do consultório da Dra. Vanessa Gonçalves. 
                            Ele funciona localmente no seu navegador, garantindo rapidez e privacidade.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-50 p-4 rounded-lg">
                            <h5 className="font-bold text-slate-800 mb-2 text-sm">Fluxo de Atendimento</h5>
                            <ol className="list-decimal list-inside text-sm text-slate-600 space-y-1">
                                <li>Cadastre o paciente.</li>
                                <li>Agende a consulta no calendário.</li>
                                <li>Inicie o atendimento pelo Dashboard ("Iniciar").</li>
                                <li>Registre a evolução no PEP.</li>
                                <li>Encerre e registre o pagamento.</li>
                            </ol>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-lg">
                            <h5 className="font-bold text-slate-800 mb-2 text-sm">Segurança de Dados</h5>
                            <p className="text-xs text-slate-600">
                                Seus dados são salvos no navegador. É <strong>crucial</strong> realizar backups frequentes através do menu Configurações {'>'} Gerenciador de Dados para evitar perda de informações em caso de formatação do computador.
                            </p>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold text-indigo-800 mb-2">Direitos Autorais</h4>
                        <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded border border-slate-200">
                            © 2025 Sistema de Gestão Clínica. Todos os direitos reservados. Licenciado exclusivamente para uso na Clínica de Psicanálise Vanessa Gonçalves.
                        </p>
                    </div>
                </div>

                <div className="flex justify-center">
                    <button 
                        onClick={() => setViewMode('faq')}
                        className="px-8 py-3 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                    >
                        <CheckIcon />
                        Entendi, quero tirar dúvidas
                    </button>
                </div>
          </div>
      )}

      {viewMode === 'faq' && (
          <div className="animate-slide-up max-w-3xl mx-auto">
              <div className="text-center mb-8">
                  <h3 className="text-xl font-bold text-slate-800 mb-4">Como podemos ajudar?</h3>
                  <div className="relative max-w-lg mx-auto">
                      <input 
                        type="text" 
                        placeholder="Digite sua dúvida (ex: como criar consulta, backup...)" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full p-4 pl-12 rounded-full border border-slate-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        autoFocus
                      />
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  </div>
              </div>

              <div className="space-y-4">
                  {filteredFaqs.length > 0 ? (
                      filteredFaqs.map((faq, index) => (
                          <div key={index} className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                              <button 
                                onClick={() => toggleFaq(index)}
                                className="w-full flex justify-between items-center p-4 text-left bg-white hover:bg-slate-50 transition-colors"
                              >
                                  <div className="flex items-center gap-3">
                                      <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase rounded tracking-wider">
                                          {faq.category}
                                      </span>
                                      <span className="font-semibold text-slate-700">{faq.question}</span>
                                  </div>
                                  <svg 
                                    className={`w-5 h-5 text-slate-400 transform transition-transform duration-200 ${openFaqIndex === index ? 'rotate-180' : ''}`} 
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                  >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                  </svg>
                              </button>
                              {openFaqIndex === index && (
                                  <div className="p-4 bg-slate-50 border-t border-slate-100 text-slate-600 text-sm leading-relaxed animate-fade-in">
                                      {faq.answer}
                                  </div>
                              )}
                          </div>
                      ))
                  ) : (
                      <div className="text-center py-12 bg-white rounded-lg border border-dashed border-slate-300">
                          <p className="text-slate-500 font-medium">Nenhuma resposta encontrada para "{searchQuery}".</p>
                          <p className="text-sm text-slate-400 mt-2">Tente palavras-chave diferentes como "agendar", "paciente" ou "recibo".</p>
                      </div>
                  )}
              </div>

              <div className="mt-8 text-center">
                  <button onClick={() => setViewMode('docs')} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium underline">
                      Voltar para Documentação
                  </button>
              </div>
          </div>
      )}

    </ModuleContainer>
  );
};

export default HelpModule;