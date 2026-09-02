'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCpfCnpj, formatPhone, isCnpj, isValidCpf, isValidCnpj, isValidEmail } from '@/lib/utils'

const SERVICOS = [
  { id: 'lavanderia',        label: 'Lavanderia',              icon: '🧺' },
  { id: 'internet',          label: 'Internet',                icon: '📡' },
  { id: 'biometrico',        label: 'Acesso Biométrico',       icon: '🔐' },
  { id: 'mercadinho',        label: 'Mercadinho',              icon: '🛒' },
  { id: 'recarga_eletrica',  label: 'Recarga de Carros Elétricos', icon: '⚡' },
  { id: 'arrumacao',         label: 'Arrumação de Quartos',    icon: '🛏️' },
]

type Investidor = {
  id: string
  token_unico: string
  nome: string
  cpf_cnpj: string
  email: string
  whatsapp: string
  condominio_id: string
  numero_venda: string
  apto: string
  condominios?: { nome: string }
}

type FormErrors = Record<string, string>

export default function CadastroPage() {
  const params = useSearchParams()
  const token = params.get('id')
  const supabase = createClient()

  const [investidor, setInvestidor] = useState<Investidor | null>(null)
  const [condominios, setCondominios] = useState<{ id: string; nome: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [notFound, setNotFound] = useState(false)

  // Campos do formulário
  const [nome, setNome] = useState('')
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [condominioId, setCondominioId] = useState('')
  const [bloco, setBloco] = useState('')
  const [unidade, setUnidade] = useState('')
  const [statusUnidade, setStatusUnidade] = useState('')
  const [servicos, setServicos] = useState<string[]>([])
  const [lgpdConsentido, setLgpdConsentido] = useState(false)
  const [autorizaContato, setAutorizaContato] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    const { data: conds } = await supabase.from('condominios').select('id, nome').order('nome')
    setCondominios(conds || [])

    if (token) {
      const { data: inv } = await supabase
        .from('investidores')
        .select('*, condominios(nome)')
        .eq('token_unico', token)
        .single()

      if (inv) {
        setInvestidor(inv)
        setNome(inv.nome || '')
        setCpfCnpj(formatCpfCnpj(inv.cpf_cnpj || ''))
        setEmail(inv.email || '')
        setWhatsapp(formatPhone(inv.whatsapp || ''))
        setCondominioId(inv.condominio_id || '')
        setUnidade(inv.apto || '')

        // Registra abertura do link
        await supabase.rpc('registrar_abertura_link', { p_token: token })
      } else {
        setNotFound(true)
      }
    }
    setLoading(false)
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadData() }, [loadData])

  const toggleServico = (id: string) => {
    setServicos(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
  }

  const validate = (): boolean => {
    const errs: FormErrors = {}
    if (!nome.trim()) errs.nome = 'Nome é obrigatório'
    
    // Validação CPF / CNPJ
    if (!cpfCnpj.trim()) {
      errs.cpfCnpj = 'CPF/CNPJ é obrigatório'
    } else if (isCnpj(cpfCnpj)) {
      if (!isValidCnpj(cpfCnpj)) errs.cpfCnpj = 'CNPJ inválido'
    } else {
      if (!isValidCpf(cpfCnpj)) errs.cpfCnpj = 'CPF inválido'
    }

    // Validação E-mail
    if (!email.trim()) {
      errs.email = 'E-mail é obrigatório'
    } else if (!isValidEmail(email)) {
      errs.email = 'Insira um e-mail válido com @ (ex: nome@dominio.com)'
    }

    // Validação WhatsApp / Telefone
    const phoneDigits = whatsapp.replace(/\D/g, '')
    if (!whatsapp.trim()) {
      errs.whatsapp = 'WhatsApp é obrigatório'
    } else if (phoneDigits.length < 10) {
      errs.whatsapp = 'Telefone/WhatsApp deve ter DDD + número'
    }

    if (!condominioId) errs.condominioId = 'Selecione o condomínio'
    if (!unidade.trim()) errs.unidade = 'Número da unidade é obrigatório'
    if (!statusUnidade) errs.statusUnidade = 'Selecione o status da unidade'
    if (!lgpdConsentido) errs.lgpd = 'Você precisa aceitar o tratamento de dados (LGPD)'
    
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)

    const agora = new Date().toISOString()
    const condNome = condominios.find(c => c.id === condominioId)?.nome || ''

    const { error } = await supabase.from('respostas').insert({
      investidor_id: investidor?.id || null,
      nome_completo: nome,
      cpf_cnpj: cpfCnpj,
      email,
      whatsapp,
      condominio: condNome,
      bloco,
      unidade,
      status_unidade: statusUnidade,
      servicos_interesse: servicos,
      lgpd_consentido: lgpdConsentido,
      autoriza_contato: autorizaContato,
      assinatura_eletronica: `Aceite digital de ${nome} (${cpfCnpj})`,
      assinatura_timestamp: agora,
    })

    if (!error && investidor) {
      await supabase
        .from('investidores')
        .update({ status_envio: 'respondeu' })
        .eq('id', investidor.id)
    }

    setSubmitting(false)
    if (!error) setSubmitted(true)
    else alert('Erro ao enviar. Tente novamente.')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin" style={{ width: 40, height: 40, border: '3px solid var(--gray-200)', borderTopColor: 'var(--navy)', borderRadius: '50%', margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--gray-500)' }}>Carregando...</p>
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
          <h1 style={{ color: 'var(--navy)', fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>Link não encontrado</h1>
          <p style={{ color: 'var(--gray-500)' }}>Verifique se o link está correto ou entre em contato com a equipe My Smart Living.</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-100)', padding: '2rem' }}>
        <div className="success-screen" style={{ maxWidth: 480, background: 'white', borderRadius: 20, padding: '3rem 2rem', boxShadow: '0 8px 32px rgba(27,58,107,0.12)' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ color: 'var(--navy)', fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>Cadastro enviado!</h2>
          <p style={{ color: 'var(--gray-500)', lineHeight: 1.6 }}>
            Obrigado, <strong style={{ color: 'var(--navy)' }}>{nome}</strong>!<br />
            Suas informações foram registradas com sucesso. Em breve nossa equipe entrará em contato.
          </p>
          <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--gray-100)', borderRadius: 10, fontSize: '0.85rem', color: 'var(--gray-500)' }}>
            Aceite termo LGPD registrado digitalmente em {new Date().toLocaleString('pt-BR')}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-100)', paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ background: 'var(--navy)', padding: '1.5rem 2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'var(--red)', width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>🏢</div>
          <div>
            <h1 style={{ color: 'white', fontSize: '1.125rem', fontWeight: 800, lineHeight: 1.2 }}>My Smart Living</h1>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.8rem' }}>Cadastro de Investidor — Mapeamento de Unidades</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '2rem auto', padding: '0 1rem' }}>
        {investidor && (
          <div style={{ background: 'rgba(27,58,107,0.08)', border: '1px solid rgba(27,58,107,0.2)', borderRadius: 12, padding: '0.875rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.25rem' }}>👋</span>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--navy)', fontSize: '0.9rem' }}>Olá, {investidor.nome.split(' ')[0]}!</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>Preencha o formulário abaixo. Seus dados foram pré-preenchidos para facilitar.</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Seção 1 */}
          <div className="form-card">
            <div className="section-title">
              <span className="section-badge">1</span>
              Dados do Proprietário
            </div>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label className="form-label">Nome Completo *</label>
                <input className={`form-input${errors.nome ? ' error' : ''}`} value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome completo" />
                {errors.nome && <p className="form-error">{errors.nome}</p>}
              </div>
              <div>
                <label className="form-label">{isCnpj(cpfCnpj) ? 'CNPJ' : 'CPF'} *</label>
                <input
                  className={`form-input${errors.cpfCnpj ? ' error' : ''}`}
                  value={cpfCnpj}
                  onChange={e => setCpfCnpj(formatCpfCnpj(e.target.value))}
                  placeholder="000.000.000-00 ou 00.000.000/0001-00"
                  maxLength={18}
                />
                {errors.cpfCnpj && <p className="form-error">{errors.cpfCnpj}</p>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">E-mail *</label>
                  <input className={`form-input${errors.email ? ' error' : ''}`} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" />
                  {errors.email && <p className="form-error">{errors.email}</p>}
                </div>
                <div>
                  <label className="form-label">WhatsApp *</label>
                  <input className={`form-input${errors.whatsapp ? ' error' : ''}`} value={whatsapp} onChange={e => setWhatsapp(formatPhone(e.target.value))} placeholder="(34) 99999-0000" maxLength={15} />
                  {errors.whatsapp && <p className="form-error">{errors.whatsapp}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Seção 2 */}
          <div className="form-card">
            <div className="section-title">
              <span className="section-badge">2</span>
              Identificação da Unidade
            </div>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label className="form-label">Condomínio *</label>
                <select className={`form-input${errors.condominioId ? ' error' : ''}`} value={condominioId} onChange={e => setCondominioId(e.target.value)}>
                  <option value="">Selecione o condomínio</option>
                  {condominios.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
                {errors.condominioId && <p className="form-error">{errors.condominioId}</p>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Bloco / Torre</label>
                  <input className="form-input" value={bloco} onChange={e => setBloco(e.target.value)} placeholder="Ex: Torre A" />
                </div>
                <div>
                  <label className="form-label">Número da Unidade *</label>
                  <input className={`form-input${errors.unidade ? ' error' : ''}`} value={unidade} onChange={e => setUnidade(e.target.value)} placeholder="Ex: 204" />
                  {errors.unidade && <p className="form-error">{errors.unidade}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Seção 3 */}
          <div className="form-card">
            <div className="section-title">
              <span className="section-badge">3</span>
              Status da Unidade
            </div>
            {errors.statusUnidade && <p className="form-error" style={{ marginBottom: '0.75rem' }}>{errors.statusUnidade}</p>}
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {[
                { id: 'proprio',    label: 'Ocupada pelo proprietário', icon: '🏠' },
                { id: 'alugado',    label: 'Alugada',                   icon: '🔑' },
                { id: 'desocupado', label: 'Desocupada',                icon: '🏗️' },
              ].map(opt => (
                <div key={opt.id} className={`radio-card${statusUnidade === opt.id ? ' selected' : ''}`} onClick={() => setStatusUnidade(opt.id)}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${statusUnidade === opt.id ? 'var(--navy)' : 'var(--gray-200)'}`, background: statusUnidade === opt.id ? 'var(--navy)' : 'transparent', flexShrink: 0, transition: 'all 0.2s', boxShadow: statusUnidade === opt.id ? '0 0 0 3px rgba(27,58,107,0.15)' : 'none' }} />
                  <span style={{ fontSize: '1.25rem' }}>{opt.icon}</span>
                  <span style={{ fontWeight: 600, color: 'var(--gray-700)', fontSize: '0.9375rem' }}>{opt.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Seção 4 */}
          <div className="form-card">
            <div className="section-title">
              <span className="section-badge">4</span>
              Serviços de Interesse
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginBottom: '1rem' }}>Selecione todos os serviços que você tem interesse em contratar:</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
              {SERVICOS.map(s => (
                <div key={s.id} className={`service-card${servicos.includes(s.id) ? ' selected' : ''}`} onClick={() => toggleServico(s.id)}>
                  <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${servicos.includes(s.id) ? 'var(--navy)' : 'var(--gray-200)'}`, background: servicos.includes(s.id) ? 'var(--navy)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                    {servicos.includes(s.id) && <span style={{ color: 'white', fontSize: '0.7rem', fontWeight: 900 }}>✓</span>}
                  </div>
                  <span className="service-icon">{s.icon}</span>
                  <span className="service-label">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Seção 5 — LGPD */}
          <div className="form-card">
            <div className="section-title">
              <span className="section-badge">5</span>
              Consentimento LGPD
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div className={`lgpd-check${errors.lgpd ? '' : ''}`} style={{ border: errors.lgpd ? '1px solid var(--red)' : undefined }}>
                <input type="checkbox" id="lgpd" checked={lgpdConsentido} onChange={e => setLgpdConsentido(e.target.checked)} style={{ width: 18, height: 18, marginTop: 2, flexShrink: 0, cursor: 'pointer', accentColor: 'var(--navy)' }} />
                <label htmlFor="lgpd" style={{ fontSize: '0.8rem', lineHeight: 1.5, color: 'var(--gray-700)', cursor: 'pointer' }}>
                  <strong style={{ color: 'var(--navy)' }}>Consentimento obrigatório (Lei 13.709/2018 — LGPD):</strong> Autorizo o tratamento dos meus dados pessoais pela My Smart Living para fins de cadastro, mapeamento de unidades e prestação dos serviços relacionados ao empreendimento. Estou ciente de que posso solicitar a exclusão dos meus dados a qualquer momento.
                </label>
              </div>
              {errors.lgpd && <p className="form-error">{errors.lgpd}</p>}

              <div className="lgpd-check">
                <input type="checkbox" id="contato" checked={autorizaContato} onChange={e => setAutorizaContato(e.target.checked)} style={{ width: 18, height: 18, marginTop: 2, flexShrink: 0, cursor: 'pointer', accentColor: 'var(--navy)' }} />
                <label htmlFor="contato" style={{ fontSize: '0.8rem', lineHeight: 1.5, color: 'var(--gray-700)', cursor: 'pointer' }}>
                  <strong style={{ color: 'var(--navy)' }}>Autorização de contato comercial (opcional):</strong> Autorizo a My Smart Living a me contatar por e-mail e WhatsApp com informações sobre novos serviços, promoções e atualizações do empreendimento.
                </label>
              </div>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={submitting} style={{ marginTop: '0.5rem', fontSize: '1.0625rem', padding: '1rem' }}>
            {submitting ? (
              <>
                <div className="animate-spin" style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%' }} />
                Enviando...
              </>
            ) : (
              <>✅ Enviar Cadastro</>
            )}
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
            Seus dados são protegidos conforme a Lei 13.709/2018 (LGPD).
          </p>
        </form>
      </div>
    </div>
  )
}
