-- Adicionar campos de personalização de condomínio/empreendimento na tabela condominios

alter table public.condominios
  add column if not exists subtitulo_administracao text default 'Sindicância & Administração: My Smart Living & Kato Condomínios',
  add column if not exists previsao_entrega text default 'Outubro/2026',
  add column if not exists data_limite_devolucao text default '30/10/2026',
  add column if not exists email_suporte text default 'contato@mysmartliving.com.br',
  add column if not exists telefone_suporte text default '(34) 99999-0000',
  add column if not exists whatsapp_suporte text default '(34) 99999-0000',
  add column if not exists nome_dpo text default 'My Smart Living DPO',
  add column if not exists email_dpo text default 'dpo@mysmartliving.com.br',
  add column if not exists telefone_dpo text default '(34) 99999-0000';
