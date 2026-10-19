export type ExportCell = string | number | boolean | null | undefined
export type ExportRow = readonly ExportCell[]

export function downloadExcelFile(fileName: string, rows: readonly ExportRow[]) {
  const workbook = createExcelWorkbook(rows)
  const blob = new Blob([workbook], {
    type: 'application/vnd.ms-excel;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `${slugify(fileName)}.xls`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

function createExcelWorkbook(rows: readonly ExportRow[]) {
  const tableRows = rows
    .map((row) => {
      if (row.length === 0) return '<tr><td>&nbsp;</td></tr>'

      return `<tr>${row
        .map((cell) => `<td>${escapeHtml(cell)}</td>`)
        .join('')}</tr>`
    })
    .join('')

  return `\ufeff<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
  <head>
    <meta charset="UTF-8" />
    <style>
      table { border-collapse: collapse; font-family: Arial, sans-serif; }
      td { border: 1px solid #d9e2ec; padding: 7px 10px; mso-number-format: General; }
      tr:first-child td { background: #164a76; color: #ffffff; font-weight: 700; font-size: 15px; }
      td:first-child { font-weight: 600; }
    </style>
  </head>
  <body><table>${tableRows}</table></body>
</html>`
}

function escapeHtml(value: ExportCell) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'du-lieu'
}
