import { useSessionRefresh } from '../hooks/useSessionRefresh'

// Component to manage session refresh inside AuthProvider
const SessionManager: React.FC = () => {
  useSessionRefresh()
  return null // This component doesn't render anything
}

export default SessionManager
