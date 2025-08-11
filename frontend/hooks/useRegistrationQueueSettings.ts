import { useEffect, useState } from 'react'

import { doApiRequest } from '../utils'
import { RegistrationQueueSettings } from '../types'

export interface UseRegistrationQueueSettingsReturn {
  settings: RegistrationQueueSettings | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

/**
 * Custom hook to fetch and manage registration queue settings.
 * Provides the current queue settings with loading state and error handling.
 */
export const useRegistrationQueueSettings = (): UseRegistrationQueueSettingsReturn => {
  const [settings, setSettings] = useState<RegistrationQueueSettings | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await doApiRequest('/settings/queue/?format=json')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch queue settings: ${response.status}`)
      }
      
      const data = await response.json()
      setSettings(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      setSettings(null)
    } finally {
      setIsLoading(false)
    }
  }

  const refetch = () => {
    fetchSettings()
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  return {
    settings,
    isLoading,
    error,
    refetch,
  }
}
