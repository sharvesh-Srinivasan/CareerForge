require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./config/db');

const log = (level, msg) => console.log(`[${level}] [${new Date().toISOString()}] ${msg}`);

const seed = async () => {
  try {
    log('INFO', 'Starting database seed...');

    // ─── Clean existing data ──────────────────────────────────────────────────
    await db.query('SET FOREIGN_KEY_CHECKS = 0');
    await db.query('TRUNCATE TABLE activity_logs');
    await db.query('TRUNCATE TABLE reminders');
    await db.query('TRUNCATE TABLE interview_rounds');
    await db.query('TRUNCATE TABLE applications');
    await db.query('TRUNCATE TABLE resume_versions');
    await db.query('TRUNCATE TABLE companies');
    await db.query('TRUNCATE TABLE users');
    await db.query('SET FOREIGN_KEY_CHECKS = 1');
    log('INFO', 'Tables truncated');

    // ─── Insert test user ─────────────────────────────────────────────────────
    const passwordHash = await bcrypt.hash('test123', 10);
    const [userResult] = await db.query(
      `INSERT INTO users (name, email, password_hash, phone, college, branch, graduation_year, whatsapp_subscribed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['Test Student', 'test@careerforge.com', passwordHash, '9876543210', 'MIT Chennai', 'Information Technology', 2027, 1]
    );
    const userId = userResult.insertId;
    log('INFO', `Test user created with ID: ${userId}`);

    // ─── Insert companies ─────────────────────────────────────────────────────
    const companies = [
      ['Google', 'product'],
      ['Microsoft', 'product'],
      ['Amazon', 'product'],
      ['Flipkart', 'startup'],
      ['Infosys', 'service'],
      ['TCS', 'service'],
      ['Zomato', 'startup'],
      ['Razorpay', 'startup'],
      ['Deloitte', 'consulting'],
      ['KPMG', 'consulting'],
    ];

    for (const [name, type] of companies) {
      await db.query('INSERT INTO companies (name, type) VALUES (?, ?)', [name, type]);
    }
    log('INFO', '10 companies inserted');

    // ─── Insert resume versions ───────────────────────────────────────────────
    const [resumeResult1] = await db.query(
      `INSERT INTO resume_versions (user_id, name, version, cloudinary_url, cloudinary_public_id)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, 'Software Engineer Resume', 'v1.0', 'https://res.cloudinary.com/demo/raw/upload/sample.pdf', 'careerforge/resumes/resume_swe_v1']
    );
    const [resumeResult2] = await db.query(
      `INSERT INTO resume_versions (user_id, name, version, cloudinary_url, cloudinary_public_id)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, 'Full Stack Developer Resume', 'v2.1', 'https://res.cloudinary.com/demo/raw/upload/sample.pdf', 'careerforge/resumes/resume_fsd_v2']
    );
    const resume1Id = resumeResult1.insertId;
    const resume2Id = resumeResult2.insertId;
    log('INFO', '2 resume versions inserted');

    // ─── Insert applications ──────────────────────────────────────────────────
    const today = new Date();
    const dateOffset = (days) => {
      const d = new Date(today);
      d.setDate(d.getDate() - days);
      return d.toISOString().split('T')[0];
    };

    const applications = [
      {
        company_name: 'Google',
        role: 'Software Engineer Intern',
        location: 'Bangalore',
        package: '80,000/month',
        application_date: dateOffset(45),
        status: 'Offer Received',
        resume_version_id: resume2Id,
        notes: 'Got through referral from senior',
      },
      {
        company_name: 'Microsoft',
        role: 'SDE Intern',
        location: 'Hyderabad',
        package: '70,000/month',
        application_date: dateOffset(38),
        status: 'HR Round',
        resume_version_id: resume2Id,
        notes: 'Technical rounds went well',
      },
      {
        company_name: 'Amazon',
        role: 'SDE 1',
        location: 'Bangalore',
        package: '45 LPA',
        application_date: dateOffset(30),
        status: 'Technical Round 2',
        resume_version_id: resume1Id,
        notes: 'OA was easy, technical rounds moderate',
      },
      {
        company_name: 'Flipkart',
        role: 'Software Developer Intern',
        location: 'Bangalore',
        package: '50,000/month',
        application_date: dateOffset(25),
        status: 'OA Cleared',
        resume_version_id: resume1Id,
        notes: 'OA had 3 coding questions',
      },
      {
        company_name: 'Infosys',
        role: 'Systems Engineer',
        location: 'Chennai',
        package: '4.5 LPA',
        application_date: dateOffset(20),
        status: 'Applied',
        resume_version_id: resume1Id,
        notes: 'Applied through campus portal',
      },
      {
        company_name: 'Zomato',
        role: 'Backend Engineer',
        location: 'Gurugram',
        package: '18 LPA',
        application_date: dateOffset(15),
        status: 'OA Scheduled',
        resume_version_id: resume2Id,
        notes: 'OA on next week',
      },
      {
        company_name: 'Razorpay',
        role: 'Full Stack Engineer Intern',
        location: 'Bangalore',
        package: '60,000/month',
        application_date: dateOffset(10),
        status: 'Rejected',
        resume_version_id: resume1Id,
        notes: 'Rejected after first technical round',
      },
      {
        company_name: 'Deloitte',
        role: 'Technology Analyst',
        location: 'Mumbai',
        package: '8 LPA',
        application_date: dateOffset(5),
        status: 'Applied',
        resume_version_id: resume1Id,
        notes: 'Applied via LinkedIn',
      },
    ];

    const appIds = [];
    for (const app of applications) {
      const [r] = await db.query(
        `INSERT INTO applications
          (user_id, company_name, role, location, package, application_date, status, resume_version_id, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, app.company_name, app.role, app.location, app.package, app.application_date, app.status, app.resume_version_id, app.notes]
      );
      appIds.push(r.insertId);
    }
    log('INFO', '8 applications inserted');

    // ─── Insert interview rounds ───────────────────────────────────────────────
    // Google (Offer Received) - multiple rounds
    await db.query(
      `INSERT INTO interview_rounds (application_id, round_name, round_date, questions_asked, topics_covered, difficulty, outcome, personal_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [appIds[0], 'Online Assessment', dateOffset(40), '3 coding questions: Array manipulation, DP, Graph', 'Arrays, DP, Graph BFS', 'Medium', 'Cleared', 'Used editorial approach for Q3']
    );
    await db.query(
      `INSERT INTO interview_rounds (application_id, round_name, round_date, questions_asked, topics_covered, difficulty, outcome, personal_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [appIds[0], 'Technical Round 1', dateOffset(35), 'LRU Cache, Binary Tree traversal, System Design intro', 'Data Structures, LLD', 'Medium', 'Cleared', 'Interviewers were friendly, focus on code quality']
    );
    await db.query(
      `INSERT INTO interview_rounds (application_id, round_name, round_date, questions_asked, topics_covered, difficulty, outcome, personal_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [appIds[0], 'Technical Round 2', dateOffset(30), 'Design Twitter feed, Rate Limiter, Dijkstra', 'System Design, Algorithms', 'Hard', 'Cleared', 'System design was tough, revised HLD after this']
    );
    await db.query(
      `INSERT INTO interview_rounds (application_id, round_name, round_date, questions_asked, topics_covered, difficulty, outcome, personal_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [appIds[0], 'HR Round', dateOffset(25), 'Why Google? Career goals, Relocation flexibility', 'Behavioral', 'Easy', 'Cleared', 'Very conversational, asked about projects in depth']
    );

    // Microsoft (HR Round) - 2 rounds
    await db.query(
      `INSERT INTO interview_rounds (application_id, round_name, round_date, questions_asked, topics_covered, difficulty, outcome, personal_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [appIds[1], 'Online Assessment', dateOffset(33), '2 coding + 1 MCQ section', 'Arrays, Strings, OS', 'Easy', 'Cleared', 'OA was straightforward']
    );
    await db.query(
      `INSERT INTO interview_rounds (application_id, round_name, round_date, questions_asked, topics_covered, difficulty, outcome, personal_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [appIds[1], 'Technical Round 1', dateOffset(28), 'Merge K sorted arrays, Virtual memory, OOPs', 'DSA, OS, OOPs', 'Medium', 'Cleared', 'Good discussion on OOPs concepts']
    );

    // Amazon (Technical Round 2) - 2 rounds
    await db.query(
      `INSERT INTO interview_rounds (application_id, round_name, round_date, questions_asked, topics_covered, difficulty, outcome, personal_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [appIds[2], 'Online Assessment', dateOffset(26), '2 coding questions, leadership principles MCQ', 'DP, Graphs', 'Medium', 'Cleared', 'LP section was tricky']
    );
    await db.query(
      `INSERT INTO interview_rounds (application_id, round_name, round_date, questions_asked, topics_covered, difficulty, outcome, personal_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [appIds[2], 'Technical Round 1', dateOffset(22), 'Minimum spanning tree, SOLID principles, REST API design', 'Graphs, System Design', 'Medium', 'Cleared', 'System design discussion was unexpected']
    );

    log('INFO', 'Interview rounds inserted');

    // ─── Insert reminders ─────────────────────────────────────────────────────
    const futureDate = (days, hours = 10) => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      d.setHours(hours, 0, 0, 0);
      return d.toISOString().slice(0, 19).replace('T', ' ');
    };

    await db.query(
      `INSERT INTO reminders (user_id, application_id, title, reminder_type, remind_at, send_email, send_whatsapp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, appIds[5], 'Zomato OA — prepare today!', 'OA', futureDate(2, 9), 1, 1]
    );
    await db.query(
      `INSERT INTO reminders (user_id, application_id, title, reminder_type, remind_at, send_email, send_whatsapp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, appIds[1], 'Microsoft HR Round Scheduled', 'Interview', futureDate(3, 14), 1, 1]
    );
    await db.query(
      `INSERT INTO reminders (user_id, application_id, title, reminder_type, remind_at, send_email, send_whatsapp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, null, 'Update resume with latest projects', 'Resume Update', futureDate(5, 11), 1, 0]
    );
    await db.query(
      `INSERT INTO reminders (user_id, application_id, title, reminder_type, remind_at, send_email, send_whatsapp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, appIds[4], 'Infosys campus drive deadline', 'Application Deadline', futureDate(7, 17), 1, 1]
    );
    await db.query(
      `INSERT INTO reminders (user_id, application_id, title, reminder_type, remind_at, send_email, send_whatsapp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, appIds[0], 'Follow up on Google offer letter', 'Referral Follow Up', futureDate(10, 10), 1, 0]
    );
    log('INFO', '5 reminders inserted');

    // ─── Insert activity logs ──────────────────────────────────────────────────
    const activityEntries = [
      `Added application to Google`,
      `Added application to Microsoft`,
      `Updated Google status to Offer Received`,
      `Added Technical Round 2 for Amazon`,
      `Uploaded resume: Full Stack Developer Resume v2.1`,
    ];

    for (const action of activityEntries) {
      await db.query(
        'INSERT INTO activity_logs (user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)',
        [userId, action, 'application', appIds[0]]
      );
    }
    log('INFO', 'Activity logs inserted');

    log('INFO', '✅ Database seed completed successfully!');
    log('INFO', '👤 Test credentials: test@careerforge.com / test123');

    process.exit(0);
  } catch (err) {
    log('ERROR', `Seed failed: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
};

seed();
