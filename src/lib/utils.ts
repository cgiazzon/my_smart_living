export function formatCpfCnpj(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

export function formatWhatsApp(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
  }
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
}

export function isCnpj(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  return digits.length > 11
}

export function buildInvestidorLink(token: string, baseUrl?: string): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${base}/cadastro?id=${token}`
}

export function formatDate(date: string | Date | null): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(date))
}

export function statusLabel(status: string): { label: string; emoji: string; color: string } {
  switch (status) {
    case 'respondeu':  return { label: 'Respondeu',    emoji: '✅', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' }
    case 'abriu_link': return { label: 'Abriu o Link', emoji: '👁️', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' }
    case 'enviado':    return { label: 'Enviado',       emoji: '📧', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' }
    default:           return { label: 'Pendente',      emoji: '⏳', color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' }
  }
}
