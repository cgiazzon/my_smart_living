export function formatCpfCnpj(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14)
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

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
  }
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
}

export function isCnpj(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  return digits.length > 11
}

export function isValidCpf(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(digits.charAt(i)) * (10 - i)
  let rev = 11 - (sum % 11)
  if (rev === 10 || rev === 11) rev = 0
  if (rev !== parseInt(digits.charAt(9))) return false

  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(digits.charAt(i)) * (11 - i)
  rev = 11 - (sum % 11)
  if (rev === 10 || rev === 11) rev = 0
  if (rev !== parseInt(digits.charAt(10))) return false

  return true
}

export function isValidCnpj(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, '')
  if (digits.length !== 14 || /^(\d)\1{13}$/.test(digits)) return false

  let size = digits.length - 2
  let numbers = digits.substring(0, size)
  const digitsPart = digits.substring(size)
  let sum = 0
  let pos = size - 7

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--
    if (pos < 2) pos = 9
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digitsPart.charAt(0))) return false

  size = size + 1
  numbers = digits.substring(0, size)
  sum = 0
  pos = size - 7
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--
    if (pos < 2) pos = 9
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digitsPart.charAt(1))) return false

  return true
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
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
