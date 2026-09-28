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
function validateForm(e){
  e.preventDefault();
  const name=document.getElementById('fullName').value.trim();
  const phone=document.getElementById('phone').value.trim();
  const sess=document.getElementById('session').value;
  const plan=document.getElementById('planSelect').value;
  const goal=document.getElementById('goal').value.trim();
  const isNow=document.querySelector('input[value="now"]').checked;
  const hasFile=document.getElementById('receipt').files.length>0;
  const err=document.getElementById('errorMsg');
  if(!name||!phone||!sess||!plan||!goal){
    err.textContent='⚠️ Fill all fields oo - all are required';err.style.display='block';return false;
  }
  if(isNow &&!hasFile){
    err.textContent='⚠️ You chose Pay Immediately - please upload receipt';err.style.display='block';return false;
  }
  err.style.display='none';
  localStorage.setItem('payMethod',isNow?'Pay Immediately':'Pay at Gym');
  localStorage.setItem('plan',plan);
  window.location.href='thank-you.html';
  return false;
}
function checkOpenStatus(){
  const now=new Date();const h=now.getHours();const d=now.getDay();const b=document.getElementById('openStatus');if(!b)return;
  if(d===0){b.textContent='● CLOSED TODAY';b.className='open-badge closed';return;}
  if((h>=7&&h<11)||(h>=15&&h<20)){b.textContent=h<11?'● OPEN NOW - Morning':'● OPEN NOW - Evening';b.className='open-badge open';}
  else{b.className='open-badge closed';b.textContent=h<7?'● CLOSED - Opens 7AM':h<15?'● CLOSED - Opens 3PM':'● CLOSED - Opens Tomorrow 7AM';}
}
window.addEventListener('load',()=>{checkOpenStatus();setInterval(checkOpenStatus,60000);document.getElementById('planSelect')?.addEventListener('change',updateAmount);});