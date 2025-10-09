const API_BASE = '/api';
const state = { token: null, user: null };

function saveAuth(token, user){ state.token = token; state.user = user; localStorage.setItem('token', token||''); localStorage.setItem('user', JSON.stringify(user||null)); renderNav(); }
function loadAuth(){ const t = localStorage.getItem('token'); const u = localStorage.getItem('user'); state.token = t || null; state.user = u ? JSON.parse(u) : null; }
function headers(json=true){ const h = {}; if(json){ h['Content-Type']='application/json'; } if(state.token){ h['Authorization']='Bearer '+state.token; } return h; }

function link(href,label){ const a=document.createElement('a'); a.href=href; a.textContent=label; a.className='navlink'; if(location.hash===href) a.classList.add('active'); a.addEventListener('click', (e)=>{ e.preventDefault(); navigate(href); }); return a; }
function setView(html){ document.getElementById('view').innerHTML = html; }
function renderNav(){ const nav = document.getElementById('nav'); nav.innerHTML=''; if(state.user){ nav.append(
  link('#/dashboard','Dashboard'),
  link('#/medications','Medications'),
  link('#/reminders','Reminders'),
  link('#/caregivers','Caregivers'),
  link('#/profile','Profile'),
  (()=>{ const a=link('#/logout','Logout'); return a; })()
);} else { nav.append(link('#/login','Login'), link('#/register','Register')); } }
function navigate(hash){ location.hash = hash; route(); }

async function api(path, opts={}){ const res = await fetch(API_BASE+path, opts); const data = await res.json().catch(()=>({})); if(!res.ok){ const msg = data?.message || 'Request failed'; throw new Error(msg); } return data; }

function alertEl(type,msg){ return `<div class="alert ${type}">${msg}</div>`; }

// Views
function viewWelcome(){ setView(`
  <div class="container">
    <div class="card">
      <h2>Welcome to MedRoutine</h2>
      <p>Use the navigation to get started.</p>
      <p><span class="kbd">#/register</span> or <span class="kbd">#/login</span></p>
    </div>
  </div>
`); }

function viewLogin(){ setView(`
  <div class="container">
    <div class="card">
      <h2>Login</h2>
      <div id="login_alert"></div>
      <div class="grid">
        <input id="login_email" class="input" placeholder="Email" type="email" />
        <input id="login_password" class="input" placeholder="Password" type="password" />
        <button id="login_btn" class="btn">Login</button>
      </div>
    </div>
  </div>
`);
  document.getElementById('login_btn').onclick = async ()=>{
    try{
      const body = JSON.stringify({ email: document.getElementById('login_email').value, password: document.getElementById('login_password').value });
      const { data } = await api('/auth/login', { method:'POST', headers: headers(), body });
      saveAuth(data.token, data.user);
      navigate('#/dashboard');
    }catch(e){ document.getElementById('login_alert').innerHTML = alertEl('error', e.message); }
  };
}

function viewRegister(){ setView(`
  <div class="container">
    <div class="card">
      <h2>Register</h2>
      <div id="reg_alert"></div>
      <div class="grid">
        <div class="grid cols-2">
          <input id="reg_first" class="input" placeholder="First name" />
          <input id="reg_last" class="input" placeholder="Last name" />
        </div>
        <input id="reg_email" class="input" placeholder="Email" type="email" />
        <input id="reg_phone" class="input" placeholder="Phone (optional)" />
        <input id="reg_password" class="input" placeholder="Password" type="password" />
        <button id="reg_btn" class="btn">Create account</button>
      </div>
    </div>
  </div>
`);
  document.getElementById('reg_btn').onclick = async ()=>{
    try{
      const body = JSON.stringify({ firstName:document.getElementById('reg_first').value, lastName:document.getElementById('reg_last').value, email:document.getElementById('reg_email').value, password:document.getElementById('reg_password').value, phone:document.getElementById('reg_phone').value });
      const { data } = await api('/auth/register', { method:'POST', headers: headers(), body });
      saveAuth(data.token, data.user);
      navigate('#/dashboard');
    }catch(e){ document.getElementById('reg_alert').innerHTML = alertEl('error', e.message); }
  };
}

function guard(){ if(!state.token){ navigate('#/login'); return false; } return true; }

async function viewDashboard(){ if(!guard()) return; const health = await api('/health'); setView(`
  <div class="container">
    <div class="grid cols-3">
      <div class="card"><h3>User</h3><div>${state.user?.firstName||''} ${state.user?.lastName||''}</div><div>${state.user?.email||''}</div></div>
      <div class="card"><h3>Health</h3><div>Status: ${health.status}</div><div>${health.timestamp}</div></div>
      <div class="card"><h3>Quick Actions</h3><button id="qa_new_med" class="btn">Add medication</button></div>
    </div>
  </div>
`);
  document.getElementById('qa_new_med').onclick=()=>navigate('#/medications');
}

async function viewMedications(){ if(!guard()) return; setView(`
  <div class="container">
    <div class="card">
      <h2>Medications</h2>
      <div class="grid cols-3">
        <input id="med_name" class="input" placeholder="Name" />
        <input id="med_amount" class="input" placeholder="Amount (number)" type="number" />
        <select id="med_unit" class="input">
          <option>mg</option><option>ml</option><option>g</option><option>mcg</option><option>units</option><option>drops</option><option>tablets</option><option>capsules</option><option>teaspoons</option><option>tablespoons</option>
        </select>
      </div>
      <div class="grid cols-3">
        <select id="med_freq" class="input">
          <option>once_daily</option><option>twice_daily</option><option>three_times_daily</option><option>four_times_daily</option><option>every_x_hours</option><option>as_needed</option><option>weekly</option><option>monthly</option><option>custom</option>
        </select>
        <input id="med_time" class="input" placeholder="Time HH:MM" />
        <button id="med_create" class="btn">Create</button>
      </div>
    </div>
    <div class="card">
      <h3>Your medications</h3>
      <div id="med_list">Loading...</div>
    </div>
  </div>
`);
  const renderList = async ()=>{
    const { data } = await api('/medications', { headers: headers(false) });
    const rows = data.medications.map(m=>`
      <tr>
        <td>${m.name}</td>
        <td>${m.dosage?.amount||''} ${m.dosage?.unit||''}</td>
        <td>${m.frequency}</td>
        <td>${m.isActive? 'Active':'Inactive'}</td>
        <td>
          <button data-id="${m._id}" class="btn secondary toggle">${m.isActive?'Deactivate':'Activate'}</button>
          <button data-id="${m._id}" class="btn secondary del">Delete</button>
        </td>
      </tr>
    `).join('');
    document.getElementById('med_list').innerHTML = `<table class="table"><tr><th>Name</th><th>Dosage</th><th>Freq</th><th>Status</th><th></th></tr>${rows}</table>`;
    document.querySelectorAll('.toggle').forEach(btn=>btn.onclick=async()=>{ await api(`/medications/${btn.dataset.id}/toggle-active`, { method:'PATCH', headers: headers() }); renderList(); });
    document.querySelectorAll('.del').forEach(btn=>btn.onclick=async()=>{ await api(`/medications/${btn.dataset.id}`, { method:'DELETE', headers: headers() }); renderList(); });
  };
  await renderList();
  document.getElementById('med_create').onclick = async ()=>{
    try{
      const med = {
        name: document.getElementById('med_name').value,
        dosage: { amount: Number(document.getElementById('med_amount').value), unit: document.getElementById('med_unit').value },
        frequency: document.getElementById('med_freq').value,
        schedule: [{ time: document.getElementById('med_time').value, days: ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] }]
      };
      await api('/medications', { method:'POST', headers: headers(), body: JSON.stringify(med) });
      await renderList();
    }catch(e){ alert(e.message); }
  };
}

async function viewReminders(){ if(!guard()) return; setView(`
  <div class="container">
    <div class="card">
      <h2>Reminders</h2>
      <div id="rem_list">Loading...</div>
    </div>
  </div>
`);
  const renderList = async ()=>{
    const { data } = await api('/reminders', { headers: headers(false) });
    const rows = data.reminders.map(r=>`
      <tr>
        <td>${new Date(r.scheduledTime).toLocaleString()}</td>
        <td>${r.medication?.name||''}</td>
        <td>${r.status}</td>
        <td>
          <button data-id="${r._id}" class="btn secondary taken">Taken</button>
          <button data-id="${r._id}" class="btn secondary missed">Missed</button>
          <button data-id="${r._id}" class="btn secondary snooze">Snooze 15m</button>
          <button data-id="${r._id}" class="btn secondary skip">Skip</button>
        </td>
      </tr>
    `).join('');
    document.getElementById('rem_list').innerHTML = `<table class="table"><tr><th>Time</th><th>Medication</th><th>Status</th><th></th></tr>${rows}</table>`;
    document.querySelectorAll('.taken').forEach(b=>b.onclick=async()=>{ await api(`/reminders/${b.dataset.id}/taken`, { method:'PATCH', headers: headers(), body: JSON.stringify({}) }); renderList(); });
    document.querySelectorAll('.missed').forEach(b=>b.onclick=async()=>{ await api(`/reminders/${b.dataset.id}/missed`, { method:'PATCH', headers: headers() }); renderList(); });
    document.querySelectorAll('.snooze').forEach(b=>b.onclick=async()=>{ await api(`/reminders/${b.dataset.id}/snooze`, { method:'PATCH', headers: headers(), body: JSON.stringify({ minutes: 15 }) }); renderList(); });
    document.querySelectorAll('.skip').forEach(b=>b.onclick=async()=>{ await api(`/reminders/${b.dataset.id}/skip`, { method:'PATCH', headers: headers() }); renderList(); });
  };
  await renderList();
}

async function viewProfile(){ if(!guard()) return; setView(`
  <div class="container">
    <div class="card">
      <h2>Profile</h2>
      <div class="grid cols-2">
        <input id="pf_first" class="input" placeholder="First name" value="${state.user?.firstName||''}"/>
        <input id="pf_last" class="input" placeholder="Last name" value="${state.user?.lastName||''}"/>
        <input id="pf_phone" class="input" placeholder="Phone" value="${state.user?.phone||''}"/>
        <input id="pf_tz" class="input" placeholder="Timezone" value="${state.user?.timezone||'UTC'}"/>
      </div>
      <h3>Notification preferences</h3>
      <div>
        <label><input type="checkbox" id="np_email" ${state.user?.notificationPreferences?.email?'checked':''}/> Email</label>
        <label><input type="checkbox" id="np_sms" ${state.user?.notificationPreferences?.sms?'checked':''}/> SMS</label>
        <label><input type="checkbox" id="np_push" ${state.user?.notificationPreferences?.push?'checked':''}/> Push</label>
      </div>
      <div style="margin-top:10px"><button id="pf_save" class="btn">Save</button></div>
    </div>
  </div>
`);
  document.getElementById('pf_save').onclick=async()=>{
    await api('/auth/update-profile', { method:'PUT', headers: headers(), body: JSON.stringify({ firstName:document.getElementById('pf_first').value, lastName:document.getElementById('pf_last').value, phone:document.getElementById('pf_phone').value, timezone:document.getElementById('pf_tz').value, notificationPreferences:{ email:document.getElementById('np_email').checked, sms:document.getElementById('np_sms').checked, push:document.getElementById('np_push').checked } }) });
    const me = await api('/auth/me', { headers: headers(false) });
    saveAuth(state.token, me.data.user);
  };
}

async function viewCaregivers(){ if(!guard()) return; setView(`
  <div class="container">
    <div class="card">
      <h2>Caregivers</h2>
      <div class="grid cols-3">
        <input id="cg_email" class="input" placeholder="Caregiver email" />
        <input id="cg_rel" class="input" placeholder="Relationship" />
        <button id="cg_invite" class="btn">Invite</button>
      </div>
    </div>
    <div class="card">
      <h3>Your caregivers</h3>
      <div id="cg_list">Loading...</div>
    </div>
  </div>
`);
  const renderList = async()=>{
    const { data } = await api('/caregivers', { headers: headers(false) });
    const rows = data.caregivers.map(c=>`
      <tr>
        <td>${c.caregiver?.firstName||''} ${c.caregiver?.lastName||''}</td>
        <td>${c.caregiver?.email||''}</td>
        <td>${c.status}</td>
        <td><button data-id="${c._id}" class="btn secondary revoke">Revoke</button></td>
      </tr>
    `).join('');
    document.getElementById('cg_list').innerHTML = `<table class="table"><tr><th>Name</th><th>Email</th><th>Status</th><th></th></tr>${rows}</table>`;
    document.querySelectorAll('.revoke').forEach(b=>b.onclick=async()=>{ await api(`/caregivers/${b.dataset.id}/revoke`, { method:'PATCH', headers: headers() }); renderList(); });
  };
  await renderList();
  document.getElementById('cg_invite').onclick=async()=>{
    try{
      await api('/caregivers/invite', { method:'POST', headers: headers(), body: JSON.stringify({ email: document.getElementById('cg_email').value, relationship: document.getElementById('cg_rel').value, permissions: { viewMedications:true, viewReminders:true } }) });
      await renderList();
    }catch(e){ alert(e.message); }
  };
}

function viewLogout(){ saveAuth(null,null); navigate('#/'); }

function route(){ renderNav(); const r = location.hash.replace('#',''); switch(r){
  case '/login': return viewLogin();
  case '/register': return viewRegister();
  case '/dashboard': return viewDashboard();
  case '/medications': return viewMedications();
  case '/reminders': return viewReminders();
  case '/caregivers': return viewCaregivers();
  case '/profile': return viewProfile();
  case '/logout': return viewLogout();
  case '/': case '': return state.user? viewDashboard(): viewWelcome();
  default: return setView('<div class="container"><div class="card">Not found</div></div>');
}}

(function init(){
  document.getElementById('year').textContent = new Date().getFullYear();
  loadAuth();
  window.addEventListener('hashchange', route);
  renderNav();
  route();
})();
