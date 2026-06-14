import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
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
} from 'lucide-react';
import {
  addAppointment,
  addBowel,
  addFamilyMember,
  addMeal,
  addMedicine,
  addWeight,
  ensureDefaultFamilyMembers,
  getLogs,
} from './data';
import { isSupabaseConfigured } from './supabase';
import './styles.css';

const familyCode = import.meta.env.VITE_FAMILY_ACCESS_CODE ?? 'NUHA2026';
const today = () => new Date().toISOString().slice(0, 10);
const nowTime = () => new Date().toTimeString().slice(0, 5);
const sameDay = (row, date = today()) => row.date === date;
const moneyDate = (date) => new Date(`${date}T00:00:00`).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' });

function App() {
  const [hasAccess, setHasAccess] = useState(() => localStorage.getItem('nuha-family-access') === 'yes');
  const [activeMember, setActiveMember] = useState(() => JSON.parse(localStorage.getItem('nuha-active-member') || 'null'));
  const [members, setMembers] = useState([]);
  const [logs, setLogs] = useState({ weights: [], meals: [], medicines: [], bowels: [], appointments: [] });
  const [screen, setScreen] = useState('home');
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
      {screen === 'meal' && <MealsScreen logs={logs} activeMember={activeMember} refresh={refresh} setError={setError} />}
      {screen === 'weight' && <WeightScreen logs={logs} activeMember={activeMember} refresh={refresh} setError={setError} />}
      {screen === 'meds' && <MedicineScreen logs={logs} activeMember={activeMember} refresh={refresh} setError={setError} />}
      {screen === 'bowel' && <BowelScreen logs={logs} activeMember={activeMember} refresh={refresh} setError={setError} />}
      {screen === 'appointments' && <AppointmentsScreen logs={logs} activeMember={activeMember} refresh={refresh} setError={setError} />}
      {screen === 'summary' && <SummaryScreen logs={logs} />}
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
        <Card title="Bowel" tone="blue">
          <p className="big small">{todayBowel?.status ?? '-'}</p>
          <p className="muted">{todayBowel ? todayBowel.type || 'Logged' : 'Belum ada bowel log hari ini.'}</p>
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
            ['appointments', 'Appt', <CalendarDays size={22} />],
          ].map(([id, label, icon]) => <button key={id} onClick={() => setScreen(id)}><span>{icon}</span>{label}</button>)}
        </div>
      </section>
    </>
  );
}

function MealsScreen({ logs, activeMember, refresh, setError }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    date: today(), meal_type: 'Breakfast', time_served: nowTime(), food_details: '',
    food_amount_served: '', drink_details: '', drink_amount_served: '', before_notes: '',
    time_finished: '', food_amount_eaten: 'Finished all', drink_amount_finished: 'Finished all',
    feeding_method: 'Self', issues: [], after_notes: '', beforePhotoFile: null, afterPhotoFile: null,
  });
  async function submit(event) {
    event.preventDefault();
    setSaving(true); setError('');
    try {
      await addMeal(form, activeMember);
      setForm((old) => ({ ...old, food_details: '', food_amount_served: '', drink_details: '', drink_amount_served: '', before_notes: '', after_notes: '', beforePhotoFile: null, afterPhotoFile: null }));
      await refresh();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }
  return (
    <Screen title="Meals" subtitle="Before and after tracking.">
      <form className="form stack" onSubmit={submit}>
        <SectionTitle number="1" title="Before Meal" />
        <div className="grid two"><Field label="Date" type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} /><Select label="Meal Type" value={form.meal_type} options={['Breakfast', 'Morning Snack', 'Lunch', 'Evening Snack', 'Dinner', 'Supper']} onChange={(v) => setForm({ ...form, meal_type: v })} /></div>
        <div className="grid two"><Field label="Time served" type="time" value={form.time_served} onChange={(v) => setForm({ ...form, time_served: v })} /><Field label="Food amount served" value={form.food_amount_served} onChange={(v) => setForm({ ...form, food_amount_served: v })} /></div>
        <Text label="Food details" value={form.food_details} onChange={(v) => setForm({ ...form, food_details: v })} />
        <div className="grid two"><Field label="Drink details" value={form.drink_details} onChange={(v) => setForm({ ...form, drink_details: v })} /><Field label="Drink amount served" value={form.drink_amount_served} onChange={(v) => setForm({ ...form, drink_amount_served: v })} /></div>
        <File label="Before photo" onChange={(file) => setForm({ ...form, beforePhotoFile: file })} />
        <Text label="Before notes" value={form.before_notes} onChange={(v) => setForm({ ...form, before_notes: v })} />
        <SectionTitle number="2" title="After Meal" />
        <div className="grid two"><Field label="Time finished" type="time" value={form.time_finished} onChange={(v) => setForm({ ...form, time_finished: v })} /><Select label="Feeding method" value={form.feeding_method} options={['Self', 'Suap', 'Mixed']} onChange={(v) => setForm({ ...form, feeding_method: v })} /></div>
        <Select label="Food amount eaten" value={form.food_amount_eaten} options={['Finished all', 'More than half', 'Half', 'Less than half', 'Few bites', 'Refused']} onChange={(v) => setForm({ ...form, food_amount_eaten: v })} />
        <Select label="Drink amount finished" value={form.drink_amount_finished} options={['Finished all', '1 cup', '1/2 cup', '1/4 cup', 'Few sips', 'Refused']} onChange={(v) => setForm({ ...form, drink_amount_finished: v })} />
        <File label="After photo" onChange={(file) => setForm({ ...form, afterPhotoFile: file })} />
        <Checklist label="Issues" values={form.issues} options={['No issue', 'Chewing difficulty', 'Swallowing difficulty', 'Spit out food', 'Coughing', 'Vomited', 'Refused', 'Took long time']} onChange={(issues) => setForm({ ...form, issues })} />
        <Text label="After notes" value={form.after_notes} onChange={(v) => setForm({ ...form, after_notes: v })} />
        <button className="primary save" disabled={saving}><Save size={20} />{saving ? 'Saving...' : 'Save Meal Log'}</button>
      </form>
      <LogList rows={logs.meals} empty="Belum ada meal log." render={(meal) => <MealCard meal={meal} />} />
    </Screen>
  );
}

function WeightScreen({ logs, activeMember, refresh, setError }) {
  const [form, setForm] = useState({ date: today(), time: nowTime(), weight_kg: '', notes: '' });
  return <SimpleForm title="Weight" subtitle="Add weight and view history." form={form} setForm={setForm} onSave={() => addWeight(form, activeMember)} refresh={refresh} setError={setError} logs={logs.weights} empty="Belum ada berat direkod." fields={<><div className="grid two"><Field label="Date" type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} /><Field label="Time" type="time" value={form.time} onChange={(v) => setForm({ ...form, time: v })} /></div><Field label="Weight kg" type="number" step="0.1" required value={form.weight_kg} onChange={(v) => setForm({ ...form, weight_kg: v })} /><Text label="Notes" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} /></>} render={(row) => <BasicLog title={`${row.weight_kg} kg`} meta={`${moneyDate(row.date)} ${row.time || ''}`} row={row} />} />;
}

function MedicineScreen({ logs, activeMember, refresh, setError }) {
  const [form, setForm] = useState({ date: today(), time: nowTime(), medicine_name: '', dosage: '', status: 'Taken', notes: '' });
  return <SimpleForm title="Medicine" subtitle="Log medicine taken, missed or skipped." form={form} setForm={setForm} onSave={() => addMedicine(form, activeMember)} refresh={refresh} setError={setError} logs={logs.medicines} empty="Belum ada medicine log." fields={<><div className="grid two"><Field label="Date" type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} /><Field label="Time" type="time" value={form.time} onChange={(v) => setForm({ ...form, time: v })} /></div><Field label="Medicine name" required value={form.medicine_name} onChange={(v) => setForm({ ...form, medicine_name: v })} /><div className="grid two"><Field label="Dosage" value={form.dosage} onChange={(v) => setForm({ ...form, dosage: v })} /><Select label="Status" value={form.status} options={['Taken', 'Missed', 'Skipped']} onChange={(v) => setForm({ ...form, status: v })} /></div><Text label="Notes" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} /></>} render={(row) => <BasicLog title={`${row.medicine_name} - ${row.status}`} meta={`${moneyDate(row.date)} ${row.time || ''}`} row={row} />} />;
}

function BowelScreen({ logs, activeMember, refresh, setError }) {
  const [form, setForm] = useState({ date: today(), status: 'Yes', type: 'Normal', notes: '' });
  return <SimpleForm title="Bowel Movement" subtitle="Simple daily bowel record." form={form} setForm={setForm} onSave={() => addBowel(form, activeMember)} refresh={refresh} setError={setError} logs={logs.bowels} empty="Belum ada bowel log." fields={<><Field label="Date" type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} /><div className="grid two"><Select label="Status" value={form.status} options={['Yes', 'No', 'Not sure']} onChange={(v) => setForm({ ...form, status: v })} /><Select label="Type" value={form.type} options={['Normal', 'Hard', 'Soft', 'Watery', 'Not sure']} onChange={(v) => setForm({ ...form, type: v })} /></div><Text label="Notes" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} /></>} render={(row) => <BasicLog title={`${row.status}${row.type ? ` - ${row.type}` : ''}`} meta={moneyDate(row.date)} row={row} />} />;
}

function AppointmentsScreen({ logs, activeMember, refresh, setError }) {
  const [form, setForm] = useState({ title: '', date: today(), time: '', location: '', reason: '', questions: '', after_notes: '' });
  return <SimpleForm title="Appointments" subtitle="Doctor visits and questions." form={form} setForm={setForm} onSave={() => addAppointment(form, activeMember)} refresh={refresh} setError={setError} logs={logs.appointments} empty="Belum ada appointment." fields={<><Field label="Title" required value={form.title} onChange={(v) => setForm({ ...form, title: v })} /><div className="grid two"><Field label="Date" type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} /><Field label="Time" type="time" value={form.time} onChange={(v) => setForm({ ...form, time: v })} /></div><Field label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} /><Text label="Reason" value={form.reason} onChange={(v) => setForm({ ...form, reason: v })} /><Text label="Questions to ask doctor" value={form.questions} onChange={(v) => setForm({ ...form, questions: v })} /><Text label="Notes after appointment" value={form.after_notes} onChange={(v) => setForm({ ...form, after_notes: v })} /></>} render={(row) => <BasicLog title={row.title} meta={`${moneyDate(row.date)} ${row.time || ''}`} row={row} />} />;
}

function SimpleForm({ title, subtitle, fields, onSave, refresh, setError, logs, empty, render }) {
  const [saving, setSaving] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setSaving(true); setError('');
    try { await onSave(); await refresh(); } catch (err) { setError(err.message); } finally { setSaving(false); }
  }
  return <Screen title={title} subtitle={subtitle}><form className="card form stack" onSubmit={submit}>{fields}<button className="primary save" disabled={saving}><Save size={20} />{saving ? 'Saving...' : 'Save'}</button></form><LogList rows={logs} empty={empty} render={render} /></Screen>;
}

function SummaryScreen({ logs }) {
  const from = new Date(); from.setDate(from.getDate() - 6);
  const in7 = (row) => new Date(`${row.date}T00:00:00`) >= from;
  const meals7 = logs.meals.filter(in7);
  const meds7 = logs.medicines.filter(in7);
  const bowel7 = logs.bowels.filter(in7);
  return <Screen title="Summary" subtitle="Last 7 days, screenshot-friendly."><div className="summary-grid"><Stat label="Weight logs" value={logs.weights.filter(in7).length} /><Stat label="Meals logged" value={meals7.length} /><Stat label="Meals refused" value={meals7.filter((m) => m.food_amount_eaten === 'Refused').length} /><Stat label="Medicine taken" value={meds7.filter((m) => m.status === 'Taken').length} /><Stat label="Medicine missed" value={meds7.filter((m) => m.status === 'Missed').length} /><Stat label="Bowel yes" value={bowel7.filter((b) => b.status === 'Yes').length} /></div><LogList rows={logs.appointments.filter((a) => a.date >= today())} empty="Belum ada appointment akan datang." render={(row) => <BasicLog title={row.title} meta={`${moneyDate(row.date)} ${row.time || ''}`} row={row} />} /></Screen>;
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
  const items = [['home', 'Home', <Home size={22} />], ['summary', 'Logs', <History size={22} />], ['meal', 'Meals', <Utensils size={22} />], ['meds', 'Meds', <Pill size={22} />], ['appointments', 'Appts', <CalendarDays size={22} />]];
  return <nav className="bottom-nav">{items.map(([id, label, icon]) => <button key={id} className={active === id ? 'active' : ''} onClick={() => setScreen(id)}>{icon}<span>{label}</span></button>)}</nav>;
}
function Screen({ title, subtitle, children }) { return <><section className="intro"><h2>{title}</h2><p>{subtitle}</p></section>{children}</>; }
function Card({ title, icon, tone, action, children }) { return <article className={`card tone-${tone}`}><div className="card-head"><span className="chip">{icon}</span><strong>{title}</strong>{action && <em>{action}</em>}</div>{children}</article>; }
function Notice({ title, text }) { return <div className="card notice"><h1>{title}</h1><p>{text}</p></div>; }
function Empty({ text }) { return <p className="muted">{text}</p>; }
function Stat({ label, value }) { return <div className="card stat"><span>{label}</span><strong>{value}</strong></div>; }
function BasicLog({ title, meta, row }) { return <div className="log-card"><strong>{title}</strong><span>{meta}</span><small>Created by {row.created_by_name || '-'}</small>{row.notes && <p>{row.notes}</p>}</div>; }
function MealCard({ meal }) { return <div className="log-card meal-card"><strong>{meal.meal_type}</strong><span>{moneyDate(meal.date)} - {meal.food_amount_eaten || 'No after amount'}</span><small>Drink: {meal.drink_amount_finished || '-'} | Created by {meal.created_by_name || '-'}</small><div className="photos">{meal.before_photo_url && <img src={meal.before_photo_url} alt="Before meal" />}{meal.after_photo_url && <img src={meal.after_photo_url} alt="After meal" />}</div>{meal.food_details && <p>{meal.food_details}</p>}</div>; }
function LogList({ rows, empty, render }) { return <section className="stack list">{rows.length ? rows.map((row) => <React.Fragment key={row.id}>{render(row)}</React.Fragment>) : <div className="card"><Empty text={empty} /></div>}</section>; }
function Field({ label, onChange, ...props }) { return <label>{label}<input {...props} onChange={(e) => onChange(e.target.value)} /></label>; }
function Text({ label, value, onChange }) { return <label>{label}<textarea value={value} onChange={(e) => onChange(e.target.value)} rows="3" /></label>; }
function Select({ label, value, options, onChange }) { return <label>{label}<select value={value} onChange={(e) => onChange(e.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select></label>; }
function File({ label, onChange }) { return <label>{label}<input type="file" accept="image/*" onChange={(e) => onChange(e.target.files?.[0] ?? null)} /></label>; }
function Checklist({ label, values, options, onChange }) {
  return <fieldset><legend>{label}</legend><div className="check-grid">{options.map((option) => <label key={option} className="check"><input type="checkbox" checked={values.includes(option)} onChange={(e) => onChange(e.target.checked ? [...values, option] : values.filter((value) => value !== option))} />{option}</label>)}</div></fieldset>;
}
function SectionTitle({ number, title }) { return <h3 className="section-title"><span>{number}</span>{title}</h3>; }

createRoot(document.getElementById('root')).render(<App />);
