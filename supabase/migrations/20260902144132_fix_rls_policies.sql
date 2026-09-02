-- Permitir leitura pública limitada da tabela investidores para pré-preenchimento do formulário
create policy "investidores_select_public" on public.investidores
for select using (true);
