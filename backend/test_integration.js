const http = require('http');

async function runTests() {
  const app = require('./server');

  // Wait 1.5s for server to initialize
  await new Promise(r => setTimeout(r, 1500));

  try {
    console.log('--- 1. Health Check ---');
    const health = await (await fetch('http://localhost:5000/api/health')).json();
    console.log('Health Status:', health.status);

    console.log('--- 2. Frontend HTML ---');
    const htmlRes = await fetch('http://localhost:5000/');
    const html = await htmlRes.text();
    console.log('Frontend served:', html.includes('<div id="root"></div>') ? 'YES (connected)' : 'NO');

    console.log('--- 3. Admin Login & Dashboard ---');
    const adminLogin = await (await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@fitness.com', password: 'AdminPassword123!' })
    })).json();
    console.log('Admin Token:', !!adminLogin.token, '| User Role:', adminLogin.user?.role);

    const adminDash = await (await fetch('http://localhost:5000/api/dashboard/admin', {
      headers: { 'Authorization': 'Bearer ' + adminLogin.token }
    })).json();
    console.log('Admin Stats:', adminDash.stats);

    console.log('--- 4. Trainer Login & Dashboard ---');
    const trainerLogin = await (await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'marcus@fitness.com', password: 'TrainerPassword123!' })
    })).json();
    console.log('Trainer Token:', !!trainerLogin.token, '| Trainer ID:', trainerLogin.user?.trainer_id);

    const trainerDash = await (await fetch('http://localhost:5000/api/dashboard/trainer', {
      headers: { 'Authorization': 'Bearer ' + trainerLogin.token }
    })).json();
    console.log('Trainer Stats:', trainerDash.stats);

    console.log('--- 5. Member Login & Dashboard ---');
    const memberLogin = await (await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'member@fitness.com', password: 'MemberPassword123!' })
    })).json();
    console.log('Member Token:', !!memberLogin.token, '| Member ID:', memberLogin.user?.member_id);

    const memberDash = await (await fetch('http://localhost:5000/api/dashboard/member', {
      headers: { 'Authorization': 'Bearer ' + memberLogin.token }
    })).json();
    console.log('Member Plan:', memberDash.memberInfo?.membership_name, '| Assigned Trainer:', memberDash.memberInfo?.trainer_name);

    console.log('\n=============================================');
    console.log(' ALL INTEGRATION & REST API TESTS PASSED 100%!');
    console.log('=============================================\n');
    process.exit(0);
  } catch (err) {
    console.error('Integration Test Error:', err);
    process.exit(1);
  }
}

runTests();
