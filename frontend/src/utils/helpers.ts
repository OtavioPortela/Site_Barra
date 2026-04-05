export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatDate = (dateString: string): string => {
  // Formato YYYY-MM-DD: converte direto sem aplicar timezone para evitar bug de offset
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [ano, mes, dia] = dateString.split('-');
    return `${dia}/${mes}/${ano}`;
  }
  // ISO com hora: aplica formatação no timezone local
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return dateString;
  }
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pendente: 'Pendente',
    em_desenvolvimento: 'Em Desenvolvimento',
    finalizada: 'Finalizada',
  };
  return labels[status] || status;
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pendente: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    em_desenvolvimento: 'bg-blue-100 text-blue-800 border-blue-300',
    finalizada: 'bg-green-100 text-green-800 border-green-300',
  };
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
};

