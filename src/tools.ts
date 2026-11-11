export type Category = 'organize' | 'convert' | 'edit' | 'security'

export type Field = {
  key: string
  label: string
  type: 'text' | 'number' | 'select' | 'password'
  placeholder?: string
  options?: { value: string; label: string }[]
  default?: string
  required?: boolean
  help?: string
  /** only show when another field has this value */
  showIf?: { key: string; value: string }
}

export type Tool = {
  slug: string
  name: string
  category: Category
  icon: string
  blurb: string
  description: string
  accepts: 'pdf' | 'image'
  formats: string
  multiple: boolean
  min: number
  action: string
  keywords: string[]
  fields: Field[]
}

export const CATEGORY_LABEL: Record<Category, string> = {
  organize: 'Organize PDF',
  convert: 'Convert PDF',
  edit: 'Edit PDF',
  security: 'Security',
}

const pagesField = (label: string, help?: string): Field => ({
  key: 'pages',
  label,
  type: 'text',
  placeholder: 'e.g. 1-3, 5, 8-',
  required: true,
  help,
})

export const TOOLS: Tool[] = [
  {
    slug: 'merge', name: 'Merge PDF', category: 'organize', icon: '⧉', accepts: 'pdf', formats: 'PDF',
    multiple: true, min: 2, action: 'Merge PDF',
    blurb: 'Combine several PDFs into one, in the order you choose.',
    description: 'Merge PDF files online into a single document. Add your files, drag to set the order, and download one combined PDF.',
    keywords: ['combine', 'join', 'append', 'concatenate'], fields: [],
  },
  {
    slug: 'split', name: 'Split PDF', category: 'organize', icon: '✂', accepts: 'pdf', formats: 'PDF',
    multiple: false, min: 1, action: 'Split PDF',
    blurb: 'Separate one PDF into single pages or custom page ranges.',
    description: 'Split a PDF into separate files, one per page or by the ranges you define. Multiple results are delivered as a ZIP.',
    keywords: ['separate', 'divide', 'cut', 'break apart'],
    fields: [
      { key: 'mode', label: 'Split mode', type: 'select', default: 'each', options: [{ value: 'each', label: 'Every page as its own PDF' }, { value: 'ranges', label: 'Custom ranges' }] },
      { key: 'ranges', label: 'Ranges', type: 'text', placeholder: 'e.g. 1-3, 4-6, 9', required: true, showIf: { key: 'mode', value: 'ranges' }, help: 'Each comma-separated part becomes its own PDF.' },
    ],
  },
  {
    slug: 'compress', name: 'Compress PDF', category: 'organize', icon: '⇲', accepts: 'pdf', formats: 'PDF',
    multiple: false, min: 1, action: 'Compress PDF',
    blurb: 'Reduce file size by optimizing images and structure.',
    description: 'Compress PDF files by re-encoding embedded images and cleaning the file structure. Text and layout stay intact. If a file cannot be made smaller, you get the original back.',
    keywords: ['reduce', 'shrink', 'optimize', 'smaller', 'size'],
    fields: [{ key: 'level', label: 'Compression', type: 'select', default: 'recommended', options: [{ value: 'low', label: 'Less (best quality)' }, { value: 'recommended', label: 'Recommended' }, { value: 'extreme', label: 'Extreme (smallest file)' }] }],
  },
  {
    slug: 'organize', name: 'Organize PDF', category: 'organize', icon: '☷', accepts: 'pdf', formats: 'PDF',
    multiple: false, min: 1, action: 'Reorder pages',
    blurb: 'Reorder, repeat, or drop pages by giving a new page order.',
    description: 'Rearrange the pages of a PDF. Enter the page numbers in the order you want them; omit a page to remove it.',
    keywords: ['reorder', 'rearrange', 'sort', 'arrange'],
    fields: [{ key: 'order', label: 'New page order', type: 'text', placeholder: 'e.g. 3,1,2', required: true, help: 'Comma-separated page numbers in the new order.' }],
  },
  {
    slug: 'rotate', name: 'Rotate PDF', category: 'organize', icon: '⟳', accepts: 'pdf', formats: 'PDF',
    multiple: false, min: 1, action: 'Rotate PDF',
    blurb: 'Rotate all pages or only the ones you pick.',
    description: 'Rotate pages of a PDF by 90, 180 or 270 degrees. Leave the page field empty to rotate every page.',
    keywords: ['turn', 'flip', 'orientation', 'landscape', 'portrait'],
    fields: [
      { key: 'angle', label: 'Rotation', type: 'select', default: '90', options: [{ value: '90', label: '90° clockwise' }, { value: '180', label: '180°' }, { value: '270', label: '90° counter-clockwise' }] },
      { key: 'pages', label: 'Pages (optional)', type: 'text', placeholder: 'All pages', help: 'e.g. 2, 4-6' },
    ],
  },
  {
    slug: 'delete-pages', name: 'Delete Pages', category: 'organize', icon: '🗑', accepts: 'pdf', formats: 'PDF',
    multiple: false, min: 1, action: 'Delete pages',
    blurb: 'Remove unwanted pages from a PDF.',
    description: 'Delete specific pages from a PDF and keep the rest. Enter single pages or ranges.',
    keywords: ['remove', 'erase', 'trim'], fields: [pagesField('Pages to delete')],
  },
  {
    slug: 'extract-pages', name: 'Extract Pages', category: 'organize', icon: '⇱', accepts: 'pdf', formats: 'PDF',
    multiple: false, min: 1, action: 'Extract pages',
    blurb: 'Pull selected pages out into a new PDF.',
    description: 'Extract the pages you need into a new PDF while leaving the original untouched.',
    keywords: ['select', 'pick', 'take out'], fields: [pagesField('Pages to extract')],
  },
  {
    slug: 'crop', name: 'Crop PDF', category: 'organize', icon: '⌗', accepts: 'pdf', formats: 'PDF',
    multiple: false, min: 1, action: 'Crop PDF',
    blurb: 'Trim margins from every page.',
    description: 'Crop white margins from all pages by specifying how much to remove from each edge, in points (72 points = 1 inch).',
    keywords: ['trim', 'margins', 'resize'],
    fields: ['top', 'right', 'bottom', 'left'].map((k) => ({ key: k, label: `${k[0].toUpperCase()}${k.slice(1)} (pt)`, type: 'number' as const, default: '0' })),
  },
  {
    slug: 'page-numbers', name: 'Add Page Numbers', category: 'edit', icon: '#', accepts: 'pdf', formats: 'PDF',
    multiple: false, min: 1, action: 'Add page numbers',
    blurb: 'Stamp page numbers in the position and format you want.',
    description: 'Add page numbers to a PDF. Use {n} for the page number and {total} for the page count, for example “Page {n} of {total}”.',
    keywords: ['number', 'pagination', 'footer', 'header', 'bates'],
    fields: [
      { key: 'position', label: 'Position', type: 'select', default: 'bottom-center', options: ['bottom-center', 'bottom-left', 'bottom-right', 'top-center', 'top-left', 'top-right'].map((v) => ({ value: v, label: v.replace('-', ' ') })) },
      { key: 'format', label: 'Format', type: 'text', default: '{n}', help: 'Use {n} and {total}.' },
      { key: 'start', label: 'Start at', type: 'number', default: '1' },
    ],
  },
  {
    slug: 'watermark', name: 'Watermark PDF', category: 'edit', icon: '✦', accepts: 'pdf', formats: 'PDF',
    multiple: false, min: 1, action: 'Add watermark',
    blurb: 'Stamp diagonal text across every page.',
    description: 'Add a text watermark to every page of your PDF. Original page content is kept as it is. Image watermarks are not supported yet.',
    keywords: ['stamp', 'confidential', 'draft', 'overlay', 'text'],
    fields: [
      { key: 'text', label: 'Watermark text', type: 'text', placeholder: 'e.g. CONFIDENTIAL', required: true },
      { key: 'opacity', label: 'Opacity (0.05 – 1)', type: 'number', default: '0.25' },
    ],
  },
  {
    slug: 'protect', name: 'Protect PDF', category: 'security', icon: '🔒', accepts: 'pdf', formats: 'PDF',
    multiple: false, min: 1, action: 'Protect PDF',
    blurb: 'Encrypt a PDF so a password is needed to open it.',
    description: 'Protect a PDF with AES-256 encryption. Anyone opening the file needs the password; we do not store it, so keep it safe.',
    keywords: ['encrypt', 'password', 'lock', 'secure'],
    fields: [{ key: 'new_password', label: 'Password', type: 'password', required: true, help: 'At least 4 characters. We cannot recover it.' }],
  },
  {
    slug: 'unlock', name: 'Unlock PDF', category: 'security', icon: '🔓', accepts: 'pdf', formats: 'PDF',
    multiple: false, min: 1, action: 'Unlock PDF',
    blurb: 'Remove the password from a PDF you have access to.',
    description: 'Remove password protection from a PDF. You must know the current password; this tool does not guess or crack passwords.',
    keywords: ['decrypt', 'remove password', 'open'],
    fields: [{ key: 'password', label: 'Current password', type: 'password', required: true }],
  },
  {
    slug: 'jpg-to-pdf', name: 'JPG to PDF', category: 'convert', icon: '🖼', accepts: 'image', formats: 'JPG, PNG',
    multiple: true, min: 1, action: 'Convert to PDF',
    blurb: 'Turn photos and scans into a single PDF.',
    description: 'Convert JPG images into one PDF, one image per page, in the order you set. PNG files work too.',
    keywords: ['image', 'photo', 'picture', 'jpeg', 'png'], fields: [],
  },
  {
    slug: 'png-to-pdf', name: 'PNG to PDF', category: 'convert', icon: '▣', accepts: 'image', formats: 'PNG, JPG',
    multiple: true, min: 1, action: 'Convert to PDF',
    blurb: 'Combine PNG images into a PDF, transparency flattened to white.',
    description: 'Convert PNG images into a PDF. Transparent areas are flattened onto a white background. JPG files work too.',
    keywords: ['image', 'picture', 'screenshot'], fields: [],
  },
  {
    slug: 'pdf-to-jpg', name: 'PDF to JPG', category: 'convert', icon: '⇄', accepts: 'pdf', formats: 'PDF',
    multiple: false, min: 1, action: 'Convert to JPG',
    blurb: 'Render each page as a JPG image (delivered as ZIP).',
    description: 'Convert every page of a PDF into a JPG image. Pages are delivered together as a ZIP archive.',
    keywords: ['image', 'export', 'render', 'jpeg'],
    fields: [{ key: 'dpi', label: 'Resolution', type: 'select', default: '150', options: [{ value: '100', label: '100 DPI (small)' }, { value: '150', label: '150 DPI' }, { value: '300', label: '300 DPI (print)' }] }],
  },
  {
    slug: 'pdf-to-png', name: 'PDF to PNG', category: 'convert', icon: '⇆', accepts: 'pdf', formats: 'PDF',
    multiple: false, min: 1, action: 'Convert to PNG',
    blurb: 'Render each page as a lossless PNG image.',
    description: 'Convert every page of a PDF into a PNG image. Multi-page results are delivered as a ZIP archive.',
    keywords: ['image', 'export', 'render', 'lossless'],
    fields: [{ key: 'dpi', label: 'Resolution', type: 'select', default: '150', options: [{ value: '100', label: '100 DPI (small)' }, { value: '150', label: '150 DPI' }, { value: '300', label: '300 DPI (print)' }] }],
  },
]

export const bySlug = (slug?: string) => TOOLS.find((t) => t.slug === slug)

export function searchTools(query: string, category: Category | 'all') {
  const q = query.trim().toLowerCase()
  return TOOLS.filter((t) => {
    if (category !== 'all' && t.category !== category && !(category === 'security' && ['protect', 'unlock'].includes(t.slug))) return false
    if (!q) return true
    return [t.name, t.blurb, t.slug, ...t.keywords].some((s) => s.toLowerCase().includes(q))
  })
}
