import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { normalizeEquipment, normalizeProblem, normalizeTemplate, store } from '../../lib/db'
import { UploadIcon } from '../icons'

function asRecord(v: unknown): Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
}

export default function SeedImportPanel() {
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    setResult('')
    setError('')
    try {
      let parsed: unknown
      try {
        parsed = JSON.parse(await file.text())
      } catch {
        throw new Error('JSON 파일을 읽을 수 없습니다. 파일 형식을 확인해 주세요.')
      }
      const rec = asRecord(parsed)
      const problems = (Array.isArray(rec.problems) ? rec.problems : [])
        .map((x) => normalizeProblem(asRecord(x)))
        .filter((p) => p.id)
      const templates = (Array.isArray(rec.templates) ? rec.templates : [])
        .map((x) => normalizeTemplate(asRecord(x)))
        .filter((t) => t.id)
      const equipments = (Array.isArray(rec.equipments) ? rec.equipments : [])
        .map((x) => normalizeEquipment(asRecord(x)))
        .filter((eq) => eq.id)
      if (problems.length === 0 && templates.length === 0 && equipments.length === 0) {
        throw new Error('가져올 데이터가 없습니다. problems, templates, equipments 배열을 확인해 주세요.')
      }
      await store.importSeed(problems, templates, equipments)
      void queryClient.invalidateQueries({ queryKey: ['problems'] })
      void queryClient.invalidateQueries({ queryKey: ['templates'] })
      void queryClient.invalidateQueries({ queryKey: ['equipments'] })
      setResult(`문제 ${problems.length}건, 템플릿 ${templates.length}건, 장비 ${equipments.length}건을 가져왔습니다.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '가져오기에 실패했습니다.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="card p-5">
        <h3 className="font-bold text-slate-800">시드 데이터 가져오기</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
          {'{ problems, templates, equipments }'} 형식의 JSON 파일을 선택하세요. 같은 id의 항목은 덮어씁니다.
        </p>
        <label className="mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition-colors hover:border-brand-400 hover:bg-brand-50">
          <UploadIcon className="h-6 w-6 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">{busy ? '가져오는 중…' : 'JSON 파일 선택'}</span>
          <span className="text-xs text-slate-400">.json</span>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="sr-only"
            onChange={handleFileChange}
            disabled={busy}
          />
        </label>

        {result && (
          <p className="mt-4 rounded-lg bg-accent-50 px-4 py-3 text-sm font-medium text-accent-700" role="status">
            {result}
          </p>
        )}
        {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600" role="alert">{error}</p>}
      </div>
    </div>
  )
}
