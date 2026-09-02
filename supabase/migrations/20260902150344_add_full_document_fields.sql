-- Adicionar todos os novos campos do documento oficial Versa Loft / Kato Condomínios / My Smart Living na tabela respostas

alter table public.respostas
  -- Parte 1
  add column if not exists qtd_unidades text,
  add column if not exists endereco_correspondencia text,
  add column if not exists cidade_uf text,
  add column if not exists cep text,
  add column if not exists coproprietario_nome text,
  add column if not exists coproprietario_cpf text,
  add column if not exists coproprietario_telefone text,
  add column if not exists pj_representante_nome text,
  add column if not exists pj_representante_cpf text,
  add column if not exists pj_representante_telefone text,
  add column if not exists interlocutor_nome text,
  add column if not exists interlocutor_telefone text,

  -- Parte 2
  add column if not exists destinacao_unidade text,
  add column if not exists quem_administra text,
  add column if not exists quem_administra_qual text,
  add column if not exists como_mobiliar text,
  add column if not exists como_mobiliar_fornecedor text,
  add column if not exists mes_ano_pronta text,
  add column if not exists mes_ano_observacao text,
  add column if not exists quem_recebe_chaves text,
  add column if not exists procurador_nome_telefone text,
  add column if not exists pretende_obra text,
  add column if not exists pretende_obra_qual text,
  add column if not exists propostas_apoio text[],
  add column if not exists campo_sinalizar text,
  add column if not exists quer_ligacao text,
  add column if not exists melhor_dia_horario text;
