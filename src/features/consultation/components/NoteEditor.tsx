import React, { useCallback, useEffect, useRef, useState } from 'react'
import { CheckCircle2, Clock, FileText, RefreshCw, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { ConsultationNote } from '@/types'

type NoteTemplate = 'FREE' | 'SOAP' | 'FOLLOW_UP'

const TEMPLATES: Record<NoteTemplate, string> = {
  FREE: '',
  SOAP: `SUBJECTIVE
Chief complaint:
History of present illness:

OBJECTIVE
Vital signs:
Physical examination:

ASSESSMENT
Diagnosis:

PLAN
Treatment:
Follow-up: `,
  FOLLOW_UP: `FOLLOW-UP NOTE
Since last visit:
Current symptoms:
Medication compliance:

ASSESSMENT
Progress:

PLAN
Continue / Modify treatment:
Next follow-up: `,
}

const AUTO_SAVE_INTERVAL_MS = 8_000

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

interface NoteEditorProps {
  consultationId: string
  initialNote?: ConsultationNote
  onSave?: (content: string, template: NoteTemplate) => Promise<unknown>
  className?: string
}

export function NoteEditor({ consultationId, initialNote, onSave, className }: NoteEditorProps) {
  const [content, setContent] = useState(initialNote?.content ?? '')
  const [template, setTemplate] = useState<NoteTemplate>(
    (initialNote?.template as NoteTemplate) ?? 'FREE'
  )
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const contentRef = useRef(content)

  contentRef.current = content

  const save = useCallback(async () => {
    if (!isDirty) return
    setSaveState('saving')
    try {
      await onSave?.(contentRef.current, template)
      setSaveState('saved')
      setLastSaved(new Date())
      setIsDirty(false)
    } catch {
      setSaveState('error')
    }
  }, [isDirty, onSave, template])

  // Auto-save timer
  useEffect(() => {
    if (!isDirty) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(save, AUTO_SAVE_INTERVAL_MS)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [isDirty, save, content])

  // Draft recovery from sessionStorage
  useEffect(() => {
    const key = `note-draft-${consultationId}`
    const saved = sessionStorage.getItem(key)
    if (saved && !initialNote?.content) {
      setContent(saved)
      setIsDirty(true)
    }
  }, [consultationId, initialNote?.content])

  useEffect(() => {
    const key = `note-draft-${consultationId}`
    if (content) sessionStorage.setItem(key, content)
  }, [content, consultationId])

  function applyTemplate(t: NoteTemplate) {
    setTemplate(t)
    if (!content || content === TEMPLATES[template]) {
      setContent(TEMPLATES[t])
      setIsDirty(true)
    }
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-[--color-text-secondary]" aria-hidden="true" />
          <span className="text-sm font-medium text-[--color-text-primary]">Consultation Notes</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Save state indicator */}
          <div className="flex items-center gap-1.5 text-xs text-[--color-text-tertiary]" aria-live="polite">
            {saveState === 'saving' && (
              <>
                <RefreshCw className="h-3 w-3 animate-spin" aria-hidden="true" />
                <span>Saving…</span>
              </>
            )}
            {saveState === 'saved' && lastSaved && (
              <>
                <CheckCircle2 className="h-3 w-3 text-[--color-success]" aria-hidden="true" />
                <span>Saved {lastSaved.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}</span>
              </>
            )}
            {saveState === 'error' && (
              <span className="text-danger">Save failed</span>
            )}
            {isDirty && saveState === 'idle' && (
              <>
                <Clock className="h-3 w-3" aria-hidden="true" />
                <span>Unsaved changes</span>
              </>
            )}
          </div>

          {/* Template picker */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
                Template: {template === 'FREE' ? 'Free text' : template}
                <ChevronDown className="h-3 w-3" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => applyTemplate('FREE')}>Free text</DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyTemplate('SOAP')}>SOAP note</DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyTemplate('FOLLOW_UP')}>Follow-up</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={save}
            disabled={!isDirty || saveState === 'saving'}
          >
            Save now
          </Button>
        </div>
      </div>

      {/* Editor */}
      <Textarea
        value={content}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
          setContent(e.target.value)
          setIsDirty(true)
          setSaveState('idle')
        }}
        placeholder={
          template === 'SOAP'
            ? 'Fill in the SOAP template…'
            : template === 'FOLLOW_UP'
              ? 'Fill in the follow-up template…'
              : 'Start typing your notes…'
        }
        className="min-h-[260px] font-mono text-sm resize-none leading-relaxed"
        aria-label="Consultation notes"
        spellCheck
      />

      {content && (
        <p className="text-xs text-[--color-text-tertiary] text-right">
          {content.split(/\s+/).filter(Boolean).length} words
        </p>
      )}
    </div>
  )
}
