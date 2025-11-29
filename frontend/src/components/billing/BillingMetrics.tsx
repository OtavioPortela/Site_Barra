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
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow-md p-6 border-l-4 border-primary-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{metric.title}</p>
              <p className="text-2xl font-bold text-gray-800">{metric.value}</p>
            </div>
            <div className={`${metric.color} rounded-full p-3 text-2xl`}>
              {metric.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

