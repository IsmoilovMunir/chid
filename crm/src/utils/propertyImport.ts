import { importPropertyListing } from '../api/client'

export interface PropertyImportResult {
  title: string | null
  propertyPrice: number | null
  address: string | null
  source: string | null
  blocked: boolean
  message: string | null
}

export function formatImportedPrice(price: number): string {
  return String(Math.round(price))
}

export async function fetchPropertyImport(
  url: string,
  text?: string
): Promise<PropertyImportResult> {
  return importPropertyListing({
    url: url.trim() || undefined,
    text: text?.trim() || undefined,
  })
}
