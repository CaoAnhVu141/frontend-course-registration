import { Download } from 'lucide-react'
import { downloadExcelFile } from '../../../shared/utils/exportExcel'
import type { ExportRow } from '../../../shared/utils/exportExcel'
import './ExportButton.css'

type ExportButtonProps = {
  fileName: string
  rows: readonly ExportRow[]
  disabled?: boolean
}

export function ExportButton({ fileName, rows, disabled = false }: ExportButtonProps) {
  return (
    <button
      type="button"
      className="app-export-button"
      disabled={disabled}
      onClick={() => downloadExcelFile(fileName, rows)}
      title="Xuất file Excel"
    >
      <Download size={17} aria-hidden="true" />
      <span>Xuất file</span>
    </button>
  )
}
