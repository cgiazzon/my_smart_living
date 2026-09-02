import { Suspense } from 'react'
import CadastroPage from './page'

export const metadata = {
  title: 'Cadastro de Investidor — My Smart Living',
  description: 'Preencha seus dados e confirme o interesse nos serviços do empreendimento.',
}

export default function CadastroLayout() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #E2E8F0', borderTopColor: '#1B3A6B', borderRadius: '50%' }} className="animate-spin" />
      </div>
    }>
      <CadastroPage />
    </Suspense>
  )
}
