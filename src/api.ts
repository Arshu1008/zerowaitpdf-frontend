export type JobView = {
  id: string
  status: 'queued' | 'processing' | 'finalizing' | 'completed' | 'failed' | 'cancelled'
  progress: number
  error: string | null
  result?: { filename: string; size: number; mimetype: string; files: number; download_url: string }
}

async function readError(res: Response): Promise<string> {
  try {
    const body = await res.json()
    return body?.error?.message ?? body?.detail?.[0]?.msg ?? `Request failed (${res.status}).`
  } catch {
    return `Request failed (${res.status}).`
  }
}

export async function inspectPdf(file: File): Promise<{ pages: number | null; encrypted: boolean }> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch('/api/v1/files/inspect', { method: 'POST', body: fd })
  if (!res.ok) throw new Error(await readError(res))
  return res.json()
}

/** Upload with real byte-level progress via XHR. */
export function startJob(
  tool: string,
  files: File[],
  options: Record<string, string>,
  onUpload: (pct: number) => void,
): { promise: Promise<JobView>; abort: () => void } {
  const xhr = new XMLHttpRequest()
  const promise = new Promise<JobView>((resolve, reject) => {
    xhr.open('POST', `/api/v1/pdf/${tool}`)
    xhr.upload.onprogress = (e) => e.lengthComputable && onUpload(Math.round((e.loaded / e.total) * 100))
    xhr.onload = () => {
      try {
        const body = JSON.parse(xhr.responseText)
        if (xhr.status >= 200 && xhr.status < 300) resolve(body)
        else reject(new Error(body?.error?.message ?? `Request failed (${xhr.status}).`))
      } catch {
        reject(new Error(`Unexpected server response (${xhr.status}).`))
      }
    }
    xhr.onerror = () => reject(new Error('Could not reach the server. Check your connection and try again.'))
    xhr.onabort = () => reject(new Error('Cancelled.'))
    const fd = new FormData()
    files.forEach((f) => fd.append('files', f))
    fd.append('options', JSON.stringify(options))
    xhr.send(fd)
  })
  return { promise, abort: () => xhr.abort() }
}

export async function getJob(id: string): Promise<JobView> {
  const res = await fetch(`/api/v1/jobs/${id}/status`)
  if (!res.ok) throw new Error(await readError(res))
  return res.json()
}

export async function cancelJob(id: string) {
  await fetch(`/api/v1/jobs/${id}/cancel`, { method: 'POST' })
}

export async function deleteJob(id: string) {
  await fetch(`/api/v1/jobs/${id}`, { method: 'DELETE' })
}
