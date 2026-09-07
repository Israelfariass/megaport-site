/**
 * MEGAPORT SERVIÇOS — biblioteca de ícones
 * ------------------------------------------------------------------
 * Usada tanto pelo site (js/script.js) quanto pelo painel administrativo
 * (js/admin.js) para desenhar o ícone de cada serviço.
 *
 * Cada chave é o valor salvo no campo "icon" de um serviço, no
 * banco de dados (tabela services). O valor é o miolo de um SVG
 * (paths/circles), sem a tag <svg> em volta — ela é adicionada
 * automaticamente na hora de desenhar o ícone na tela.
 *
 * PARA ADICIONAR UM ÍCONE NOVO:
 * 1. Escolha uma chave (ex: "caminhao")
 * 2. Cole o SVG (só o conteúdo interno, formato 24x24, estilo de linha)
 * 3. Ele já aparece automaticamente no seletor de ícones do painel admin
 */
const ICON_LIBRARY = {
  pombos: '<path d="M2 15.5q3-5 5-1.5 2-5 4.5 0 2.5-5 5-1.5"/><path d="M2 9.5q3-5 5-1.5 2-5 4.5 0 2.5-5 5-1.5"/>',
  zeladoria: '<path d="M12 3 18.5 6.2V11c0 4.6-2.7 7.6-6.5 9-3.8-1.4-6.5-4.4-6.5-9V6.2L12 3z"/><path d="M9.2 12.2 11 14l3.8-4"/>',
  limpeza: '<path d="M12 3c2.5 2.4 4 5 4 7.5a4 4 0 1 1-8 0C8 8 9.5 5.4 12 3z"/>',
  manutencao: '<path d="M13.4 5.6a3.5 3.5 0 0 0 4.6 4.6L20 12l-2 2-2-2-7 7a1.5 1.5 0 0 1-2-2l7-7-2-2 2-2 2 2 .4-2.4z"/>',
  jardinagem: '<path d="M5 21c0-7 3-12 8-16 1 6-1 10-4 13M5 21c2-1 4-3 4-6"/>',
  especiais: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/><circle cx="12" cy="12" r="3"/>',
  estrela: '<path d="m12 17.3-6.2 3.3 1.2-6.9-5-4.9 6.9-1L12 1.7l2.8 5.9 6.9 1.2-5 4.9 1.2 6.9z"/>',
  escudo: '<path d="M12 3 19.5 6.5V12c0 5.2-3.1 8.7-7.5 9.9-4.4-1.2-7.5-4.7-7.5-9.9V6.5L12 3z"/><path d="M9 12l2 2 4-4"/>',
  casa: '<path d="M4 11l8-7 8 7"/><path d="M6 10v9h12v-9"/><path d="M10 19v-5h4v5"/>',
  relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9"/>',
  etiqueta: '<path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9-9-9z"/><circle cx="7.5" cy="7.5" r="1.3"/>'
};
const DEFAULT_ICON = 'especiais';

const ICON_LABELS = {
  pombos: 'Pombos',
  zeladoria: 'Zeladoria',
  limpeza: 'Limpeza',
  manutencao: 'Manutenção',
  jardinagem: 'Jardinagem',
  especiais: 'Especiais',
  estrela: 'Estrela',
  escudo: 'Escudo',
  casa: 'Casa',
  relogio: 'Relógio',
  check: 'Verificado',
  etiqueta: 'Etiqueta'
};

function iconMarkup(key) {
  return ICON_LIBRARY[key] || ICON_LIBRARY[DEFAULT_ICON];
}
