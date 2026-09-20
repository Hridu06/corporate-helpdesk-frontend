/**
 * Short, human-readable summary of a User-Agent string ("Edge on Windows").
 * Deliberately simple: good enough for an audit table, not a full parser.
 * The raw string should stay available (e.g. as a tooltip).
 */
export function describeUserAgent(userAgent) {
  if (!userAgent) return 'Unknown device'

  // Order matters: Edge and Opera also contain "Chrome", Chrome also contains "Safari".
  let browser = null
  if (/curl\//i.test(userAgent)) browser = 'curl'
  else if (/Edg(e|A|iOS)?\//.test(userAgent)) browser = 'Edge'
  else if (/OPR\/|Opera/.test(userAgent)) browser = 'Opera'
  else if (/Firefox\/|FxiOS\//.test(userAgent)) browser = 'Firefox'
  else if (/Chrome\/|CriOS\//.test(userAgent)) browser = 'Chrome'
  else if (/Safari\//.test(userAgent) && /Version\//.test(userAgent)) browser = 'Safari'

  // iOS UAs contain "like Mac OS X" and Android UAs contain "Linux", so test those first.
  let os = null
  if (/Android/.test(userAgent)) os = 'Android'
  else if (/iPhone|iPad|iPod/.test(userAgent)) os = 'iOS'
  else if (/Windows NT/.test(userAgent)) os = 'Windows'
  else if (/Mac OS X|Macintosh/.test(userAgent)) os = 'macOS'
  else if (/CrOS/.test(userAgent)) os = 'ChromeOS'
  else if (/Linux/.test(userAgent)) os = 'Linux'

  if (browser && os) return `${browser} on ${os}`
  return browser ?? os ?? 'Unknown device'
}
