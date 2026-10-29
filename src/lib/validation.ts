import type { ComplaintDraft } from '../data/types';

export type Errors = Partial<Record<keyof ComplaintDraft, string>>;

export function validateDraft(d: ComplaintDraft): Errors {
  const e: Errors = {};
  if (d.title.trim().length < 10) e.title = 'Enter a title of at least 10 characters.';
  else if (d.title.length > 120) e.title = 'Keep the title under 120 characters.';
  if (!d.category) e.category = 'Choose a category.';
  if (d.description.trim().length < 30) e.description = 'Describe the problem in at least 30 characters so the department can understand it.';
  if (!d.state) e.state = 'Choose a state.';
  if (!d.city) e.city = 'Choose a city.';
  if (!d.localityId) e.localityId = 'Choose a locality.';
  if (!/^[1-9][0-9]{5}$/.test(d.pin)) e.pin = 'Enter a valid 6-digit PIN code.';
  if (d.coordinates.trim()) {
    const m = d.coordinates.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
    if (!m || Math.abs(+m[1]) > 90 || Math.abs(+m[2]) > 180) e.coordinates = 'Use the format latitude, longitude — for example 28.3936, 77.3178.';
  }
  if (!d.incidentDate) e.incidentDate = 'Enter the date you first noticed the problem.';
  else if (d.incidentDate > new Date().toISOString().slice(0, 10)) e.incidentDate = 'The date cannot be in the future.';
  if (!d.departmentId) e.departmentId = 'Choose the department.';
  if (!d.serviceId) e.serviceId = 'Choose the official channel.';
  if (d.complaintText.trim().length < 50) e.complaintText = 'The complaint text should be at least 50 characters.';
  if (/\b\d{4}\s?\d{4}\s?\d{4}\b/.test(d.complaintText + ' ' + d.description))
    e.description = 'This looks like an Aadhaar number. Please remove it — it is not needed to file a civic complaint.';
  return e;
}

export function validateRef(ref: string): string {
  const r = ref.trim();
  if (r.length < 4) return 'Enter the reference number shown by the official portal.';
  if (r.length > 40) return 'Reference numbers are usually shorter than 40 characters.';
  if (!/^[A-Za-z0-9/\-_.]+$/.test(r)) return 'Use only letters, numbers, slashes, hyphens or dots.';
  return '';
}
