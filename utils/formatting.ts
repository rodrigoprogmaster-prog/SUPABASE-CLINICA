
export const formatCurrency = (value: string): string => {
  if (!value) return '';
  // Remove tudo que não for dígito
  let numericValue = value.replace(/\D/g, '');
  
  if (numericValue === '') return '';

  // Garante que tenha zeros à esquerda para valores pequenos
  numericValue = numericValue.padStart(3, '0');

  // Separa os centavos (últimos 2 dígitos) do resto
  const integerPart = numericValue.slice(0, -2);
  const decimalPart = numericValue.slice(-2);
  
  // Formata a parte inteira com pontos de milhar
  const formattedIntegerPart = new Intl.NumberFormat('pt-BR').format(parseInt(integerPart, 10) || 0);

  return `R$ ${formattedIntegerPart},${decimalPart}`;
};

export const parseCurrency = (value: string): number => {
  if (!value) return 0;
  // Remove tudo que não for dígito
  const numericValue = value.replace(/\D/g, '');
  if (numericValue === '') return 0;
  
  // Divide por 100 para considerar os 2 últimos dígitos como centavos
  return parseFloat(numericValue) / 100;
};

/**
 * Returns the current date as a string in YYYY-MM-DD format,
 * respecting the user's local timezone.
 */
export const getTodayString = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Returns tomorrow's date as a string in YYYY-MM-DD format.
 */
export const getTomorrowString = (): string => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const year = tomorrow.getFullYear();
    const month = (tomorrow.getMonth() + 1).toString().padStart(2, '0');
    const day = tomorrow.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}
