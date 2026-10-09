const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxJu69LzD43DvMcqaYm7U8GvlmRorUkrqhj0IDfsx-X2JXQZSVpsUgf63PJIwf87EK4/exec";
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
    'Monthly Without Coaching':'₦12,000',
    'Monthly With Coaching':'₦20,000'
  };
  const el=document.getElementById('showAmount');if(el)el.textContent=m[v]||'Select plan';
}

function getExpiry(plan){
  const d = new Date();
  const p = plan.toLowerCase();
  if(p.includes("daily") || p.includes("day")) d.setDate(d.getDate()+1);
  else if(p.includes("weekly")) d.setDate(d.getDate()+7);
  else if(p.includes("quarterly")) d.setMonth(d.getMonth()+3);
  else if(p.includes("yearly")) d.setFullYear(d.getFullYear()+1);
  else d.setMonth(d.getMonth()+1);
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

async function validateForm(e){
  e.preventDefault();
  const name=document.getElementById('fullName').value.trim();
  const phone=document.getElementById('phone').value.trim();
  const sess=document.getElementById('session').value;
  const plan=document.getElementById('planSelect').value;
  const goal=document.getElementById('goal').value.trim();
  const email = document.getElementById('email')?.value.trim() || "";

  const payRadio = document.querySelector('input[name="pay"]:checked') || document.querySelector('input[value="now"]') || document.querySelector('input[type="radio"]:checked');
  const isNow = payRadio? (payRadio.value.toLowerCase().includes('now') || payRadio.value.toLowerCase().includes('immediate')) : false;

  const payMethod = isNow?'Pay Immediately':'Pay at Gym';
  const receiptInput = document.getElementById('receipt');
  const receiptFile = receiptInput? receiptInput.files[0] : null;
  const err=document.getElementById('errorMsg');
  const submitBtn = e.target.querySelector('button[type="submit"]');

  if(!name||!phone||!sess||!plan||!goal){
    err.textContent='⚠️ Fill all fields oo - all are required';err.style.display='block';return false;
  }
  if(isNow &&!receiptFile){
    err.textContent='⚠️ You chose Pay Immediately - please upload receipt';err.style.display='block';return false;
  }
  err.style.display='none';
  submitBtn.innerText = "Checking...";
  submitBtn.disabled = true;

  try{
    // === 1. FAST CHECK ALREADY REGISTERED ===
    const checkRes = await fetch(SCRIPT_URL + "?phone=" + cleanPhone(phone) + "&t=" + Date.now(), { cache: "no-store" });
    const members = await checkRes.json();
    const existing = members[0];

    if(existing){
      const alreadySec = document.getElementById('alreadyRegistered');
      if(alreadySec){
        document.getElementById('dupPhone').innerText = existing.phone;
        document.getElementById('dupName').innerText = existing.name;
        document.getElementById('dupPlan').innerText = existing.plan;
        const exp = existing.expiryDate || existing.expiry || '';
        document.getElementById('dupExpiry').innerText = exp;
        const expD = parseDateCheck(exp);
        const isExp = expD? expD < new Date().setHours(0,0,0,0) : false;
        document.getElementById('dupStatus').innerText = isExp? "🔴 Expired - Please Renew" : "🟢 Active";
        document.querySelectorAll('.page, section').forEach(p=> p.style.display='none');
        alreadySec.style.display='block';
        document.querySelectorAll('.bottom-nav button').forEach(b=> b.classList.remove('active'));
        window.scrollTo(0,0);
      } else {
        err.textContent = `⚠️ Phone ${existing.phone} already registered as ${existing.name}. Expires: ${existing.expiryDate||existing.expiry}`;
        err.style.display='block';
      }
      submitBtn.innerText = "SUBMIT REGISTRATION";
      submitBtn.disabled = false;
      return false;
    }

    // === 2. IF NOT EXISTING, CONTINUE ===
    submitBtn.innerText = "Processing...";
    let price = 1500;
    if(plan === 'Daily With Coaching') price = 2500;
    if(plan === 'Monthly Without Coaching') price = 12000;
    if(plan === 'Monthly With Coaching') price = 20000;
    if(!isNow){ price = 0; }

    const expiryDate = getExpiry(plan);
    let receiptObj = null;
    if(isNow && receiptFile){
      const base64 = await getBase64(receiptFile);
      receiptObj = { name: receiptFile.name, mime: receiptFile.type, data: base64 };
    }

    const data = {
      name: name, phone: phone, email: email || `${cleanPhone(phone)}@ironcity.com`,
      session: sess, plan: plan, goal: goal, payMethod: payMethod,
      price: price, amount: price, expiry: expiryDate, receipt: receiptObj
    };

    await fetch(SCRIPT_URL, { method: "POST", mode: "no-cors", body: JSON.stringify(data) });
    localStorage.setItem('payMethod', payMethod);
    localStorage.setItem('plan', plan);
    localStorage.setItem('memberName', name);
    localStorage.setItem('memberExpiry', expiryDate);
    window.location.href = `thank_you.html?name=${encodeURIComponent(name)}&plan=${encodeURIComponent(plan)}&expiry=${encodeURIComponent(expiryDate)}`;

  } catch(err2){
    console.error(err2);
    err.textContent = '⚠️ Network error. Check internet and try again. '+err2.message;
    err.style.display='block';
    submitBtn.innerText = "SUBMIT REGISTRATION";
    submitBtn.disabled = false;
  }
  return false;
}

document.addEventListener('DOMContentLoaded', ()=>{
  document.querySelectorAll('input[name="pay"], input[type="radio"]').forEach(r=>{
    r.addEventListener('change', ()=>{
      const receiptDiv = document.getElementById('receiptDiv') || document.getElementById('receipt')?.parentElement;
      if(!receiptDiv) return;
      const checked = document.querySelector('input[name="pay"]:checked') || r;
      const show = checked.value.toLowerCase().includes('now') || checked.value.toLowerCase().includes('immediate');
      receiptDiv.style.display = show? 'block' : 'none';
    });
  });
});

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