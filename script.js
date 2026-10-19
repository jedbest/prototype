// script.js//

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxXzLASwZrrU3uwd_KIz-hk4TkinqfwGpOUrkL6J2oufiEWx7UQjNJ5FR431eq5QlWcJw/exec";
const cleanPhone = (p) => String(p).replace(/[^0-9]/g,'').slice(-10);

function updateOpenStatus(){
  const el = document.getElementById('openStatus') || document.getElementById('status') || document.querySelector('.open-status');
  if(!el) return;
  const now = new Date();
  const hour = now.getHours();
  const min = now.getMinutes();
  const time = hour + min/60;
  const isOpen = (time >= 7 && time < 11) || (time >= 15 && time < 19);
  if(isOpen){
    el.innerHTML = "🟢 Open Now - Closes 7PM";
    el.style.color = "#a6ff00";
  } else {
    let next = "";
    if(time < 7) next = "Opens 7AM today";
    else if(time < 15) next = "Opens 3PM today";
    else next = "Opens 7AM tomorrow";
    el.innerHTML = `🔴 Closed - ${next}`;
    el.style.color = "red";
  }
}
updateOpenStatus();
setInterval(updateOpenStatus, 60000);

function showPage(pageId, el){
  document.querySelectorAll('.page, section').forEach(p=> p.style.display='none');
  const target = document.getElementById(pageId);
  if(target) target.style.display='block';
  document.querySelectorAll('.bottom-nav button').forEach(b=> b.classList.remove('active'));
  if(el){
    el.classList.add('active');
  } else {
    document.querySelectorAll('.bottom-nav button').forEach(b=>{
      if(b.getAttribute('onclick') && b.getAttribute('onclick').includes(`'${pageId}'`)){
        b.classList.add('active');
      }
    });
  }
  window.scrollTo(0,0);
}

function selectPlan(card,val){
  document.querySelectorAll('.plan-card').forEach(c=>c.classList.remove('selected'));
  card.classList.add('selected');
  document.getElementById('planSelect').value=val;
  updateAmount();
  showPage('register');
}

function updateAmount(){
  const v=document.getElementById('planSelect').value;
  const m={
    'Daily Without Coaching':'₦1,500',
    'Daily With Coaching':'₦2,500',
    'Weekly Without Coaching':'₦7,000',
    'Weekly With Coaching':'₦10,000',
    '2 Weeks Without Coaching':'₦12,000',
    '2 Weeks With Coaching':'₦16,000',
    'Monthly Without Coaching':'₦12,000',
    'Monthly With Coaching':'₦20,000'
  };
  const el=document.getElementById('showAmount');if(el)el.textContent=m[v]||'Select plan';
}

function getDaysFromPlan(plan){
  const p = plan.toLowerCase();
  if(p.includes("daily")) return 1;
  if(p.includes("weekly") &&!p.includes("2")) return 7;
  if(p.includes("2 week") || p.includes("2weeks") || p.includes("two week")) return 14;
  if(p.includes("monthly") || p.includes("month")) return 30;
  if(p.includes("quarterly")) return 90;
  if(p.includes("yearly")) return 365;
  return 30;
}

function getExpiry(plan, fromDate = new Date()){
  const d = new Date(fromDate);
  d.setDate(d.getDate() + getDaysFromPlan(plan));
  return d.toISOString().split('T')[0];
}

function parseDateCheck(s){
  if(!s) return null;
  const str = String(s).trim();
  if(str.includes('T') || str.match(/^\d{4}-\d{2}-\d{2}/)){
    const d = new Date(str); return isNaN(d)?null:d;
  }
  if(str.includes('/')){
    const p=str.split('/');
    if(p.length===3){
      const d=new Date(parseInt(p[2]),parseInt(p[1])-1,parseInt(p[0]));
      return isNaN(d)?null:d;
    }
  }
  const d=new Date(str); return isNaN(d)?null:d;
}

function profilePicked(input){
  const el=document.getElementById('profileName');
  const label=document.getElementById('profileLabel');
  if(el && input.files[0]){
    el.textContent = "✅ " + input.files[0].name;
    if(input.files[0].type.startsWith('image/')){
      const reader = new FileReader();
      reader.onload = e => {
        label.innerHTML = `<img src="${e.target.result}" style="width:60px;height:60px;border-radius:50%;object-fit:cover;border:2px solid #a6ff00"><br>✅ Photo selected`;
        localStorage.setItem('tempProfilePic', e.target.result);
      };
      reader.readAsDataURL(input.files[0]);
    }
  }
}

async function validateForm(e){
  e.preventDefault();
  const name=document.getElementById('fullName').value.trim();
  const phone=document.getElementById('phone').value.trim();
  const sess=document.getElementById('session').value;
  const plan=document.getElementById('planSelect').value;
  const goal=document.getElementById('goal').value.trim();
  const email = document.getElementById('email')?.value.trim() || "";
  const profileInput = document.getElementById('profilePic');
  const profileFile = profileInput? profileInput.files[0] : null;

  const payRadio = document.querySelector('input[name="pay"]:checked');
  const isNow = payRadio? payRadio.value === 'now' : false;

  const payMethod = isNow?'Pay Immediately':'Pay at Gym';
  const receiptInput = document.getElementById('receipt');
  const receiptFile = receiptInput? receiptInput.files[0] : null;
  const err=document.getElementById('errorMsg');
  const submitBtn = e.target.querySelector('button[type="submit"]');

  if(!name||!phone||!sess||!plan||!goal){
    err.textContent='⚠️ Fill all fields oo - all are required';err.style.display='block';return false;
  }
  if(!profileFile &&!localStorage.getItem('tempProfilePic')){
    err.textContent='⚠️ Please upload your face photo for ID card';err.style.display='block';return false;
  }
  if(isNow &&!receiptFile){
    err.textContent='⚠️ You chose Pay Immediately - please upload receipt';err.style.display='block';return false;
  }
  err.style.display='none';
  submitBtn.innerText = "Checking...";
  submitBtn.disabled = true;

  try{
    // === 1. CHECK EXISTING FOR EXTEND LOGIC ===
    const checkRes = await fetch(SCRIPT_URL + "?phone=" + cleanPhone(phone) + "&t=" + Date.now(), { cache: "no-store" });
    const members = await checkRes.json();
    const existing = members[0];

    let expiryDate = "";
    let isTopUp = false;

     if(existing){
      const exp = existing.expiryDate || existing.expiry || '';
      const expD = parseDateCheck(exp);
      const today = new Date(); today.setHours(0,0,0,0);

      if(expD && expD >= today){
        // ACTIVE - EXTEND, NOT BLOCK
        isTopUp = true;
        expiryDate = getExpiry(plan, expD);
        submitBtn.innerText = "Extending...";
      } else {
        // EXPIRED - new expiry from today
        expiryDate = getExpiry(plan, new Date());
      }
    } else {
      expiryDate = getExpiry(plan, new Date());
    }

    // === 2. CONTINUE REGISTRATION ===
    submitBtn.innerText = isTopUp? "Extending plan..." : "Processing...";
    let price = 1500;
    if(plan === 'Daily Without Coaching') price = 1500;
    if(plan === 'Daily With Coaching') price = 2500;
    if(plan === 'Weekly Without Coaching') price = 7000;
    if(plan === 'Weekly With Coaching') price = 10000;
    if(plan === '2 Weeks Without Coaching') price = 12000;
    if(plan === '2 Weeks With Coaching') price = 16000;
    if(plan === 'Monthly Without Coaching') price = 12000;
    if(plan === 'Monthly With Coaching') price = 20000;
    if(!isNow){ price = 0; }

    let receiptObj = null;
    if(isNow && receiptFile){
      const base64 = await getBase64(receiptFile);
      receiptObj = { name: receiptFile.name, mime: receiptFile.type, data: base64 };
    }

    let profileObj = null;
    if(profileFile){
      const base64P = await getBase64(profileFile);
      profileObj = { name: profileFile.name, mime: profileFile.type, data: base64P };
    }

    const data = {
      name: name, phone: phone, email: email || `${cleanPhone(phone)}@ironcity.com`,
      session: sess, plan: plan, goal: goal, payMethod: payMethod,
      price: price, amount: price, expiry: expiryDate, receipt: receiptObj,
      profilePic: profileObj,
      isTopUp: isTopUp
    };

    await fetch(SCRIPT_URL, { method: "POST", mode: "no-cors", body: JSON.stringify(data) });
    localStorage.setItem('payMethod', payMethod);
    localStorage.setItem('plan', plan);
    localStorage.setItem('memberName', name);
    localStorage.setItem('memberPhone', phone);
    localStorage.setItem('memberExpiry', expiryDate);
    // profile pic already in tempProfilePic for card page
   window.location.href = `thank_you.html?name=${encodeURIComponent(name)}&plan=${encodeURIComponent(plan)}&expiry=${encodeURIComponent(expiryDate)}&phone=${encodeURIComponent(phone)}&payMethod=${encodeURIComponent(payMethod)}&isTopUp=${isTopUp}`;

  } catch(err2){
    console.error(err2);
    err.textContent = '⚠️ Network error. Check internet and try again. '+err2.message;
    err.style.display='block';
    submitBtn.innerText = "SUBMIT REGISTRATION";
    submitBtn.disabled = false;
  }
  return false;
}

function togglePay(){
  const isNow = document.querySelector('input[name="pay"][value="now"]')?.checked;
  const box = document.getElementById('payNowBox');
  if(box) box.style.display = isNow? 'block' : 'none';
  document.getElementById('cardNow')?.classList.toggle('active', isNow);
  document.getElementById('cardGym')?.classList.toggle('active',!isNow);
}

function filePicked(input){
  const el=document.getElementById('fileName');
  if(el && input.files[0]) el.textContent = "✅ " + input.files[0].name;
}

function getBase64(file){
  return new Promise((resolve, reject)=>{
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = ()=> resolve(reader.result.split(',')[1]);
    reader.onerror = e=> reject(e);
  });
}