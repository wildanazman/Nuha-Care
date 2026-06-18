import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  CalendarDays,
  Home,
  History,
  Lock,
  LogOut,
  Pill,
  Plus,
  Utensils,
  Save,
  Scale,
  Settings,
  UserRound,
  FileText,
  MoreHorizontal,
  Printer,
  Droplet,
  Camera,
  ImagePlus,
  X,
} from 'lucide-react';
import {
  addAppointment,
  addBowel,
  addFamilyMember,
  addMeal,
  addMedicine,
  addPeriod,
  addWeight,
  deleteAppointment,
  deleteMeal,
  deleteMedicine,
  deletePeriod,
  deleteWeight,
  ensureDefaultFamilyMembers,
  getLogs,
  getLogsForDate,
  updateAppointment,
  updateMeal,
  updateMedicine,
  updatePeriod,
  updateWeight,
} from './data';
import { isSupabaseConfigured } from './supabase';
import './styles.css';

const familyCode = import.meta.env.VITE_FAMILY_ACCESS_CODE ?? 'NUHA2026';
const today = () => dateInputValue(new Date());
const nowTime = () => new Date().toTimeString().slice(0, 5);
const sameDay = (row, date = today()) => row.date === date;
const moneyDate = (date) => new Date(`${date}T00:00:00`).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' });
const REPORT_ROWS = [
  ['Breakfast', 'Breakfast'],
  ['Morning Tea', 'Morning Snack'],
  ['Lunch', 'Lunch'],
  ['Evening Tea', 'Evening Snack'],
  ['Dinner', 'Dinner'],
  ['Supper', 'Supper'],
];

function App() {
  const [hasAccess, setHasAccess] = useState(() => localStorage.getItem('nuha-family-access') === 'yes');
  const [activeMember, setActiveMember] = useState(() => JSON.parse(localStorage.getItem('nuha-active-member') || 'null'));
  const [members, setMembers] = useState([]);
  const [logs, setLogs] = useState({ weights: [], meals: [], medicines: [], bowels: [], periods: [], appointments: [] });
  const [screen, setScreen] = useState('home');
  const [formDate, setFormDate] = useState(today());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function refresh() {
    if (!hasAccess || !isSupabaseConfigured) return;
    setLoading(true);
    setError('');
    try {
      const [familyMembers, nextLogs] = await Promise.all([ensureDefaultFamilyMembers(), getLogs()]);
      setMembers(familyMembers);
      setLogs(nextLogs);
      if (activeMember && !familyMembers.some((member) => member.id === activeMember.id)) {
        localStorage.removeItem('nuha-active-member');
        setActiveMember(null);
      }
    } catch (err) {
      setError(err.message || 'Tidak dapat load data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [hasAccess]);

  function selectMember(member) {
    setActiveMember(member);
    localStorage.setItem('nuha-active-member', JSON.stringify(member));
  }

  function logout() {
    localStorage.removeItem('nuha-family-access');
    localStorage.removeItem('nuha-active-member');
    setHasAccess(false);
    setActiveMember(null);
    setScreen('home');
  }

  if (!hasAccess) return <AccessScreen onAccess={() => setHasAccess(true)} />;
  if (!isSupabaseConfigured) return <Shell><Notice title="Supabase belum siap" text="Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY dalam .env.local, kemudian deploy/run semula." /></Shell>;
  if (!activeMember) return <MemberPicker members={members} onSelect={selectMember} onAdded={refresh} error={error} />;

  return (
    <Shell active={screen} setScreen={setScreen}>
      <Header activeMember={activeMember} onSettings={() => setScreen('settings')} />
      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Loading data Supabase...</p>}
      {screen === 'home' && <HomeScreen logs={logs} activeMember={activeMember} setScreen={setScreen} />}
      {screen === 'meal' && <MealsScreen logs={logs} activeMember={activeMember} refresh={refresh} setError={setError} initialDate={formDate} />}
      {screen === 'weight' && <WeightScreen logs={logs} activeMember={activeMember} refresh={refresh} setError={setError} initialDate={formDate} />}
      {screen === 'meds' && <MedicineScreen logs={logs} activeMember={activeMember} refresh={refresh} setError={setError} initialDate={formDate} />}
      {screen === 'bowel' && <BowelScreen logs={logs} activeMember={activeMember} refresh={refresh} setError={setError} initialDate={formDate} />}
      {screen === 'period' && <PeriodScreen logs={logs} activeMember={activeMember} refresh={refresh} setError={setError} initialDate={formDate} />}
      {screen === 'appointments' && <AppointmentsScreen logs={logs} activeMember={activeMember} refresh={refresh} setError={setError} initialDate={formDate} />}
      {screen === 'summary' && <LogsReviewScreen setScreen={setScreen} setFormDate={setFormDate} />}
      {screen === 'more' && <MoreScreen setScreen={setScreen} />}
      {screen === 'report' && <WeeklyReportScreen logs={logs} />}
      {screen === 'settings' && <SettingsScreen members={members} activeMember={activeMember} onSelect={selectMember} onAdded={refresh} onLogout={logout} />}
    </Shell>
  );
}

function AccessScreen({ onAccess }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  function submit(event) {
    event.preventDefault();
    if (code.trim() === familyCode) {
      localStorage.setItem('nuha-family-access', 'yes');
      onAccess();
      return;
    }
    setError('Family code salah. Cuba lagi.');
  }
  return (
    <div className="access-page">
      <form className="access-card" onSubmit={submit}>
        <div className="brand">Nuha Care</div>
        <div className="hero-mark"><Lock size={44} /></div>
        <h1>Nuha Care</h1>
        <p>Masukkan family code untuk buka log Nuha.</p>
        <label htmlFor="family-code">Family code</label>
        <input id="family-code" value={code} onChange={(event) => setCode(event.target.value)} autoFocus />
        {error && <p className="error">{error}</p>}
        <button className="primary" type="submit">Continue</button>
      </form>
    </div>
  );
}

function MemberPicker({ members, onSelect, onAdded, error }) {
  const [name, setName] = useState('');
  async function createMember(event) {
    event.preventDefault();
    if (!name.trim()) return;
    const member = await addFamilyMember(name.trim());
    setName('');
    await onAdded();
    onSelect(member);
  }
  return (
    <Shell>
      <div className="member-picker">
        <h1>Siapa yang guna app sekarang?</h1>
        <p className="muted">Setiap log akan simpan nama orang yang isi.</p>
        {error && <p className="error">{error}</p>}
        <div className="member-grid">
          {members.map((member) => (
            <button key={member.id} className="member-button" onClick={() => onSelect(member)}>
              <span>{member.name.slice(0, 1).toUpperCase()}</span>{member.name}
            </button>
          ))}
        </div>
        <form className="card form" onSubmit={createMember}>
          <label>Add New Person</label>
          <div className="inline-form">
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nama" />
            <button className="primary icon" type="submit"><Plus size={20} /></button>
          </div>
        </form>
      </div>
    </Shell>
  );
}

function Header({ activeMember, onSettings }) {
  return (
    <header className="topbar">
      <div className="avatar">N</div>
      <div>
        <h1>Nuha Care</h1>
        <p>Logging as {activeMember.name}</p>
      </div>
      <button className="ghost icon" onClick={onSettings} aria-label="Settings"><Settings size={22} /></button>
    </header>
  );
}

function HomeScreen({ logs, activeMember, setScreen }) {
  const latestWeight = logs.weights[0];
  const previousWeight = logs.weights[1];
  const diff = latestWeight && previousWeight ? Number(latestWeight.weight_kg) - Number(previousWeight.weight_kg) : null;
  const todayMeals = logs.meals.filter((row) => sameDay(row));
  const todayMeds = logs.medicines.filter((row) => sameDay(row));
  const todayBowel = logs.bowels.find((row) => sameDay(row));
  const cycle = cycleStats(logs.periods);
  const nextAppt = logs.appointments.find((row) => row.date >= today());
  return (
    <>
      <section className="intro">
        <h2>Morning, Nuha</h2>
        <p>Family care log is synced from Supabase.</p>
      </section>
      <div className="dashboard-grid">
        <Card title="Weight" icon={<Scale size={20} />} tone="white" action={diff === null ? '' : `${diff > 0 ? '+' : ''}${diff.toFixed(1)}kg`}>
          {latestWeight ? <p className="big">{latestWeight.weight_kg}<span>kg</span></p> : <Empty text="Belum ada berat direkod." />}
        </Card>
        <Card title="Meals" icon={<Utensils size={20} />} tone="green" action={`${todayMeals.length} today`}>
          <div className="bar"><span style={{ width: `${Math.min(todayMeals.length / 6 * 100, 100)}%` }} /></div>
          <p className="muted">{todayMeals.length ? `Last: ${todayMeals[0].meal_type}` : 'Belum ada meal log hari ini.'}</p>
        </Card>
        <Card title="Meds" icon={<Pill size={20} />} tone="pink">
          <p className="big small">{todayMeds.filter((row) => row.status === 'Taken').length}<span> taken</span></p>
          <p className="muted">{todayMeds.length ? `${todayMeds.length} log hari ini` : 'Belum ada medicine log.'}</p>
        </Card>
        <Card title="Toilet Log" tone="blue">
          <p className="big small">{todayBowel?.status ?? '-'}</p>
          <p className="muted">{todayBowel ? todayBowel.type || 'Logged' : 'Tak pergi tandas lagi hari ni.'}</p>
        </Card>
        <Card title="Period" icon={<Droplet size={20} />} tone="pink" action={cycle ? `Day ${cycle.cycleDay}` : ''}>
          {cycle ? <><p className="big small">{cycle.daysSince}<span> days ago</span></p><p className="muted">{cycle.overdue ? `Overdue by ${-cycle.daysUntilNext} days` : `Next ~${moneyDate(cycle.predictedNext)}`}</p></> : <Empty text="Belum ada period log." />}
        </Card>
        <Card title="Appointment" icon={<CalendarDays size={20} />} tone="white">
          {nextAppt ? <p><strong>{nextAppt.title}</strong><br /><span className="muted">{moneyDate(nextAppt.date)} {nextAppt.time || ''}</span></p> : <Empty text="Belum ada appointment akan datang." />}
        </Card>
      </div>
      <section>
        <h3 className="caps">Quick Log</h3>
        <div className="quick-actions">
          {[
            ['meal', 'Meal', <Utensils size={22} />],
            ['weight', 'Weight', <Scale size={22} />],
            ['meds', 'Med', <Pill size={22} />],
            ['bowel', 'Bowel', <History size={22} />],
            ['period', 'Period', <Droplet size={22} />],
            ['appointments', 'Appt', <CalendarDays size={22} />],
          ].map(([id, label, icon]) => <button key={id} onClick={() => setScreen(id)}><span>{icon}</span>{label}</button>)}
        </div>
      </section>
    </>
  );
}

const SNACK_MEAL_TYPES = ['Morning Snack', 'Evening Snack'];
const FOOD_MAIN_OPTIONS = [
  'Char kuey teow', 'Maggi goreng', 'Mee goreng', 'Bi hun goreng', 'Nasi ayam kari',
  'Nasi ayam kuning', 'Nasi ayam kicap', 'Spaghetti bolognese', 'Spaghetti carbonara',
  'Buttermilk chicken', 'Cereal', 'Maggi sup', 'Nasi goreng', 'Mi kari',
];
const FOOD_SNACK_OPTIONS = ['Ice cream'];
const FOOD_ADDITIONAL_OPTIONS = ['Telur mata', 'Telur dadar', 'Telur rebus', 'Telur separuh masak'];
const DRINK_OPTIONS = [
  'Orange juice', 'Sunquick', 'Ribena', 'Soya', 'Teh', 'Fanta strawberi',
  'F&N strawberi', 'Sirap bandung', 'Sirap', 'Apple juice',
];
function foodOptions(mealType) {
  return SNACK_MEAL_TYPES.includes(mealType) ? FOOD_SNACK_OPTIONS : FOOD_MAIN_OPTIONS;
}
function mergeOptions(presets, learned) {
  const seen = new Set(presets.map((item) => item.toLowerCase()));
  const extra = [];
  for (const raw of learned) {
    const value = (raw ?? '').trim();
    if (value && !seen.has(value.toLowerCase())) {
      seen.add(value.toLowerCase());
      extra.push(value);
    }
  }
  return [...extra, ...presets];
}

function MealsScreen({ logs, activeMember, refresh, setError, initialDate = today() }) {
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const emptyMealForm = {
    date: initialDate, meal_type: 'Breakfast', time_served: nowTime(), food_details: '',
    additional_food: '', drink_details: '', before_notes: '',
    time_finished: '', food_amount_eaten: 'Finished all', drink_amount_finished: 'Finished all',
    feeding_method: 'Self', issues: [], after_notes: '', beforePhotoFile: null, afterPhotoFile: null,
  };
  const [form, setForm] = useState(emptyMealForm);
  function editMeal(meal) {
    setEditingId(meal.id);
    setForm({
      date: meal.date ?? today(),
      meal_type: meal.meal_type ?? 'Breakfast',
      time_served: meal.time_served ?? '',
      food_details: meal.food_details ?? '',
      additional_food: meal.additional_food ?? '',
      drink_details: meal.drink_details ?? '',
      before_notes: meal.before_notes ?? '',
      time_finished: meal.time_finished ?? '',
      food_amount_eaten: meal.food_amount_eaten ?? 'Finished all',
      drink_amount_finished: meal.drink_amount_finished ?? 'Finished all',
      feeding_method: meal.feeding_method ?? 'Self',
      issues: meal.issues ?? [],
      after_notes: meal.after_notes ?? '',
      beforePhotoFile: null,
      afterPhotoFile: null,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function resetMealForm() {
    setEditingId(null);
    setForm(emptyMealForm);
  }
  async function removeMeal(id) {
    if (!window.confirm('Delete meal log?')) return;
    setError('');
    try {
      await deleteMeal(id);
      if (editingId === id) resetMealForm();
      await refresh();
    } catch (err) { setError(err.message); }
  }
  async function submit(event) {
    event.preventDefault();
    setSaving(true); setError('');
    try {
      if (editingId) await updateMeal(editingId, form);
      else await addMeal(form, activeMember);
      resetMealForm();
      await refresh();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }
  const isSnackType = SNACK_MEAL_TYPES.includes(form.meal_type);
  const learnedFood = logs.meals.filter((m) => SNACK_MEAL_TYPES.includes(m.meal_type) === isSnackType).map((m) => m.food_details);
  const foodOpts = mergeOptions(foodOptions(form.meal_type), learnedFood);
  const additionalOpts = mergeOptions(FOOD_ADDITIONAL_OPTIONS, logs.meals.map((m) => m.additional_food));
  const drinkOpts = mergeOptions(DRINK_OPTIONS, logs.meals.map((m) => m.drink_details));
  const todayMeals = logs.meals.filter((m) => sameDay(m));
  return (
    <Screen title="Meals" subtitle="Log makan hari ini. Tarikh lain pergi tab Logs.">
      <form className="form stack" onSubmit={submit}>
        <SectionTitle number="1" title="Before Meal" />
        <div className="grid two"><Field label="Date" type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} /><Select label="Meal Type" value={form.meal_type} options={['Breakfast', 'Morning Snack', 'Lunch', 'Evening Snack', 'Dinner', 'Supper']} onChange={(v) => setForm({ ...form, meal_type: v })} /></div>
        <Field label="Time served" type="time" value={form.time_served} onChange={(v) => setForm({ ...form, time_served: v })} />
        <Combo label="Food details" value={form.food_details} options={foodOpts} onChange={(v) => setForm({ ...form, food_details: v })} />
        <Combo label="Additional food / lauk" value={form.additional_food} options={additionalOpts} onChange={(v) => setForm({ ...form, additional_food: v })} />
        <Combo label="Drink details" value={form.drink_details} options={drinkOpts} onChange={(v) => setForm({ ...form, drink_details: v })} />
        <File label="Before photo" onChange={(file) => setForm({ ...form, beforePhotoFile: file })} />
        <Text label="Before notes" value={form.before_notes} onChange={(v) => setForm({ ...form, before_notes: v })} />
        <SectionTitle number="2" title="After Meal" />
        <div className="grid two"><Field label="Time finished" type="time" value={form.time_finished} onChange={(v) => setForm({ ...form, time_finished: v })} /><Select label="Feeding method" value={form.feeding_method} options={['Self', 'Suap', 'Mixed']} onChange={(v) => setForm({ ...form, feeding_method: v })} /></div>
        <Select label="Food amount eaten" value={form.food_amount_eaten} options={['Finished all', 'More than half', 'Half', 'Less than half', 'Few bites', 'Refused']} onChange={(v) => setForm({ ...form, food_amount_eaten: v })} />
        <Select label="Drink amount finished" value={form.drink_amount_finished} options={['Finished all', '1 cup', '1/2 cup', '1/4 cup', 'Few sips', 'Refused']} onChange={(v) => setForm({ ...form, drink_amount_finished: v })} />
        <File label="After photo" onChange={(file) => setForm({ ...form, afterPhotoFile: file })} />
        <Checklist label="Issues" values={form.issues} options={['No issue', 'Chewing difficulty', 'Swallowing difficulty', 'Spit out food', 'Coughing', 'Vomited', 'Refused', 'Took long time']} onChange={(issues) => setForm({ ...form, issues })} />
        <Text label="After notes" value={form.after_notes} onChange={(v) => setForm({ ...form, after_notes: v })} />
        <button className="primary save" disabled={saving}><Save size={20} />{saving ? 'Saving...' : editingId ? 'Update Meal Log' : 'Save Meal Log'}</button>
        {editingId && <button className="secondary-action" type="button" onClick={resetMealForm}>Cancel edit</button>}
      </form>
      <h3 className="caps">Log hari ini</h3>
      <LogList rows={todayMeals} empty="Belum ada meal log hari ini." render={(meal) => <MealCard meal={meal} onEdit={() => editMeal(meal)} onDelete={() => removeMeal(meal.id)} />} />
    </Screen>
  );
}

function WeightScreen({ logs, activeMember, refresh, setError, initialDate = today() }) {
  const initialForm = { date: initialDate, time: nowTime(), weight_kg: '', notes: '' };
  const [form, setForm] = useState(initialForm);
  return <SimpleForm title="Weight" subtitle="Add weight and view history." form={form} setForm={setForm} initialForm={initialForm} onSave={() => addWeight(form, activeMember)} onUpdate={(id) => updateWeight(id, form)} onDelete={deleteWeight} toForm={(row) => ({ date: row.date ?? today(), time: row.time ?? '', weight_kg: row.weight_kg ?? '', notes: row.notes ?? '' })} refresh={refresh} setError={setError} logs={logs.weights} empty="Belum ada berat direkod." fields={<><div className="grid two"><Field label="Date" type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} /><Field label="Time" type="time" value={form.time} onChange={(v) => setForm({ ...form, time: v })} /></div><Field label="Weight kg" type="number" step="0.1" required value={form.weight_kg} onChange={(v) => setForm({ ...form, weight_kg: v })} /><Text label="Notes" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} /></>} render={(row, actions) => <BasicLog title={`${row.weight_kg} kg`} meta={`${moneyDate(row.date)} ${row.time || ''}`} row={row} {...actions} />} />;
}

function MedicineScreen({ logs, activeMember, refresh, setError, initialDate = today() }) {
  const initialForm = { date: initialDate, time: nowTime(), medicine_name: '', dosage: '', status: 'Taken', notes: '' };
  const [form, setForm] = useState(initialForm);
  return <SimpleForm title="Medicine" subtitle="Log medicine taken, missed or skipped." form={form} setForm={setForm} initialForm={initialForm} onSave={() => addMedicine(form, activeMember)} onUpdate={(id) => updateMedicine(id, form)} onDelete={deleteMedicine} toForm={(row) => ({ date: row.date ?? today(), time: row.time ?? '', medicine_name: row.medicine_name ?? '', dosage: row.dosage ?? '', status: row.status ?? 'Taken', notes: row.notes ?? '' })} refresh={refresh} setError={setError} logs={logs.medicines} empty="Belum ada medicine log." fields={<><div className="grid two"><Field label="Date" type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} /><Field label="Time" type="time" value={form.time} onChange={(v) => setForm({ ...form, time: v })} /></div><Field label="Medicine name" required value={form.medicine_name} onChange={(v) => setForm({ ...form, medicine_name: v })} /><div className="grid two"><Field label="Dosage" value={form.dosage} onChange={(v) => setForm({ ...form, dosage: v })} /><Select label="Status" value={form.status} options={['Taken', 'Missed', 'Skipped']} onChange={(v) => setForm({ ...form, status: v })} /></div><Text label="Notes" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} /></>} render={(row, actions) => <BasicLog title={`${row.medicine_name} - ${row.status}`} meta={`${moneyDate(row.date)} ${row.time || ''}`} row={row} {...actions} />} />;
}

function BowelScreen({ logs, activeMember, refresh, setError, initialDate = today() }) {
  const [form, setForm] = useState({ date: initialDate, status: 'Yes', type: 'Normal', notes: '' });
  return <SimpleForm title="Bowel Movement" subtitle="Simple daily bowel record." form={form} setForm={setForm} onSave={() => addBowel(form, activeMember)} refresh={refresh} setError={setError} logs={logs.bowels} empty="Belum ada bowel log." fields={<><Field label="Date" type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} /><div className="grid two"><Select label="Status" value={form.status} options={['Yes', 'No', 'Not sure']} onChange={(v) => setForm({ ...form, status: v })} /><Select label="Type" value={form.type} options={['Normal', 'Hard', 'Soft', 'Watery', 'Not sure']} onChange={(v) => setForm({ ...form, type: v })} /></div><Text label="Notes" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} /></>} render={(row) => <BasicLog title={`${row.status}${row.type ? ` - ${row.type}` : ''}`} meta={moneyDate(row.date)} row={row} />} />;
}

const PERIOD_FLOW = ['Spotting', 'Light', 'Medium', 'Heavy'];
const PERIOD_SYMPTOMS = ['No issue', 'Cramps', 'Pain', 'Mood changes', 'Tired', 'Headache', 'Bloating', 'Poor appetite'];

function cycleStats(periods) {
  const starts = (periods ?? []).map((row) => row.date).filter(Boolean).sort();
  if (!starts.length) return null;
  const last = starts[starts.length - 1];
  const lengths = [];
  for (let index = 1; index < starts.length; index += 1) {
    lengths.push(dayDiff(starts[index - 1], starts[index]));
  }
  const valid = lengths.filter((value) => value > 0 && value < 90);
  const avg = valid.length ? Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length) : 28;
  const predictedNext = addDays(last, avg);
  const daysSince = dayDiff(last, today());
  const daysUntilNext = dayDiff(today(), predictedNext);
  return {
    last,
    avg,
    predictedNext,
    daysSince,
    daysUntilNext,
    cycleDay: daysSince + 1,
    overdue: daysUntilNext < 0,
    count: starts.length,
    estimate: valid.length === 0,
  };
}

function periodDuration(row) {
  if (!row.end_date) return null;
  const days = dayDiff(row.date, row.end_date) + 1;
  return days > 0 ? days : null;
}

function PeriodScreen({ logs, activeMember, refresh, setError, initialDate = today() }) {
  const stats = cycleStats(logs.periods);
  const initialForm = { date: initialDate, end_date: '', flow: 'Medium', symptoms: [], notes: '' };
  const [form, setForm] = useState(initialForm);
  return (
    <>
      <section className="intro"><h2>Period</h2><p>Track Nuha menstrual cycle and predict next period.</p></section>
      <div className="dashboard-grid">
        <Card title="Last Period" icon={<Droplet size={20} />} tone="pink">
          {stats ? <><p className="big small">{stats.daysSince}<span> days ago</span></p><p className="muted">{moneyDate(stats.last)} - cycle day {stats.cycleDay}</p></> : <Empty text="Belum ada period log." />}
        </Card>
        <Card title="Predicted Next" icon={<CalendarDays size={20} />} tone="white">
          {stats ? <><p className="big small">{moneyDate(stats.predictedNext)}</p><p className="muted">{stats.overdue ? `Overdue by ${-stats.daysUntilNext} days` : `In ${stats.daysUntilNext} days`}</p></> : <Empty text="Perlu sekurang-kurangnya 1 log." />}
        </Card>
        <Card title="Avg Cycle" tone="green">
          {stats ? <><p className="big small">{stats.avg}<span> days</span></p><p className="muted">{stats.estimate ? 'Anggaran (default 28)' : `Dari ${stats.count} log`}</p></> : <Empty text="-" />}
        </Card>
      </div>
      <SimpleForm
        title="Add Period Log"
        subtitle="Record start, end, flow and symptoms."
        form={form}
        setForm={setForm}
        initialForm={initialForm}
        onSave={() => addPeriod({ ...form, end_date: form.end_date || null }, activeMember)}
        onUpdate={(id) => updatePeriod(id, { ...form, end_date: form.end_date || null })}
        onDelete={deletePeriod}
        toForm={(row) => ({ date: row.date ?? today(), end_date: row.end_date ?? '', flow: row.flow ?? 'Medium', symptoms: row.symptoms ?? [], notes: row.notes ?? '' })}
        refresh={refresh}
        setError={setError}
        logs={logs.periods}
        empty="Belum ada period log."
        fields={<>
          <div className="grid two">
            <Field label="Start date" type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
            <Field label="End date (optional)" type="date" value={form.end_date} onChange={(v) => setForm({ ...form, end_date: v })} />
          </div>
          <Select label="Flow" value={form.flow} options={PERIOD_FLOW} onChange={(v) => setForm({ ...form, flow: v })} />
          <Checklist label="Symptoms" values={form.symptoms} options={PERIOD_SYMPTOMS} onChange={(symptoms) => setForm({ ...form, symptoms })} />
          <Text label="Notes" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />
        </>}
        render={(row, actions) => <BasicLog title={`${row.flow || 'Period'}${periodDuration(row) ? ` - ${periodDuration(row)} days` : ''}`} meta={`${moneyDate(row.date)}${row.end_date ? ` to ${moneyDate(row.end_date)}` : ''}${row.symptoms?.length ? ` | ${row.symptoms.join(', ')}` : ''}`} row={row} {...actions} />}
      />
    </>
  );
}

function AppointmentsScreen({ logs, activeMember, refresh, setError, initialDate = today() }) {
  const initialForm = { title: '', date: initialDate, time: '', location: '', reason: '', questions: '', after_notes: '' };
  const [form, setForm] = useState(initialForm);
  return <SimpleForm title="Appointments" subtitle="Doctor visits and questions." form={form} setForm={setForm} initialForm={initialForm} onSave={() => addAppointment(form, activeMember)} onUpdate={(id) => updateAppointment(id, form)} onDelete={deleteAppointment} toForm={(row) => ({ title: row.title ?? '', date: row.date ?? today(), time: row.time ?? '', location: row.location ?? '', reason: row.reason ?? '', questions: row.questions ?? '', after_notes: row.after_notes ?? '' })} refresh={refresh} setError={setError} logs={logs.appointments} empty="Belum ada appointment." fields={<><Field label="Title" required value={form.title} onChange={(v) => setForm({ ...form, title: v })} /><div className="grid two"><Field label="Date" type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} /><Field label="Time" type="time" value={form.time} onChange={(v) => setForm({ ...form, time: v })} /></div><Field label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} /><Text label="Reason" value={form.reason} onChange={(v) => setForm({ ...form, reason: v })} /><Text label="Questions to ask doctor" value={form.questions} onChange={(v) => setForm({ ...form, questions: v })} /><Text label="Notes after appointment" value={form.after_notes} onChange={(v) => setForm({ ...form, after_notes: v })} /></>} render={(row, actions) => <BasicLog title={row.title} meta={`${moneyDate(row.date)} ${row.time || ''}`} row={row} {...actions} />} />;
}

function SimpleForm({ title, subtitle, fields, onSave, onUpdate, onDelete, toForm, initialForm, form, setForm, refresh, setError, logs, empty, render }) {
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  function startEdit(row) {
    if (!toForm) return;
    setEditingId(row.id);
    setForm(toForm(row));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function cancelEdit() {
    setEditingId(null);
    if (initialForm) setForm(initialForm);
  }
  async function removeRow(row) {
    if (!onDelete || !window.confirm('Delete this log?')) return;
    setError('');
    try {
      await onDelete(row.id);
      if (editingId === row.id) cancelEdit();
      await refresh();
    } catch (err) { setError(err.message); }
  }
  async function submit(event) {
    event.preventDefault();
    setSaving(true); setError('');
    try {
      if (editingId && onUpdate) await onUpdate(editingId);
      else await onSave();
      cancelEdit();
      await refresh();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }
  return <Screen title={title} subtitle={subtitle}><form className="card form stack" onSubmit={submit}>{fields}<button className="primary save" disabled={saving}><Save size={20} />{saving ? 'Saving...' : editingId ? 'Update' : 'Save'}</button>{editingId && <button className="secondary-action" type="button" onClick={cancelEdit}>Cancel edit</button>}</form><LogList rows={logs} empty={empty} render={(row) => render(row, onUpdate || onDelete ? { onEdit: () => startEdit(row), onDelete: () => removeRow(row) } : {})} /></Screen>;
}

function LogsReviewScreen({ setScreen, setFormDate }) {
  const [selectedDate, setSelectedDate] = useState(today());
  const [dayLogs, setDayLogs] = useState({ weights: [], meals: [], medicines: [], bowels: [], periods: [], appointments: [] });
  const [loadingDay, setLoadingDay] = useState(false);
  const [dayError, setDayError] = useState('');

  async function loadDay(date) {
    setLoadingDay(true);
    setDayError('');
    try {
      setDayLogs(await getLogsForDate(date));
    } catch (err) {
      setDayError(err.message || 'Tidak dapat load log.');
    } finally {
      setLoadingDay(false);
    }
  }

  useEffect(() => {
    loadDay(selectedDate);
  }, [selectedDate]);

  function addForDate(nextScreen) {
    setFormDate(selectedDate);
    setScreen(nextScreen);
  }

  const notes = [
    ...dayLogs.weights.map((row) => row.notes),
    ...dayLogs.medicines.map((row) => row.notes),
    ...dayLogs.bowels.map((row) => row.notes),
    ...dayLogs.periods.map((row) => row.notes),
    ...dayLogs.appointments.map((row) => row.after_notes),
    ...dayLogs.meals.map((row) => row.after_notes || row.before_notes),
  ].filter(Boolean);

  return (
    <div className="logs-review-page">
      <Screen title="Logs" subtitle={`Review logs for ${formatReviewDateLong(selectedDate)}.`}>
        {dayError && <p className="error">{dayError}</p>}
        {loadingDay && <p className="muted">Loading selected date...</p>}
        <ReviewSection title="Meals" button="Add Meal for this date" onAdd={() => addForDate('meal')}>
          {orderedMeals(dayLogs.meals).length ? orderedMeals(dayLogs.meals).map((meal) => <ReviewMeal key={meal.id} meal={meal} />) : <Empty text="Belum ada meal log untuk tarikh ini." />}
        </ReviewSection>
        <ReviewSection title="Weight" button="Add Weight for this date" onAdd={() => addForDate('weight')}>
          {dayLogs.weights.length ? dayLogs.weights.map((row) => <ReviewItem key={row.id} title={`${row.weight_kg} kg`} lines={[row.time, row.notes, `Logged by ${row.created_by_name || '-'}`]} />) : <Empty text="Belum ada berat direkod untuk tarikh ini." />}
        </ReviewSection>
        <ReviewSection title="Medicine" button="Add Medicine for this date" onAdd={() => addForDate('meds')}>
          {dayLogs.medicines.length ? dayLogs.medicines.map((row) => <ReviewItem key={row.id} title={`${row.medicine_name} - ${row.status}`} lines={[row.time, row.dosage, row.notes, `Logged by ${row.created_by_name || '-'}`]} />) : <Empty text="Belum ada medicine log untuk tarikh ini." />}
        </ReviewSection>
        <ReviewSection title="Toilet Log" button="Add Toilet Log for this date" onAdd={() => addForDate('bowel')}>
          {dayLogs.bowels.length ? dayLogs.bowels.map((row) => <ReviewItem key={row.id} title={`Poop: ${row.status}`} lines={[`Pee status: -`, `Pee frequency: -`, `Poop type: ${row.type || '-'}`, row.notes, `Logged by ${row.created_by_name || '-'}`]} />) : <Empty text="Belum ada toilet log untuk tarikh ini." />}
        </ReviewSection>
        <ReviewSection title="Period" button="Add Period for this date" onAdd={() => addForDate('period')}>
          {dayLogs.periods.length ? dayLogs.periods.map((row) => <ReviewItem key={row.id} title={`${row.flow || 'Period'}${periodDuration(row) ? ` - ${periodDuration(row)} days` : ''}`} lines={[row.end_date ? `Until ${moneyDate(row.end_date)}` : '', row.symptoms?.length ? row.symptoms.join(', ') : '', row.notes, `Logged by ${row.created_by_name || '-'}`]} />) : <Empty text="Belum ada period log untuk tarikh ini." />}
        </ReviewSection>
        <ReviewSection title="Appointments" button="Add Appointment for this date" onAdd={() => addForDate('appointments')}>
          {dayLogs.appointments.length ? dayLogs.appointments.map((row) => <ReviewItem key={row.id} title={row.title} lines={[row.time, row.location, row.reason, row.after_notes]} />) : <Empty text="Tiada appointment untuk tarikh ini." />}
        </ReviewSection>
        <ReviewSection title="Notes / Observations">
          {notes.length ? notes.map((note, index) => <p className="note-line" key={`${note}-${index}`}>{note}</p>) : <Empty text="Tiada notes untuk tarikh ini." />}
        </ReviewSection>
      </Screen>
      <DateReviewBar selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
    </div>
  );
}

function ReviewSection({ title, button, onAdd, children }) {
  return <section className="review-section"><div className="review-section-head"><h3>{title}</h3>{button && <button onClick={onAdd}>{button}</button>}</div><div className="stack">{children}</div></section>;
}

function ReviewMeal({ meal }) {
  return (
    <article className="review-card">
      <div className="review-card-head"><strong>{meal.meal_type}</strong><small>Logged by {meal.created_by_name || '-'}</small></div>
      <div className="review-photos">{meal.before_photo_url && <img src={meal.before_photo_url} alt="Before meal" />}{meal.after_photo_url && <img src={meal.after_photo_url} alt="After meal" />}</div>
      {foodWithAdditional(meal) && <p><b>Food:</b> {foodWithAdditional(meal)}</p>}
      {meal.food_amount_eaten && <p><b>Eaten:</b> {meal.food_amount_eaten}</p>}
      {meal.drink_amount_finished && <p><b>Drink:</b> {meal.drink_amount_finished}</p>}
      {meal.issues?.length ? <p><b>Issues:</b> {meal.issues.join(', ')}</p> : null}
    </article>
  );
}

function ReviewItem({ title, lines }) {
  return <article className="review-card"><strong>{title}</strong>{lines.filter(Boolean).map((line, index) => <p key={`${line}-${index}`}>{line}</p>)}</article>;
}

function DateReviewBar({ selectedDate, setSelectedDate }) {
  return (
    <div className="date-review-bar">
      <button onClick={() => setSelectedDate(addDays(selectedDate, -1))} aria-label="Previous day">&lt;</button>
      <strong>{formatReviewDate(selectedDate)}</strong>
      <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} aria-label="Next day">&gt;</button>
      <label className="calendar-button" aria-label="Pick date">Cal<input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></label>
      <button onClick={() => setSelectedDate(today())}>Today</button>
    </div>
  );
}

function orderedMeals(meals) {
  const order = ['Breakfast', 'Morning Snack', 'Lunch', 'Evening Snack', 'Dinner', 'Supper'];
  return [...meals].sort((a, b) => order.indexOf(a.meal_type) - order.indexOf(b.meal_type));
}

function addDays(date, amount) {
  const next = new Date(`${date}T00:00:00`);
  next.setDate(next.getDate() + amount);
  return dateInputValue(next);
}

function dayDiff(from, to) {
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return Math.round((end - start) / 86400000);
}

function datesBetween(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [today()];
  const first = start <= end ? start : end;
  const last = start <= end ? end : start;
  const days = [];
  const cursor = new Date(first);
  while (cursor <= last) {
    days.push(dateInputValue(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function dateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function chunkDays(days, size) {
  const chunks = [];
  for (let index = 0; index < days.length; index += size) {
    chunks.push(days.slice(index, index + size));
  }
  return chunks.length ? chunks : [[today()]];
}

function formatReviewDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatReviewDateLong(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function MoreScreen({ setScreen }) {
  return (
    <Screen title="More" subtitle="Extra tools for family care.">
      <div className="stack">
        <button className="tool-row" onClick={() => setScreen('report')}>
          <span><FileText size={22} /></span>
          <div>
            <strong>Weekly Report</strong>
            <small>Doctor meal report, printable PDF style</small>
          </div>
        </button>
        <button className="tool-row" onClick={() => setScreen('report')}>
          <span><Printer size={22} /></span>
          <div>
            <strong>Doctor Report</strong>
            <small>Same report, ready to print</small>
          </div>
        </button>
      </div>
    </Screen>
  );
}

function WeeklyReportScreen({ logs }) {
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState(addDays(today(), 6));
  const [extraNotes, setExtraNotes] = useState('');
  const [dayComments, setDayComments] = useState({});
  const days = useMemo(() => datesBetween(startDate, endDate), [startDate, endDate]);
  const pages = useMemo(() => chunkDays(days, 4), [days]);
  const mealsInRange = logs.meals.filter((meal) => days.includes(meal.date));

  return (
    <Screen title="Weekly Report" subtitle="Printable meal report for doctor visit.">
      <section className="card form stack no-print">
        <div className="grid two">
          <Field label="Start date" type="date" value={startDate} onChange={setStartDate} />
          <Field label="End date" type="date" value={endDate} onChange={setEndDate} />
        </div>
        <Text label="Extra notes for doctor" value={extraNotes} onChange={setExtraNotes} />
        <div className="report-actions">
          <button className="secondary-action" type="button" onClick={() => saveReportImage(startDate, endDate)}>
            <FileText size={20} /> Save Image
          </button>
          <button className="primary save" type="button" onClick={() => downloadDoctorPdf({ pages, startDate, endDate, meals: mealsInRange, dayComments, extraNotes })}>
            <FileText size={20} /> Download PDF
          </button>
          <button className="secondary-action" type="button" onClick={() => window.print()}>
            <Printer size={20} /> Print
          </button>
        </div>
      </section>
      <div className="report-preview">
        {pages.map((pageDays, index) => (
          <ReportPage
            key={pageDays.join('-')}
            pageDays={pageDays}
            pageNumber={index + 1}
            pageCount={pages.length}
            startDate={startDate}
            endDate={endDate}
            meals={mealsInRange}
            extraNotes={extraNotes}
            dayComments={dayComments}
            setDayComments={setDayComments}
          />
        ))}
      </div>
    </Screen>
  );
}

function ReportPage({ pageDays, pageNumber, pageCount, startDate, endDate, meals, extraNotes, dayComments, setDayComments }) {
  return (
    <article className="report-page">
      <div className="report-head">
        <div>
          <h2>Meal Plan for: Nuha</h2>
          <p>Date: {formatReportDate(startDate)} to {formatReportDate(endDate)}</p>
        </div>
        {pageCount > 1 && <span>Page {pageNumber} / {pageCount}</span>}
      </div>
      <table className="doctor-table">
        <thead>
          <tr>
            <th>Meal</th>
            {pageDays.map((day, index) => <th key={day}>Day {((pageNumber - 1) * 4) + index + 1}<br /><small>{formatReportDate(day)}</small></th>)}
          </tr>
        </thead>
        <tbody>
          {REPORT_ROWS.map(([label, mealType]) => (
            <tr key={label}>
              <th>{label}</th>
              {pageDays.map((day) => <td key={`${day}-${mealType}`}>{mealSummary(findMeal(meals, day, mealType))}</td>)}
            </tr>
          ))}
          <tr>
            <th>Comment</th>
            {pageDays.map((day) => (
              <td key={`${day}-comment`} className="comment-cell">
                <textarea
                  value={dayComments[day] ?? ''}
                  onChange={(event) => setDayComments({ ...dayComments, [day]: event.target.value })}
                  placeholder="Write comment"
                />
                <div className="print-comment">{dayComments[day] || '-'}</div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <div className="doctor-notes">
        <strong>Notes</strong>
        <p>{extraNotes || ''}</p>
        <span></span><span></span><span></span><span></span>
      </div>
    </article>
  );
}

function downloadDoctorPdf({ pages, startDate, endDate, meals, dayComments, extraNotes }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  pages.forEach((pageDays, pageIndex) => {
    if (pageIndex > 0) doc.addPage();
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Meal Plan for: Nuha', 14, 15);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Date: ${formatReportDate(startDate)} to ${formatReportDate(endDate)}`, 14, 22);
    if (pages.length > 1) doc.text(`Page ${pageIndex + 1} / ${pages.length}`, pageWidth - 34, 22);

    const head = [['Meal', ...pageDays.map((day, index) => `Day ${pageIndex * 4 + index + 1}\n${formatReportDate(day)}`)]];
    const body = [
      ...REPORT_ROWS.map(([label, mealType]) => [
        label,
        ...pageDays.map((day) => mealSummary(findMeal(meals, day, mealType))),
      ]),
      ['Comment', ...pageDays.map((day) => dayComments[day] || '-')],
    ];

    autoTable(doc, {
      head,
      body,
      startY: 29,
      theme: 'grid',
      styles: {
        textColor: 0,
        lineColor: 0,
        lineWidth: 0.2,
        fontSize: 8,
        cellPadding: 2,
        valign: 'top',
      },
      headStyles: { fillColor: [245, 245, 245], textColor: 0, fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 25, fontStyle: 'bold' } },
      bodyStyles: { minCellHeight: 20 },
      margin: { left: 10, right: 10 },
    });

    const notesTop = doc.lastAutoTable.finalY + 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Notes', 14, notesTop);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    if (extraNotes) {
      doc.text(doc.splitTextToSize(extraNotes, 180), 14, notesTop + 7);
    }
    for (let index = 0; index < 4; index += 1) {
      const y = notesTop + 12 + index * 8;
      doc.line(14, y, 196, y);
    }
  });
  doc.save(`nuha-doctor-report-${startDate}-to-${endDate}.pdf`);
}

async function saveReportImage(startDate, endDate) {
  const report = document.querySelector('.report-preview');
  if (!report) return;
  const canvas = await html2canvas(report, {
    backgroundColor: '#ffffff',
    scale: Math.min(window.devicePixelRatio || 2, 2),
    useCORS: true,
  });
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 1));
  if (!blob) return;
  const fileName = `nuha-doctor-report-${startDate}-to-${endDate}.png`;
  if (typeof File === 'function' && navigator.share) {
    const file = new File([blob], fileName, { type: 'image/png' });
    try {
      await navigator.share({
        files: [file],
        title: 'Nuha Doctor Report',
        text: 'Nuha doctor report image',
      });
      return;
    } catch {
      // Fall back to normal browser download below.
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function findMeal(meals, date, mealType) {
  return meals.find((meal) => meal.date === date && meal.meal_type === mealType);
}

function foodWithAdditional(meal) {
  return [meal.food_details, meal.additional_food].map((v) => (v ?? '').trim()).filter(Boolean).join(' + ');
}
function mealSummary(meal) {
  if (!meal) return '-';
  const food = foodWithAdditional(meal);
  const parts = [
    food ? `Food: ${shortText(food, 46)}` : '',
    meal.drink_details ? `Drink: ${shortText(meal.drink_details, 36)}` : '',
  ].filter(Boolean);
  return parts.length ? parts.join('\n') : '-';
}

function shortText(text, max) {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max - 1)}...` : text;
}

function formatReportDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function SettingsScreen({ members, activeMember, onSelect, onAdded, onLogout }) {
  const [name, setName] = useState('');
  async function submit(event) {
    event.preventDefault();
    if (!name.trim()) return;
    await addFamilyMember(name.trim());
    setName('');
    await onAdded();
  }
  return <Screen title="Settings" subtitle="Switch who is logging."><div className="member-grid">{members.map((member) => <button key={member.id} className={`member-button ${activeMember.id === member.id ? 'active' : ''}`} onClick={() => onSelect(member)}><span>{member.name.slice(0, 1).toUpperCase()}</span>{member.name}</button>)}</div><form className="card form" onSubmit={submit}><label>Add New Person</label><div className="inline-form"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama" /><button className="primary icon" type="submit"><Plus size={20} /></button></div></form><button className="danger" onClick={onLogout}><LogOut size={18} /> Log out device</button></Screen>;
}

function Shell({ children, active, setScreen }) {
  return <div className="app-shell"><main className="app-main">{children}</main>{setScreen && <BottomNav active={active} setScreen={setScreen} />}</div>;
}
function BottomNav({ active, setScreen }) {
  const items = [['home', 'Home', <Home size={22} />], ['summary', 'Logs', <History size={22} />], ['meal', 'Meals', <Utensils size={22} />], ['meds', 'Meds', <Pill size={22} />], ['more', 'More', <MoreHorizontal size={22} />]];
  return <nav className="bottom-nav">{items.map(([id, label, icon]) => <button key={id} className={active === id ? 'active' : ''} onClick={() => setScreen(id)}>{icon}<span>{label}</span></button>)}</nav>;
}
function Screen({ title, subtitle, children }) { return <><section className="intro"><h2>{title}</h2><p>{subtitle}</p></section>{children}</>; }
function Card({ title, icon, tone, action, children }) { return <article className={`card tone-${tone}`}><div className="card-head"><span className="chip">{icon}</span><strong>{title}</strong>{action && <em>{action}</em>}</div>{children}</article>; }
function Notice({ title, text }) { return <div className="card notice"><h1>{title}</h1><p>{text}</p></div>; }
function Empty({ text }) { return <p className="muted">{text}</p>; }
function Stat({ label, value }) { return <div className="card stat"><span>{label}</span><strong>{value}</strong></div>; }
function BasicLog({ title, meta, row, onEdit, onDelete }) { return <div className="log-card"><strong>{title}</strong><span>{meta}</span><small>Created by {row.created_by_name || '-'}</small>{row.notes && <p>{row.notes}</p>}<LogActions onEdit={onEdit} onDelete={onDelete} /></div>; }
function MealCard({ meal, onEdit, onDelete }) { return <div className="log-card meal-card"><strong>{meal.meal_type}</strong><span>{moneyDate(meal.date)} - {meal.food_amount_eaten || 'No after amount'}</span><small>Drink: {meal.drink_amount_finished || '-'} | Created by {meal.created_by_name || '-'}</small><div className="photos">{meal.before_photo_url && <img src={meal.before_photo_url} alt="Before meal" />}{meal.after_photo_url && <img src={meal.after_photo_url} alt="After meal" />}</div>{foodWithAdditional(meal) && <p>{foodWithAdditional(meal)}</p>}<LogActions onEdit={onEdit} onDelete={onDelete} /></div>; }
function LogActions({ onEdit, onDelete }) {
  if (!onEdit && !onDelete) return null;
  return <div className="log-actions">{onEdit && <button type="button" onClick={onEdit}>Edit</button>}{onDelete && <button type="button" className="delete" onClick={onDelete}>Delete</button>}</div>;
}
function LogList({ rows, empty, render }) { return <section className="stack list">{rows.length ? rows.map((row) => <React.Fragment key={row.id}>{render(row)}</React.Fragment>) : <div className="card"><Empty text={empty} /></div>}</section>; }
function Field({ label, onChange, ...props }) {
  const handleChange = (event) => onChange(event.target.value);
  return <label>{label}<input {...props} onChange={handleChange} onInput={handleChange} /></label>;
}
function Text({ label, value, onChange }) { return <label>{label}<textarea value={value} onChange={(e) => onChange(e.target.value)} rows="3" /></label>; }
function Select({ label, value, options, onChange }) { return <label>{label}<select value={value} onChange={(e) => onChange(e.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select></label>; }
function Combo({ label, value, options, onChange }) {
  const listId = `dl-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <label>{label}
      <input list={listId} value={value} placeholder="Pilih atau taip sendiri" onChange={(e) => onChange(e.target.value)} />
      <datalist id={listId}>{options.map((option) => <option key={option} value={option} />)}</datalist>
    </label>
  );
}
function File({ label, onChange }) {
  const [preview, setPreview] = useState('');
  const [name, setName] = useState('');
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  function handle(file) {
    onChange(file);
    setName(file?.name || '');
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : '';
    });
  }
  return (
    <fieldset className="photo-field">
      <legend>{label}</legend>
      {preview ? (
        <div className="photo-preview">
          <img src={preview} alt="Selected" />
          <button type="button" className="photo-clear" onClick={() => handle(null)} aria-label="Remove photo"><X size={18} /></button>
        </div>
      ) : (
        <div className="photo-buttons">
          <label className="photo-btn">
            <Camera size={22} /><span>Camera</span>
            <input type="file" accept="image/*" capture="environment" onChange={(e) => handle(e.target.files?.[0] ?? null)} />
          </label>
          <label className="photo-btn">
            <ImagePlus size={22} /><span>Gallery</span>
            <input type="file" accept="image/*" onChange={(e) => handle(e.target.files?.[0] ?? null)} />
          </label>
        </div>
      )}
      {!preview && name ? <small className="muted">{name}</small> : null}
    </fieldset>
  );
}
function Checklist({ label, values, options, onChange }) {
  return <fieldset><legend>{label}</legend><div className="check-grid">{options.map((option) => <label key={option} className="check"><input type="checkbox" checked={values.includes(option)} onChange={(e) => onChange(e.target.checked ? [...values, option] : values.filter((value) => value !== option))} />{option}</label>)}</div></fieldset>;
}
function SectionTitle({ number, title }) { return <h3 className="section-title"><span>{number}</span>{title}</h3>; }

createRoot(document.getElementById('root')).render(<App />);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service worker registration failed:', err);
    });
  });
}
