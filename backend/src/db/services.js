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
  students: [
    { id: 1, rollNo: 'R-1042', name: 'Arun Kumar', grade: 'Class 12', school: 'Govt. Hr. Sec. School, Ganapathy', email: 'arun@gmail.com', fatherName: 'Kumar S', fatherWhatsapp: '+91 98765 43211', motherName: 'Anitha K', motherWhatsapp: '+91 98765 12341', subjects: ['Mathematics', 'Physics'], photoUrl: null, status: 'active' },
    { id: 2, rollNo: 'R-1043', name: 'Sneha Priya', grade: 'Class 10', school: 'Mani Hr. Sec. School, Coimbatore', email: 'sneha@gmail.com', fatherName: 'Priya Raj', fatherWhatsapp: '+91 98765 43212', motherName: 'Devi P', motherWhatsapp: '+91 98765 12342', subjects: ['Mathematics', 'Science'], photoUrl: null, status: 'active' },
    { id: 3, rollNo: 'R-1044', name: 'Karthik V', grade: 'Class 11', school: 'Govt. Hr. Sec. School, Ganapathy', email: 'karthik@gmail.com', fatherName: 'Venkat R', fatherWhatsapp: '+91 98765 43213', motherName: 'Lakshmi V', motherWhatsapp: '+91 98765 12343', subjects: ['Mathematics'], photoUrl: null, status: 'active' },
    { id: 4, rollNo: 'R-1045', name: 'Divya M', grade: 'Class 9', school: 'Govt. Hr. Sec. School, Ganapathy', email: 'divya@gmail.com', fatherName: 'Mani T', fatherWhatsapp: '+91 98765 43214', motherName: 'Chitra M', motherWhatsapp: '+91 98765 12344', subjects: ['Science'], photoUrl: null, status: 'active' },
    { id: 5, rollNo: 'R-1051', name: 'Ranjith V', grade: 'Class 10', school: 'Govt. Hr. Sec. School, Ganapathy', email: 'ranjith@gmail.com', fatherName: 'Vasudevan G', fatherWhatsapp: '+91 98765 43215', motherName: 'Geetha V', motherWhatsapp: '+91 98765 12345', subjects: ['Mathematics'], photoUrl: null, status: 'active' },
    { id: 6, rollNo: 'R-1052', name: 'Divya M (Class 10)', grade: 'Class 10', school: 'Govt. Hr. Sec. School, Ganapathy', email: 'divya10@gmail.com', fatherName: 'Muthu K', fatherWhatsapp: '+91 98765 43216', motherName: 'Uma M', motherWhatsapp: '+91 98765 12346', subjects: ['Mathematics', 'Science'], photoUrl: null, status: 'active' },
    { id: 7, rollNo: 'R-1058', name: 'Harini N', grade: 'Class 10', school: 'Govt. Hr. Sec. School, Ganapathy', email: 'harini@gmail.com', fatherName: 'Narayanan A', fatherWhatsapp: '+91 98765 43217', motherName: 'Saritha N', motherWhatsapp: '+91 98765 12347', subjects: ['Mathematics', 'Science'], photoUrl: null, status: 'active' }
  ],
  attendance: [
    { id: 1, studentId: 1, date: '2026-07-08', status: 'present' },
    { id: 2, studentId: 2, date: '2026-07-08', status: 'present' },
    { id: 3, studentId: 5, date: '2026-07-08', status: 'absent' },
    { id: 4, studentId: 6, date: '2026-07-08', status: 'present' },
    { id: 5, studentId: 7, date: '2026-07-08', status: 'present' }
  ],
  marks: [
    { id: 1, studentId: 1, testName: 'Unit Test 2 — Trigonometry', subject: 'Maths', marksObtained: 46, maxMarks: 50, remarks: 'Minor calculation slip in Q7' },
    { id: 2, studentId: 2, testName: 'Unit Test 2 — Trigonometry', subject: 'Maths', marksObtained: 39, maxMarks: 50, remarks: 'Identity proof incomplete' },
    { id: 3, studentId: 5, testName: 'Unit Test 2 — Trigonometry', subject: 'Maths', marksObtained: 21, maxMarks: 50, remarks: 'Weak on formulae · needs revision of ratios' },
    { id: 4, studentId: 6, testName: 'Unit Test 2 — Trigonometry', subject: 'Maths', marksObtained: 44, maxMarks: 50, remarks: '—' },
    { id: 5, studentId: 7, testName: 'Unit Test 2 — Trigonometry', subject: 'Maths', marksObtained: 18, maxMarks: 50, remarks: 'Absent for 2 topics · arrange doubt session' }
  ],
  fees: [
    { id: 1, studentId: 1, month: 'July', amount: 2500, status: 'paid' },
    { id: 2, studentId: 2, month: 'July', amount: 2000, status: 'pending' },
    { id: 3, studentId: 3, month: 'July', amount: 2200, status: 'paid' },
    { id: 4, studentId: 4, month: 'July', amount: 1800, status: 'pending' },
    { id: 5, studentId: 5, month: 'July', amount: 2000, status: 'paid' },
    { id: 6, studentId: 6, month: 'July', amount: 2000, status: 'paid' },
    { id: 7, studentId: 7, month: 'July', amount: 2000, status: 'paid' }
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

// HELPER: Get in-memory mock student by roll
const getMockStudentByRoll = (rollNo) => {
  return mockDb.students.find(s => s.rollNo === rollNo);
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

// -------------------------------------------------------------
// STUDENT SERVICES
// -------------------------------------------------------------
export const getStudents = async () => {
  if (isMock) {
    return mockDb.students;
  }
  return await db.select().from(schema.students);
};

export const createStudent = async (studentData) => {
  if (isMock) {
    const nextId = mockDb.students.length > 0 ? Math.max(...mockDb.students.map(s => s.id)) + 1 : 1;
    const rollNo = `R-${1042 + mockDb.students.length}`;
    const newStudent = { id: nextId, rollNo, ...studentData, status: studentData.status || 'active' };
    mockDb.students.push(newStudent);
    // Auto-create a pending fee record for this student
    const classFees = { 'Class 9': 1800, 'Class 10': 2000, 'Class 11': 2200, 'Class 12': 2500 };
    const amount = classFees[studentData.grade] || 2000;
    mockDb.fees.push({
      id: mockDb.fees.length + 1,
      studentId: nextId,
      month: 'July',
      amount,
      status: 'pending'
    });
    return newStudent;
  }
  const rollNo = `R-${1042 + (await db.select().from(schema.students)).length}`;
  const [newStudent] = await db.insert(schema.students).values({ ...studentData, rollNo }).returning();
  
  // Create fee record
  const classFees = { 'Class 9': 1800, 'Class 10': 2000, 'Class 11': 2200, 'Class 12': 2500 };
  const amount = classFees[studentData.grade] || 2000;
  await db.insert(schema.fees).values({
    studentId: newStudent.id,
    month: 'July',
    amount,
    status: 'pending'
  });

  return newStudent;
};

// -------------------------------------------------------------
// ATTENDANCE SERVICES
// -------------------------------------------------------------
export const getAttendanceByDate = async (date) => {
  if (isMock) {
    return mockDb.attendance.filter(a => a.date === date);
  }
  return await db.select().from(schema.attendance).where(eq(schema.attendance.date, date));
};

export const saveAttendance = async (date, records) => {
  // records is array of { studentId, status }
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
      and(
        eq(schema.attendance.date, date),
        eq(schema.attendance.studentId, rec.studentId)
      )
    );

    if (existing.length > 0) {
      await db.update(schema.attendance)
        .set({ status: rec.status })
        .where(eq(schema.attendance.id, existing[0].id));
    } else {
      await db.insert(schema.attendance).values({
        studentId: rec.studentId,
        date,
        status: rec.status
      });
    }
  }
  return { success: true };
};

// -------------------------------------------------------------
// MARKS SERVICES
// -------------------------------------------------------------
export const getMarksByTest = async (testName) => {
  if (isMock) {
    return mockDb.marks.filter(m => m.testName === testName);
  }
  return await db.select().from(schema.marks).where(eq(schema.marks.testName, testName));
};

export const saveMarks = async (testName, subject, records) => {
  // records is array of { studentId, marksObtained, maxMarks, remarks }
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
      and(
        eq(schema.marks.testName, testName),
        eq(schema.marks.studentId, rec.studentId)
      )
    );

    if (existing.length > 0) {
      await db.update(schema.marks)
        .set({
          marksObtained: parseInt(rec.marksObtained),
          maxMarks: parseInt(rec.maxMarks),
          remarks: rec.remarks
        })
        .where(eq(schema.marks.id, existing[0].id));
    } else {
      await db.insert(schema.marks).values({
        studentId: rec.studentId,
        testName,
        subject,
        marksObtained: parseInt(rec.marksObtained),
        maxMarks: parseInt(rec.maxMarks),
        remarks: rec.remarks
      });
    }
  }
  return { success: true };
};

// -------------------------------------------------------------
// FEES SERVICES
// -------------------------------------------------------------
export const getFeesByMonth = async (month) => {
  if (isMock) {
    return mockDb.fees.filter(f => f.month === month);
  }
  return await db.select().from(schema.fees).where(eq(schema.fees.month, month));
};

export const updateFeeStatus = async (feeId, status) => {
  if (isMock) {
    const idx = mockDb.fees.findIndex(f => f.id === feeId);
    if (idx !== -1) {
      mockDb.fees[idx].status = status;
      return mockDb.fees[idx];
    }
    return null;
  }
  const [updated] = await db.update(schema.fees)
    .set({ status })
    .where(eq(schema.fees.id, feeId))
    .returning();
  return updated || null;
};

// -------------------------------------------------------------
// NOTICE SERVICES
// -------------------------------------------------------------
export const getNotices = async () => {
  if (isMock) {
    return mockDb.notices;
  }
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

// -------------------------------------------------------------
// WORK DONE SERVICES
// -------------------------------------------------------------
export const getWorkDone = async () => {
  if (isMock) {
    return mockDb.workDone;
  }
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
