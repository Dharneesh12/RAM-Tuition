import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import * as services from './db/services.js';
import { isMock } from './db/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Log DB Mode
console.log(`ℹ️ Backend started in ${isMock ? 'MOCK IN-MEMORY' : 'POSTGRESQL'} database mode.`);

// -------------------------------------------------------------
// AUTH ROUTES
// -------------------------------------------------------------
app.post('/api/auth/login', async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const user = await services.getUserByUsername(username);
    if (!user) return res.status(401).json({ error: 'Invalid username or password' });
    if (user.password !== password) return res.status(401).json({ error: 'Invalid username or password' });
    if (user.role !== role) return res.status(401).json({ error: 'Role mismatch' });
    res.json({ id: user.id, username: user.username, role: user.role, name: user.name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// USER MANAGEMENT ROUTES (Admin only — enforced on frontend)
// -------------------------------------------------------------
app.get('/api/users', async (req, res) => {
  try {
    const users = await services.getUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', async (req, res) => {
  const { username, password, role, name, grade, board, subjects, designation, phone } = req.body;
  if (!username || !password || !role || !name) {
    return res.status(400).json({ error: 'Missing required fields: username, password, role, name' });
  }
  if (!['director', 'staff', 'student'].includes(role)) {
    return res.status(400).json({ error: 'Role must be director, staff, or student' });
  }
  try {
    // Extra fields (grade/board/subjects for students, designation for staff) let
    // createUser also provision the matching directory record.
    const newUser = await services.createUser({ username, password, role, name, grade, board, subjects, designation, phone });
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { username, password, role, name } = req.body;
  const updates = {};
  if (username) updates.username = username;
  if (password) updates.password = password;
  if (role) updates.role = role;
  if (name) updates.name = name;
  try {
    const updated = await services.updateUser(parseInt(id), updates);
    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await services.deleteUser(parseInt(id));
    if (!deleted) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// STAFF ROUTES
// -------------------------------------------------------------
app.get('/api/staff', async (req, res) => {
  try {
    const staff = await services.getStaff();
    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/staff', async (req, res) => {
  const { name, email, phone, role, classes, subjects, joined, status } = req.body;
  if (!name || !email || !role) {
    return res.status(400).json({ error: 'Missing required fields: name, email, role' });
  }
  try {
    const newStaff = await services.createStaff({
      name, email, phone: phone || '', role,
      classes: classes || [], subjects: subjects || [],
      joined: joined || new Date().toISOString().split('T')[0],
      status: status || 'active'
    });
    res.status(201).json(newStaff);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/staff/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    const updated = await services.updateStaff(parseInt(id), updates);
    if (!updated) return res.status(404).json({ error: 'Staff not found' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/staff/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await services.deleteStaff(parseInt(id));
    if (!deleted) return res.status(404).json({ error: 'Staff not found' });
    res.json({ message: 'Staff member deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// STUDENT & ADMISSION ROUTES
// -------------------------------------------------------------
app.get('/api/students', async (req, res) => {
  try {
    const students = await services.getStudents();
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/students', async (req, res) => {
  const { name, grade, board, school, email, fatherName, fatherWhatsapp, motherName, motherWhatsapp, subjects, photoUrl, status } = req.body;
  if (!name || !grade || !school || !email || !fatherName || !fatherWhatsapp || !motherName || !motherWhatsapp || !subjects) {
    return res.status(400).json({ error: 'Missing required admission fields' });
  }
  try {
    const student = await services.createStudent({
      name, grade, board: board || 'State Board', school, email, fatherName, fatherWhatsapp, motherName, motherWhatsapp, subjects, photoUrl, status: status || 'active'
    });
    res.status(201).json(student);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/students/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    const updated = await services.updateStudent(parseInt(id), updates);
    if (!updated) return res.status(404).json({ error: 'Student not found' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await services.deleteStudent(parseInt(id));
    if (!deleted) return res.status(404).json({ error: 'Student not found' });
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// ATTENDANCE ROUTES
// -------------------------------------------------------------
app.get('/api/attendance', async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'Date query param required (YYYY-MM-DD)' });
  try {
    const attendance = await services.getAttendanceByDate(date);
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/attendance/student/:id', async (req, res) => {
  try {
    const records = await services.getAttendanceByStudent(parseInt(req.params.id));
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/attendance', async (req, res) => {
  const { date, records } = req.body;
  if (!date || !records || !Array.isArray(records)) {
    return res.status(400).json({ error: 'Missing date or records array' });
  }
  try {
    await services.saveAttendance(date, records);
    res.json({ message: 'Attendance saved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// MARKS ROUTES
// -------------------------------------------------------------
app.get('/api/marks', async (req, res) => {
  const { testName } = req.query;
  if (!testName) return res.status(400).json({ error: 'testName query param required' });
  try {
    const marks = await services.getMarksByTest(testName);
    res.json(marks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/marks/student/:id', async (req, res) => {
  try {
    const records = await services.getMarksByStudent(parseInt(req.params.id));
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/marks/tests', async (req, res) => {
  try {
    const tests = await services.getAllTestNames();
    res.json(tests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/marks', async (req, res) => {
  const { testName, subject, records } = req.body;
  if (!testName || !subject || !records || !Array.isArray(records)) {
    return res.status(400).json({ error: 'Missing testName, subject, or records array' });
  }
  try {
    await services.saveMarks(testName, subject, records);
    res.json({ message: 'Marks saved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// FEE ROUTES
// -------------------------------------------------------------
app.get('/api/fees', async (req, res) => {
  const { month } = req.query;
  if (!month) return res.status(400).json({ error: 'Month query param required' });
  try {
    const fees = await services.getFeesByMonth(month);
    res.json(fees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/fees/student/:id', async (req, res) => {
  try {
    const records = await services.getFeesByStudent(parseInt(req.params.id));
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/fees/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'Status is required' });
  try {
    const updated = await services.updateFeeStatus(parseInt(id), status);
    if (!updated) return res.status(404).json({ error: 'Fee record not found' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// NOTICE ROUTES
// -------------------------------------------------------------
app.get('/api/notices', async (req, res) => {
  try {
    const notices = await services.getNotices();
    res.json(notices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/notices', async (req, res) => {
  const { title, message, publishDate, expiryDate, audience } = req.body;
  if (!title || !message || !publishDate || !audience) {
    return res.status(400).json({ error: 'Missing notice fields' });
  }
  try {
    const notice = await services.createNotice({ title, message, publishDate, expiryDate, audience });
    res.status(201).json(notice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/notices/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    const updated = await services.updateNotice(parseInt(id), updates);
    if (!updated) return res.status(404).json({ error: 'Notice not found' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/notices/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await services.deleteNotice(parseInt(id));
    if (!deleted) return res.status(404).json({ error: 'Notice not found' });
    res.json({ message: 'Notice deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// WORK DONE LOG ROUTES
// -------------------------------------------------------------
app.get('/api/workdone', async (req, res) => {
  try {
    const entries = await services.getWorkDone();
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/workdone', async (req, res) => {
  const { date, classSubject, topic, staffName, remarks } = req.body;
  if (!date || !classSubject || !topic || !staffName) {
    return res.status(400).json({ error: 'Missing work done fields' });
  }
  try {
    const entry = await services.createWorkDone({ date, classSubject, topic, staffName, remarks });
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/workdone/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    const updated = await services.updateWorkDone(parseInt(id), updates);
    if (!updated) return res.status(404).json({ error: 'Work done entry not found' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/workdone/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await services.deleteWorkDone(parseInt(id));
    if (!deleted) return res.status(404).json({ error: 'Work done entry not found' });
    res.json({ message: 'Entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// DASHBOARD METRICS ROUTE
// -------------------------------------------------------------
app.get('/api/dashboard', async (req, res) => {
  try {
    const students = await services.getStudents();
    const notices = await services.getNotices();
    const staff = await services.getStaff();
    const fees = await services.getFeesByMonth('July');
    const totalStudents = students.length;
    const totalStaff = staff.length;

    let pendingAmount = 0, collectedAmount = 0, paidCount = 0, pendingCount = 0;
    fees.forEach(f => {
      if (f.status === 'pending') { pendingAmount += f.amount; pendingCount++; }
      else { collectedAmount += f.amount; paidCount++; }
    });

    const allMarks = await services.getMarksByTest('Unit Test 2 — Trigonometry');
    let lowScoresCount = 0;
    allMarks.forEach(m => {
      if ((m.marksObtained / m.maxMarks) * 100 < 50) lowScoresCount++;
    });

    res.json({
      stats: {
        totalStudents,
        totalStaff,
        feesPendingAmount: pendingAmount,
        collectedAmount,
        lowScoresCount,
        collectionRate: fees.length > 0 ? Math.round((collectedAmount / (collectedAmount + pendingAmount)) * 100) : 0,
        paidCount,
        pendingCount,
        totalExpectedAmount: collectedAmount + pendingAmount
      },
      recentAdmissions: students.slice(-4).reverse(),
      notices: notices.slice(0, 3)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
