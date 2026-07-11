import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces'
import logoUrl from '../assets/logochid.svg'
import type { CalculationDetail } from '../types/crm'
import { CHID_BRAND } from '../constants/brand'
import { CALCULATION_MODE_LABELS, PAYMENT_TYPE_LABELS } from '../constants/labels'
import {
  formatMoney,
  formatMoneyExact,
  formatPaymentMonth,
  formatScheduleAmount,
} from '../types/mortgage'
import { formatDate, formatTermMonths } from './format'

// @ts-expect-error pdfmake vfs typing
pdfMake.vfs = pdfFonts.pdfMake?.vfs ?? pdfFonts.vfs

const COLORS = {
  primary: '#082F9B',
  accent: '#DFB286',
  text: '#1e293b',
  muted: '#64748b',
  border: '#e2e8f0',
  accentBg: '#f8fafc',
  green: '#15803d',
}

async function loadSvgAsPngDataUrl(svgUrl: string, width = 140): Promise<string> {
  const res = await fetch(svgUrl)
  const svgText = await res.text()
  const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' })
  const objectUrl = URL.createObjectURL(blob)

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const ratio = img.height / img.width || 0.54
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = Math.round(width * ratio)
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('Canvas unavailable'))
        return
      }
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(objectUrl)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load logo'))
    }
    img.src = objectUrl
  })
}

function metricCell(label: string, value: string): Content {
  return {
    stack: [
      { text: label, fontSize: 8, color: COLORS.muted, margin: [0, 0, 0, 4] },
      { text: value, fontSize: 11, bold: true, color: COLORS.text },
    ],
    margin: [10, 10, 10, 10],
  }
}

function buildScheduleRows(calculation: CalculationDetail): string[][] {
  return calculation.result.schedule.map((row) => [
    String(row.month),
    formatPaymentMonth(row.month),
    formatScheduleAmount(row.payment),
    formatScheduleAmount(row.principal),
    formatScheduleAmount(row.interest),
    formatScheduleAmount(row.remainingBalance),
  ])
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 80)
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

export async function downloadCalculationPdf(calculation: CalculationDetail): Promise<void> {
  const result = calculation.result
  const logo = await loadSvgAsPngDataUrl(logoUrl)
  const title = calculation.title || `Расчёт #${calculation.id}`
  const monthly = formatMoneyExact(result.monthlyPayment ?? result.firstMonthlyPayment)
  const hasDiscount = (result.discountAmount ?? 0) > 0 || (result.discountPercent ?? 0) > 0

  const summaryMetrics: Content[] = [
    metricCell('Режим расчёта', CALCULATION_MODE_LABELS[calculation.mode]),
    metricCell('Тип платежа', PAYMENT_TYPE_LABELS[calculation.paymentType]),
    metricCell('Сумма кредита', formatMoney(result.loanAmount)),
    metricCell('Срок', formatTermMonths(result.termMonths)),
    metricCell('Ставка', `${result.interestRate}%`),
    metricCell('Ежемесячный платёж', monthly),
    metricCell('Переплата', formatMoney(result.overpayment)),
    metricCell('Выплачено всего', formatMoney(result.totalPayment)),
  ]

  if (result.propertyPrice) {
    summaryMetrics.splice(2, 0, metricCell('Стоимость жилья', formatMoney(result.propertyPrice)))
  }
  if (result.downPayment) {
    summaryMetrics.splice(3, 0, metricCell('Первоначальный взнос', formatMoney(result.downPayment)))
  }

  const discountBlock: Content[] = hasDiscount
    ? [
        {
          table: {
            widths: ['*'],
            body: [
              [
                {
                  stack: [
                    { text: 'Скидка по договору с застройщиком', style: 'sectionTitle', margin: [0, 0, 0, 6] },
                    {
                      text: `Базовая сумма кредита: ${formatMoney(result.baseLoanAmount ?? result.loanAmount)}`,
                      fontSize: 10,
                      margin: [0, 0, 0, 2],
                    },
                    ...(result.discountPercent
                      ? [{ text: `Скидка: −${result.discountPercent}%`, fontSize: 10, color: COLORS.green, margin: [0, 0, 0, 2] as [number, number, number, number] }]
                      : []),
                    ...(result.discountAmount
                      ? [{ text: `Скидка: −${formatMoney(result.discountAmount)}`, fontSize: 10, color: COLORS.green, margin: [0, 0, 0, 2] as [number, number, number, number] }]
                      : []),
                    {
                      text: `С учётом скидки: ${formatMoney(result.loanAmount)}`,
                      fontSize: 11,
                      bold: true,
                      color: COLORS.primary,
                    },
                  ],
                  fillColor: '#f1f5f9',
                  margin: [12, 12, 12, 12],
                },
              ],
            ],
          },
          layout: {
            hLineWidth: () => 1,
            vLineWidth: () => 1,
            hLineColor: () => COLORS.border,
            vLineColor: () => COLORS.border,
          },
          margin: [0, 0, 0, 16] as [number, number, number, number],
        },
      ]
    : []

  const scheduleRows = buildScheduleRows(calculation)

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 50],
    defaultStyle: {
      font: 'Roboto',
      fontSize: 10,
      color: COLORS.text,
      lineHeight: 1.25,
    },
    styles: {
      sectionTitle: {
        fontSize: 12,
        bold: true,
        color: COLORS.primary,
      },
      footer: {
        fontSize: 8,
        color: COLORS.muted,
      },
      tableHeader: {
        fontSize: 8,
        bold: true,
        color: '#ffffff',
        fillColor: COLORS.primary,
        margin: [4, 6, 4, 6],
      },
    },
    footer: (currentPage: number, pageCount: number) => ({
      columns: [
        {
          text: `${CHID_BRAND.name} · ${CHID_BRAND.website} · ${CHID_BRAND.phone}`,
          style: 'footer',
          margin: [40, 0, 0, 0] as [number, number, number, number],
        },
        {
          text: `Стр. ${currentPage} из ${pageCount}`,
          style: 'footer',
          alignment: 'right' as const,
          margin: [0, 0, 40, 0] as [number, number, number, number],
        },
      ],
    }),
    content: [
      {
        columns: [
          { image: logo, width: 120 },
          {
            width: '*',
            alignment: 'right',
            stack: [
              { text: CHID_BRAND.tagline, fontSize: 9, color: COLORS.muted, margin: [0, 4, 0, 6] },
              { text: CHID_BRAND.phone, fontSize: 11, bold: true, color: COLORS.primary },
              { text: CHID_BRAND.website, fontSize: 10, color: COLORS.text, margin: [0, 2, 0, 0] },
              { text: CHID_BRAND.email, fontSize: 9, color: COLORS.muted, margin: [0, 2, 0, 0] },
            ],
          },
        ],
        margin: [0, 0, 0, 20],
      },
      {
        canvas: [
          { type: 'rect', x: 0, y: 0, w: 515, h: 3, color: COLORS.primary },
          { type: 'rect', x: 0, y: 3, w: 180, h: 3, color: COLORS.accent },
        ],
        margin: [0, 0, 0, 18],
      },
      {
        text: 'Ипотечный расчёт',
        fontSize: 20,
        bold: true,
        color: COLORS.primary,
        margin: [0, 0, 0, 4],
      },
      {
        text: title,
        fontSize: 13,
        bold: true,
        margin: [0, 0, 0, 6],
      },
      {
        text: [
          { text: `Дата: ${formatDate(calculation.createdAt)}`, fontSize: 9, color: COLORS.muted },
          ...(calculation.clientName
            ? [{ text: `   ·   Клиент: ${calculation.clientName}`, fontSize: 9, color: COLORS.muted }]
            : []),
        ],
        margin: [0, 0, 0, 16],
      },
      ...discountBlock,
      { text: 'Основные параметры', style: 'sectionTitle', margin: [0, 0, 0, 8] as [number, number, number, number] },
      {
        table: {
          widths: ['*', '*', '*', '*'],
          body: chunkArray(summaryMetrics, 4).map((row) =>
            row.length < 4 ? [...row, ...Array(4 - row.length).fill({ text: '' })] : row,
          ),
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => COLORS.border,
          vLineColor: () => COLORS.border,
          fillColor: (rowIndex: number) => (rowIndex === 0 ? COLORS.accentBg : null),
        },
        margin: [0, 0, 0, 16] as [number, number, number, number],
      },
      ...(result.paymentType === 'DIFFERENTIATED'
        ? [
            {
              text: `Первый платёж: ${formatMoneyExact(result.firstMonthlyPayment)}, последний: ${formatMoneyExact(result.lastMonthlyPayment)}`,
              fontSize: 9,
              color: COLORS.muted,
              margin: [0, 0, 0, 16] as [number, number, number, number],
            },
          ]
        : []),
      ...(calculation.comment
        ? [
            { text: 'Комментарий', style: 'sectionTitle', margin: [0, 0, 0, 6] as [number, number, number, number] },
            {
              text: calculation.comment,
              fontSize: 10,
              color: COLORS.text,
              margin: [0, 0, 0, 16] as [number, number, number, number],
            },
          ]
        : []),
      { text: 'График погашения', style: 'sectionTitle', margin: [0, 0, 0, 8] as [number, number, number, number] },
      {
        table: {
          headerRows: 1,
          widths: [24, '*', 68, 68, 68, 72],
          body: [
            [
              { text: '№', style: 'tableHeader' },
              { text: 'Месяц', style: 'tableHeader' },
              { text: 'Платёж', style: 'tableHeader', alignment: 'right' },
              { text: 'Основной долг', style: 'tableHeader', alignment: 'right' },
              { text: 'Проценты', style: 'tableHeader', alignment: 'right' },
              { text: 'Остаток', style: 'tableHeader', alignment: 'right' },
            ],
            ...scheduleRows.map((row, idx) =>
              row.map((cell, colIdx) => ({
                text: cell,
                fontSize: 8,
                alignment: (colIdx === 0 ? 'center' : colIdx >= 2 ? 'right' : 'left') as 'left' | 'center' | 'right',
                fillColor: idx % 2 === 0 ? '#ffffff' : COLORS.accentBg,
              })),
            ),
            [
              { text: 'Итого', bold: true, colSpan: 2, fillColor: '#e8eef9' },
              '',
              { text: formatScheduleAmount(result.totalPayment), bold: true, alignment: 'right' as const, fillColor: '#e8eef9' },
              { text: formatScheduleAmount(result.loanAmount), bold: true, alignment: 'right' as const, fillColor: '#e8eef9' },
              { text: formatScheduleAmount(result.totalInterest), bold: true, alignment: 'right' as const, fillColor: '#e8eef9' },
              { text: '0,00', bold: true, alignment: 'right' as const, fillColor: '#e8eef9' },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => COLORS.border,
          vLineColor: () => COLORS.border,
        },
      } as Content,
      {
        text: 'Документ подготовлен в CHID CRM. Расчёт носит информационный характер и не является офертой.',
        fontSize: 8,
        color: COLORS.muted,
        margin: [0, 16, 0, 0] as [number, number, number, number],
        alignment: 'center',
      },
    ],
  }

  const filename = `CHID-${sanitizeFilename(title)}.pdf`
  pdfMake.createPdf(docDefinition as unknown as TDocumentDefinitions).download(filename)
}
