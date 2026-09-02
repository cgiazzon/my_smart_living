'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCpfCnpj, formatPhone, formatCep, isCnpj, isValidCpf, isValidCnpj, isValidEmail, isValidCep } from '@/lib/utils'

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
  condominios?: {
    nome: string
    subtitulo_administracao: string
    previsao_entrega: string
    data_limite_devolucao: string
    email_suporte: string
    telefone_suporte: string
    whatsapp_suporte: string
    nome_dpo: string
    email_dpo: string
    telefone_dpo: string
  }
}

type FormErrors = Record<string, string>

export default function CadastroPage() {
  const params = useSearchParams()
  const token = params.get('id')
  const supabase = createClient()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [investidor, setInvestidor] = useState<Investidor | null>(null)
  const [condominios, setCondominios] = useState<{ id: string; nome: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [notFound, setNotFound] = useState(false)

  // ================= PARTE 1 =================
  const [unidade, setUnidade] = useState('')
  const [bloco, setBloco] = useState('')
  const [qtdUnidades, setQtdUnidades] = useState('1')
  const [nome, setNome] = useState('')
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [endereco, setEndereco] = useState('')
  const [cidadeUf, setCidadeUf] = useState('')
  const [cep, setCep] = useState('')
  const [condominioId, setCondominioId] = useState('')

  // Coproprietário
  const [hasCoproprietario, setHasCoproprietario] = useState(false)
  const [coproprietarioNome, setCoproprietarioNome] = useState('')
  const [coproprietarioCpf, setCoproprietarioCpf] = useState('')
  const [coproprietarioTelefone, setCoproprietarioTelefone] = useState('')

  // Representante Legal (PJ)
  const [pjRepresentanteNome, setPjRepresentanteNome] = useState('')
  const [pjRepresentanteCpf, setPjRepresentanteCpf] = useState('')
  const [pjRepresentanteTelefone, setPjRepresentanteTelefone] = useState('')

  // Interlocutor Oficial
  const [hasInterlocutorDiferente, setHasInterlocutorDiferente] = useState(false)
  const [interlocutorNome, setInterlocutorNome] = useState('')
  const [interlocutorTelefone, setInterlocutorTelefone] = useState('')

  // ================= PARTE 2 =================
  const [destinacao, setDestinacao] = useState('')
  const [quemAdministra, setQuemAdministra] = useState('')
  const [quemAdministraQual, setQuemAdministraQual] = useState('')
  const [comoMobiliar, setComoMobiliar] = useState('')
  const [comoMobiliarFornecedor, setComoMobiliarFornecedor] = useState('')
  const [mesAnoPronta, setMesAnoPronta] = useState('')
  const [mesAnoObservacao, setMesAnoObservacao] = useState('')
  const [quemRecebeChaves, setQuemRecebeChaves] = useState('')
  const [procuradorNomeTelefone, setProcuradorNomeTelefone] = useState('')
  const [pretendeObra, setPretendeObra] = useState('')
  const [pretendeObraQual, setPretendeObraQual] = useState('')
  const [propostasApoio, setPropostasApoio] = useState<string[]>([])
  const [campoSinalizar, setCampoSinalizar] = useState('')
  const [querLigacao, setQuerLigacao] = useState('')
  const [melhorDiaHorario, setMelhorDiaHorario] = useState('')

  // ================= PARTE 3 =================
  const [declaracaoAceita, setDeclaracaoAceita] = useState(false)
  const [lgpdCompartilhamento, setLgpdCompartilhamento] = useState(false)

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

        await supabase.rpc('registrar_abertura_link', { p_token: token })
      } else {
        setNotFound(true)
      }
    } else {
      if (conds && conds.length > 0) setCondominioId(conds[0].id)
    }
    setLoading(false)
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadData() }, [loadData])

  const toggleProposta = (id: string) => {
    if (id === 'nenhum') {
      setPropostasApoio(['nenhum'])
      return
    }
    setPropostasApoio(prev => {
      const newArr = prev.filter(p => p !== 'nenhum')
      return newArr.includes(id) ? newArr.filter(p => p !== id) : [...newArr, id]
    })
  }

  const validateStep1 = (): boolean => {
    const errs: FormErrors = {}
    if (!unidade.trim()) errs.unidade = 'Número da unidade é obrigatório'
    if (!nome.trim()) errs.nome = 'Nome / Razão Social é obrigatório'
    
    if (!cpfCnpj.trim()) {
      errs.cpfCnpj = 'CPF/CNPJ é obrigatório'
    } else if (isCnpj(cpfCnpj)) {
      if (!isValidCnpj(cpfCnpj)) errs.cpfCnpj = 'CNPJ inválido'
    } else {
      if (!isValidCpf(cpfCnpj)) errs.cpfCnpj = 'CPF inválido'
    }

    if (!email.trim()) {
      errs.email = 'E-mail é obrigatório'
    } else if (!isValidEmail(email)) {
      errs.email = 'E-mail inválido (ex: nome@dominio.com)'
    }

    const phoneDigits = whatsapp.replace(/\D/g, '')
    if (!whatsapp.trim()) {
      errs.whatsapp = 'Telefone/WhatsApp é obrigatório'
    } else if (phoneDigits.length < 10) {
      errs.whatsapp = 'Telefone/WhatsApp deve ter DDD + número'
    }

    if (cep.trim() && !isValidCep(cep)) {
      errs.cep = 'CEP inválido (deve conter 8 dígitos — ex: 38400-000)'
    }

    if (!condominioId) errs.condominioId = 'Selecione o condomínio'

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const validateStep2 = (): boolean => {
    const errs: FormErrors = {}
    if (!destinacao) errs.destinacao = 'Selecione a destinação da unidade'
    if (!quemAdministra) errs.quemAdministra = 'Selecione quem vai administrar'
    if (!comoMobiliar) errs.comoMobiliar = 'Selecione como pretende mobiliar'
    if (!quemRecebeChaves) errs.quemRecebeChaves = 'Selecione quem recebe as chaves'
    if (!pretendeObra) errs.pretendeObra = 'Responda se pretende fazer obra'
    if (propostasApoio.length === 0) errs.propostasApoio = 'Selecione ao menos uma opção'

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const validateStep3 = (): boolean => {
    const errs: FormErrors = {}
    if (!declaracaoAceita) errs.declaracaoAceita = 'Você precisa aceitar a declaração e os termos cadastrais'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (step === 2 && validateStep2()) {
      setStep(3)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep3()) return
    setSubmitting(true)

    const agora = new Date().toISOString()
    const condNome = condominios.find(c => c.id === condominioId)?.nome || 'VERSA LOFT STYLE'

    const { error } = await supabase.from('respostas').insert({
      investidor_id: investidor?.id || null,
      nome_completo: nome,
      cpf_cnpj: cpfCnpj,
      email,
      whatsapp,
      condominio: condNome,
      bloco,
      unidade,
      qtd_unidades: qtdUnidades,
      endereco_correspondencia: endereco,
      cidade_uf: cidadeUf,
      cep,
      coproprietario_nome: hasCoproprietario ? coproprietarioNome : null,
      coproprietario_cpf: hasCoproprietario ? coproprietarioCpf : null,
      coproprietario_telefone: hasCoproprietario ? coproprietarioTelefone : null,
      pj_representante_nome: isCnpj(cpfCnpj) ? pjRepresentanteNome : null,
      pj_representante_cpf: isCnpj(cpfCnpj) ? pjRepresentanteCpf : null,
      pj_representante_telefone: isCnpj(cpfCnpj) ? pjRepresentanteTelefone : null,
      interlocutor_nome: hasInterlocutorDiferente ? interlocutorNome : nome,
      interlocutor_telefone: hasInterlocutorDiferente ? interlocutorTelefone : whatsapp,

      // Parte 2
      destinacao_unidade: destinacao,
      quem_administra: quemAdministra,
      quem_administra_qual: quemAdministraQual,
      como_mobiliar: comoMobiliar,
      como_mobiliar_fornecedor: comoMobiliarFornecedor,
      mes_ano_pronta: mesAnoPronta,
      mes_ano_observacao: mesAnoObservacao,
      quem_recebe_chaves: quemRecebeChaves,
      procurador_nome_telefone: procuradorNomeTelefone,
      pretende_obra: pretendeObra,
      pretende_obra_qual: pretendeObraQual,
      propostas_apoio: propostasApoio,
      campo_sinalizar: campoSinalizar,
      quer_ligacao: querLigacao,
      melhor_dia_horario: melhorDiaHorario,

      // Parte 3
      lgpd_consentido: declaracaoAceita,
      autoriza_contato: lgpdCompartilhamento,
      assinatura_eletronica: `Aceite digital Versa Loft de ${nome} (${cpfCnpj})`,
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
    else alert('Erro ao enviar o cadastro. Por favor, tente novamente.')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin" style={{ width: 40, height: 40, border: '3px solid var(--gray-200)', borderTopColor: 'var(--navy)', borderRadius: '50%', margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--gray-500)' }}>Carregando ficha de cadastro...</p>
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
          <p style={{ color: 'var(--gray-500)' }}>Verifique se o link recebido está correto ou entre em contato com a equipe My Smart Living.</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-100)', padding: '2rem' }}>
        <div className="success-screen" style={{ maxWidth: 520, background: 'white', borderRadius: 20, padding: '3rem 2rem', boxShadow: '0 8px 32px rgba(27,58,107,0.12)' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
          <h2 style={{ color: 'var(--navy)', fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>Cadastro & Mapeamento Concluído!</h2>
          <p style={{ color: 'var(--gray-500)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Obrigado, <strong style={{ color: 'var(--navy)' }}>{nome}</strong>!<br />
            Seu cadastro e mapeamento da unidade <strong style={{ color: 'var(--navy)' }}>{unidade}</strong> foram registrados com sucesso pela administração <strong>My Smart Living & Kato Condomínios</strong>.
          </p>
          <div style={{ padding: '1rem', background: 'var(--gray-100)', borderRadius: 10, fontSize: '0.8rem', color: 'var(--gray-500)', textAlign: 'left' }}>
            🔒 Aceite digital e termos declarados em {new Date().toLocaleString('pt-BR')}<br />
            📱 Boletos e comunicados serão enviados para: <strong>{email}</strong>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-100)', paddingBottom: '3rem' }}>
      {/* Header oficial */}
      <div style={{ background: 'var(--navy)', padding: '1.5rem 2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
        <div style={{ maxWidth: 740, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'var(--red)', width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>🏢</div>
            <div>
              <h1 style={{ color: 'white', fontSize: '1.125rem', fontWeight: 800, lineHeight: 1.2 }}>{investidor?.condominios?.nome || 'CONDOMÍNIO VERSA LOFT STYLE'}</h1>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>{investidor?.condominios?.subtitulo_administracao || 'Sindicância & Administração: My Smart Living & Kato Condomínios'}</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 740, margin: '2rem auto', padding: '0 1rem' }}>

        {/* Banner de apresentação */}
        <div style={{ background: 'white', borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid var(--gray-200)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--navy)' }}>Cadastro e Mapeamento da Unidade</h2>
            {investidor?.condominios?.data_limite_devolucao && (
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#991B1B', background: '#FEF2F2', padding: '0.25rem 0.625rem', borderRadius: 20, border: '1px solid #FCA5A5' }}>
                Devolver preenchido até {investidor.condominios.data_limite_devolucao}
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: 1.6, marginBottom: '0.75rem' }}>
            Prezado(a) proprietário(a), a entrega está prevista para <strong>{investidor?.condominios?.previsao_entrega || 'breve'}</strong>. Precisamos de duas coisas: seus dados de cadastro na administradora e uma leitura de como você pretende usar a unidade. Só isso — o resto a gente resolve com você ao longo do caminho.
          </p>
          <div style={{ background: 'rgba(27,58,107,0.04)', borderRadius: 10, padding: '0.875rem 1rem', borderLeft: '4px solid var(--navy)', fontSize: '0.8rem', color: 'var(--gray-700)', lineHeight: 1.5 }}>
            💡 <strong>Importante:</strong> Nada aqui é votação ou contratação obrigatória. É cadastro e mapeamento. Se você ainda não decidiu algum ponto, marque &quot;Ainda não decidi&quot;.
          </div>
        </div>

        {/* Indicador de Etapas */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', background: 'white', borderRadius: 12, padding: '0.75rem 1.25rem', border: '1px solid var(--gray-200)' }}>
          {[
            { num: 1, label: 'PARTE 1: Cadastro' },
            { num: 2, label: 'PARTE 2: Mapeamento' },
            { num: 3, label: 'PARTE 3: Declarações' },
          ].map(s => (
            <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: s.num < step ? 'pointer' : 'default' }} onClick={() => s.num < step && setStep(s.num as 1 | 2 | 3)}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: step === s.num ? 'var(--navy)' : step > s.num ? '#10B981' : 'var(--gray-200)', color: step >= s.num ? 'white' : 'var(--gray-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>
                {step > s.num ? '✓' : s.num}
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: step === s.num ? 700 : 500, color: step === s.num ? 'var(--navy)' : 'var(--gray-500)', display: step === s.num ? 'inline' : 'none' }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>

          {/* ============================================================ */}
          {/* PARTE 1 — CADASTRO */}
          {/* ============================================================ */}
          {step === 1 && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-card">
                <div className="section-title">
                  <span className="section-badge">1</span>
                  PARTE 1 — Identificação da Unidade e Proprietário
                </div>

                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div>
                    <label className="form-label">Condomínio *</label>
                    <select className={`form-input${errors.condominioId ? ' error' : ''}`} value={condominioId} onChange={e => setCondominioId(e.target.value)}>
                      {condominios.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                    {errors.condominioId && <p className="form-error">{errors.condominioId}</p>}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label className="form-label">Unidade Nº *</label>
                      <input className={`form-input${errors.unidade ? ' error' : ''}`} value={unidade} onChange={e => setUnidade(e.target.value)} placeholder="Ex: 204" />
                      {errors.unidade && <p className="form-error">{errors.unidade}</p>}
                    </div>
                    <div>
                      <label className="form-label">Torre / Bloco</label>
                      <input className="form-input" value={bloco} onChange={e => setBloco(e.target.value)} placeholder="Ex: Torre A" />
                    </div>
                    <div>
                      <label className="form-label">Nº de Unidades</label>
                      <input className="form-input" type="number" min={1} value={qtdUnidades} onChange={e => setQtdUnidades(e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Nome Completo ou Razão Social *</label>
                    <input className={`form-input${errors.nome ? ' error' : ''}`} value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome completo ou Razão Social" />
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
                      <label className="form-label">Telefone Celular / WhatsApp *</label>
                      <input className={`form-input${errors.whatsapp ? ' error' : ''}`} value={whatsapp} onChange={e => setWhatsapp(formatPhone(e.target.value))} placeholder="(00)0000-0000" maxLength={15} />
                      {errors.whatsapp && <p className="form-error">{errors.whatsapp}</p>}
                    </div>
                    <div>
                      <label className="form-label">E-mail *</label>
                      <input className={`form-input${errors.email ? ' error' : ''}`} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" />
                      {errors.email && <p className="form-error">{errors.email}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Endereço para Correspondência</label>
                    <input className="form-input" value={endereco} onChange={e => setEndereco(e.target.value)} placeholder="Rua, número, complemento e bairro" />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                    <div>
                      <label className="form-label">Cidade / UF</label>
                      <input className="form-input" value={cidadeUf} onChange={e => setCidadeUf(e.target.value)} placeholder="Cidade / UF" />
                    </div>
                    <div>
                      <label className="form-label">CEP</label>
                      <input className={`form-input${errors.cep ? ' error' : ''}`} value={cep} onChange={e => setCep(formatCep(e.target.value))} placeholder="00000-000" maxLength={9} />
                      {errors.cep && <p className="form-error">{errors.cep}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bloco Representante Legal (se PJ / CNPJ) */}
              {isCnpj(cpfCnpj) && (
                <div className="form-card" style={{ borderLeft: '4px solid var(--navy)' }}>
                  <div className="section-title">🏢 Representante Legal da Pessoa Jurídica</div>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    <div>
                      <label className="form-label">Nome Completo do Representante</label>
                      <input className="form-input" value={pjRepresentanteNome} onChange={e => setPjRepresentanteNome(e.target.value)} placeholder="Nome do representante legal" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label className="form-label">CPF do Representante</label>
                        <input className="form-input" value={pjRepresentanteCpf} onChange={e => setPjRepresentanteCpf(formatCpfCnpj(e.target.value))} placeholder="000.000.000-00" maxLength={14} />
                      </div>
                      <div>
                        <label className="form-label">Telefone do Representante</label>
                        <input className="form-input" value={pjRepresentanteTelefone} onChange={e => setPjRepresentanteTelefone(formatPhone(e.target.value))} placeholder="(00)0000-0000" maxLength={15} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bloco Coproprietário */}
              <div className="form-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 700, color: 'var(--navy)', fontSize: '0.95rem' }}>Possui Coproprietário na unidade?</div>
                  <button type="button" className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => setHasCoproprietario(!hasCoproprietario)}>
                    {hasCoproprietario ? '✕ Remover Coproprietário' : '+ Adicionar Coproprietário'}
                  </button>
                </div>

                {hasCoproprietario && (
                  <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--gray-200)' }}>
                    <div>
                      <label className="form-label">Nome do Coproprietário</label>
                      <input className="form-input" value={coproprietarioNome} onChange={e => setCoproprietarioNome(e.target.value)} placeholder="Nome completo do coproprietário" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label className="form-label">CPF do Coproprietário</label>
                        <input className="form-input" value={coproprietarioCpf} onChange={e => setCoproprietarioCpf(formatCpfCnpj(e.target.value))} placeholder="000.000.000-00" maxLength={14} />
                      </div>
                      <div>
                        <label className="form-label">Telefone do Coproprietário</label>
                        <input className="form-input" value={coproprietarioTelefone} onChange={e => setCoproprietarioTelefone(formatPhone(e.target.value))} placeholder="(00)0000-0000" maxLength={15} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bloco Interlocutor Oficial */}
              <div className="form-card">
                <div className="section-title">👤 Interlocutor Oficial da Unidade</div>
                <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: '1rem' }}>
                  Pessoa responsável com quem a administradora (Kato Condomínios) tratará todos os assuntos operacionais e boletos.
                </p>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                    <input type="radio" name="interlocutorOpt" checked={!hasInterlocutorDiferente} onChange={() => setHasInterlocutorDiferente(false)} />
                    O próprio proprietário acima
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                    <input type="radio" name="interlocutorOpt" checked={hasInterlocutorDiferente} onChange={() => setHasInterlocutorDiferente(true)} />
                    Outra pessoa / Procurador
                  </label>
                </div>

                {hasInterlocutorDiferente && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.75rem' }}>
                    <div>
                      <label className="form-label">Nome do Interlocutor</label>
                      <input className="form-input" value={interlocutorNome} onChange={e => setInterlocutorNome(e.target.value)} placeholder="Nome do interlocutor" />
                    </div>
                    <div>
                      <label className="form-label">Telefone / WhatsApp</label>
                      <input className="form-input" value={interlocutorTelefone} onChange={e => setInterlocutorTelefone(formatPhone(e.target.value))} placeholder="(00)0000-0000" maxLength={15} />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ background: 'rgba(230,48,34,0.06)', border: '1px solid rgba(230,48,34,0.2)', borderRadius: 10, padding: '0.875rem 1rem', fontSize: '0.8rem', color: '#991B1B', lineHeight: 1.5 }}>
                ⚠️ <strong>Aviso da Administradora (Kato Condomínios):</strong> Boletos e comunicados são enviados exclusivamente em formato digital, por e-mail e pelo aplicativo da administradora. Não há envio impresso.
              </div>

              <button type="button" className="btn-primary" onClick={handleNext} style={{ padding: '0.875rem' }}>
                Avançar para PARTE 2 (Mapeamento) ➔
              </button>
            </div>
          )}

          {/* ============================================================ */}
          {/* PARTE 2 — MAPEAMENTO */}
          {/* ============================================================ */}
          {step === 2 && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-card">
                <div className="section-title">
                  <span className="section-badge">2</span>
                  PARTE 2 — Mapeamento Operacional da Unidade
                </div>

                {/* Pergunta 1 */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--navy)' }}>
                    1. Qual será a destinação da unidade? *
                  </label>
                  {errors.destinacao && <p className="form-error" style={{ marginBottom: '0.5rem' }}>{errors.destinacao}</p>}
                  <div style={{ display: 'grid', gap: '0.625rem', marginTop: '0.5rem' }}>
                    {[
                      'Locação de curta duração — diárias e temporada',
                      'Mensalista — estadias de 30 a 180 dias, mobiliado',
                      'Locação residencial tradicional — 12 meses ou mais',
                      'Uso próprio ou de familiar',
                      'Vender assim que possível',
                      'Ainda não decidi',
                    ].map(opt => (
                      <div key={opt} className={`radio-card${destinacao === opt ? ' selected' : ''}`} onClick={() => setDestinacao(opt)}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${destinacao === opt ? 'var(--navy)' : 'var(--gray-200)'}`, background: destinacao === opt ? 'var(--navy)' : 'transparent', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--gray-700)' }}>{opt}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pergunta 2 */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--navy)' }}>
                    2. Quem vai administrar a unidade? *
                  </label>
                  {errors.quemAdministra && <p className="form-error" style={{ marginBottom: '0.5rem' }}>{errors.quemAdministra}</p>}
                  <div style={{ display: 'grid', gap: '0.625rem', marginTop: '0.5rem' }}>
                    {[
                      'Operadora credenciada',
                      'Imobiliária',
                      'Eu mesmo',
                      'Ainda não decidi',
                    ].map(opt => (
                      <div key={opt} className={`radio-card${quemAdministra === opt ? ' selected' : ''}`} onClick={() => setQuemAdministra(opt)}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${quemAdministra === opt ? 'var(--navy)' : 'var(--gray-200)'}`, background: quemAdministra === opt ? 'var(--navy)' : 'transparent', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--gray-700)' }}>{opt}</span>
                      </div>
                    ))}
                  </div>
                  {(quemAdministra === 'Operadora credenciada' || quemAdministra === 'Imobiliária') && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <label className="form-label">Qual empresa/operadora?</label>
                      <input className="form-input" value={quemAdministraQual} onChange={e => setQuemAdministraQual(e.target.value)} placeholder="Digite o nome da administradora/imobiliária" />
                    </div>
                  )}
                </div>

                {/* Pergunta 3 */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--navy)' }}>
                    3. Como pretende mobiliar? *
                  </label>
                  {errors.comoMobiliar && <p className="form-error" style={{ marginBottom: '0.5rem' }}>{errors.comoMobiliar}</p>}
                  <div style={{ display: 'grid', gap: '0.625rem', marginTop: '0.5rem' }}>
                    {[
                      'Kit padrão (turn key - chave na mão)',
                      'Por minha conta',
                      'Já contratei fornecedor',
                      'Ainda não decidi',
                    ].map(opt => (
                      <div key={opt} className={`radio-card${comoMobiliar === opt ? ' selected' : ''}`} onClick={() => setComoMobiliar(opt)}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${comoMobiliar === opt ? 'var(--navy)' : 'var(--gray-200)'}`, background: comoMobiliar === opt ? 'var(--navy)' : 'transparent', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--gray-700)' }}>{opt}</span>
                      </div>
                    ))}
                  </div>
                  {comoMobiliar === 'Já contratei fornecedor' && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <label className="form-label">Nome do fornecedor contratado</label>
                      <input className="form-input" value={comoMobiliarFornecedor} onChange={e => setComoMobiliarFornecedor(e.target.value)} placeholder="Nome da empresa/marcenaria" />
                    </div>
                  )}
                </div>

                {/* Pergunta 4 */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--navy)' }}>
                    4. Em que mês a unidade estará pronta para operar?
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginTop: '0.5rem' }}>
                    <div>
                      <input className="form-input" value={mesAnoPronta} onChange={e => setMesAnoPronta(e.target.value)} placeholder="Ex: 10/2026" />
                    </div>
                    <div>
                      <input className="form-input" value={mesAnoObservacao} onChange={e => setMesAnoObservacao(e.target.value)} placeholder="Observação se houver" />
                    </div>
                  </div>
                </div>

                {/* Pergunta 5 */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--navy)' }}>
                    5. Quem vai receber as chaves e fazer a vistoria? *
                  </label>
                  {errors.quemRecebeChaves && <p className="form-error" style={{ marginBottom: '0.5rem' }}>{errors.quemRecebeChaves}</p>}
                  <div style={{ display: 'grid', gap: '0.625rem', marginTop: '0.5rem' }}>
                    {[
                      'Eu mesmo',
                      'Procurador',
                      'A administração, em meu nome, com laudo fotográfico',
                    ].map(opt => (
                      <div key={opt} className={`radio-card${quemRecebeChaves === opt ? ' selected' : ''}`} onClick={() => setQuemRecebeChaves(opt)}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${quemRecebeChaves === opt ? 'var(--navy)' : 'var(--gray-200)'}`, background: quemRecebeChaves === opt ? 'var(--navy)' : 'transparent', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--gray-700)' }}>{opt}</span>
                      </div>
                    ))}
                  </div>
                  {quemRecebeChaves === 'Procurador' && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <label className="form-label">Nome e telefone do procurador</label>
                      <input className="form-input" value={procuradorNomeTelefone} onChange={e => setProcuradorNomeTelefone(e.target.value)} placeholder="Nome completo e telefone" />
                    </div>
                  )}
                </div>

                {/* Pergunta 6 */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--navy)' }}>
                    6. Pretende fazer alguma obra ou alteração física na unidade? *
                  </label>
                  <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.5rem' }}>
                    Reforma exige projeto com responsável técnico, ART ou RRT e aprovação prévia (NBR 16280).
                  </p>
                  {errors.pretendeObra && <p className="form-error" style={{ marginBottom: '0.5rem' }}>{errors.pretendeObra}</p>}
                  <div style={{ display: 'grid', gap: '0.625rem' }}>
                    {['Não', 'Sim'].map(opt => (
                      <div key={opt} className={`radio-card${pretendeObra === opt ? ' selected' : ''}`} onClick={() => setPretendeObra(opt)}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${pretendeObra === opt ? 'var(--navy)' : 'var(--gray-200)'}`, background: pretendeObra === opt ? 'var(--navy)' : 'transparent' }} />
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--gray-700)' }}>{opt}</span>
                      </div>
                    ))}
                  </div>
                  {pretendeObra === 'Sim' && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <label className="form-label">Qual alteração pretende fazer?</label>
                      <input className="form-input" value={pretendeObraQual} onChange={e => setPretendeObraQual(e.target.value)} placeholder="Descreva brevemente a reforma pretendida" />
                    </div>
                  )}
                </div>

                {/* Pergunta 7 */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--navy)' }}>
                    7. Você precisa de nosso apoio para receber alguma proposta? *
                  </label>
                  <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.5rem' }}>
                    Marque quantas quiser. Marcar não obriga a nada — só nos autoriza a apresentar condições.
                  </p>
                  {errors.propostasApoio && <p className="form-error" style={{ marginBottom: '0.5rem' }}>{errors.propostasApoio}</p>}
                  <div style={{ display: 'grid', gap: '0.625rem' }}>
                    {[
                      { id: 'montagem', label: 'Montagem da unidade — móveis, marcenaria, eletrodomésticos e decoração' },
                      { id: 'enxoval',  label: 'Enxoval de cama e banho, limpeza e lavanderia' },
                      { id: 'manutencao', label: 'Manutenção da unidade e seguro contra danos de hóspede' },
                      { id: 'operacao', label: 'Operação e locação da unidade' },
                      { id: 'energia',  label: 'Energia elétrica (redução do custo de energia do seu studio)' },
                      { id: 'internet', label: 'Internet (redução de custo e infraestrutura)' },
                      { id: 'nenhum',   label: 'Nenhum — não quero receber propostas' },
                    ].map(item => (
                      <div key={item.id} className={`service-card${propostasApoio.includes(item.id) ? ' selected' : ''}`} onClick={() => toggleProposta(item.id)}>
                        <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${propostasApoio.includes(item.id) ? 'var(--navy)' : 'var(--gray-200)'}`, background: propostasApoio.includes(item.id) ? 'var(--navy)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.7rem', fontWeight: 900 }}>
                          {propostasApoio.includes(item.id) && '✓'}
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-700)' }}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pergunta 8 */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--navy)' }}>
                    8. O que a gente não perguntou e você quer sinalizar?
                  </label>
                  <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.5rem' }}>
                    Dúvida, necessidade, restrição, acordo entre coproprietários, questão fiscal, prazo apertado.
                  </p>
                  <textarea rows={3} className="form-input" style={{ resize: 'vertical' }} value={campoSinalizar} onChange={e => setCampoSinalizar(e.target.value)} placeholder="Escreva aqui qualquer sinalização..." />
                </div>

                {/* Pergunta 9 */}
                <div>
                  <label className="form-label" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--navy)' }}>
                    9. Quer que a gente ligue para tratar de algum ponto?
                  </label>
                  <div style={{ display: 'grid', gap: '0.625rem', marginTop: '0.5rem' }}>
                    {[
                      'Sim',
                      'Prefiro por WhatsApp',
                      'Não é necessário',
                    ].map(opt => (
                      <div key={opt} className={`radio-card${querLigacao === opt ? ' selected' : ''}`} onClick={() => setQuerLigacao(opt)}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${querLigacao === opt ? 'var(--navy)' : 'var(--gray-200)'}`, background: querLigacao === opt ? 'var(--navy)' : 'transparent', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--gray-700)' }}>{opt}</span>
                      </div>
                    ))}
                  </div>
                  {querLigacao === 'Sim' && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <label className="form-label">Melhor dia e horário para ligação</label>
                      <input className="form-input" value={melhorDiaHorario} onChange={e => setMelhorDiaHorario(e.target.value)} placeholder="Ex: Terça-feira no período da tarde" />
                    </div>
                  )}
                </div>

              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setStep(1)} style={{ flex: 1 }}>
                  ⇠ Voltar para PARTE 1
                </button>
                <button type="button" className="btn-primary" onClick={handleNext} style={{ flex: 2 }}>
                  Avançar para PARTE 3 (Declarações) ➔
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* PARTE 3 — DECLARAÇÕES & LGPD */}
          {/* ============================================================ */}
          {step === 3 && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-card">
                <div className="section-title">
                  <span className="section-badge">3</span>
                  PARTE 3 — Declarações e Termos LGPD
                </div>

                {/* Termos Oficiais */}
                <div style={{ background: 'var(--gray-100)', borderRadius: 12, padding: '1.25rem', marginBottom: '1.25rem', fontSize: '0.8rem', color: 'var(--gray-700)', lineHeight: 1.6, maxHeight: 220, overflowY: 'auto', border: '1px solid var(--gray-200)' }}>
                  <strong style={{ color: 'var(--navy)', display: 'block', marginBottom: '0.5rem' }}>DECLARAÇÃO DO PROPRIETÁRIO:</strong>
                  Declaro que as informações prestadas são verdadeiras e que comunicarei qualquer alteração de dados cadastrais à administradora. Estou ciente de que boletos e comunicados são enviados apenas em formato digital, sem comprovante de entrega, e de que o acompanhamento do recebimento e a solicitação de 2ª via são de minha responsabilidade. Declaro estar ciente de que o edifício se destina predominantemente a locação de curta duração, com circulação diária de hóspedes.
                  <br /><br />
                  <strong style={{ color: 'var(--navy)', display: 'block', marginBottom: '0.5rem' }}>USO DOS DADOS (LGPD — Lei 13.709/2018):</strong>
                  Os dados da Parte 1 são tratados pelo condomínio e pela administradora (Kato Condomínios) para cobrança, controle de acesso, comunicação e cumprimento de obrigações legais (LGPD art. 7º, II e V).
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Aceite Obrigatório */}
                  <div className="lgpd-check" style={{ border: errors.declaracaoAceita ? '1.5px solid var(--red)' : undefined }}>
                    <input type="checkbox" id="decAceita" checked={declaracaoAceita} onChange={e => setDeclaracaoAceita(e.target.checked)} style={{ width: 20, height: 20, marginTop: 2, flexShrink: 0, cursor: 'pointer', accentColor: 'var(--navy)' }} />
                    <label htmlFor="decAceita" style={{ fontSize: '0.85rem', lineHeight: 1.5, color: 'var(--gray-900)', cursor: 'pointer' }}>
                      <strong style={{ color: 'var(--navy)' }}>Aceite Obrigatório *</strong><br />
                      Declaro que li e concordo com a Declaração de Cadastro e Regulamento acima.
                    </label>
                  </div>
                  {errors.declaracaoAceita && <p className="form-error">{errors.declaracaoAceita}</p>}

                  {/* Autorização Comercial Facultativa (Questão 7) */}
                  <div className="lgpd-check">
                    <input type="checkbox" id="lgpdComp" checked={lgpdCompartilhamento} onChange={e => setLgpdCompartilhamento(e.target.checked)} style={{ width: 20, height: 20, marginTop: 2, flexShrink: 0, cursor: 'pointer', accentColor: 'var(--navy)' }} />
                    <label htmlFor="lgpdComp" style={{ fontSize: '0.85rem', lineHeight: 1.5, color: 'var(--gray-900)', cursor: 'pointer' }}>
                      <strong style={{ color: 'var(--navy)' }}>Autorização para Propostas (Facultativa)</strong><br />
                      Autorizo a My Smart Living a compartilhar meu nome, telefone, e-mail e unidade com parceiros credenciados exclusivamente para me apresentarem propostas das finalidades marcadas na Questão 7.
                    </label>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setStep(2)} style={{ flex: 1 }}>
                  ⇠ Voltar para PARTE 2
                </button>
                <button type="submit" className="btn-primary" disabled={submitting} style={{ flex: 2, padding: '1rem', fontSize: '1.05rem' }}>
                  {submitting ? 'Enviando...' : '✅ Finalizar e Enviar Cadastro'}
                </button>
              </div>
            </div>
          )}

        </form>
      </div>
    </div>
  )
}
