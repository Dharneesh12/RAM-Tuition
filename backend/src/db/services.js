import { db, isMock } from './index.js';
import * as schema from './schema.js';
import { eq, and, like } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Durable JSON store — acts as the database in mock mode so every entered
// record survives backend restarts (data written to backend/src/db/data.json).
const DATA_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data.json');

// In-Memory Database for Mock Fallback — seed used only when data.json
// doesn't exist yet (fresh deploy). Kept in sync with the cleaned,
// single-admin state so a fresh deploy never resurrects old test data.
const mockDb = {
  users: [
    { id: 1, username: 'director@ramtuitioncentre.com', password: 'password', role: 'director', name: 'R. Selvam' }
  ],
  staff: [],
  students: [],
  attendance: [],
  marks: [],
  fees: [],
  notices: [],
  workDone: [],
  // Admin-configurable classes & subjects — drive every dropdown across the app.
  config: {
    classes: ['Class 9', 'Class 10', 'Class 11', 'Class 12', 'Class 9 CBSE'],
    subjects: ['Mathematics', 'Biology', 'Science', 'English', 'Social Science']
  }
};

// Write the whole store to disk. Called after every create/update/delete so
// nothing entered is ever lost on restart.
export const persist = () => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(mockDb, null, 2));
  } catch (e) {
    console.warn(`⚠️ Failed to persist data: ${e.message}`);
  }
};

// Load previously-saved data on startup (or seed the file on first run).
const loadDb = () => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const saved = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      Object.keys(saved).forEach((key) => { mockDb[key] = saved[key]; });
      console.log('📂 Loaded persisted data from data.json');
    } else {
      persist(); // first run — write the seed so the file exists
      console.log('🌱 Seeded data.json with initial data');
    }
  } catch (e) {
    console.warn(`⚠️ Failed to load persisted data: ${e.message}`);
  }
};
loadDb();

// Academic year months (June → May) used to split annual fees into installments.
const MONTHS = ['June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March', 'April', 'May'];

// Create one pending fee record per month for a student (the annual-fee split).
const createMonthlyFees = (studentId, perMonth) => {
  let feeId = mockDb.fees.length ? Math.max(...mockDb.fees.map(f => f.id)) + 1 : 1;
  MONTHS.forEach((month) => {
    mockDb.fees.push({ id: feeId++, studentId, month, amount: perMonth, advance: 0, status: 'pending' });
  });
};

// -------------------------------------------------------------
// ACCOUNT LINKING HELPERS
// Keep login accounts (users) in sync with student/staff records so that
// anything the director creates/updates/deletes reflects EVERYWHERE:
// the directory list, the User Management screen, and the login itself.
// Auto-provisioned accounts use the default password 'password'.
// -------------------------------------------------------------
const DEFAULT_PASSWORD = 'password';

const ensureLinkedUser = ({ name, username, role, password }) => {
  if (!username) return;
  if (mockDb.users.some(u => u.username === username)) return; // already has a login
  const nextId = mockDb.users.length ? Math.max(...mockDb.users.map(u => u.id)) + 1 : 1;
  mockDb.users.push({ id: nextId, username, password: password || DEFAULT_PASSWORD, role, name });
};

const removeLinkedUser = (username) => {
  if (!username) return;
  const idx = mockDb.users.findIndex(u => u.username === username);
  if (idx !== -1) mockDb.users.splice(idx, 1);
};

// Sync a login account when the underlying person's name/email changes.
const syncLinkedUser = (oldUsername, { name, username, role }) => {
  const idx = mockDb.users.findIndex(u => u.username === oldUsername);
  if (idx === -1) {
    if (username && role) ensureLinkedUser({ name, username, role }); // create if missing (e.g. draft → active)
    return;
  }
  if (username) mockDb.users[idx].username = username;
  if (name) mockDb.users[idx].name = name;
  if (role) mockDb.users[idx].role = role;
};

// When the director creates a login in User Management, also create the matching
// directory record (student/staff) so the account maps EVERYWHERE, and delete /
// rename it in step. `username` is used as the person's email key.
const ensureLinkedPerson = (role, { name, username, extra = {} }) => {
  if (role === 'student' && !mockDb.students.some(s => s.email === username)) {
    const id = mockDb.students.length ? Math.max(...mockDb.students.map(s => s.id)) + 1 : 1;
    const rollNo = `R-${1042 + mockDb.students.length}`;
    const grade = extra.grade || 'Class 10';
    mockDb.students.push({
      id, rollNo, name, grade, board: extra.board || 'State Board',
      school: extra.school || '—', email: username,
      fatherName: extra.fatherName || '—', fatherWhatsapp: extra.fatherWhatsapp || '—',
      motherName: extra.motherName || '—', motherWhatsapp: extra.motherWhatsapp || '—',
      subjects: (extra.subjects && extra.subjects.length) ? extra.subjects : ['Mathematics'],
      photoUrl: null, status: 'active',
    });
    const classFees = { 'Class 9': 1800, 'Class 10': 2000, 'Class 11': 2200, 'Class 12': 2500 };
    createMonthlyFees(id, classFees[grade] || 2000);
  }
  if (role === 'staff' && !mockDb.staff.some(s => s.email === username)) {
    const id = mockDb.staff.length ? Math.max(...mockDb.staff.map(s => s.id)) + 1 : 1;
    mockDb.staff.push({
      id, name, email: username, phone: extra.phone || '',
      role: extra.designation || 'Teacher',
      classes: extra.classes || [], subjects: extra.subjects || [],
      joined: '2026-07-15', status: 'active',
    });
  }
};

const removeLinkedPerson = (role, username) => {
  if (role === 'student') {
    const idx = mockDb.students.findIndex(s => s.email === username);
    if (idx !== -1) {
      const sid = mockDb.students[idx].id;
      mockDb.students.splice(idx, 1);
      mockDb.fees = mockDb.fees.filter(f => f.studentId !== sid);
      mockDb.attendance = mockDb.attendance.filter(a => a.studentId !== sid);
      mockDb.marks = mockDb.marks.filter(m => m.studentId !== sid);
    }
  }
  if (role === 'staff') {
    const idx = mockDb.staff.findIndex(s => s.email === username);
    if (idx !== -1) mockDb.staff.splice(idx, 1);
  }
};

const syncLinkedPerson = (role, oldUsername, { name, username }) => {
  const table = role === 'student' ? mockDb.students : role === 'staff' ? mockDb.staff : null;
  if (!table) return;
  const rec = table.find(p => p.email === oldUsername);
  if (rec) { if (name) rec.name = name; if (username) rec.email = username; }
};

// -------------------------------------------------------------
// USER SERVICES
// -------------------------------------------------------------
export const getUserByUsername = async (username) => {
  if (isMock) {
    return mockDb.users.find(u => u.username === username) || null;
  }
  const result = await db.select().from(schema.users).where(eq(schema.users.username, username));
  return result[0] || null;
};

export const getUsers = async () => {
  if (isMock) return mockDb.users.map(({ password, ...u }) => u);
  const result = await db.select({
    id: schema.users.id,
    username: schema.users.username,
    role: schema.users.role,
    name: schema.users.name
  }).from(schema.users);
  return result;
};

export const createUser = async (userData) => {
  // Core login fields vs. optional directory fields (grade, board, subjects, designation…)
  const { username, password, role, name, ...extra } = userData;
  if (isMock) {
    const nextId = mockDb.users.length > 0 ? Math.max(...mockDb.users.map(u => u.id)) + 1 : 1;
    const newUser = { id: nextId, username, password, role, name };
    mockDb.users.push(newUser);
    // Also create the matching student/staff directory record so it maps everywhere.
    ensureLinkedPerson(role, { name, username, extra });
    const { password: _pw, ...safe } = newUser;
    return safe;
  }
  const [newUser] = await db.insert(schema.users).values({ username, password, role, name }).returning({
    id: schema.users.id,
    username: schema.users.username,
    role: schema.users.role,
    name: schema.users.name
  });
  return newUser;
};

export const updateUser = async (userId, updates) => {
  if (isMock) {
    const idx = mockDb.users.findIndex(u => u.id === userId);
    if (idx === -1) return null;
    const prevUsername = mockDb.users[idx].username;
    mockDb.users[idx] = { ...mockDb.users[idx], ...updates };
    const merged = mockDb.users[idx];
    // Keep the linked student/staff record's name & email in sync with the login.
    syncLinkedPerson(merged.role, prevUsername, { name: merged.name, username: merged.username });
    const { password, ...safe } = merged;
    return safe;
  }
  const [updated] = await db.update(schema.users)
    .set(updates)
    .where(eq(schema.users.id, userId))
    .returning({
      id: schema.users.id,
      username: schema.users.username,
      role: schema.users.role,
      name: schema.users.name
    });
  return updated || null;
};

export const deleteUser = async (userId) => {
  if (isMock) {
    const idx = mockDb.users.findIndex(u => u.id === userId);
    if (idx === -1) return false;
    const removed = mockDb.users[idx];
    mockDb.users.splice(idx, 1);
    // Also remove the linked student/staff directory record (and its dependents).
    removeLinkedPerson(removed.role, removed.username);
    return true;
  }
  await db.delete(schema.users).where(eq(schema.users.id, userId));
  return true;
};

// -------------------------------------------------------------
// STAFF SERVICES (in-memory only for now — extend schema for PG)
// -------------------------------------------------------------
export const getStaff = async () => {
  // Staff is in-memory even in PG mode for now
  return mockDb.staff;
};

export const createStaff = async (staffData) => {
  const { password, ...rest } = staffData; // password is for the login, not the staff record
  const nextId = mockDb.staff.length > 0 ? Math.max(...mockDb.staff.map(s => s.id)) + 1 : 1;
  const newStaff = { id: nextId, ...rest, status: rest.status || 'active' };
  mockDb.staff.push(newStaff);
  // Auto-provision a staff login account with the chosen password.
  ensureLinkedUser({ name: newStaff.name, username: newStaff.email, role: 'staff', password });
  return newStaff;
};

export const updateStaff = async (staffId, updates) => {
  const idx = mockDb.staff.findIndex(s => s.id === staffId);
  if (idx === -1) return null;
  const prev = mockDb.staff[idx];
  mockDb.staff[idx] = { ...prev, ...updates };
  const next = mockDb.staff[idx];
  syncLinkedUser(prev.email, { name: next.name, username: next.email, role: 'staff' });
  return next;
};

export const deleteStaff = async (staffId) => {
  const idx = mockDb.staff.findIndex(s => s.id === staffId);
  if (idx === -1) return false;
  const removed = mockDb.staff[idx];
  mockDb.staff.splice(idx, 1);
  removeLinkedUser(removed.email); // remove the linked login account too
  return true;
};

// -------------------------------------------------------------
// STUDENT SERVICES
// -------------------------------------------------------------
export const getStudents = async () => {
  if (isMock) return mockDb.students;
  return await db.select().from(schema.students);
};

export const createStudent = async (studentData) => {
  const { password, annualFee, ...rest } = studentData; // password → login; annualFee → fee split
  if (isMock) {
    const nextId = mockDb.students.length > 0 ? Math.max(...mockDb.students.map(s => s.id)) + 1 : 1;
    const rollNo = `R-${1042 + mockDb.students.length}`;
    const newStudent = { id: nextId, rollNo, ...rest, status: rest.status || 'active' };
    mockDb.students.push(newStudent);
    // Split the annual fee across the 12 academic months (fall back to a
    // per-class monthly rate × 12 if no annual fee was entered).
    const classMonthly = { 'Class 9': 1800, 'Class 10': 2000, 'Class 11': 2200, 'Class 12': 2500 };
    const annual = Number(annualFee) > 0 ? Number(annualFee) : (classMonthly[studentData.grade] || 2000) * 12;
    const perMonth = Math.round(annual / MONTHS.length);
    createMonthlyFees(nextId, perMonth);
    // Auto-provision a login account for admitted (non-draft) students.
    if (newStudent.status !== 'draft') {
      ensureLinkedUser({ name: newStudent.name, username: newStudent.email, role: 'student', password });
    }
    return newStudent;
  }
  const rollNo = `R-${1042 + (await db.select().from(schema.students)).length}`;
  const [newStudent] = await db.insert(schema.students).values({ ...studentData, rollNo }).returning();
  const classFees = { 'Class 9': 1800, 'Class 10': 2000, 'Class 11': 2200, 'Class 12': 2500 };
  const amount = classFees[studentData.grade] || 2000;
  await db.insert(schema.fees).values({ studentId: newStudent.id, month: 'July', amount, status: 'pending' });
  return newStudent;
};

export const updateStudent = async (studentId, updates) => {
  if (isMock) {
    const idx = mockDb.students.findIndex(s => s.id === studentId);
    if (idx === -1) return null;
    const prev = mockDb.students[idx];
    mockDb.students[idx] = { ...prev, ...updates };
    const next = mockDb.students[idx];
    // Keep the linked login account in sync (name/email), or create it if the
    // student was just promoted from draft → active.
    if (next.status !== 'draft') {
      syncLinkedUser(prev.email, { name: next.name, username: next.email, role: 'student' });
    }
    return next;
  }
  const [updated] = await db.update(schema.students)
    .set(updates)
    .where(eq(schema.students.id, studentId))
    .returning();
  return updated || null;
};

export const deleteStudent = async (studentId) => {
  if (isMock) {
    const idx = mockDb.students.findIndex(s => s.id === studentId);
    if (idx === -1) return false;
    const removed = mockDb.students[idx];
    mockDb.students.splice(idx, 1);
    mockDb.fees = mockDb.fees.filter(f => f.studentId !== studentId);
    mockDb.attendance = mockDb.attendance.filter(a => a.studentId !== studentId);
    mockDb.marks = mockDb.marks.filter(m => m.studentId !== studentId);
    removeLinkedUser(removed.email); // remove the linked login account too
    return true;
  }
  await db.delete(schema.students).where(eq(schema.students.id, studentId));
  return true;
};

// Year rollover: promote every student one class up. Class 12 students graduate
// and are removed (with their logins + records). History for promoted students
// stays intact because it is keyed by studentId — only the grade changes.
export const promoteStudents = async () => {
  const nextGrade = { 'Class 9': 'Class 10', 'Class 10': 'Class 11', 'Class 11': 'Class 12' };
  if (isMock) {
    const graduating = mockDb.students.filter(s => s.grade === 'Class 12');
    // Remove graduating students + their dependents + logins
    graduating.forEach(g => {
      mockDb.fees = mockDb.fees.filter(f => f.studentId !== g.id);
      mockDb.attendance = mockDb.attendance.filter(a => a.studentId !== g.id);
      mockDb.marks = mockDb.marks.filter(m => m.studentId !== g.id);
      removeLinkedUser(g.email);
    });
    mockDb.students = mockDb.students.filter(s => s.grade !== 'Class 12');
    // Promote the rest
    let promoted = 0;
    mockDb.students.forEach(s => {
      if (nextGrade[s.grade]) { s.grade = nextGrade[s.grade]; promoted++; }
    });
    return { promoted, graduated: graduating.length };
  }
  // PG mode
  const all = await db.select().from(schema.students);
  const graduating = all.filter(s => s.grade === 'Class 12');
  for (const g of graduating) await deleteStudent(g.id);
  let promoted = 0;
  for (const s of all) {
    if (nextGrade[s.grade]) {
      await db.update(schema.students).set({ grade: nextGrade[s.grade] }).where(eq(schema.students.id, s.id));
      promoted++;
    }
  }
  return { promoted, graduated: graduating.length };
};

// -------------------------------------------------------------
// ATTENDANCE SERVICES
// -------------------------------------------------------------
export const getAttendanceByDate = async (date) => {
  if (isMock) return mockDb.attendance.filter(a => a.date === date);
  return await db.select().from(schema.attendance).where(eq(schema.attendance.date, date));
};

export const getAttendanceByStudent = async (studentId) => {
  if (isMock) return mockDb.attendance.filter(a => a.studentId === studentId).sort((a, b) => a.date.localeCompare(b.date));
  return await db.select().from(schema.attendance).where(eq(schema.attendance.studentId, studentId));
};

// All attendance records for a given month, e.g. month="2026-07" matches every
// date starting with that prefix. Used to power the Month View grid + stats.
export const getAttendanceByMonth = async (month) => {
  if (isMock) return mockDb.attendance.filter(a => a.date.startsWith(month));
  return await db.select().from(schema.attendance).where(like(schema.attendance.date, `${month}%`));
};

export const saveAttendance = async (date, records, markedBy) => {
  const now = new Date().toISOString();
  if (isMock) {
    records.forEach(rec => {
      const idx = mockDb.attendance.findIndex(a => a.date === date && a.studentId === rec.studentId);
      if (idx !== -1) {
        mockDb.attendance[idx].status = rec.status;
        mockDb.attendance[idx].markedBy = markedBy || mockDb.attendance[idx].markedBy || null;
        mockDb.attendance[idx].updatedAt = now;
      } else {
        const nextId = mockDb.attendance.length > 0 ? Math.max(...mockDb.attendance.map(a => a.id)) + 1 : 1;
        mockDb.attendance.push({ id: nextId, studentId: rec.studentId, date, status: rec.status, markedBy: markedBy || null, updatedAt: now });
      }
    });
    return { success: true, count: records.length, updatedAt: now };
  }
  for (const rec of records) {
    const existing = await db.select().from(schema.attendance).where(
      and(eq(schema.attendance.date, date), eq(schema.attendance.studentId, rec.studentId))
    );
    if (existing.length > 0) {
      await db.update(schema.attendance).set({ status: rec.status }).where(eq(schema.attendance.id, existing[0].id));
    } else {
      await db.insert(schema.attendance).values({ studentId: rec.studentId, date, status: rec.status });
    }
  }
  return { success: true, count: records.length, updatedAt: now };
};

// -------------------------------------------------------------
// MARKS SERVICES
// -------------------------------------------------------------
export const getMarksByTest = async (testName) => {
  if (isMock) return mockDb.marks.filter(m => m.testName === testName);
  return await db.select().from(schema.marks).where(eq(schema.marks.testName, testName));
};

export const getMarksByStudent = async (studentId) => {
  if (isMock) return mockDb.marks.filter(m => m.studentId === studentId);
  return await db.select().from(schema.marks).where(eq(schema.marks.studentId, studentId));
};

export const getAllTestNames = async () => {
  if (isMock) {
    const names = [...new Set(mockDb.marks.map(m => m.testName))];
    return names;
  }
  const result = await db.selectDistinct({ testName: schema.marks.testName }).from(schema.marks);
  return result.map(r => r.testName);
};

export const saveMarks = async (testName, subject, records) => {
  if (isMock) {
    records.forEach(rec => {
      const idx = mockDb.marks.findIndex(m => m.testName === testName && m.studentId === rec.studentId);
      if (idx !== -1) {
        mockDb.marks[idx].marksObtained = parseInt(rec.marksObtained);
        mockDb.marks[idx].maxMarks = parseInt(rec.maxMarks);
        mockDb.marks[idx].remarks = rec.remarks;
      } else {
        const nextId = mockDb.marks.length > 0 ? Math.max(...mockDb.marks.map(m => m.id)) + 1 : 1;
        mockDb.marks.push({
          id: nextId,
          studentId: rec.studentId,
          testName,
          subject,
          marksObtained: parseInt(rec.marksObtained),
          maxMarks: parseInt(rec.maxMarks),
          remarks: rec.remarks
        });
      }
    });
    return { success: true };
  }
  for (const rec of records) {
    const existing = await db.select().from(schema.marks).where(
      and(eq(schema.marks.testName, testName), eq(schema.marks.studentId, rec.studentId))
    );
    if (existing.length > 0) {
      await db.update(schema.marks)
        .set({ marksObtained: parseInt(rec.marksObtained), maxMarks: parseInt(rec.maxMarks), remarks: rec.remarks })
        .where(eq(schema.marks.id, existing[0].id));
    } else {
      await db.insert(schema.marks).values({
        studentId: rec.studentId, testName, subject,
        marksObtained: parseInt(rec.marksObtained), maxMarks: parseInt(rec.maxMarks), remarks: rec.remarks
      });
    }
  }
  return { success: true };
};

// -------------------------------------------------------------
// FEES SERVICES
// -------------------------------------------------------------
export const getFeesByMonth = async (month) => {
  if (isMock) return mockDb.fees.filter(f => f.month === month);
  return await db.select().from(schema.fees).where(eq(schema.fees.month, month));
};

export const getFeesByStudent = async (studentId) => {
  if (isMock) return mockDb.fees.filter(f => f.studentId === studentId);
  return await db.select().from(schema.fees).where(eq(schema.fees.studentId, studentId));
};

export const updateFeeStatus = async (feeId, status) => {
  if (isMock) {
    const idx = mockDb.fees.findIndex(f => f.id === feeId);
    if (idx !== -1) { mockDb.fees[idx].status = status; return mockDb.fees[idx]; }
    return null;
  }
  const [updated] = await db.update(schema.fees).set({ status }).where(eq(schema.fees.id, feeId)).returning();
  return updated || null;
};

// -------------------------------------------------------------
// NOTICE SERVICES
// -------------------------------------------------------------
export const getNotices = async () => {
  if (isMock) return mockDb.notices;
  return await db.select().from(schema.notices);
};

export const createNotice = async (noticeData) => {
  if (isMock) {
    const nextId = mockDb.notices.length > 0 ? Math.max(...mockDb.notices.map(n => n.id)) + 1 : 1;
    const newNotice = { id: nextId, ...noticeData };
    mockDb.notices.push(newNotice);
    return newNotice;
  }
  const [newNotice] = await db.insert(schema.notices).values(noticeData).returning();
  return newNotice;
};

export const updateNotice = async (noticeId, updates) => {
  if (isMock) {
    const idx = mockDb.notices.findIndex(n => n.id === noticeId);
    if (idx === -1) return null;
    mockDb.notices[idx] = { ...mockDb.notices[idx], ...updates };
    return mockDb.notices[idx];
  }
  const [updated] = await db.update(schema.notices).set(updates).where(eq(schema.notices.id, noticeId)).returning();
  return updated || null;
};

export const deleteNotice = async (noticeId) => {
  if (isMock) {
    const idx = mockDb.notices.findIndex(n => n.id === noticeId);
    if (idx === -1) return false;
    mockDb.notices.splice(idx, 1);
    return true;
  }
  await db.delete(schema.notices).where(eq(schema.notices.id, noticeId));
  return true;
};

// -------------------------------------------------------------
// WORK DONE SERVICES
// -------------------------------------------------------------
export const getWorkDone = async () => {
  if (isMock) return mockDb.workDone;
  return await db.select().from(schema.workDone);
};

export const createWorkDone = async (entryData) => {
  if (isMock) {
    const nextId = mockDb.workDone.length > 0 ? Math.max(...mockDb.workDone.map(w => w.id)) + 1 : 1;
    const newEntry = { id: nextId, ...entryData };
    mockDb.workDone.push(newEntry);
    return newEntry;
  }
  const [newEntry] = await db.insert(schema.workDone).values(entryData).returning();
  return newEntry;
};

export const updateWorkDone = async (entryId, updates) => {
  if (isMock) {
    const idx = mockDb.workDone.findIndex(w => w.id === entryId);
    if (idx === -1) return null;
    mockDb.workDone[idx] = { ...mockDb.workDone[idx], ...updates };
    return mockDb.workDone[idx];
  }
  const [updated] = await db.update(schema.workDone).set(updates).where(eq(schema.workDone.id, entryId)).returning();
  return updated || null;
};

export const deleteWorkDone = async (entryId) => {
  if (isMock) {
    const idx = mockDb.workDone.findIndex(w => w.id === entryId);
    if (idx === -1) return false;
    mockDb.workDone.splice(idx, 1);
    return true;
  }
  await db.delete(schema.workDone).where(eq(schema.workDone.id, entryId));
  return true;
};

// -------------------------------------------------------------
// CONFIG SERVICES (admin-managed classes & subjects)
// Stored in-memory so it works in both mock and PG modes.
// -------------------------------------------------------------
export const getConfig = async () => ({
  classes: [...mockDb.config.classes],
  subjects: [...mockDb.config.subjects],
  months: [...MONTHS],
});

const addToConfig = (key, value) => {
  const name = (value || '').trim();
  if (!name) return { error: 'Name is required' };
  const list = mockDb.config[key];
  if (list.some(x => x.toLowerCase() === name.toLowerCase())) return { error: 'Already exists' };
  list.push(name);
  return { ok: true, list: [...list] };
};

const removeFromConfig = (key, value) => {
  const list = mockDb.config[key];
  const idx = list.findIndex(x => x.toLowerCase() === (value || '').toLowerCase());
  if (idx === -1) return { error: 'Not found' };
  list.splice(idx, 1);
  return { ok: true, list: [...list] };
};

export const addClass = async (name) => addToConfig('classes', name);
export const removeClass = async (name) => removeFromConfig('classes', name);
export const addSubject = async (name) => addToConfig('subjects', name);
export const removeSubject = async (name) => removeFromConfig('subjects', name);
