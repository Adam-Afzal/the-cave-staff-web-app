import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Settings, ToggleLeft, ToggleRight, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { cn } from '../lib/utils'

interface FeatureFlag {
  id: string
  key: string
  name: string
  description: string | null
  enabled: boolean
  created_at: string
  updated_at: string
}

export function FeatureFlagsPage() {
  const queryClient = useQueryClient()

  const { data: flags, isLoading, error } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      return data as FeatureFlag[]
    }
  })

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('feature_flags')
        .update({ enabled })
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] })
    }
  })

  const handleToggle = (flag: FeatureFlag) => {
    toggleMutation.mutate({ id: flag.id, enabled: !flag.enabled })
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-cave-gold border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12 text-cave-status-error">
          <AlertCircle className="w-6 h-6 mr-2" />
          Failed to load feature flags
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-cave-text-primary flex items-center gap-3">
          <Settings className="w-7 h-7 text-cave-gold" />
          Feature Flags
        </h1>
        <p className="text-cave-text-secondary mt-1">
          Enable or disable features across the application
        </p>
      </div>

      {/* Flags List */}
      <div className="space-y-4">
        {flags && flags.length > 0 ? (
          flags.map(flag => (
            <div 
              key={flag.id}
              className="bg-cave-bg-card border border-cave-border rounded-lg p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-medium text-cave-text-primary">
                      {flag.name}
                    </h3>
                    <span className={cn(
                      'px-2 py-0.5 rounded text-xs font-medium',
                      flag.enabled 
                        ? 'bg-cave-status-success/20 text-cave-status-success'
                        : 'bg-cave-text-muted/20 text-cave-text-muted'
                    )}>
                      {flag.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  {flag.description && (
                    <p className="text-sm text-cave-text-secondary mb-2">
                      {flag.description}
                    </p>
                  )}
                  <p className="text-xs text-cave-text-muted font-mono">
                    Key: {flag.key}
                  </p>
                </div>

                <button
                  onClick={() => handleToggle(flag)}
                  disabled={toggleMutation.isPending}
                  className={cn(
                    'p-1 rounded-lg transition-colors',
                    flag.enabled 
                      ? 'text-cave-status-success hover:bg-cave-status-success/10'
                      : 'text-cave-text-muted hover:bg-cave-bg-elevated'
                  )}
                >
                  {flag.enabled ? (
                    <ToggleRight className="w-10 h-10" />
                  ) : (
                    <ToggleLeft className="w-10 h-10" />
                  )}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <Settings className="w-12 h-12 text-cave-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-cave-text-primary mb-2">No feature flags</h3>
            <p className="text-cave-text-secondary">
              Feature flags will appear here once configured
            </p>
          </div>
        )}
      </div>
    </div>
  )
}