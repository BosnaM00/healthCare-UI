import React, { useState, useEffect } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { useMedics } from '../hooks/use-booking'
import { MedicCard } from './MedicCard'
import { PageHeader } from '@/components/layout/PageHeader'
import { PageContainer } from '@/components/layout/PageContainer'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SkeletonCard } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/layout/EmptyState'
import { Badge } from '@/components/ui/badge'
import type { Medic } from '@/types'
import { mockSpecialties } from '@/mocks/fixtures'

interface MedicSearchPageProps {
  onBook?: (medic: Medic) => void
  onViewProfile?: (medic: Medic) => void
}

export function MedicSearchPage({ onBook, onViewProfile }: MedicSearchPageProps) {
  const [query, setQuery] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [consultationType, setConsultationType] = useState('')
  const [page, setPage] = useState(0)
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 350)
    return () => clearTimeout(timer)
  }, [query])

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setPage(0)
  }

  const { data, isLoading, isFetching } = useMedics({
    q: debouncedQuery || undefined,
    specialty: specialty || undefined,
    consultationType: consultationType || undefined,
    page,
    size: 9,
  })

  const activeFilters = [
    specialty && mockSpecialties.find(s => s.id === specialty)?.name,
    consultationType,
  ].filter(Boolean)

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Find a Doctor"
        description="Browse verified specialists and book your next consultation"
      />

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by name or specialty..."
            value={query}
            onChange={handleQueryChange}
            startAdornment={<Search className="h-4 w-4" />}
            aria-label="Search medics"
          />
        </div>

        <Select value={specialty} onValueChange={(v) => { setSpecialty(v === '_all' ? '' : v); setPage(0) }}>
          <SelectTrigger className="w-full sm:w-[200px]" aria-label="Filter by specialty">
            <SlidersHorizontal className="h-4 w-4 mr-2 text-[--color-text-secondary]" />
            <SelectValue placeholder="All specialties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All specialties</SelectItem>
            {mockSpecialties.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={consultationType} onValueChange={(v) => { setConsultationType(v === '_all' ? '' : v); setPage(0) }}>
          <SelectTrigger className="w-full sm:w-[160px]" aria-label="Filter by type">
            <SelectValue placeholder="Any type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Any type</SelectItem>
            <SelectItem value="VIDEO">Video</SelectItem>
            <SelectItem value="IN_PERSON">In-person</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Active filters */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-[--color-text-secondary]">Filters:</span>
          {activeFilters.map((f) => (
            <Badge key={f} variant="secondary" className="gap-1">
              {f}
              <button
                onClick={() => { setSpecialty(''); setConsultationType('') }}
                className="ml-1 rounded hover:bg-[--color-neutral-300] p-0.5"
                aria-label={`Remove filter ${f}`}
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Results header */}
      <div className="flex items-center justify-between text-sm text-[--color-text-secondary]">
        {!isLoading && data && (
          <span>{data.totalElements} doctor{data.totalElements !== 1 ? 's' : ''} found</span>
        )}
        {isFetching && !isLoading && <span className="text-xs animate-pulse">Updating...</span>}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : !data?.content.length ? (
        <EmptyState
          icon={<Search className="h-7 w-7" />}
          title="No doctors found"
          description="Try adjusting your search or filters to find available specialists."
          action={{
            label: 'Clear filters',
            onClick: () => { setQuery(''); setDebouncedQuery(''); setSpecialty(''); setConsultationType('') },
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.content.map((medic) => (
            <MedicCard
              key={medic.id}
              medic={medic}
              onBook={onBook}
              onViewProfile={onViewProfile}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex justify-center items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-[--color-text-secondary]">
            Page {page + 1} of {data.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </PageContainer>
  )
}
