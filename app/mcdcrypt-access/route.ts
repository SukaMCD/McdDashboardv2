import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Generate HMAC token untuk auto-login MCDCrypt
  const timestamp = Math.floor(Date.now() / 1000)
  const mcdcryptKey = process.env.MCDCRYPT_ADMIN_KEY!
  const mcdcryptUrl = process.env.MCDCRYPT_URL!

  // Gunakan Web Crypto API (tersedia di Edge/Node runtime Vercel)
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(mcdcryptKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(String(timestamp))
  )
  const token = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  const redirectUrl = `${mcdcryptUrl}/auto-login?token=${token}&timestamp=${timestamp}`
  return NextResponse.redirect(redirectUrl)
}
