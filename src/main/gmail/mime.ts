import type { SendEmailInput } from './types'

/**
 * Encodes a string in RFC 2047 Q-encoding or UTF-8 base64 for email headers
 */
function encodeHeaderField(text: string): string {
  // If only ASCII characters, return as-is
  if (/^[\x20-\x7E]*$/.test(text)) {
    return text
  }
  // Otherwise encode as UTF-8 Base64
  return `=?UTF-8?B?${Buffer.from(text, 'utf-8').toString('base64')}?=`
}

/**
 * Builds an RFC 2822 MIME message string from SendEmailInput and sender email
 */
export function buildMimeMessage(input: SendEmailInput, senderEmail?: string): string {
  const lines: string[] = []

  if (senderEmail) {
    lines.push(`From: ${senderEmail}`)
  }

  // To header (comma separated)
  if (input.to && input.to.length > 0) {
    lines.push(`To: ${input.to.join(', ')}`)
  }

  // Cc header only if present
  if (input.cc && input.cc.length > 0) {
    lines.push(`Cc: ${input.cc.join(', ')}`)
  }

  // Bcc header for SMTP/Gmail MTA delivery (stripped by Gmail on delivery to To/Cc)
  if (input.bcc && input.bcc.length > 0) {
    lines.push(`Bcc: ${input.bcc.join(', ')}`)
  }

  // Subject header
  const encodedSubject = encodeHeaderField(input.subject || '(No Subject)')
  lines.push(`Subject: ${encodedSubject}`)

  // Standard MIME headers
  lines.push('MIME-Version: 1.0')
  lines.push('Content-Type: text/plain; charset=UTF-8')
  lines.push('Content-Transfer-Encoding: 8bit')

  // Blank line separating headers and body
  lines.push('')

  // Body content
  lines.push(input.body || '')

  return lines.join('\r\n')
}

/**
 * Encodes a MIME string into URL-safe Base64 without padding for Gmail API raw field
 */
export function base64UrlEncode(str: string): string {
  return Buffer.from(str, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}
