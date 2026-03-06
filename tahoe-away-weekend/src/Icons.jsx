// Inline SVG icons — no emoji, consistent styling
// All icons accept className for sizing/color

const s = (d, vb = '24') => ({ children, className = 'w-5 h-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${vb} ${vb}`} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>{d}</svg>
)

const sf = (d, vb = '24') => ({ className = 'w-5 h-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${vb} ${vb}`} fill="currentColor" className={className}>{d}</svg>
)

// Nav & Section icons
export const CalendarIcon = s(<><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>)
export const BedIcon = s(<><path d="M2 4v16" /><path d="M2 8h18a2 2 0 0 1 2 2v10" /><path d="M2 17h20" /><path d="M6 8v3" /></>)
export const TargetIcon = s(<><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>)
export const MapIcon = s(<><path d="M14.5 4.5 21 3v16l-6.5 1.5M14.5 4.5 9 3M14.5 4.5v16M9 3 3 4.5V20l6-1.5M9 3v15.5M9 18.5l5.5 2" /></>)
export const HandIcon = s(<><path d="M18 11V6a2 2 0 0 0-4 0v5" /><path d="M14 10V4a2 2 0 0 0-4 0v6" /><path d="M10 10.5V6a2 2 0 0 0-4 0v8" /><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" /></>)
export const DollarIcon = s(<><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>)

// Schedule day icons
export const SunriseIcon = s(<><path d="M17 18a5 5 0 0 0-10 0" /><line x1="12" y1="9" x2="12" y2="2" /><line x1="4.22" y1="10.22" x2="5.64" y2="11.64" /><line x1="1" y1="18" x2="3" y2="18" /><line x1="21" y1="18" x2="23" y2="18" /><line x1="18.36" y1="11.64" x2="19.78" y2="10.22" /><line x1="23" y1="22" x2="1" y2="22" /><polyline points="8,6 12,2 16,6" /></>)
export const MountainIcon = s(<><path d="m8 3 4 8 5-5 5 15H2L8 3z" /></>)
export const SunsetIcon = s(<><path d="M17 18a5 5 0 0 0-10 0" /><line x1="12" y1="2" x2="12" y2="9" /><line x1="4.22" y1="10.22" x2="5.64" y2="11.64" /><line x1="1" y1="18" x2="3" y2="18" /><line x1="21" y1="18" x2="23" y2="18" /><line x1="18.36" y1="11.64" x2="19.78" y2="10.22" /><line x1="23" y1="22" x2="1" y2="22" /><polyline points="16,6 12,2 8,6" /></>)

// Schedule event icons
export const HomeIcon = s(<><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9,22 9,12 15,12 15,22" /></>)
export const UtensilsIcon = s(<><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" /></>)
export const FlameIcon = s(<><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14 0-5.5 5-7 .5 4 2 5.38 2 8a5 5 0 1 1-8.5 4.5z" /></>)
export const CoffeeIcon = s(<><path d="M17 8h1a4 4 0 1 1 0 8h-1" /><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" /><line x1="6" y1="2" x2="6" y2="4" /><line x1="10" y1="2" x2="10" y2="4" /><line x1="14" y1="2" x2="14" y2="4" /></>)
export const CarIcon = s(<><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /></>)
export const HikingIcon = s(<><path d="M13 4c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z" /><path d="m7.21 20 3.79-8 3 3-1.5 5" /><path d="m3 20 4.5-12 3 3" /><path d="m17.5 20-.7-4.5-3.8-3.5" /></>)
export const SandwichIcon = s(<><path d="M3 11v-1a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1" /><path d="M21 11H3l1.5 5H19.5L21 11z" /><path d="M4.5 16h15v1a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-1z" /></>)
export const SwordIcon = s(<><polyline points="14.5,17.5 3,6 3,3 6,3 17.5,14.5" /><line x1="13" y1="19" x2="19" y2="13" /><line x1="16" y1="16" x2="20" y2="20" /><line x1="19" y1="21" x2="21" y2="19" /></>)
export const WindIcon = s(<><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" /><path d="M9.6 4.6A2 2 0 1 1 11 8H2" /><path d="M12.6 19.4A2 2 0 1 0 14 16H2" /></>)
export const ChatIcon = s(<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></>)
export const DiceIcon = s(<><rect x="2" y="2" width="20" height="20" rx="3" /><circle cx="8" cy="8" r="1" fill="currentColor" /><circle cx="16" cy="8" r="1" fill="currentColor" /><circle cx="8" cy="16" r="1" fill="currentColor" /><circle cx="16" cy="16" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /></>)
export const YogaIcon = s(<><circle cx="12" cy="4" r="2" /><path d="M12 6v6" /><path d="M8 10l4 2 4-2" /><path d="M8 22l4-8 4 8" /></>)
export const GuitarIcon = s(<><path d="M20 4l-3.5 3.5" /><circle cx="14" cy="14" r="5" /><path d="M14 9v10" /><path d="M9 14h10" /></>)
export const CircleIcon = s(<><circle cx="12" cy="12" r="10" /></>)
export const HandshakeIcon = s(<><path d="m11 17 2 2a1 1 0 1 0 3-3" /><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3L14 8" /><path d="m8 15 2-2" /><path d="M2 12h3" /><path d="M19 12h3" /><path d="m7.5 4.2 1 1.8" /><path d="m15.5 4.2-1 1.8" /></>)
export const MeatIcon = s(<><path d="M15.5 2.5c3.5 0 6 2.5 6 6s-6 10-12 13.5C6.5 19.5 2.5 16 2.5 12s3-6 6-6" /><ellipse cx="12" cy="10" rx="3" ry="2" /></>)
export const SaladIcon = s(<><path d="M7 21h10" /><path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9z" /><path d="M12 3v3" /><path d="M6.6 5.6l2.1 2.1" /><path d="M17.4 5.6l-2.1 2.1" /></>)

// Accommodation icons
export const HotelIcon = s(<><path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" /><path d="M9 22v-4h6v4" /><rect x="8" y="6" width="3" height="3" /><rect x="13" y="6" width="3" height="3" /><rect x="8" y="12" width="3" height="3" /><rect x="13" y="12" width="3" height="3" /></>)
export const CabinIcon = s(<><path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-6h6v6" /></>)
export const TentIcon = s(<><path d="M3.5 21 14 3" /><path d="M20.5 21 10 3" /><path d="M2 21h20" /><path d="M12 21V7" /></>)

// Activity icons
export const HotSpringIcon = s(<><path d="M12 3c-1 2-3 3-3 6a3 3 0 0 0 6 0c0-3-2-4-3-6z" /><path d="M6 20a6 6 0 0 1 12 0" /><path d="M2 20h20" /></>)
export const TreesIcon = s(<><path d="M12 2l-5 9h10L12 2z" /><path d="M12 7l-4 7h8l-4-7z" /><path d="M12 12l-3 5h6l-3-5z" /><line x1="12" y1="17" x2="12" y2="22" /></>)
export const BeachIcon = s(<><path d="M17.5 21H6.5" /><path d="M12 3c-2 3-6 5-8 12h16c-2-7-6-9-8-12z" /></>)

// Packing icons
export const BackpackIcon = s(<><path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10z" /><path d="M9 6V4a3 3 0 0 1 6 0v2" /><path d="M8 14h8" /><path d="M8 18h8" /></>)
export const BootIcon = s(<><path d="M7 21h10" /><path d="M5 21v-8l2-4h10l2 4v8" /><path d="M9 5l-2 4" /><path d="M15 5l2 4" /></>)
export const LotusIcon = s(<><circle cx="12" cy="7" r="3" /><path d="M12 10v7" /><path d="M8 17l4 4 4-4" /></>)

// Rideshare icons  
export const SteeringIcon = s(<><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="2" /><path d="M12 2v4" /><path d="M12 18v4" /><path d="M4.93 4.93l2.83 2.83" /><path d="M16.24 16.24l2.83 2.83" /></>)

// Status icons
export const CheckIcon = s(<><polyline points="20,6 9,17 4,12" /></>)
export const WaveIcon = s(<><path d="M7 15.5C4 14 2 11 2 7.5 2 4 4 2 7 2s5 2 5 5.5" /><path d="M17 15.5c3-1.5 5-4.5 5-8C22 4 20 2 17 2s-5 2-5 5.5" /><path d="M12 22c-4 0-7-2-7-5s3-4 7-4 7 1 7 4-3 5-7 5z" /></>)
export const QuestionIcon = s(<><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></>)
export const XIcon = s(<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>)

// Calendar
export const CalendarPlusIcon = s(<><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="12" y1="14" x2="12" y2="20" /><line x1="9" y1="17" x2="15" y2="17" /></>)
export const DownloadIcon = s(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7,10 12,15 17,10" /><line x1="12" y1="15" x2="12" y2="3" /></>)
