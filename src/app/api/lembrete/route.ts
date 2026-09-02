import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { buildInvestidorLink } from '@/lib/utils'
import { Resend } from 'resend'

export async function POST(request: Request) {
  const { investidor_id } = await request.json()
  if (!investidor_id) return NextResponse.json({ error: 'Missing investidor_id' }, { status: 400 })

  const supabase = await createServiceClient()

  const { data: inv } = await supabase
    .from('investidores')
    .select('*, condominios(nome)')
    .eq('id', investidor_id)
    .single()

  if (!inv) return NextResponse.json({ error: 'Investidor not found' }, { status: 404 })

  const { data: config } = await supabase.from('configuracoes').select('*').eq('id', 1).single()

  const link = buildInvestidorLink(inv.token_unico, process.env.NEXT_PUBLIC_APP_URL)
  const corpo = (config?.email_corpo || 'Olá {nome}, acesse seu cadastro: {link}')
    .replace('{nome}', inv.nome)
    .replace('{link}', link)

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: config?.email_remetente || 'noreply@mysmartliving.com.br',
    to: inv.email,
    subject: config?.email_assunto || 'Lembrete: Cadastro My Smart Living',
    html: `<p>${corpo.replace(/\n/g, '<br/>')}</p><br/><a href="${link}" style="display:inline-block;background:#1B3A6B;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Preencher Cadastro</a>`,
  })

  if (error) return NextResponse.json({ error }, { status: 500 })

  await supabase.from('investidores').update({
    lembrete_enviado_at: new Date().toISOString(),
    status_envio: inv.status_envio === 'pendente' ? 'enviado' : inv.status_envio,
  }).eq('id', investidor_id)

  return NextResponse.json({ ok: true })
}
