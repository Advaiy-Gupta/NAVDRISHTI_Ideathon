import type { Category, CategoryId, Department, Locality } from './types';

// Illustrative service timelines. Not official service-level standards.
export const CATEGORIES: Category[] = [
  { id: 'roads', label: 'Roads and potholes', labelHi: 'सड़क और गड्ढे', slaDays: 15 },
  { id: 'parking', label: 'Illegal parking', labelHi: 'अवैध पार्किंग', slaDays: 3 },
  { id: 'garbage', label: 'Garbage and sanitation', labelHi: 'कूड़ा और स्वच्छता', slaDays: 5 },
  { id: 'water', label: 'Water and drainage', labelHi: 'पानी और जल निकासी', slaDays: 7 },
  { id: 'streetlights', label: 'Streetlights', labelHi: 'स्ट्रीट लाइट', slaDays: 7 },
  { id: 'health', label: 'Public hospital services', labelHi: 'सरकारी अस्पताल सेवाएँ', slaDays: 21 },
  { id: 'education', label: 'Government school facilities', labelHi: 'सरकारी स्कूल सुविधाएँ', slaDays: 30 },
  { id: 'other', label: 'Other public services', labelHi: 'अन्य सार्वजनिक सेवाएँ', slaDays: 30 },
];

export const categoryById = (id: CategoryId | ''): Category | undefined =>
  CATEGORIES.find((c) => c.id === id);

export const categoryLabel = (id: CategoryId | '', lang: 'en' | 'hi' = 'en'): string => {
  const c = categoryById(id);
  if (!c) return '—';
  return lang === 'hi' ? c.labelHi : c.label;
};

// Locality names are real areas of Faridabad; ward numbers, PINs and landmarks are illustrative.
export const LOCALITIES: Locality[] = [
  {
    id: 'sec15',
    name: 'Sector 15',
    ward: 'Ward 11 (sample)',
    pin: '121007',
    city: 'Faridabad',
    state: 'Haryana',
    zone: 'Central zone',
    aliases: ['sector 15', 'sec 15', 'sector-15', 'सेक्टर 15', 'सेक्टर-15'],
    landmarks: ['Sector 15 market', 'Community centre road', 'Sector 15–16 dividing road'],
  },
  {
    id: 'nit',
    name: 'NIT Faridabad',
    ward: 'Ward 4 (sample)',
    pin: '121001',
    city: 'Faridabad',
    state: 'Haryana',
    zone: 'NIT zone',
    aliases: ['nit', 'n.i.t', 'nit faridabad', 'एनआईटी', 'नेहरू ग्राउंड'],
    landmarks: ['Neelam chowk', 'Nehru Ground', 'NIT 5 market'],
  },
  {
    id: 'oldfbd',
    name: 'Old Faridabad',
    ward: 'Ward 20 (sample)',
    pin: '121002',
    city: 'Faridabad',
    state: 'Haryana',
    zone: 'Old Faridabad zone',
    aliases: ['old faridabad', 'purana faridabad', 'ओल्ड फरीदाबाद', 'पुराना फरीदाबाद'],
    landmarks: ['Old Faridabad chowk', 'Sabzi mandi road', 'Railway road'],
  },
  {
    id: 'ballabgarh',
    name: 'Ballabgarh',
    ward: 'Ward 33 (sample)',
    pin: '121004',
    city: 'Faridabad',
    state: 'Haryana',
    zone: 'Ballabgarh zone',
    aliases: ['ballabgarh', 'ballabhgarh', 'बल्लभगढ़'],
    landmarks: ['Ballabgarh bus stand', 'Main bazaar', 'Sector 3 road'],
  },
  {
    id: 'sec21',
    name: 'Sector 21',
    ward: 'Ward 14 (sample)',
    pin: '121001',
    city: 'Faridabad',
    state: 'Haryana',
    zone: 'Central zone',
    aliases: ['sector 21', 'sec 21', 'sector-21', 'सेक्टर 21'],
    landmarks: ['Sector 21C market', 'Sector 21 park', 'Hospital road'],
  },
  {
    id: 'greater',
    name: 'Greater Faridabad (Sector 86)',
    ward: 'Ward 38 (sample)',
    pin: '121002',
    city: 'Faridabad',
    state: 'Haryana',
    zone: 'Greater Faridabad zone',
    aliases: ['greater faridabad', 'sector 86', 'sec 86', 'ग्रेटर फरीदाबाद', 'सेक्टर 86'],
    landmarks: ['Sector 86 main road', 'BPTP road', 'Sector 86–87 dividing road'],
  },
];

export const localityById = (id: string): Locality | undefined => LOCALITIES.find((l) => l.id === id);

// Department names describe the kind of body responsible. Assignments are illustrative.
export const DEPARTMENTS: Department[] = [
  { id: 'mc-roads', name: 'Municipal Corporation — Engineering Wing (Roads)', shortName: 'MC Engineering (Roads)', parent: 'Municipal Corporation Faridabad', categories: ['roads'] },
  { id: 'mda-roads', name: 'Metropolitan Development Authority — Infrastructure Division', shortName: 'MDA Infrastructure', parent: 'Faridabad Metropolitan Development Authority', categories: ['roads', 'water'] },
  { id: 'mc-sanitation', name: 'Municipal Corporation — Sanitation Wing', shortName: 'MC Sanitation', parent: 'Municipal Corporation Faridabad', categories: ['garbage'] },
  { id: 'mc-water', name: 'Municipal Corporation — Water Supply and Sewerage', shortName: 'MC Water & Sewerage', parent: 'Municipal Corporation Faridabad', categories: ['water'] },
  { id: 'mc-electrical', name: 'Municipal Corporation — Electrical Division (Streetlights)', shortName: 'MC Electrical', parent: 'Municipal Corporation Faridabad', categories: ['streetlights'] },
  { id: 'traffic', name: 'Traffic Police, Faridabad', shortName: 'Traffic Police', parent: 'Haryana Police', categories: ['parking'] },
  { id: 'health', name: 'Office of the Civil Surgeon, Faridabad', shortName: 'Civil Surgeon Office', parent: 'Health Department, Haryana', categories: ['health'] },
  { id: 'education', name: 'Office of the District Education Officer, Faridabad', shortName: 'District Education Office', parent: 'School Education Department, Haryana', categories: ['education'] },
  { id: 'cpgrams', name: 'General grievance redressal (CPGRAMS / CM Window)', shortName: 'General grievances', parent: 'Central / State grievance system', categories: ['other'] },
];

export const departmentById = (id: string): Department | undefined => DEPARTMENTS.find((d) => d.id === id);

/**
 * Mock jurisdiction rules: which department handles a category in a locality.
 * Example rule: Greater Faridabad sector roads are maintained by the development authority
 * in this sample dataset; elsewhere the municipal corporation is responsible.
 */
export interface JurisdictionResult {
  departmentId: string;
  serviceId: string;
  reason: string;
}

export function resolveJurisdiction(category: CategoryId, localityId: string): JurisdictionResult {
  const loc = localityById(localityId);
  const where = loc ? loc.name : 'this area';
  switch (category) {
    case 'roads':
      if (localityId === 'greater')
        return {
          departmentId: 'mda-roads',
          serviceId: 'mda-grievance',
          reason: `In the sample jurisdiction data, sector roads in ${where} are maintained by the development authority rather than the municipal corporation.`,
        };
      return {
        departmentId: 'mc-roads',
        serviceId: 'mcf-grievance',
        reason: `Internal roads in ${where} are listed under the municipal corporation's engineering wing in the sample jurisdiction data.`,
      };
    case 'water':
      if (localityId === 'greater')
        return {
          departmentId: 'mda-roads',
          serviceId: 'mda-grievance',
          reason: `Bulk water and master drainage in ${where} are listed under the development authority in the sample jurisdiction data.`,
        };
      return {
        departmentId: 'mc-water',
        serviceId: 'mcf-grievance',
        reason: `Water supply and sewer lines in ${where} are listed under the municipal corporation in the sample jurisdiction data.`,
      };
    case 'garbage':
      return { departmentId: 'mc-sanitation', serviceId: 'mcf-grievance', reason: `Solid-waste collection in ${where} is a municipal function.` };
    case 'streetlights':
      return { departmentId: 'mc-electrical', serviceId: 'mcf-grievance', reason: `Streetlights on municipal roads in ${where} are maintained by the municipal electrical division in the sample data.` };
    case 'parking':
      return { departmentId: 'traffic', serviceId: 'haryana-police', reason: `Enforcement against illegal parking and obstruction is handled by the traffic police.` };
    case 'health':
      return { departmentId: 'health', serviceId: 'cm-window', reason: `District government hospitals report to the Civil Surgeon; state-level grievances can be raised through the CM Window.` };
    case 'education':
      return { departmentId: 'education', serviceId: 'cm-window', reason: `Government schools in the district fall under the District Education Officer.` };
    default:
      return { departmentId: 'cpgrams', serviceId: 'cpgrams', reason: `No specific department matched, so the general grievance channel is suggested.` };
  }
}

export const STATES = ['Haryana', 'Delhi', 'Uttar Pradesh', 'Rajasthan', 'Punjab'];
export const CITIES: Record<string, string[]> = {
  Haryana: ['Faridabad', 'Gurugram', 'Panipat'],
  Delhi: ['New Delhi'],
  'Uttar Pradesh': ['Noida', 'Ghaziabad'],
  Rajasthan: ['Jaipur'],
  Punjab: ['Ludhiana'],
};

/** Reference "today" for the sample dataset. */
export const SNAPSHOT_DATE = '2026-10-28';
export const DATASET_START = '2026-05-01';
