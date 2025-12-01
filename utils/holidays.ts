
/**
 * Calcula a data da Páscoa para um determinado ano.
 * Algoritmo de Meeus/Jones/Butcher.
 */
const getEasterDate = (year: number): Date => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1; // 0-indexed
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(year, month, day);
};

/**
 * Adiciona dias a uma data e retorna a string YYYY-MM-DD
 */
const addDays = (date: Date, days: number): string => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().split('T')[0];
};

/**
 * Retorna o nome do feriado se a data fornecida (YYYY-MM-DD) for um feriado nacional brasileiro.
 * Retorna null caso contrário.
 */
export const checkIsHoliday = (dateString: string): string | null => {
  const [yearStr, monthStr, dayStr] = dateString.split('-');
  const year = parseInt(yearStr);
  
  // Feriados Fixos
  const fixedHolidays: Record<string, string> = {
    [`${yearStr}-01-01`]: 'Confraternização Universal',
    [`${yearStr}-04-21`]: 'Tiradentes',
    [`${yearStr}-05-01`]: 'Dia do Trabalho',
    [`${yearStr}-09-07`]: 'Independência do Brasil',
    [`${yearStr}-10-12`]: 'Nossa Senhora Aparecida',
    [`${yearStr}-11-02`]: 'Finados',
    [`${yearStr}-11-15`]: 'Proclamação da República',
    [`${yearStr}-12-25`]: 'Natal',
  };

  if (fixedHolidays[dateString]) {
    return fixedHolidays[dateString];
  }

  // Feriados Móveis (baseados na Páscoa)
  const easterDate = getEasterDate(year);
  
  // Carnaval (Terça-feira) - 47 dias antes da Páscoa
  const carnivalDate = addDays(easterDate, -47);
  
  // Sexta-feira Santa - 2 dias antes da Páscoa
  const goodFridayDate = addDays(easterDate, -2);
  
  // Corpus Christi - 60 dias após a Páscoa
  const corpusChristiDate = addDays(easterDate, 60);

  const mobileHolidays: Record<string, string> = {
    [carnivalDate]: 'Carnaval',
    [goodFridayDate]: 'Sexta-feira Santa',
    [corpusChristiDate]: 'Corpus Christi'
  };

  if (mobileHolidays[dateString]) {
    return mobileHolidays[dateString];
  }

  return null;
};
