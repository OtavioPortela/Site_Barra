import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { BillingData } from '../../types';
import { formatCurrency } from '../../utils/helpers';

interface BillingChartProps {
  data: BillingData;
}

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const BillingChart = ({ data }: BillingChartProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Gráfico de Faturamento ao Longo do Tempo */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Faturamento ao Longo do Tempo</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.faturamento_por_periodo}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="periodo" />
            <YAxis />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
            <Line type="monotone" dataKey="valor" stroke="#0ea5e9" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico de Distribuição por Status */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribuição por Status</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data.distribuicao_status}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="quantidade"
            >
              {data.distribuicao_status.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Top Clientes */}
      <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Clientes por Faturamento</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.top_clientes}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="cliente" />
            <YAxis />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
            <Bar dataKey="faturamento" fill="#0ea5e9" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

