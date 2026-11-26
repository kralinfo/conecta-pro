window.ConectaPro = window.ConectaPro || {};

window.ConectaPro.config = {
  DEFAULT_APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbzBwhPlJxf-U-6Rz2zN30y4mfPl8SUjUwmthKsylZqnrJ73tmmUeVxcg7tkgsu9mkqt0Q/exec',
  KEYS: {
    PROFESSIONALS: 'conectapro_professionals_v4',
    PROFESSIONS: 'conectapro_professions_v4',
    SHEETS_URL_CUSTOM: 'conectapro_sheets_url_custom_v4',
    CITIES_CACHE: 'conectapro_cities_ibge_v4'
  },
  DEFAULT_PROFESSIONS: [
    'Pedreiro',
    'Eletricista',
    'Encanador',
    'Pintor',
    'Diarista',
    'Jardineiro',
    'Marceneiro',
    'Técnico em Refrigeração',
    'Montador de Móveis',
    'Chaveiro'
  ],
  INITIAL_CITIES: [
    'Recife - PE', 'Olinda - PE', 'Jaboatão dos Guararapes - PE', 'Paulista - PE',
    'Caruaru - PE', 'Petrolina - PE', 'Cabo de Santo Agostinho - PE', 'Camaragibe - PE',
    'Garanhuns - PE', 'Vitória de Santo Antão - PE', 'Igarassu - PE', 'São Lourenço da Mata - PE',
    'Goiana - PE', 'Aliança - PE', 'Timbaúba - PE', 'Carpina - PE', 'Nazaré da Mata - PE',
    'Paudalho - PE', 'Limoeiro - PE', 'Surubim - PE', 'Belo Jardim - PE', 'Arcoverde - PE',
    'Serra Talhada - PE', 'Salgueiro - PE', 'Gravatá - PE', 'Santa Cruz do Capibaribe - PE',
    'São Paulo - SP', 'Guarulhos - SP', 'Campinas - SP', 'São Bernardo do Campo - SP',
    'Santo André - SP', 'Osasco - SP', 'Sorocaba - SP', 'Ribeirão Preto - SP', 'Santos - SP',
    'Rio de Janeiro - RJ', 'São Gonçalo - RJ', 'Duque de Caxias - RJ', 'Niterói - RJ',
    'Belo Horizonte - MG', 'Uberlândia - MG', 'Contagem - MG', 'Juiz de Fora - MG',
    'Salvador - BA', 'Feira de Santana - BA', 'Vitória da Conquista - BA',
    'Fortaleza - CE', 'Caucaia - CE', 'Juazeiro do Norte - CE',
    'Brasília - DF', 'Curitiba - PR', 'Londrina - PR', 'Maringá - PR',
    'Porto Alegre - RS', 'Caxias do Sul - RS', 'Manaus - AM', 'Belém - PA',
    'Goiânia - GO', 'Aparecida de Goiânia - GO', 'Florianópolis - SC', 'Joinville - SC',
    'João Pessoa - PB', 'Campina Grande - PB', 'Natal - RN', 'Mossoró - RN',
    'Maceió - AL', 'Arapiraca - AL', 'Aracaju - SE', 'Teresina - PI', 'São Luís - MA',
    'Campo Grande - MS', 'Cuiabá - MT', 'Vitória - ES', 'Vila Velha - ES'
  ],
  SAMPLE_PROFESSIONALS: [
    { id: 'demo-1', nome: 'Carlos Eduardo Silva', profissao: 'Eletricista', cidade: 'Recife - PE', whatsapp: '81998765432' },
    { id: 'demo-2', nome: 'Mariana Souza', profissao: 'Diarista', cidade: 'Aliança - PE', whatsapp: '81991234567' },
    { id: 'demo-3', nome: 'José Roberto Lima', profissao: 'Pedreiro', cidade: 'Goiana - PE', whatsapp: '81988776655' },
    { id: 'demo-4', nome: 'Fernanda Oliveira', profissao: 'Pintor', cidade: 'São Paulo - SP', whatsapp: '11999998888' },
    { id: 'demo-5', nome: 'Antônio Marcos', profissao: 'Encanador', cidade: 'Timbaúba - PE', whatsapp: '81987651234' }
  ]
};
