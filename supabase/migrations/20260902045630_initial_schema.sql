-- ============================================================
-- MySmartLiving — Schema inicial
-- ============================================================

-- Extensões
create extension if not exists "pgcrypto";

-- ============================================================
-- TABELA: condominios
-- ============================================================
create table if not exists public.condominios (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null unique,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- TABELA: investidores
-- ============================================================
create table if not exists public.investidores (
  id                  uuid primary key default gen_random_uuid(),
  token_unico         text not null unique,
  nome                text not null,
  cpf_cnpj            text,
  email               text,
  whatsapp            text,
  telefone            text,
  condominio_id       uuid references public.condominios(id) on delete set null,
  numero_venda        text,
  apto                text,
  status_envio        text not null default 'pendente'
                        check (status_envio in ('pendente','enviado','respondeu','abriu_link')),
  abriu_link_at       timestamptz,
  lembrete_enviado_at timestamptz,
  created_at          timestamptz not null default now()
);

-- ============================================================
-- TABELA: respostas
-- ============================================================
create table if not exists public.respostas (
  id                    uuid primary key default gen_random_uuid(),
  investidor_id         uuid references public.investidores(id) on delete cascade,
  nome_completo         text,
  cpf_cnpj              text,
  email                 text,
  whatsapp              text,
  condominio            text,
  bloco                 text,
  unidade               text,
  status_unidade        text check (status_unidade in ('proprio','alugado','desocupado')),
  servicos_interesse    text[],
  lgpd_consentido       boolean not null default false,
  autoriza_contato      boolean not null default false,
  assinatura_eletronica text,
  assinatura_timestamp  timestamptz,
  created_at            timestamptz not null default now()
);

-- ============================================================
-- TABELA: configuracoes
-- ============================================================
create table if not exists public.configuracoes (
  id                    int primary key default 1,
  delay_lembrete_dias   int not null default 7,
  email_remetente       text not null default 'noreply@mysmartliving.com.br',
  email_assunto         text not null default 'Lembrete: Cadastro My Smart Living',
  email_corpo           text not null default 'Olá {nome}, por favor preencha seu cadastro: {link}',
  updated_at            timestamptz not null default now(),
  constraint configuracoes_single_row check (id = 1)
);

-- Garante que sempre existe 1 linha de configuração
insert into public.configuracoes (id) values (1) on conflict do nothing;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.condominios   enable row level security;
alter table public.investidores  enable row level security;
alter table public.respostas     enable row level security;
alter table public.configuracoes enable row level security;

-- condominios: leitura pública, escrita só autenticados
create policy "condominios_select_public"  on public.condominios for select using (true);
create policy "condominios_insert_auth"    on public.condominios for insert with check (auth.role() = 'authenticated');
create policy "condominios_update_auth"    on public.condominios for update using (auth.role() = 'authenticated');
create policy "condominios_delete_auth"    on public.condominios for delete using (auth.role() = 'authenticated');

-- investidores: leitura total só autenticados; update de campos de rastreio permitido via função
create policy "investidores_select_auth"   on public.investidores for select using (auth.role() = 'authenticated');
create policy "investidores_insert_auth"   on public.investidores for insert with check (auth.role() = 'authenticated');
create policy "investidores_update_auth"   on public.investidores for update using (auth.role() = 'authenticated');
create policy "investidores_delete_auth"   on public.investidores for delete using (auth.role() = 'authenticated');

-- respostas: qualquer um pode inserir (formulário público), só autenticados lêem
create policy "respostas_insert_public"    on public.respostas for insert with check (true);
create policy "respostas_select_auth"      on public.respostas for select using (auth.role() = 'authenticated');

-- configuracoes: só autenticados
create policy "configuracoes_all_auth"     on public.configuracoes for all using (auth.role() = 'authenticated');

-- ============================================================
-- FUNÇÃO: registrar abertura de link (anon pode chamar)
-- ============================================================
create or replace function public.registrar_abertura_link(p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.investidores
  set
    abriu_link_at = coalesce(abriu_link_at, now()),
    status_envio  = case when status_envio = 'pendente' or status_envio = 'enviado' then 'abriu_link' else status_envio end
  where token_unico = p_token;
end;
$$;

-- ============================================================
-- SEED: Condomínio
-- ============================================================
insert into public.condominios (nome) values ('VERSA LOFT STYLE') on conflict do nothing;

-- ============================================================
-- SEED: Investidores (base inicial — 47 registros)
-- ============================================================
do $$
declare v_cond_id uuid;
begin
  select id into v_cond_id from public.condominios where nome = 'VERSA LOFT STYLE';

  insert into public.investidores (token_unico, nome, cpf_cnpj, email, whatsapp, telefone, condominio_id, numero_venda, apto) values
  ('MSL-001','RENATA GONÇALVES PEREIRA','040.572.336-95','renata.gpereira@hotmail.com','3131000031','34991557291',v_cond_id,'19012','1'),
  ('MSL-002','MARCIA GERALDA OLIVEIRA','655.669.046-53','marciaaft2015@hotmail.com','3131000031','34992348447',v_cond_id,'19013','2'),
  ('MSL-003','PAULO GREGORIO VERGARA MUKAI','302.721.698-89','mukaip@hotmail.com','3131000031','34999253119',v_cond_id,'19014','3'),
  ('MSL-004','ANDREZA CAMILA BUENO','313.611.078-12','andrezacbueno@hotmail.com','3434997740589','3131000031',v_cond_id,'19016','5'),
  ('MSL-005','HELOISA VERZOLA CALABRIA','091.546.376-86','heloisavc@gmail.com','+5534999764441','+34998789977',v_cond_id,'19017','7'),
  ('MSL-006','ALESSIO RAINIER ARAUJO MARQUES','050.072.526-89','alessiorainier@gmail.com','3131000031','68999018900',v_cond_id,'19018','8'),
  ('MSL-007','CELSO HENRIQUE MAGALHAES DE BRITO','033.495.106-20','triangpecas@gmail.com','3131000031','34992370001',v_cond_id,'19020','10'),
  ('MSL-008','GUSTAVO PRADO OLIVEIRA','042.445.276-64','gustavoprado@iftm.edu.br','3131000031','34997901999',v_cond_id,'19022','102'),
  ('MSL-009','FERNANDO COSTA MORAES','037.224.606-03','fernandocostamoraes@hotmail.com','3131000031','34992286358',v_cond_id,'19023','103'),
  ('MSL-010','THIAGO DE SOUSA ALVES','097.631.596-36','thiagoitba2@hotmail.com','3434996967326','3131000031',v_cond_id,'19024','104'),
  ('MSL-011','ANDREA BORGES ALVES GURGEL DO AMARAL','061.822.796-21','andreaborgesalves@hotmail.com','69992865662','69992839999',v_cond_id,'19025','105'),
  ('MSL-012','ANTONIO CARLOS NOMURA DE S E SILVA','059.134.056-92','acnomura@yahoo.com.br','3434988111699','3432358427',v_cond_id,'19026','106'),
  ('MSL-013','MAAC EMPREENDIMENTOS LTDA','40.587.284/0001-89','manuelalexandreadm@gmail.com','34991245337','34991245337',v_cond_id,'19027','107'),
  ('MSL-014','FEROLLA DIGITAL LTDA','28.036.559/0001-90','jpferolla1991@gmail.com','3432224241','34998090088',v_cond_id,'19028','108'),
  ('MSL-015','EDSON GONÇALVES JUNIOR','011.985.616-61','dr.edsonjr@gmail.com','3131000031','34999448855',v_cond_id,'19029','109'),
  ('MSL-016','RENATA FRANCO QUEIROZ','004.961.576-98','renata.rfq@gmail.com','3131000031','34993030007',v_cond_id,'19030','110'),
  ('MSL-017','JEAN CARLOS FERREIRA','649.905.326-00','jcf_jean@hotmail.com','3131000031','34991766558',v_cond_id,'19032','202'),
  ('MSL-018','JEAN CARLOS FERREIRA','649.905.326-00','jcf_jean@hotmail.com','3131000031','34991766558',v_cond_id,'19033','203'),
  ('MSL-019','SIDNEY TAVARES BORGES','040.578.826-69','sidneytavaresmg@hotmail.com','3131000031','34999790003',v_cond_id,'19034','204'),
  ('MSL-020','FABIOLA NOGUEIRA LEAL','122.688.566-74','fabiolanleal@gmail.com','3131000031','31993903172',v_cond_id,'19035','205'),
  ('MSL-021','INVISTA CORRETAGEM E IMOVEIS LTDA','36.243.117/0001-43','contabilidade@agorasolucoesemp.con.br','34984109700','34984109700',v_cond_id,'19036','206'),
  ('MSL-022','MAYNNE DE CASSIA TAVARES','558.873.336-34','maynnetavares@gmail.com','3131000031','34991645544',v_cond_id,'19037','207'),
  ('MSL-023','FLAVIO MARTINS BORELA','884.488.006-72','fmborela@yahoo.com.br','343491740396','34991740398',v_cond_id,'19038','208'),
  ('MSL-024','ALESSANDRO APARECIDO CORDEIRO','086.894.266-98','alessandrocoap@hotmail.com','3131000031','34999898623',v_cond_id,'19039','209'),
  ('MSL-025','JADY SILVA PEREIRA PELLEGRINI','012.286.876-50','jadypellegrini@gmail.com','3131000031','34991993068',v_cond_id,'19044','304'),
  ('MSL-026','RAFAEL CARDOSO','068.214.176-36','rafavetufu@gmail.com','3131000031','34988229628',v_cond_id,'19045','305'),
  ('MSL-027','LIGIA CAROLINA OLIVEIRA SILVA','029.630.555-36','ligiacarol1987@hotmail.com','3131000031','34984268022',v_cond_id,'19046','306'),
  ('MSL-028','PATRICIA ROTELLI DE ALMEIDA','814.906.076-68','patirotelli@gmail.com','3131000031','21996982075',v_cond_id,'19047','307'),
  ('MSL-029','RENATA FRANCO QUEIROZ','004.961.576-98','renata.rfq@gmail.com','3131000031','34993030007',v_cond_id,'19048','308'),
  ('MSL-030','RENATO SANTOS RIBEIRO','848.923.076-53','ribeirorenatos@gmail.com','3131000031','34988419355',v_cond_id,'19049','309'),
  ('MSL-031','CARLOS EDUARDO GROHMANN DE SOUZA','013.960.766-89','cadu@polopni.com.br','3131000031','34992287272',v_cond_id,'19050','310'),
  ('MSL-032','CLAUDIO HENRIQUE CARVALHO COSTA','045.474.056-54','claudiohenriquecosta@hotmail.com','3434991761444','3432355010',v_cond_id,'19052','402'),
  ('MSL-033','JOAO VIEIRA DE FARIA NETO','096.859.756-47','joaonetovieiraf@gmail.com','3131000031','34991510938',v_cond_id,'19053','403'),
  ('MSL-034','ARLEI ALMEIDA','866.997.501-78','almeida.neto2005@gmail.com','3131000031','6481015565',v_cond_id,'19054','404'),
  ('MSL-035','TIAGO MANTOVANI','937.338.015-04','timantova@hotmail.com','3131000031','34998139599',v_cond_id,'19056','407'),
  ('MSL-036','CPS ADMINISTRAÇÃO PATRIMONIAL LTDA','24.475.060/0001-29','claiton.pereira@hotmail.com','3434993006767','3131000031',v_cond_id,'19057','408'),
  ('MSL-037','REJANE FRANCO QUEIROZ','069.719.996-73','rejanefq07@gmail.com','34993286565','3131000031',v_cond_id,'19058','409'),
  ('MSL-038','CATU EMPREENDIMENTOS LTDA','71.031.363/0001-32','analuizasilveira75@gmail.com','34999718701','34999791313',v_cond_id,'19059','410'),
  ('MSL-039','ALISSON LIMA DE FREITAS','910.801.186-91','alissonfreitas.udi@hotmail.com','3131000031','34999083470',v_cond_id,'19060','501'),
  ('MSL-040','MAURO BRANDES','312.560.368-46','mauropaulista13@gmail.com','3131000031','34991171770',v_cond_id,'19061','503'),
  ('MSL-041','AURELIANO VIEIRA CAIXETA','831.244.381-91','aureliano77@hotmail.com','3131000031','64992029544',v_cond_id,'19062','504'),
  ('MSL-042','FERNANDA SANTOS DE OLIVEIRA','027.396.896-32','fsoliveira74@gmail.com','3434984143459','34984010123',v_cond_id,'19063','505'),
  ('MSL-043','VITOR EDUARDO SIQUEIRA E ANCHIETA','128.347.016-01','siqueiraeanchieta@gmail.com','3434999981910','34',v_cond_id,'19065','507'),
  ('MSL-044','RAPHAEL RIBEIRO CUNHA','054.254.056-85','raphaelcunha83@gmail.com','3131000031','34996554094',v_cond_id,'19066','508'),
  ('MSL-045','PRIETO SOLUCOES EM INFORMATICA LTDA','10.015.756/0001-68','evandroprieto@gmail.com','3432359011','34992339915',v_cond_id,'19067','509'),
  ('MSL-046','FOCUS GESTAO DE PATRIMONIO E PARTICIPACO','37.059.809/0001-07','fernanda@focusesg.com','34999718701','34999718701',v_cond_id,'19068','510'),
  ('MSL-047','JUCINEI FERREIRA DA CUNHA','112.198.276-06','jucineifc@gmail.com','5534991560886','5534991560886',v_cond_id,'21684','210')
  on conflict (token_unico) do nothing;
end;
$$;
