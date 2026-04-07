import type { BillingData } from '../../types';
import { formatCurrency } from '../../utils/helpers';

interface BillingMetricsProps {
  data: BillingData;
}

export const BillingMetrics = ({ data }: BillingMetricsProps) => {
  const metrics = [
    {
      title: 'Faturamento Total',
      value: formatCurrency(data.faturamento_total),
      icon: '💰',
      color: 'bg-green-500',
    },
    {
      title: 'Faturamento Mensal',
      value: formatCurrency(data.faturamento_mensal),
      icon: '📅',
      color: 'bg-blue-500',
    },
    {
      title: 'Faturamento Semanal',
      value: formatCurrency(data.faturamento_semanal),
      icon: '📊',
      color: 'bg-purple-500',
    },
    {
      title: 'OS Finalizadas',
      value: data.quantidade_finalizadas.toString(),
      icon: '✅',
      color: 'bg-yellow-500',
    },
    {
      title: 'Ticket Médio',
      value: formatCurrency(data.ticket_medio),
      icon: '🎯',
      color: 'bg-indigo-500',
    },
    {
      title: 'Saídas de Caixa',
      value: formatCurrency(data.total_saidas ?? 0),
      icon: '📤',
      color: 'bg-red-500',
    },
    {
      title: 'Saídas Mensais',
      value: formatCurrency(data.total_saidas_mensal ?? 0),
      icon: '🧾',
      color: 'bg-orange-500',
    },
    {
      title: 'Lucro Líquido',
      value: formatCurrency(data.lucro_liquido ?? 0),
      icon: '💵',
      color: (data.lucro_liquido ?? 0) >= 0 ? 'bg-emerald-500' : 'bg-rose-600',
    },
    {
      title: 'Lucro Líquido Mensal',
      value: formatCurrency(data.lucro_liquido_mensal ?? 0),
      icon: '📈',
      color: (data.lucro_liquido_mensal ?? 0) >= 0 ? 'bg-teal-500' : 'bg-rose-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow-md p-4 border-l-4 border-primary-500"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600 mb-1 truncate">{metric.title}</p>
              <p className="text-lg font-bold text-gray-800 truncate">{metric.value}</p>
            </div>
            <div className={`${metric.color} rounded-full p-2 text-xl ml-2 shrink-0`}>
              {metric.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
