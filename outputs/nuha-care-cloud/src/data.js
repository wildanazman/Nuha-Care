import { supabase } from './supabase';

const orderByDateTime = { ascending: false };

function withCreator(payload, activeMember) {
  return {
    ...payload,
    created_by_member_id: activeMember?.id ?? null,
    created_by_name: activeMember?.name ?? '',
  };
}

function withUpdatedAt(payload) {
  return {
    ...payload,
    updated_at: new Date().toISOString(),
  };
}

function requireSupabase() {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
  return supabase;
}

export async function getFamilyMembers() {
  const client = requireSupabase();
  const { data, error } = await client
    .from('family_members')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addFamilyMember(name, relationship = '') {
  const client = requireSupabase();
  const { data, error } = await client
    .from('family_members')
    .insert({ name, relationship })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function ensureDefaultFamilyMembers() {
  const members = await getFamilyMembers();
  if (members.length) return members;
  const client = requireSupabase();
  const defaults = [
    { name: 'ABI', relationship: 'Family' },
    { name: 'UMI', relationship: 'Family' },
    { name: 'ABANG', relationship: 'Family' },
    { name: 'ALONG', relationship: 'Family' },
    { name: 'ANGAH', relationship: 'Family' },
    { name: 'AYIN', relationship: 'Family' },
  ];
  const { data, error } = await client.from('family_members').insert(defaults).select();
  if (error) throw error;
  return data ?? [];
}

export async function getLogs() {
  const client = requireSupabase();
  const [weights, meals, medicines, bowels, appointments] = await Promise.all([
    client.from('weight_logs').select('*').order('date', orderByDateTime).order('created_at', orderByDateTime),
    client.from('meal_logs').select('*').order('date', orderByDateTime).order('created_at', orderByDateTime),
    client.from('medicine_logs').select('*').order('date', orderByDateTime).order('created_at', orderByDateTime),
    client.from('bowel_logs').select('*').order('date', orderByDateTime).order('created_at', orderByDateTime),
    client.from('appointments').select('*').order('date', { ascending: true }).order('time', { ascending: true }),
  ]);
  const responses = [weights, meals, medicines, bowels, appointments];
  const failed = responses.find((response) => response.error);
  if (failed) throw failed.error;
  return {
    weights: weights.data ?? [],
    meals: meals.data ?? [],
    medicines: medicines.data ?? [],
    bowels: bowels.data ?? [],
    appointments: appointments.data ?? [],
  };
}

export async function getLogsForDate(date) {
  const client = requireSupabase();
  const [weights, meals, medicines, bowels, appointments] = await Promise.all([
    client.from('weight_logs').select('*').eq('date', date).order('time', { ascending: true }).order('created_at', { ascending: true }),
    client.from('meal_logs').select('*').eq('date', date).order('created_at', { ascending: true }),
    client.from('medicine_logs').select('*').eq('date', date).order('time', { ascending: true }).order('created_at', { ascending: true }),
    client.from('bowel_logs').select('*').eq('date', date).order('created_at', { ascending: true }),
    client.from('appointments').select('*').eq('date', date).order('time', { ascending: true }),
  ]);
  const responses = [weights, meals, medicines, bowels, appointments];
  const failed = responses.find((response) => response.error);
  if (failed) throw failed.error;
  return {
    weights: weights.data ?? [],
    meals: meals.data ?? [],
    medicines: medicines.data ?? [],
    bowels: bowels.data ?? [],
    appointments: appointments.data ?? [],
  };
}

export async function addWeight(payload, activeMember) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('weight_logs')
    .insert(withCreator(payload, activeMember))
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateWeight(id, payload) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('weight_logs')
    .update(withUpdatedAt(payload))
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteWeight(id) {
  const client = requireSupabase();
  const { error } = await client.from('weight_logs').delete().eq('id', id);
  if (error) throw error;
}

export async function addMedicine(payload, activeMember) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('medicine_logs')
    .insert(withCreator(payload, activeMember))
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateMedicine(id, payload) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('medicine_logs')
    .update(withUpdatedAt(payload))
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMedicine(id) {
  const client = requireSupabase();
  const { error } = await client.from('medicine_logs').delete().eq('id', id);
  if (error) throw error;
}

export async function addBowel(payload, activeMember) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('bowel_logs')
    .insert(withCreator(payload, activeMember))
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function addAppointment(payload, activeMember) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('appointments')
    .insert(withCreator(payload, activeMember))
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateAppointment(id, payload) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('appointments')
    .update(withUpdatedAt(payload))
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteAppointment(id) {
  const client = requireSupabase();
  const { error } = await client.from('appointments').delete().eq('id', id);
  if (error) throw error;
}

export async function uploadMealPhoto(file, prefix) {
  if (!file) return '';
  const client = requireSupabase();
  const safeName = file.name.replace(/[^a-z0-9.-]/gi, '-').toLowerCase();
  const path = `${prefix}/${Date.now()}-${safeName}`;
  const { error } = await client.storage.from('meal-photos').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;
  const { data } = client.storage.from('meal-photos').getPublicUrl(path);
  return data.publicUrl;
}

export async function addMeal(payload, activeMember) {
  const client = requireSupabase();
  const [beforePhotoUrl, afterPhotoUrl] = await Promise.all([
    uploadMealPhoto(payload.beforePhotoFile, 'before'),
    uploadMealPhoto(payload.afterPhotoFile, 'after'),
  ]);
  const { beforePhotoFile, afterPhotoFile, ...meal } = payload;
  const { data, error } = await client
    .from('meal_logs')
    .insert(withCreator({
      ...meal,
      before_photo_url: beforePhotoUrl,
      after_photo_url: afterPhotoUrl,
    }, activeMember))
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateMeal(id, payload) {
  const client = requireSupabase();
  const [beforePhotoUrl, afterPhotoUrl] = await Promise.all([
    uploadMealPhoto(payload.beforePhotoFile, 'before'),
    uploadMealPhoto(payload.afterPhotoFile, 'after'),
  ]);
  const { beforePhotoFile, afterPhotoFile, ...meal } = payload;
  const updatePayload = {
    ...meal,
    ...(beforePhotoUrl ? { before_photo_url: beforePhotoUrl } : {}),
    ...(afterPhotoUrl ? { after_photo_url: afterPhotoUrl } : {}),
  };
  const { data, error } = await client
    .from('meal_logs')
    .update(withUpdatedAt(updatePayload))
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMeal(id) {
  const client = requireSupabase();
  const { error } = await client.from('meal_logs').delete().eq('id', id);
  if (error) throw error;
}
