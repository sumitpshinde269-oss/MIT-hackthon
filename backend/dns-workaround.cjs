/**
 * DNS workaround for this sandbox environment.
 *
 * The default DNS proxy (10.233.96.175) refuses Node's c-ares SRV queries
 * (dns.resolveSrv fails with `querySrv ECONNREFUSED`), which breaks
 * mongodb+srv:// connection strings. Pointing Node's c-ares resolver at
 * public DNS servers fixes SRV/TXT lookups. Regular hostname resolution
 * (dns.lookup / getaddrinfo) is NOT affected — it still uses the OS resolver.
 *
 * Usage: node --require ./dns-workaround.cjs server.js
 * (Set DNS_WORKAROUND_DISABLED=1 to skip it if the environment changes.)
 */
if (!process.env.DNS_WORKAROUND_DISABLED) {
  require('dns').setServers(['1.1.1.1', '8.8.8.8']);
}
