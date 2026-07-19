import { db, isMock } from './index.js';
import * as schema from './schema.js';
import { eq, and } from 'drizzle-orm';

// In-Memory Database for Mock Fallback
const mockDb = {
  users: [
    { id: 1, username: 'director@ramtuitioncentre.com', password: 'password', role: 'director', name: 'R. Selvam' },
    { id: 2, username: 'staff@ramtuitioncentre.com', password: 'password', role: 'staff', name: 'Suganya K' },
    { id: 3, username: 'student@ramtuitioncentre.com', password: 'password', role: 'student', name: 'Arun Kumar' }
  ],
  staff: [
    { id: 1, name: 'Suganya K', email: 'suganya@ramtuitioncentre.com', phone: '+91 98765 11111', role: 'Mathematics Teacher', classes: ['Class 10', 'Class 12'], subjects: ['Mathematics'], joined: '2021-06-01', status: 'active' },
    { id: 2, name: 'Mohan R', email: 'mohan@ramtuitioncentre.com', phone: '+91 98765 22222', role: 'Science Teacher', classes: ['Class 9', 'Class 10'], subjects: ['Physics', 'Chemistry', 'Biology'], joined: '2022-05-15', status: 'active' },
    { id: 3, name: 'Naveen Raj', email: 'naveen@ramtuitioncentre.com', phone: '+91 98765 33333', role: 'English Instructor', classes: ['Class 10', 'Class 11', 'Class 12'], subjects: ['English'], joined: '2023-01-10', status: 'active' },
    { id: 4, name: 'Meera G', email: 'meera@ramtuitioncentre.com', phone: '+91 98765 44444', role: 'Social Science Educator', classes: ['Class 9', 'Class 10'], subjects: ['History', 'Civics', 'Geography'], joined: '2023-08-01', status: 'active' }
  ],
  students: [
    { id: 1, rollNo: 'R-1042', name: 'Arun Kumar', grade: 'Class 12', board: 'CBSE', school: 'Govt. Hr. Sec. School, Ganapathy', email: 'arun@gmail.com', fatherName: 'Kumar S', fatherWhatsapp: '+91 98765 43211', motherName: 'Anitha K', motherWhatsapp: '+91 98765 12341', subjects: ['Mathematics', 'Physics'], photoUrl: null, status: 'active' },
    { id: 2, rollNo: 'R-1043', name: 'Sneha Priya', grade: 'Class 10', board: 'State Board', school: 'Mani Hr. Sec. School, Coimbatore', email: 'sneha@gmail.com', fatherName: 'Priya Raj', fatherWhatsapp: '+91 98765 43212', motherName: 'Devi P', motherWhatsapp: '+91 98765 12342', subjects: ['Mathematics', 'Science'], photoUrl: null, status: 'active' },
    { id: 3, rollNo: 'R-1044', name: 'Karthik V', grade: 'Class 11', board: 'CBSE', school: 'Govt. Hr. Sec. School, Ganapathy', email: 'karthik@gmail.com', fatherName: 'Venkat R', fatherWhatsapp: '+91 98765 43213', motherName: 'Lakshmi V', motherWhatsapp: '+91 98765 12343', subjects: ['Mathematics'], photoUrl: null, status: 'active' },
    { id: 4, rollNo: 'R-1045', name: 'Divya M', grade: 'Class 9', board: 'State Board', school: 'Govt. Hr. Sec. School, Ganapathy', email: 'divya@gmail.com', fatherName: 'Mani T', fatherWhatsapp: '+91 98765 43214', motherName: 'Chitra M', motherWhatsapp: '+91 98765 12344', subjects: ['Science'], photoUrl: null, status: 'active' },
    { id: 5, rollNo: 'R-1051', name: 'Ranjith V', grade: 'Class 10', board: 'State Board', school: 'Govt. Hr. Sec. School, Ganapathy', email: 'ranjith@gmail.com', fatherName: 'Vasudevan G', fatherWhatsapp: '+91 98765 43215', motherName: 'Geetha V', motherWhatsapp: '+91 98765 12345', subjects: ['Mathematics'], photoUrl: null, status: 'active' },
    { id: 6, rollNo: 'R-1052', name: 'Divya M (Class 10)', grade: 'Class 10', board: 'CBSE', school: 'Govt. Hr. Sec. School, Ganapathy', email: 'divya10@gmail.com', fatherName: 'Muthu K', fatherWhatsapp: '+91 98765 43216', motherName: 'Uma M', motherWhatsapp: '+91 98765 12346', subjects: ['Mathematics', 'Science'], photoUrl: null, status: 'active' },
    { id: 7, rollNo: 'R-1058', name: 'Harini N', grade: 'Class 10', board: 'State Board', school: 'Govt. Hr. Sec. School, Ganapathy', email: 'harini@gmail.com', fatherName: 'Narayanan A', fatherWhatsapp: '+91 98765 43217', motherName: 'Saritha N', motherWhatsapp: '+91 98765 12347', subjects: ['Mathematics', 'Science'], photoUrl: null, status: 'active' }
  ],
  attendance: [
    // Spread across several July dates so the month view + absent-date list are meaningful
    { id: 1, studentId: 1, date: '2026-07-01', status: 'present' },
    { id: 2, studentId: 1, date: '2026-07-02', status: 'present' },
    { id: 3, studentId: 1, date: '2026-07-03', status: 'absent' },
    { id: 4, studentId: 1, date: '2026-07-06', status: 'present' },
    { id: 5, studentId: 1, date: '2026-07-07', status: 'present' },
    { id: 6, studentId: 1, date: '2026-07-08', status: 'present' },
    { id: 7, studentId: 1, date: '2026-07-09', status: 'present' },
    { id: 8, studentId: 1, date: '2026-07-10', status: 'absent' },
    { id: 9, studentId: 2, date: '2026-07-01', status: 'present' },
    { id: 10, studentId: 2, date: '2026-07-08', status: 'present' },
    { id: 11, studentId: 5, date: '2026-07-08', status: 'absent' },
    { id: 12, studentId: 5, date: '2026-07-03', status: 'absent' },
    { id: 13, studentId: 6, date: '2026-07-08', status: 'present' },
    { id: 14, studentId: 7, date: '2026-07-08', status: 'present' }
  ],
  // testMonth lets the student portal group results into a month view.
  marks: [
    // June test
    { id: 6, studentId: 1, testName: 'Unit Test 1 — Algebra', testMonth: 'June', subject: 'Maths', marksObtained: 42, maxMarks: 50, remarks: 'Good improvement' },
    { id: 7, studentId: 2, testName: 'Unit Test 1 — Algebra', testMonth: 'June', subject: 'Maths', marksObtained: 35, maxMarks: 50, remarks: 'Revise quadratic equations' },
    { id: 8, studentId: 1, testName: 'Unit Test 1 — Algebra', testMonth: 'June', subject: 'Physics', marksObtained: 40, maxMarks: 50, remarks: 'Steady' },
    // July test
    { id: 1, studentId: 1, testName: 'Unit Test 2 — Trigonometry', testMonth: 'July', subject: 'Maths', marksObtained: 46, maxMarks: 50, remarks: 'Minor calculation slip in Q7' },
    { id: 2, studentId: 2, testName: 'Unit Test 2 — Trigonometry', testMonth: 'July', subject: 'Maths', marksObtained: 39, maxMarks: 50, remarks: 'Identity proof incomplete' },
    { id: 3, studentId: 5, testName: 'Unit Test 2 — Trigonometry', testMonth: 'July', subject: 'Maths', marksObtained: 21, maxMarks: 50, remarks: 'Weak on formulae · needs revision of ratios' },
    { id: 4, studentId: 6, testName: 'Unit Test 2 — Trigonometry', testMonth: 'July', subject: 'Maths', marksObtained: 44, maxMarks: 50, remarks: '—' },
    { id: 5, studentId: 7, testName: 'Unit Test 2 — Trigonometry', testMonth: 'July', subject: 'Maths', marksObtained: 18, maxMarks: 50, remarks: 'Absent for 2 topics · arrange doubt session' }
  ],
  // Each fee record: amount = monthly tuition total; advance = amount paid ahead
  // toward future months. Per-subject split is derived on the client from the
  // student's enrolled subjects.
  fees: [
    // Previous month (June) — a couple left pending to surface carry-over dues
    { id: 8, studentId: 1, month: 'June', amount: 2500, advance: 0, status: 'paid' },
    { id: 9, studentId: 2, month: 'June', amount: 2000, advance: 0, status: 'pending' },
    { id: 10, studentId: 3, month: 'June', amount: 2200, advance: 0, status: 'paid' },
    { id: 11, studentId: 4, month: 'June', amount: 1800, advance: 0, status: 'pending' },
    { id: 12, studentId: 5, month: 'June', amount: 2000, advance: 0, status: 'paid' },
    { id: 13, studentId: 6, month: 'June', amount: 2000, advance: 0, status: 'paid' },
    { id: 14, studentId: 7, month: 'June', amount: 2000, advance: 0, status: 'paid' },
    // Current month (July)
    { id: 1, studentId: 1, month: 'July', amount: 2500, advance: 1000, status: 'paid' },
    { id: 2, studentId: 2, month: 'July', amount: 2000, advance: 0, status: 'pending' },
    { id: 3, studentId: 3, month: 'July', amount: 2200, advance: 0, status: 'paid' },
    { id: 4, studentId: 4, month: 'July', amount: 1800, advance: 0, status: 'pending' },
    { id: 5, studentId: 5, month: 'July', amount: 2000, advance: 500, status: 'paid' },
    { id: 6, studentId: 6, month: 'July', amount: 2000, advance: 0, status: 'paid' },
    { id: 7, studentId: 7, month: 'July', amount: 2000, advance: 0, status: 'paid' }
  ],
  notices: [
    { id: 1, title: 'Quarterly Exam Timetable Released', message: 'Class 10 & 12 quarterly exams begin 22 July. Timetable shared on parent WhatsApp groups.', publishDate: '2026-07-05', expiryDate: '2026-07-22', audience: 'All' },
    { id: 2, title: 'Fee Reminder — July', message: 'Kindly clear pending fees before 15 July to avoid late charges.', publishDate: '2026-07-03', expiryDate: '2026-07-15', audience: 'All' },
    { id: 3, title: 'Extra Doubt-Clearing Session', message: 'Special Maths session for Class 12 this Sunday, 10 AM – 12 PM.', publishDate: '2026-07-01', expiryDate: '2026-07-06', audience: 'Class 12' }
  ],
  workDone: [
    { id: 1, date: '2026-07-08', classSubject: 'Class 10 · Maths', topic: 'Trigonometry — Heights & Distances', staffName: 'Suganya K', remarks: 'Practice sums assigned' },
    { id: 2, date: '2026-07-07', classSubject: 'Class 12 · Maths', topic: 'Integration — Definite Integrals', staffName: 'Suganya K', remarks: 'Revision on Sunday' },
    { id: 3, date: '2026-07-06', classSubject: 'Class 10 · Science', topic: 'Chemical Reactions & Equations', staffName: 'Mohan R', remarks: 'Lab demo done' },
    { id: 4, date: '2026-07-05', classSubject: 'Class 12 · Maths', topic: 'Matrices — Determinants', staffName: 'Suganya K', remarks: '—' }
  ]
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
    const feeId = mockDb.fees.length ? Math.max(...mockDb.fees.map(f => f.id)) + 1 : 1;
    mockDb.fees.push({ id: feeId, studentId: id, month: 'July', amount: classFees[grade] || 2000, advance: 0, status: 'pending' });
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
  const { password, ...rest } = studentData; // password is for the login, not the student record
  if (isMock) {
    const nextId = mockDb.students.length > 0 ? Math.max(...mockDb.students.map(s => s.id)) + 1 : 1;
    const rollNo = `R-${1042 + mockDb.students.length}`;
    const newStudent = { id: nextId, rollNo, ...rest, status: rest.status || 'active' };
    mockDb.students.push(newStudent);
    const classFees = { 'Class 9': 1800, 'Class 10': 2000, 'Class 11': 2200, 'Class 12': 2500 };
    const amount = classFees[studentData.grade] || 2000;
    mockDb.fees.push({
      id: mockDb.fees.length + 1,
      studentId: nextId,
      month: 'July',
      amount,
      advance: 0,
      status: 'pending'
    });
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

export const saveAttendance = async (date, records) => {
  if (isMock) {
    records.forEach(rec => {
      const idx = mockDb.attendance.findIndex(a => a.date === date && a.studentId === rec.studentId);
      if (idx !== -1) {
        mockDb.attendance[idx].status = rec.status;
      } else {
        const nextId = mockDb.attendance.length > 0 ? Math.max(...mockDb.attendance.map(a => a.id)) + 1 : 1;
        mockDb.attendance.push({ id: nextId, studentId: rec.studentId, date, status: rec.status });
      }
    });
    return { success: true };
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
  return { success: true };
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
