import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { buildInvestidorLink } from '@/lib/utils'
import { Resend } from 'resend'

export async function POST(request: Request) {
  try {
    const { investidor_ids } = await request.json()
    if (!Array.isArray(investidor_ids) || investidor_ids.length === 0) {
      return NextResponse.json({ error: 'Nenhum investidor selecionado.' }, { status: 400 })
    }

    const supabase = await createServiceClient()

    // Busca os investidores selecionados com condomínio
    const { data: investidores } = await supabase
      .from('investidores')
      .select('*, condominios(*)')
      .in('id', investidor_ids)

    if (!investidores || investidores.length === 0) {
      return NextResponse.json({ error: 'Investidores não encontrados.' }, { status: 404 })
    }

    const { data: config } = await supabase.from('configuracoes').select('*').eq('id', 1).single()
    const resend = new Resend(process.env.RESEND_API_KEY)

    let enviados = 0
    let erros = 0
    const agora = new Date().toISOString()

    for (const inv of investidores) {
      const link = buildInvestidorLink(inv.token_unico, process.env.NEXT_PUBLIC_APP_URL)
      const condoNome = inv.condominios?.nome || 'CONDOMÍNIO'
      const corpoText = (config?.email_corpo || 'Olá {nome}, acesse o cadastro da sua unidade: {link}')
        .replace('{nome}', inv.nome)
        .replace('{link}', link)

      const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #334155; line-height: 1.6;">
          <div style="background-color: #1B3A6B; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h2 style="color: white; margin: 0; font-size: 20px;">${condoNome}</h2>
            <p style="color: rgba(255,255,255,0.7); margin: 5px 0 0; font-size: 13px;">${inv.condominios?.subtitulo_administracao || 'Cadastro e Mapeamento da Unidade'}</p>
          </div>
          <div style="padding: 30px; background-color: #ffffff; border: 1px solid #E2E8F0; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; color: #0F172A;">Olá, <strong>${inv.nome}</strong>!</p>
            <p>${corpoText.replace(/\n/g, '<br/>')}</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${link}" style="background-color: #1B3A6B; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Preencher Ficha da Unidade ${inv.apto}</a>
            </div>
            <p style="font-size: 12px; color: #64748B;">Ou acesse copiando o link: <br/><a href="${link}" style="color: #1B3A6B;">${link}</a></p>
          </div>
        </div>
      `

      const { error } = await resend.emails.send({
        from: config?.email_remetente || 'noreply@mysmartliving.com.br',
        to: inv.email,
        subject: config?.email_assunto || `Cadastro e Mapeamento — Unidade ${inv.apto}`,
        html: htmlContent,
      })

      if (!error) {
        enviados++
        await supabase.from('investidores').update({
          lembrete_enviado_at: agora,
          status_envio: inv.status_envio === 'pendente' ? 'enviado' : inv.status_envio,
        }).eq('id', inv.id)
      } else {
        erros++
      }
    }

    return NextResponse.json({ ok: true, enviados, erros })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
