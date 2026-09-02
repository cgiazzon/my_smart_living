'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Config = {
  delay_lembrete_dias: number
  email_remetente: string
  email_assunto: string
  email_corpo: string
}

export default function ConfigPage() {
  const supabase = createClient()
  const [config, setConfig] = useState<Config>({ delay_lembrete_dias: 7, email_remetente: '', email_assunto: '', email_corpo: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.from('configuracoes').select('*').eq('id', 1).single().then(({ data }) => {
      if (data) setConfig(data)
      setLoading(false)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await supabase.from('configuracoes').update({ ...config, updated_at: new Date().toISOString() }).eq('id', 1)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return <div style={{ padding: '2rem', color: 'var(--gray-500)' }}>Carregando...</div>

  return (
    <div style={{ padding: '2rem', maxWidth: 640 }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy)', marginBottom: '0.5rem' }}>Configurações</h1>
      <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', marginBottom: '2rem' }}>Gerencie as configurações de lembretes e e-mail.</p>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="form-card">
          <div className="section-title">⏰ Lembrete Automático</div>
          <div>
            <label className="form-label">Dias sem resposta para enviar lembrete</label>
            <input type="number" min={1} max={90} className="form-input" style={{ maxWidth: 120 }}
              value={config.delay_lembrete_dias}
              onChange={e => setConfig(c => ({ ...c, delay_lembrete_dias: parseInt(e.target.value) || 7 }))} />
            <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: '0.375rem' }}>
              O lembrete será enviado para investidores com status &#34;Pendente&#34; ou &#34;Abriu o Link&#34; após este número de dias.
            </p>
          </div>
        </div>

        <div className="form-card">
          <div className="section-title">📧 Configurações de E-mail (Resend)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="form-label">E-mail remetente</label>
              <input type="email" className="form-input" value={config.email_remetente}
                onChange={e => setConfig(c => ({ ...c, email_remetente: e.target.value }))}
                placeholder="noreply@mysmartliving.com.br" />
              <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: '0.375rem' }}>
                ⚠️ O domínio precisa estar verificado no Resend.
              </p>
            </div>
            <div>
              <label className="form-label">Assunto do e-mail</label>
              <input type="text" className="form-input" value={config.email_assunto}
                onChange={e => setConfig(c => ({ ...c, email_assunto: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Corpo do e-mail</label>
              <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.375rem' }}>
                Use <code style={{ background: 'var(--gray-100)', padding: '0 4px', borderRadius: 4 }}>{'{nome}'}</code> e <code style={{ background: 'var(--gray-100)', padding: '0 4px', borderRadius: 4 }}>{'{link}'}</code> como variáveis.
              </p>
              <textarea rows={5} className="form-input" style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '0.85rem' }}
                value={config.email_corpo}
                onChange={e => setConfig(c => ({ ...c, email_corpo: e.target.value }))} />
            </div>
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={saving} style={{ maxWidth: 200 }}>
          {saving ? 'Salvando...' : saved ? '✅ Salvo!' : '💾 Salvar configurações'}
        </button>
      </form>
    </div>
  )
}
