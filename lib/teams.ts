// Kit colours and flag codes for every 2026 World Cup participant.
// flagCode: ISO 3166-1 alpha-2, or subdivision (GB-ENG, GB-SCT).
// jersey / shorts / socks: hex colours for the pixel player sprite.

export type TeamData = {
  flagCode: string
  jersey: string
  shorts: string
  socks: string
}

export const TEAMS: Record<string, TeamData> = {
  'Algeria':              { flagCode: 'DZ', jersey: '#FFFFFF', shorts: '#FFFFFF', socks: '#009A44' },
  'Argentina':            { flagCode: 'AR', jersey: '#74ACDF', shorts: '#FFFFFF', socks: '#74ACDF' },
  'Australia':            { flagCode: 'AU', jersey: '#FFD700', shorts: '#00843D', socks: '#00843D' },
  'Austria':              { flagCode: 'AT', jersey: '#ED2939', shorts: '#FFFFFF', socks: '#ED2939' },
  'Belgium':              { flagCode: 'BE', jersey: '#ED2939', shorts: '#1A1A2E', socks: '#ED2939' },
  'Bosnia & Herzegovina': { flagCode: 'BA', jersey: '#003087', shorts: '#003087', socks: '#FFFFFF' },
  'Brazil':               { flagCode: 'BR', jersey: '#FFDF00', shorts: '#009639', socks: '#FFFFFF' },
  'Canada':               { flagCode: 'CA', jersey: '#D80621', shorts: '#D80621', socks: '#D80621' },
  'Cape Verde':           { flagCode: 'CV', jersey: '#003893', shorts: '#003893', socks: '#CF2027' },
  'Colombia':             { flagCode: 'CO', jersey: '#FDD116', shorts: '#003087', socks: '#FFFFFF' },
  'Croatia':              { flagCode: 'HR', jersey: '#D80621', shorts: '#FFFFFF', socks: '#003087' },
  'Curacao':              { flagCode: 'CW', jersey: '#003087', shorts: '#FFD700', socks: '#003087' },
  'Czechia':              { flagCode: 'CZ', jersey: '#D80621', shorts: '#FFFFFF', socks: '#003087' },
  'DR Congo':             { flagCode: 'CD', jersey: '#007FFF', shorts: '#FFD700', socks: '#007FFF' },
  'Ecuador':              { flagCode: 'EC', jersey: '#FFD700', shorts: '#003087', socks: '#003087' },
  'Egypt':                { flagCode: 'EG', jersey: '#D80621', shorts: '#FFFFFF', socks: '#D80621' },
  'England':              { flagCode: 'GB-ENG', jersey: '#FFFFFF', shorts: '#FFFFFF', socks: '#FFFFFF' },
  'France':               { flagCode: 'FR', jersey: '#002395', shorts: '#002395', socks: '#D80621' },
  'Germany':              { flagCode: 'DE', jersey: '#FFFFFF', shorts: '#1A1A2E', socks: '#FFFFFF' },
  'Ghana':                { flagCode: 'GH', jersey: '#FFFFFF', shorts: '#1A1A2E', socks: '#FFD700' },
  'Haiti':                { flagCode: 'HT', jersey: '#D80621', shorts: '#003087', socks: '#D80621' },
  'Iran':                 { flagCode: 'IR', jersey: '#FFFFFF', shorts: '#FFFFFF', socks: '#009639' },
  'Iraq':                 { flagCode: 'IQ', jersey: '#009639', shorts: '#FFFFFF', socks: '#009639' },
  'Ivory Coast':          { flagCode: 'CI', jersey: '#F77F00', shorts: '#FFFFFF', socks: '#009639' },
  'Japan':                { flagCode: 'JP', jersey: '#003087', shorts: '#FFFFFF', socks: '#003087' },
  'Jordan':               { flagCode: 'JO', jersey: '#FFFFFF', shorts: '#1A1A2E', socks: '#FFFFFF' },
  'Mexico':               { flagCode: 'MX', jersey: '#006847', shorts: '#FFFFFF', socks: '#006847' },
  'Morocco':              { flagCode: 'MA', jersey: '#D80621', shorts: '#009639', socks: '#D80621' },
  'Netherlands':          { flagCode: 'NL', jersey: '#FF6600', shorts: '#FF6600', socks: '#FF6600' },
  'New Zealand':          { flagCode: 'NZ', jersey: '#FFFFFF', shorts: '#1A1A2E', socks: '#FFFFFF' },
  'Norway':               { flagCode: 'NO', jersey: '#D80621', shorts: '#FFFFFF', socks: '#003087' },
  'Panama':               { flagCode: 'PA', jersey: '#D80621', shorts: '#FFFFFF', socks: '#D80621' },
  'Paraguay':             { flagCode: 'PY', jersey: '#D80621', shorts: '#003087', socks: '#003087' },
  'Portugal':             { flagCode: 'PT', jersey: '#D80621', shorts: '#009639', socks: '#D80621' },
  'Qatar':                { flagCode: 'QA', jersey: '#8B0000', shorts: '#FFFFFF', socks: '#8B0000' },
  'Saudi Arabia':         { flagCode: 'SA', jersey: '#FFFFFF', shorts: '#FFFFFF', socks: '#009639' },
  'Scotland':             { flagCode: 'GB-SCT', jersey: '#003087', shorts: '#FFFFFF', socks: '#003087' },
  'Senegal':              { flagCode: 'SN', jersey: '#FFFFFF', shorts: '#FFFFFF', socks: '#009639' },
  'South Africa':         { flagCode: 'ZA', jersey: '#007A4D', shorts: '#FFB81C', socks: '#FFB81C' },
  'South Korea':          { flagCode: 'KR', jersey: '#D80621', shorts: '#003087', socks: '#D80621' },
  'Spain':                { flagCode: 'ES', jersey: '#D80621', shorts: '#FFD700', socks: '#D80621' },
  'Sweden':               { flagCode: 'SE', jersey: '#FFCD00', shorts: '#006AA7', socks: '#FFCD00' },
  'Switzerland':          { flagCode: 'CH', jersey: '#D80621', shorts: '#FFFFFF', socks: '#D80621' },
  'Tunisia':              { flagCode: 'TN', jersey: '#FFFFFF', shorts: '#D80621', socks: '#FFFFFF' },
  'Türkiye':              { flagCode: 'TR', jersey: '#D80621', shorts: '#FFFFFF', socks: '#D80621' },
  'Uruguay':              { flagCode: 'UY', jersey: '#5EB6E4', shorts: '#1A1A2E', socks: '#1A1A2E' },
  'USA':                  { flagCode: 'US', jersey: '#1A2744', shorts: '#FFFFFF', socks: '#1A2744' },
  'Uzbekistan':           { flagCode: 'UZ', jersey: '#FFFFFF', shorts: '#1EA0FF', socks: '#FFFFFF' },
}

export function getTeamData(name: string): TeamData {
  return TEAMS[name] ?? { flagCode: 'UN', jersey: '#555577', shorts: '#888899', socks: '#aaaacc' }
}
