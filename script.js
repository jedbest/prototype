function showPage(id,el){
  document.querySelectorAll('.page').forEach(p=>{p.classList.remove('active');p.style.display='none';});
  const t=document.getElementById(id);t.style.display='block';t.classList.add('active');
  if(el){document.querySelectorAll('.bottom-nav button').forEach(b=>b.classList.remove('active'));el.classList.add('active');}
  window.scrollTo(0,0);
}
function selectPlan(card,val){
  document.querySelectorAll('.plan-card').forEach(c=>c.classList.remove('selected'));card.classList.add('selected');
  document.getElementById('planSelect').value=val;updateAmount();showPage('register');
}
function updateAmount(){
  const v=document.getElementById('planSelect').value;
  const m={'Daily Without Coaching':'₦1,500','Daily With Coaching':'₦2,500','Monthly Without Coaching':'₦12,000','Monthly With Coaching':'₦20,000'};
  const el=document.getElementById('showAmount');if(el)el.textContent=m[v]||'Select plan';
}
function togglePay(){
  const isNow=document.querySelector('input[value="now"]').checked;
  document.getElementById('payNowBox').style.display=isNow?'block':'none';
  document.getElementById('cardGym').classList.toggle('active',!isNow);
  document.getElementById('cardNow').classList.toggle('active',isNow);
}
function filePicked(input){
  if(input.files[0]){
    document.getElementById('fileName').textContent='✅ '+input.files[0].name;
    document.getElementById('uploadLabel').innerHTML='✅ Receipt selected<br><small>Tap to change</small>';
  }
}


const SHEET_URL = "PASTE_YOUR_WEB_APP_URL_HERE";

function validateForm(e){
  e.preventDefault();
  const name=document.getElementById('fullName').value.trim();
  const phone=document.getElementById('phone').value.trim();
  const email=document.getElementById('email').value.trim();
  const sess=document.getElementById('session').value;
  const plan=document.getElementById('planSelect').value;
  const goal=document.getElementById('goal').value.trim();
  const isNow=document.querySelector('input[value="now"]').checked;
  const fileInput=document.getElementById('receipt');
  const err=document.getElementById('errorMsg');
  const btn=e.target.querySelector('button[type="submit"]');

  if(!name||!phone||!email||!sess||!plan||!goal){
    err.textContent='⚠️ Fill all fields oo';err.style.display='block';return false;
  }
  if(isNow && fileInput.files.length==0){
    err.textContent='⚠️ Upload receipt for Pay Immediately';err.style.display='block';return false;
  }
  err.style.display='none';
  btn.textContent='SENDING...'; btn.disabled=true;

  function sendData(receiptData){
    fetch(SHEET_URL, { method: "POST", body: JSON.stringify({
      name, phone, email, session:sess, plan, goal,
      payMethod: isNow? 'Pay Immediately' : 'Pay at Gym',
      receipt: receiptData? receiptData.base64 : "",
      receiptName: receiptData? receiptData.name : "",
      receiptType: receiptData? receiptData.type : ""
    })})
   .then(()=>{ localStorage.setItem('payMethod', isNow?'Pay Immediately':'Pay at Gym'); window.location.href='thank-you.html'; })
   .catch(()=>{ err.textContent='⚠️ Network error'; err.style.display='block'; btn.textContent='SUBMIT REGISTRATION'; btn.disabled=false; });
  }

  if(isNow && fileInput.files[0]){
    const reader=new FileReader();
    reader.onload=(ev)=>{ sendData({base64: ev.target.result.split(',')[1], name: fileInput.files[0].name, type: fileInput.files[0].type}); };
    reader.readAsDataURL(fileInput.files[0]);
  } else { sendData(null); }
  return false;
}

function checkOpenStatus(){
  const now=new Date();const h=now.getHours();const d=now.getDay();const b=document.getElementById('openStatus');if(!b)return;
  if(d===0){b.textContent='● CLOSED TODAY';b.className='open-badge closed';return;}
  if((h>=7&&h<11)||(h>=15&&h<20)){b.textContent=h<11?'● OPEN NOW - Morning':'● OPEN NOW - Evening';b.className='open-badge open';}
  else{b.className='open-badge closed';b.textContent=h<7?'● CLOSED - Opens 7AM':h<15?'● CLOSED - Opens 3PM':'● CLOSED - Opens Tomorrow 7AM';}
}
window.addEventListener('load',()=>{checkOpenStatus();setInterval(checkOpenStatus,60000);document.getElementById('planSelect')?.addEventListener('change',updateAmount);});

try {
    const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(data) });
    const result = await res.json();

    if (result.status === 'already_exists') {
      window.location.href = "already-registered.html?phone=" + data.phone;
    } else if (result.status === 'success') {
      window.location.href = "thank-you.html?name=" + encodeURIComponent(data.name) + "&plan=" + data.plan + "&expiry=" + result.expiryDate;
    } else {
      status.innerText = "Error: " + result.message;
      btn.innerText = "REGISTER & PAY";
      btn.disabled = false;
    }
  } catch (err) {
    status.innerText = "Network error, please try again.";
    btn.innerText = "REGISTER & PAY";
    btn.disabled = false;
  }
});