import type {
  CategoryId,
  CitizenVerification,
  Complaint,
  ComplaintStatus,
  StatusSource,
  TimelineEvent,
  TimelineStage,
} from './types';
import { localityById, resolveJurisdiction } from './reference';

// Sample complaint records for the demo citizen's "My Complaints" page.
// Reference numbers follow an invented format and do not correspond to any real portal.

type Step = [TimelineStage, number, string, StatusSource?];

interface Seed {
  ref: string;
  title: string;
  category: CategoryId;
  localityId: string;
  landmark: string;
  description: string;
  submitted: string;
  status: ComplaintStatus;
  verification?: CitizenVerification;
  hasPhoto?: boolean;
  steps: Step[];
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso + 'T10:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function build(seed: Seed, index: number): Complaint {
  const loc = localityById(seed.localityId)!;
  const j = resolveJurisdiction(seed.category, seed.localityId);
  const timeline: TimelineEvent[] = [
    { id: `${seed.ref}-p`, stage: 'prepared', date: addDays(seed.submitted, 0), note: 'Complaint prepared with JanSeva.', source: 'user' },
    { id: `${seed.ref}-s`, stage: 'submitted', date: addDays(seed.submitted, 0), note: 'Citizen recorded the portal reference number after submitting on the official channel.', source: 'user' },
    ...seed.steps.map(([stage, offset, note, source], i) => ({
      id: `${seed.ref}-${i}`,
      stage,
      date: addDays(seed.submitted, offset),
      note,
      source: source ?? ('official' as StatusSource),
    })),
  ];
  const last = timeline[timeline.length - 1];
  const last2 = [...timeline].reverse().find((e) => e.stage !== 'followup');
  return {
    id: `c${index + 1}`,
    ref: seed.ref,
    title: seed.title,
    category: seed.category,
    description: seed.description,
    complaintText: seed.description,
    state: loc.state,
    city: loc.city,
    localityId: loc.id,
    ward: loc.ward,
    pin: loc.pin,
    landmark: seed.landmark,
    incidentDate: addDays(seed.submitted, -1).slice(0, 10),
    departmentId: j.departmentId,
    serviceId: j.serviceId,
    submittedOn: addDays(seed.submitted, 0),
    lastUpdate: last.date,
    status: seed.status,
    statusSource: last2?.source ?? 'official',
    citizenVerification: seed.verification ?? 'not-requested',
    hasPhoto: seed.hasPhoto ?? true,
    timeline,
    isDemo: false,
  };
}

const SEEDS: Seed[] = [
  {
    ref: 'MCF/2026/RD/04821',
    title: 'Deep pothole on Sector 15 market road',
    category: 'roads',
    localityId: 'sec15',
    landmark: 'Sector 15 market, opposite the bank ATM',
    description: 'A pothole roughly one metre wide has formed on the main market road. Two-wheelers are swerving into oncoming traffic to avoid it.',
    submitted: '2026-10-02',
    status: 'Action Reported',
    verification: 'pending',
    steps: [
      ['acknowledged', 1, 'Complaint acknowledged on the municipal portal.'],
      ['assigned', 3, 'Assigned to Junior Engineer, Central zone.'],
      ['action', 19, 'Department reports patch work completed.'],
    ],
  },
  {
    ref: 'MCF/2026/SN/03377',
    title: 'Garbage not collected for a week near community centre',
    category: 'garbage',
    localityId: 'sec15',
    landmark: 'Community centre road, near the park gate',
    description: 'Household garbage has not been collected for seven days. The secondary collection point is overflowing onto the road.',
    submitted: '2026-09-11',
    status: 'Resolved',
    verification: 'confirmed',
    steps: [
      ['acknowledged', 1, 'Complaint acknowledged.'],
      ['assigned', 1, 'Assigned to sanitation supervisor, Ward 11.'],
      ['action', 3, 'Department reports garbage lifted and area cleaned.'],
      ['resolved', 4, 'Complaint closed as resolved by the department.'],
      ['verification', 5, 'Citizen confirmed that the site was cleaned.', 'user'],
    ],
  },
  {
    ref: 'HP/FBD/TR/77120',
    title: 'Vehicles parked on footpath blocking school gate',
    category: 'parking',
    localityId: 'sec21',
    landmark: 'Sector 21 park, near the school gate',
    description: 'Cars are parked on the footpath every morning between 7:30 and 9:00, forcing children to walk on the road.',
    submitted: '2026-10-20',
    status: 'Acknowledged',
    steps: [['acknowledged', 2, 'Complaint registered with the traffic unit.']],
  },
  {
    ref: 'MCF/2026/WS/02990',
    title: 'Sewer overflowing onto road at Neelam chowk',
    category: 'water',
    localityId: 'nit',
    landmark: 'Neelam chowk, service lane',
    description: 'Sewage has been overflowing from a manhole for three days, flooding the service lane and entering nearby shops.',
    submitted: '2026-08-28',
    status: 'Reopened',
    verification: 'disputed',
    steps: [
      ['acknowledged', 1, 'Complaint acknowledged.'],
      ['assigned', 2, 'Assigned to sewer maintenance team, NIT zone.'],
      ['action', 6, 'Department reports manhole cleaned.'],
      ['resolved', 7, 'Complaint closed as resolved by the department.'],
      ['disputed', 9, 'Citizen reports overflow resumed two days after closure. Photo attached.', 'user'],
      ['reopened', 11, 'Complaint reopened on the portal.'],
    ],
  },
  {
    ref: 'MCF/2026/EL/01544',
    title: 'Three streetlights not working on Hospital road',
    category: 'streetlights',
    localityId: 'sec21',
    landmark: 'Hospital road, between gate 2 and gate 3',
    description: 'Three consecutive streetlights have been off for over two weeks, leaving the stretch dark after 7 pm.',
    submitted: '2026-09-24',
    status: 'Overdue',
    steps: [
      ['acknowledged', 2, 'Complaint acknowledged.'],
      ['overdue', 9, 'No further update after the 7-day sample service timeline.', 'user'],
    ],
  },
  {
    ref: 'CMW/2026/HLT/55812',
    title: 'Long waiting time and no token system at district hospital OPD',
    category: 'health',
    localityId: 'sec21',
    landmark: 'Hospital road',
    description: 'Patients wait more than four hours in the OPD queue without any token system or seating for elderly patients.',
    submitted: '2026-09-05',
    status: 'In Progress',
    hasPhoto: false,
    steps: [
      ['acknowledged', 3, 'Grievance acknowledged and forwarded to the Civil Surgeon office.'],
      ['assigned', 10, 'Assigned to Principal Medical Officer for report.'],
    ],
  },
  {
    ref: 'MDA/2026/RD/00417',
    title: 'Broken road surface on Sector 86 main road',
    category: 'roads',
    localityId: 'greater',
    landmark: 'Sector 86 main road, near the bus stop',
    description: 'A 200-metre stretch of the main road has broken surface and exposed gravel, causing dust and skidding.',
    submitted: '2026-07-14',
    status: 'Resolved',
    verification: 'pending',
    steps: [
      ['acknowledged', 4, 'Complaint acknowledged by the authority.'],
      ['assigned', 8, 'Included in resurfacing work order.'],
      ['action', 52, 'Authority reports resurfacing completed.'],
      ['resolved', 54, 'Complaint closed as resolved by the authority.'],
    ],
  },
  {
    ref: 'MCF/2026/SN/04102',
    title: 'Garbage dumped on vacant plot near Railway road',
    category: 'garbage',
    localityId: 'oldfbd',
    landmark: 'Railway road, behind the sabzi mandi',
    description: 'A vacant plot is being used as an unofficial dumping site. Garbage is being burnt in the evenings.',
    submitted: '2026-10-08',
    status: 'In Progress',
    steps: [
      ['acknowledged', 1, 'Complaint acknowledged.'],
      ['assigned', 4, 'Assigned to sanitation inspector, Old Faridabad zone.'],
    ],
  },
  {
    ref: 'SED/FBD/2026/0091',
    title: 'No drinking water in government school for students',
    category: 'education',
    localityId: 'ballabgarh',
    landmark: 'Main bazaar, government senior secondary school',
    description: 'The water cooler and RO unit in the school have not worked since August. Students bring water from home.',
    submitted: '2026-09-18',
    status: 'Submitted',
    hasPhoto: false,
    steps: [],
  },
  {
    ref: 'MCF/2026/WS/03310',
    title: 'Low water pressure in Ballabgarh Sector 3 road houses',
    category: 'water',
    localityId: 'ballabgarh',
    landmark: 'Sector 3 road',
    description: 'Water supply in the morning slot has had very low pressure for ten days; upper floors receive no water.',
    submitted: '2026-10-15',
    status: 'Acknowledged',
    hasPhoto: false,
    steps: [['acknowledged', 3, 'Complaint acknowledged.']],
  },
  {
    ref: 'MCF/2026/RD/03019',
    title: 'Waterlogged and damaged road near Nehru Ground',
    category: 'roads',
    localityId: 'nit',
    landmark: 'Nehru Ground, east gate',
    description: 'Rainwater collects on the damaged stretch every time it rains and the road surface has broken further.',
    submitted: '2026-08-04',
    status: 'Resolved',
    verification: 'disputed',
    steps: [
      ['acknowledged', 2, 'Complaint acknowledged.'],
      ['assigned', 5, 'Assigned to Junior Engineer, NIT zone.'],
      ['action', 30, 'Department reports patch repair done.'],
      ['resolved', 31, 'Complaint closed as resolved by the department.'],
      ['disputed', 36, 'Citizen reports patch washed out after rain; waterlogging continues.', 'user'],
    ],
  },
  {
    ref: 'HP/FBD/TR/76004',
    title: 'Autos parked across Ballabgarh bus stand exit',
    category: 'parking',
    localityId: 'ballabgarh',
    landmark: 'Ballabgarh bus stand exit',
    description: 'Auto-rickshaws park across the bus stand exit lane, blocking buses during evening hours.',
    submitted: '2026-09-30',
    status: 'Resolved',
    verification: 'confirmed',
    steps: [
      ['acknowledged', 1, 'Complaint registered with the traffic unit.'],
      ['action', 4, 'Traffic unit reports enforcement drive conducted.'],
      ['resolved', 4, 'Complaint closed.'],
      ['verification', 8, 'Citizen confirms exit lane is clear during evening hours.', 'user'],
    ],
  },
];

export const SEED_COMPLAINTS: Complaint[] = SEEDS.map(build);
