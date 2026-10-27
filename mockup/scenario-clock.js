/* Warsaw calendar days, not elapsed 24-hour periods (DST-safe). */
function civicCalendarDay(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Warsaw',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
const CIVIC_CALENDAR_DAY=civicCalendarDay();
const civicScenarioDelta=Math.round((Date.parse(CIVIC_CALENDAR_DAY+'T12:00:00Z')-Date.parse('2026-10-26T12:00:00Z'))/86400000);
const civicScenarioDates=new Map();
for(const key of CIVIC_SCENARIO_DATE_KEYS){const d=new Date(key+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+civicScenarioDelta);const next=d.toISOString().slice(0,10);civicScenarioDates.set(key,next);civicScenarioDates.set(key.split('-').reverse().join('.'),next.split('-').reverse().join('.'))}
function civicShiftScenario(value){if(Array.isArray(value))return value.map(civicShiftScenario);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,civicShiftScenario(v)]));if(typeof value==='string')return value.replace(/(?<![0-9])(?:[0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{2}\.[0-9]{2}\.[0-9]{4})(?![0-9])/g,raw=>civicScenarioDates.get(raw)||raw);return value}
for(const id of Object.keys(OSOBY))OSOBY[id]=civicShiftScenario(OSOBY[id]);
