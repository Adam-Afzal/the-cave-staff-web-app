import { useState, useMemo, useRef, useEffect } from 'react'
import { X, Search, MapPin, ChevronRight } from 'lucide-react'
import { countries, getLocationFlag } from '../data/locations'

interface LocationPickerModalProps {
  title?: string
  value: string | null
  onSelect: (location: string) => void
  onClose: () => void
}

interface SearchResult {
  label: string
  sublabel: string
  value: string
  flag: string
}

// Pre-build the full flat list once (outside component so it's only done once)
const allResults: SearchResult[] = []
for (const country of countries) {
  // Country-only entry
  allResults.push({
    label: country.name,
    sublabel: '',
    value: country.name,
    flag: country.flag,
  })
  // City entries
  for (const city of country.cities) {
    allResults.push({
      label: city,
      sublabel: country.name,
      value: `${city}, ${country.name}`,
      flag: country.flag,
    })
  }
}

export function LocationPickerModal({ title = 'Select Location', value, onSelect, onClose }: LocationPickerModalProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return allResults
      .filter(r =>
        r.label.toLowerCase().includes(q) ||
        r.sublabel.toLowerCase().includes(q) ||
        r.value.toLowerCase().includes(q)
      )
      .slice(0, 50)
  }, [query])

  const currentFlag = getLocationFlag(value)

  return (
    <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-[60] p-4 pt-16">
      <div className="bg-cave-bg-secondary border border-cave-border rounded-xl w-full max-w-lg overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cave-border">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-cave-gold" />
            <h2 className="text-lg font-semibold text-cave-text-primary">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-cave-text-muted hover:bg-cave-bg-elevated hover:text-cave-text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-cave-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cave-text-muted" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search country or city..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input w-full pl-10"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-cave-text-muted hover:text-cave-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {value && (
            <p className="mt-2 text-xs text-cave-text-muted flex items-center gap-1.5">
              Current:
              {currentFlag && <span className="text-base leading-none">{currentFlag}</span>}
              <span className="text-cave-gold">{value}</span>
            </p>
          )}
        </div>

        {/* Results */}
        <div className="overflow-y-auto max-h-80">
          {query.trim() === '' ? (
            <div className="flex flex-col items-center justify-center py-10 text-cave-text-muted">
              <Search className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">Start typing to search</p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-cave-text-muted">
              <MapPin className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">No locations found</p>
            </div>
          ) : (
            <ul>
              {results.map((result) => (
                <li key={result.value}>
                  <button
                    onClick={() => {
                      onSelect(result.value)
                      onClose()
                    }}
                    className="w-full flex items-center justify-between px-5 py-3 hover:bg-cave-bg-elevated transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl leading-none w-7 text-center flex-shrink-0">
                        {result.flag}
                      </span>
                      <div className="min-w-0">
                        <p className="text-cave-text-primary font-medium truncate">{result.label}</p>
                        {result.sublabel && (
                          <p className="text-xs text-cave-text-muted truncate">{result.sublabel}</p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-cave-text-muted opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
