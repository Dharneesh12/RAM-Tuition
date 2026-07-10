import { pgTable, serial, text, integer, date, jsonb } from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  role: text('role').notNull(), // 'director', 'staff', 'student'
  name: text('name').notNull(),
});

// Students table
export const students = pgTable('students', {
  id: serial('id').primaryKey(),
  rollNo: text('roll_no').notNull().unique(),
  name: text('name').notNull(),
  grade: text('grade').notNull(), // e.g., 'Class 10', 'Class 12'
  school: text('school').notNull(),
  email: text('email').notNull(),
  fatherName: text('father_name').notNull(),
  fatherWhatsapp: text('father_whatsapp').notNull(),
  motherName: text('mother_name').notNull(),
  motherWhatsapp: text('mother_whatsapp').notNull(),
  subjects: jsonb('subjects').notNull(), // e.g., ['Mathematics', 'Science']
  photoUrl: text('photo_url'),
  status: text('status').notNull().default('active'), // 'active', 'draft'
});

// Attendance table
export const attendance = pgTable('attendance', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id').references(() => students.id, { onDelete: 'cascade' }).notNull(),
  date: text('date').notNull(), // 'YYYY-MM-DD'
  status: text('status').notNull(), // 'present', 'absent'
});

// Marks table
export const marks = pgTable('marks', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id').references(() => students.id, { onDelete: 'cascade' }).notNull(),
  testName: text('test_name').notNull(),
  subject: text('subject').notNull(),
  marksObtained: integer('marks_obtained').notNull(),
  maxMarks: integer('max_marks').notNull(),
  remarks: text('remarks'),
});

// Fees table
export const fees = pgTable('fees', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id').references(() => students.id, { onDelete: 'cascade' }).notNull(),
  month: text('month').notNull(), // e.g., 'July'
  amount: integer('amount').notNull(),
  status: text('status').notNull(), // 'paid', 'pending'
});

// Notices table
export const notices = pgTable('notices', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  publishDate: text('publish_date').notNull(), // 'YYYY-MM-DD'
  expiryDate: text('expiry_date'), // 'YYYY-MM-DD' or null
  audience: text('audience').notNull(), // 'All', 'Staff', 'Class 10', 'Class 12', etc.
});

// Work Done table
export const workDone = pgTable('work_done', {
  id: serial('id').primaryKey(),
  date: text('date').notNull(), // 'YYYY-MM-DD'
  classSubject: text('class_subject').notNull(), // e.g. 'Class 10 · Maths'
  topic: text('topic').notNull(),
  staffName: text('staff_name').notNull(),
  remarks: text('remarks'),
});
