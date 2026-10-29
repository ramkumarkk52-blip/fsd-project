const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  multipleStatements: true
};

async function seedDatabase() {
  console.log('🚀 Starting Database Initializer & Seeder...');
  let connection;
  try {
    // 1. Connect without database selected to ensure DB exists
    connection = await mysql.createConnection(DB_CONFIG);
    const dbName = process.env.DB_NAME || 'fitness_center_db';
    console.log(`Checking / Creating Database "${dbName}"...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.changeUser({ database: dbName });

    // 2. Read and execute schema.sql
    console.log('Applying database schema...');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await connection.query(schemaSql);
    console.log(' Schema tables created successfully!');

    // 3. Hash default passwords
    const salt = await bcrypt.genSalt(10);
    const adminPass = await bcrypt.hash('AdminPassword123!', salt);
    const trainerPass = await bcrypt.hash('TrainerPassword123!', salt);
    const memberPass = await bcrypt.hash('MemberPassword123!', salt);

    console.log('Seeding initial users...');
    // Seed Users
    const usersData = [
      ['System Admin', 'admin@fitness.com', adminPass, 'admin', '+1-555-0100', '100 Gym Plaza, Suite 400', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 'active'],
      ['Marcus Vance', 'marcus@fitness.com', trainerPass, 'trainer', '+1-555-0201', '45 Ironwood Dr, Metro City', 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150', 'active'],
      ['Elena Rostova', 'elena@fitness.com', trainerPass, 'trainer', '+1-555-0202', '78 Olympic Ave, Metro City', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', 'active'],
      ['David Chen', 'david@fitness.com', trainerPass, 'trainer', '+1-555-0203', '12 Harmony Way, Metro City', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'active'],
      ['Sarah Jenkins', 'member@fitness.com', memberPass, 'member', '+1-555-0301', '105 West End St, Metro City', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', 'active'],
      ['Michael Torres', 'michael@fitness.com', memberPass, 'member', '+1-555-0302', '34 Beacon Hill, Metro City', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 'active'],
      ['Aaliyah Patel', 'aaliyah@fitness.com', memberPass, 'member', '+1-555-0303', '90 Sunset Blvd, Metro City', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', 'active'],
      ['James Wilson', 'james@fitness.com', memberPass, 'member', '+1-555-0304', '22 Riverdale Rd, Metro City', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150', 'active']
    ];

    for (const u of usersData) {
      await connection.query(
        `INSERT INTO users (name, email, password, role, phone, address, avatar_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        u
      );
    }

    // Retrieve user IDs
    const [userRows] = await connection.query(`SELECT id, email, role FROM users`);
    const userMap = {};
    userRows.forEach(u => { userMap[u.email] = u.id; });

    console.log('Seeding trainers...');
    // Seed Trainers
    const trainersData = [
      [userMap['marcus@fitness.com'], 'Strength & Conditioning', 8, 'Certified CSCS and elite strength coach helping athletes achieve peak physical output.', 75.00, '2022-03-15'],
      [userMap['elena@fitness.com'], 'HIIT & Mobility', 6, 'Former rhythmic gymnast and functional movement specialist with focus on posture and core strength.', 65.00, '2023-01-10'],
      [userMap['david@fitness.com'], 'Weight Loss & Cardiovascular Health', 5, 'Specialist in fat loss, metabolic conditioning, and sustainable nutrition habits.', 60.00, '2023-08-01']
    ];

    for (const t of trainersData) {
      await connection.query(
        `INSERT INTO trainers (user_id, specialization, experience_years, bio, hourly_rate, hire_date) VALUES (?, ?, ?, ?, ?, ?)`,
        t
      );
    }

    // Retrieve trainer IDs
    const [trainerRows] = await connection.query(`SELECT t.id, u.email FROM trainers t JOIN users u ON t.user_id = u.id`);
    const trainerMap = {};
    trainerRows.forEach(t => { trainerMap[t.email] = t.id; });

    console.log('Seeding membership plans...');
    // Seed Memberships
    const membershipsData = [
      ['Basic Fitness', 'Essential access to standard gym floor, cardio zone, and locker rooms during off-peak and peak hours.', 1, 39.99, JSON.stringify(['Full Gym Floor Access', 'Locker Room & Showers', 'Free WiFi', 'Fitness Assessment'])],
      ['Pro Athlete', 'Comprehensive package including all group fitness classes, steam & sauna, plus monthly body composition analysis.', 3, 99.99, JSON.stringify(['All Basic Features', 'Unlimited Group Classes', 'Steam & Sauna Access', '2 Free Guest Passes / mo', 'Monthly Body Composition'])],
      ['Elite VIP', 'All-inclusive premium experience with dedicated trainer support, private locker, towel service, and nutrition counseling.', 6, 249.99, JSON.stringify(['All Pro Features', '4 Dedicated Personal Trainer Sessions / mo', 'Custom Nutrition & Diet Plan', 'Private VIP Locker', 'Unlimited Towel Service', 'Free Smoothie / Visit'])],
      ['Annual Champions Club', 'Top-tier 12-month commitment offering maximum savings and unlimited priority access to all fitness facilities.', 12, 499.99, JSON.stringify(['Full 1-Year VIP Access', 'Monthly Personal Training Sessions', 'All Classes & Workshops', 'Complimentary Gym Kit & Bag', '20% Discount at Pro Shop'])]
    ];

    for (const m of membershipsData) {
      await connection.query(
        `INSERT INTO memberships (name, description, duration_months, price, features) VALUES (?, ?, ?, ?, ?)`,
        m
      );
    }

    const [membershipRows] = await connection.query(`SELECT id, name FROM memberships`);
    const membershipMap = {};
    membershipRows.forEach(m => { membershipMap[m.name] = m.id; });

    console.log('Seeding members...');
    // Seed Members
    const membersData = [
      [userMap['member@fitness.com'], trainerMap['marcus@fitness.com'], membershipMap['Pro Athlete'], 'female', '1995-04-12', '+1-555-9001', 'None', '2026-01-15', 'active'],
      [userMap['michael@fitness.com'], trainerMap['elena@fitness.com'], membershipMap['Elite VIP'], 'male', '1990-08-23', '+1-555-9002', 'Mild lower back sensitivity', '2025-11-01', 'active'],
      [userMap['aaliyah@fitness.com'], trainerMap['david@fitness.com'], membershipMap['Basic Fitness'], 'female', '1998-12-05', '+1-555-9003', 'None', '2026-02-01', 'active'],
      [userMap['james@fitness.com'], trainerMap['marcus@fitness.com'], membershipMap['Annual Champions Club'], 'male', '1987-03-30', '+1-555-9004', 'Hypertension under control', '2025-06-15', 'active']
    ];

    for (const mem of membersData) {
      await connection.query(
        `INSERT INTO members (user_id, trainer_id, membership_id, gender, dob, emergency_contact, health_conditions, join_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        mem
      );
    }

    const [memberRows] = await connection.query(`SELECT m.id, u.email FROM members m JOIN users u ON m.user_id = u.id`);
    const memberMap = {};
    memberRows.forEach(m => { memberMap[m.email] = m.id; });

    console.log('Seeding subscriptions...');
    // Seed Subscriptions
    const subscriptionsData = [
      [memberMap['member@fitness.com'], membershipMap['Pro Athlete'], '2026-01-15', '2026-04-15', 99.99, 'card', 'paid', 'active', 'Initial 3-month signup'],
      [memberMap['michael@fitness.com'], membershipMap['Elite VIP'], '2025-11-01', '2026-05-01', 249.99, 'card', 'paid', 'active', 'VIP biannual membership'],
      [memberMap['aaliyah@fitness.com'], membershipMap['Basic Fitness'], '2026-02-01', '2026-03-01', 39.99, 'upi', 'paid', 'active', 'Monthly auto-renewal candidate'],
      [memberMap['james@fitness.com'], membershipMap['Annual Champions Club'], '2025-06-15', '2026-06-15', 499.99, 'netbanking', 'paid', 'active', 'Annual paid in advance']
    ];

    for (const s of subscriptionsData) {
      await connection.query(
        `INSERT INTO subscriptions (member_id, membership_id, start_date, end_date, amount_paid, payment_method, payment_status, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        s
      );
    }

    console.log('Seeding workout plans...');
    // Seed Workout Plans
    const exercisesSarah = JSON.stringify([
      { name: 'Barbell Back Squat', sets: 4, reps: '8-10', weight_or_time: '55 kg', notes: 'Maintain deep hip hinge and steady tempo' },
      { name: 'Romanian Deadlift', sets: 3, reps: '10-12', weight_or_time: '45 kg', notes: 'Feel hamstring stretch, neutral spine' },
      { name: 'Walking Dumbbell Lunges', sets: 3, reps: '12 per leg', weight_or_time: '12 kg dumbbells', notes: 'Control deceleration' },
      { name: 'Hanging Leg Raises', sets: 3, reps: '15', weight_or_time: 'Bodyweight', notes: 'Engage core, no swinging' }
    ]);

    const exercisesMichael = JSON.stringify([
      { name: 'Kettlebell Swings', sets: 5, reps: '20', weight_or_time: '24 kg', notes: 'Explosive hip drive' },
      { name: 'Incline Dumbbell Press', sets: 4, reps: '10', weight_or_time: '26 kg each', notes: 'Full chest contraction' },
      { name: 'Pull-ups / Lat Pulldown', sets: 4, reps: '8-10', weight_or_time: 'BW / 70 kg', notes: 'Squeeze lats at bottom' },
      { name: 'Battle Ropes Intervals', sets: 4, reps: '45 sec', weight_or_time: 'High Intensity', notes: '15 sec rest between waves' }
    ]);

    const exercisesAaliyah = JSON.stringify([
      { name: 'Treadmill Incline Intervals', sets: 1, reps: '25 min', weight_or_time: 'Speed 5.5, Incline 6%', notes: 'Steady zone 2 cardio' },
      { name: 'Goblet Squats', sets: 3, reps: '15', weight_or_time: '14 kg', notes: 'Focus on posture and depth' },
      { name: 'Plank Hold', sets: 3, reps: '60 sec', weight_or_time: 'Bodyweight', notes: 'Tuck pelvis and squeeze glutes' }
    ]);

    const workoutPlansData = [
      ['Hypertrophy & Lower Body Focus', 'Targeted muscular hypertrophy for quadriceps, hamstrings, and glutes with core stabilization.', memberMap['member@fitness.com'], trainerMap['marcus@fitness.com'], 'Muscle Gain', 'intermediate', 'Mon, Wed, Fri', exercisesSarah, '2026-01-20', '2026-04-20', 'active'],
      ['Athletic Conditioning & Agility', 'High intensity endurance, explosive power, and functional strength program.', memberMap['michael@fitness.com'], trainerMap['elena@fitness.com'], 'Athletic Performance', 'advanced', 'Tue, Thu, Sat', exercisesMichael, '2025-11-10', '2026-05-10', 'active'],
      ['Fat Loss & Core Sculpt', 'Cardiovascular conditioning combined with high-repetition compound resistance training.', memberMap['aaliyah@fitness.com'], trainerMap['david@fitness.com'], 'Fat Loss', 'beginner', 'Mon, Thu, Sat', exercisesAaliyah, '2026-02-05', '2026-04-05', 'active']
    ];

    for (const w of workoutPlansData) {
      await connection.query(
        `INSERT INTO workout_plans (title, description, member_id, trainer_id, goal, difficulty, schedule_days, exercises, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        w
      );
    }

    console.log('Seeding trainer schedules...');
    // Seed Schedules
    const schedulesData = [
      [trainerMap['marcus@fitness.com'], memberMap['member@fitness.com'], 'Strength Progression & Technique Review', 'personal_training', '2026-09-26', '09:00:00', '10:00:00', 1, 'Strength Bay 1', 'scheduled', 'Focus on heavy squat form check'],
      [trainerMap['elena@fitness.com'], memberMap['michael@fitness.com'], 'HIIT & Mobility Assessment', 'personal_training', '2026-09-26', '10:30:00', '11:30:00', 1, 'Functional Studio B', 'scheduled', 'Lower back safe mobility drills'],
      [trainerMap['david@fitness.com'], memberMap['aaliyah@fitness.com'], 'Nutrition & Cardio Check-in', 'consultation', '2026-09-27', '14:00:00', '14:45:00', 1, 'Consultation Office 2', 'scheduled', 'Review caloric intake and weekly target'],
      [trainerMap['marcus@fitness.com'], null, 'Powerlifting Workshop (Open Session)', 'group_class', '2026-09-28', '17:00:00', '18:30:00', 15, 'Main Platform Area', 'scheduled', 'Open to all Pro and VIP members'],
      [trainerMap['elena@fitness.com'], null, 'Morning Flow & Core Conditioning', 'group_class', '2026-09-27', '07:30:00', '08:30:00', 20, 'Aerobics Studio A', 'scheduled', 'All levels welcome']
    ];

    for (const sc of schedulesData) {
      await connection.query(
        `INSERT INTO schedules (trainer_id, member_id, session_title, session_type, session_date, start_time, end_time, capacity, room, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        sc
      );
    }

    console.log('Seeding attendance records...');
    // Seed Attendance
    const attendanceRecords = [
      [memberMap['member@fitness.com'], '2026-09-18', '08:45:00', '10:15:00', 'present', 'Morning workout completed'],
      [memberMap['member@fitness.com'], '2026-09-20', '09:00:00', '10:30:00', 'present', 'Strength session with trainer'],
      [memberMap['member@fitness.com'], '2026-09-22', '08:50:00', '10:10:00', 'present', 'Leg day workout completed'],
      [memberMap['member@fitness.com'], '2026-09-24', '09:10:00', '10:25:00', 'present', 'Cardio + cool down completed'],
      [memberMap['michael@fitness.com'], '2026-09-19', '07:00:00', '08:30:00', 'present', 'Early morning functional class'],
      [memberMap['michael@fitness.com'], '2026-09-21', '07:15:00', '08:45:00', 'present', 'HIIT session'],
      [memberMap['michael@fitness.com'], '2026-09-23', '07:05:00', '08:35:00', 'present', 'Agility drills'],
      [memberMap['aaliyah@fitness.com'], '2026-09-20', '17:30:00', '18:45:00', 'present', 'Treadmill and resistance machines'],
      [memberMap['aaliyah@fitness.com'], '2026-09-22', '18:00:00', '19:15:00', 'present', 'Core and stretch session'],
      [memberMap['james@fitness.com'], '2026-09-21', '06:30:00', '08:00:00', 'present', 'VIP workout'],
      [memberMap['james@fitness.com'], '2026-09-23', '06:45:00', '08:15:00', 'present', 'Heavy bench and arms']
    ];

    for (const a of attendanceRecords) {
      await connection.query(
        `INSERT INTO attendance (member_id, date, check_in_time, check_out_time, status, notes) VALUES (?, ?, ?, ?, ?, ?)`,
        a
      );
    }

    console.log('Seeding fitness progress history...');
    // Seed Fitness Progress
    const progressRecords = [
      [memberMap['member@fitness.com'], trainerMap['marcus@fitness.com'], '2026-01-20', 68.5, 168.0, 24.27, 26.5, 88.0, 74.0, 28.0, 'Baseline assessment. Target: lean muscle gain.'],
      [memberMap['member@fitness.com'], trainerMap['marcus@fitness.com'], '2026-02-20', 67.2, 168.0, 23.81, 25.1, 89.0, 72.5, 28.5, 'Good posture improvement, waist reduced by 1.5 cm.'],
      [memberMap['member@fitness.com'], trainerMap['marcus@fitness.com'], '2026-03-20', 66.8, 168.0, 23.67, 23.8, 90.0, 71.0, 29.0, 'Substantial muscle definition in quads and upper back.'],
      [memberMap['member@fitness.com'], trainerMap['marcus@fitness.com'], '2026-09-20', 65.5, 168.0, 23.21, 22.2, 91.0, 69.5, 29.5, 'Excellent progress! Body fat down 4.3%, strength up significantly.'],

      [memberMap['michael@fitness.com'], trainerMap['elena@fitness.com'], '2025-11-15', 86.0, 180.0, 26.54, 21.0, 102.0, 88.0, 35.0, 'Baseline athletic testing.'],
      [memberMap['michael@fitness.com'], trainerMap['elena@fitness.com'], '2026-01-15', 83.5, 180.0, 25.77, 18.5, 103.5, 84.0, 36.0, 'Speed and endurance increased significantly.'],
      [memberMap['michael@fitness.com'], trainerMap['elena@fitness.com'], '2026-03-15', 82.0, 180.0, 25.31, 16.8, 105.0, 82.0, 36.5, 'Peak performance metrics reached.'],

      [memberMap['aaliyah@fitness.com'], trainerMap['david@fitness.com'], '2026-02-05', 72.0, 162.0, 27.43, 31.0, 94.0, 82.0, 29.0, 'Starting journey. Focus on nutrition and consistency.'],
      [memberMap['aaliyah@fitness.com'], trainerMap['david@fitness.com'], '2026-03-10', 69.5, 162.0, 26.48, 29.2, 92.5, 79.0, 28.5, 'Consistent workouts, feeling much more energized.'],
      [memberMap['aaliyah@fitness.com'], trainerMap['david@fitness.com'], '2026-09-15', 66.0, 162.0, 25.15, 26.5, 90.0, 75.0, 28.0, 'Down 6 kg total! Cholesterol and stamina improved.']
    ];

    for (const p of progressRecords) {
      await connection.query(
        `INSERT INTO fitness_progress (member_id, recorded_by, date, weight_kg, height_cm, bmi, body_fat_percentage, chest_cm, waist_cm, arms_cm, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        p
      );
    }

    console.log('\n=============================================');
    console.log(' Fitness Center DB seeded successfully!');
    console.log('=============================================');
    console.log('Demo Credentials:');
    console.log('  Admin:   admin@fitness.com   / AdminPassword123!');
    console.log('  Trainer: marcus@fitness.com  / TrainerPassword123!');
    console.log('  Trainer: elena@fitness.com   / TrainerPassword123!');
    console.log('  Trainer: david@fitness.com   / TrainerPassword123!');
    console.log('  Member:  member@fitness.com  / MemberPassword123!');
    console.log('  Member:  michael@fitness.com / MemberPassword123!');
    console.log('  Member:  aaliyah@fitness.com / MemberPassword123!');
    console.log('  Member:  james@fitness.com   / MemberPassword123!');
    console.log('=============================================\n');

  } catch (error) {
    console.error('❌ Error during database seeding:', error);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

seedDatabase();
