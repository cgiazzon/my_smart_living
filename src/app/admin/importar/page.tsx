'use client'

import { useState, useRef } from 'react'
import Papa from 'papaparse'
import { createClient } from '@/lib/supabase/client'

type Row = Record<string, string>

export default function ImportarPage() {
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<Row[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ novos: number; erros: number } | null>(null)
  const [filename, setFilename] = useState('')

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFilename(file.name)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (r) => setRows(r.data as Row[]),
    })
  }

  const handleImport = async () => {
    if (!rows.length) return
    setImporting(true)
    let novos = 0, erros = 0

    for (const row of rows) {
      const token = row.token_unico || row.TOKEN
      const nome = row.nome || row.NOME
      if (!token || !nome) { erros++; continue }

      // Busca ou cria o condomínio
      let condId: string | null = null
      const condNome = row.condominio || row.CONDOMINIO
      if (condNome) {
        let { data: cond } = await supabase.from('condominios').select('id').eq('nome', condNome).single()
        if (!cond) {
          const { data: newCond } = await supabase.from('condominios').insert({ nome: condNome }).select('id').single()
          cond = newCond
        }
        condId = cond?.id || null
      }

      const { error } = await supabase.from('investidores').upsert({
        token_unico: token,
        nome,
        cpf_cnpj: row.cpf_cnpj || row.CPF_CNPJ || '',
        email: row.email || row.EMAIL || '',
        whatsapp: row.whatsapp || row.WHATSAPP || '',
        telefone: row.telefone || row.TELEFONE || '',
        condominio_id: condId,
        numero_venda: row.numero_venda || row.NUMERO_VENDA || '',
        apto: row.apto || row.APTO || '',
      }, { onConflict: 'token_unico' })

      if (error) erros++; else novos++
    }

    setImporting(false)
    setResult({ novos, erros })
    setRows([])
    setFilename('')
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 800 }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy)', marginBottom: '0.5rem' }}>Importar CSV</h1>
      <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', marginBottom: '2rem' }}>
        Importe ou atualize a base de investidores via arquivo CSV.
      </p>

      {result && (
        <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontSize: '1.5rem' }}>✅</span>
          <div>
            <div style={{ fontWeight: 700, color: '#15803D' }}>Importação concluída!</div>
            <div style={{ fontSize: '0.875rem', color: '#166534' }}>{result.novos} registros importados/atualizados{result.erros > 0 ? ` • ${result.erros} erros` : ''}</div>
          </div>
          <button onClick={() => setResult(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#166534', fontSize: '1.125rem' }}>✕</button>
        </div>
      )}

      <div className="form-card" style={{ marginBottom: '1.5rem' }}>
        <div className="section-title">📥 Upload do arquivo</div>
        <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: '1rem', lineHeight: 1.5 }}>
          Colunas esperadas: <code style={{ background: 'var(--gray-100)', padding: '1px 6px', borderRadius: 4, fontSize: '0.75rem' }}>token_unico, nome, cpf_cnpj, email, whatsapp, telefone, condominio, numero_venda, apto</code>
        </p>
        <div style={{ border: '2px dashed var(--gray-200)', borderRadius: 12, padding: '2rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { const fakeEvt = { target: { files: [f] } } as unknown as React.ChangeEvent<HTMLInputElement>; handleFile(fakeEvt) } }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📄</div>
          <div style={{ fontWeight: 600, color: 'var(--navy)', marginBottom: '0.25rem' }}>
            {filename || 'Arraste um arquivo CSV ou clique para selecionar'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>Suporta arquivos .csv</div>
        </div>
        <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFile} />
      </div>

      {rows.length > 0 && (
        <div className="form-card">
          <div className="section-title">👁️ Preview — {rows.length} registros</div>
          <div style={{ overflowX: 'auto', marginBottom: '1.25rem', maxHeight: 320, overflowY: 'auto' }}>
            <table className="data-table" style={{ fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  {Object.keys(rows[0]).slice(0, 6).map(k => <th key={k}>{k}</th>)}
                  {Object.keys(rows[0]).length > 6 && <th>...</th>}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 10).map((r, i) => (
                  <tr key={i}>
                    {Object.values(r).slice(0, 6).map((v, j) => <td key={j}>{v}</td>)}
                    {Object.values(r).length > 6 && <td style={{ color: 'var(--gray-500)' }}>...</td>}
                  </tr>
                ))}
                {rows.length > 10 && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--gray-500)' }}>... e mais {rows.length - 10} registros</td></tr>}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={handleImport} className="btn-primary" disabled={importing} style={{ maxWidth: 200 }}>
              {importing ? 'Importando...' : `✅ Importar ${rows.length} registros`}
            </button>
            <button onClick={() => { setRows([]); setFilename(''); if (fileRef.current) fileRef.current.value = '' }} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
