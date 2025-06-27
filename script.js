const canvas        = document.getElementById('wheelCanvas');
const ctx           = canvas.getContext('2d');
const itemsInput    = document.getElementById('itemsInput');
const spinBtn       = document.getElementById('spinBtn');
const modal         = document.getElementById('resultModal');
const selectedItemP = document.getElementById('selectedItem');
const removeBtn     = document.getElementById('removeAndSpin');
const anotherBtn    = document.getElementById('justSpin');
const closeBtn      = document.getElementById('closeModal');

// novos objetos de áudio
const tickSound = document.getElementById('tickSound');
const winSound  = document.getElementById('winSound');

const palette = ['#6a0dad', '#000000', '#4b0082'];
let items = [], startAngle = 0, currentIdx = null, selectedIdx = null;

window.addEventListener('load', () => {
  const saved = localStorage.getItem('erroletaItems');
  if (saved) {
    items = JSON.parse(saved);
    itemsInput.value = items.join('\n');
  }
  updateWheel();
});

itemsInput.addEventListener('input', () => {
  const raw = itemsInput.value.trim();
  items = raw
    ? raw.split(/[\n,]+/).map(i=>i.trim()).filter(i=>i)
    : [];
  localStorage.setItem('erroletaItems', JSON.stringify(items));
  updateWheel();
});

function updateWheel() {
  currentIdx = null;
  spinBtn.disabled = !items.length;
  if (items.length) drawWheel();
  else ctx.clearRect(0,0,canvas.width,canvas.height);
}

function drawWheel() {
  const len = items.length, arc = 2*Math.PI/len;
  const cx = canvas.width/2, cy = canvas.height/2, r = Math.min(cx,cy)-20;

  // gera cores sem repeats adjacentes
  const sliceColors = Array.from({length:len},(_,i)=>palette[i%palette.length]);
  if(len>1 && sliceColors[len-1]===sliceColors[0]){
    for(const c of palette){
      if(c!==sliceColors[len-2] && c!==sliceColors[0]){
        sliceColors[len-1]=c; break;
      }
    }
  }

  ctx.clearRect(0,0,canvas.width,canvas.height);
  items.forEach((item,i)=>{
    const ang = startAngle + i*arc;
    // fill
    ctx.fillStyle = sliceColors[i];
    ctx.beginPath();
    ctx.moveTo(cx,cy);
    ctx.arc(cx,cy,r,ang,ang+arc);
    ctx.closePath();
    ctx.fill();
    // border vermelho no selecionado
    if(i===currentIdx){
      ctx.beginPath();
      ctx.moveTo(cx,cy);
      ctx.arc(cx,cy,r,ang,ang+arc);
      ctx.closePath();
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#e60000';
      ctx.stroke();
    }
    // texto
    ctx.save();
    ctx.translate(cx,cy);
    ctx.rotate(ang + arc/2);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(item, r-10,5);
    ctx.restore();
  });
}

// funções de tocar áudio
function playTick(){
  tickSound.currentTime = 0;
  tickSound.play();
}
function playWin(){
  winSound.currentTime = 0;
  winSound.play();
}

// spin
spinBtn.addEventListener('click', ()=>{
  if(!items.length) return;
  const arc = 2*Math.PI/items.length;
  const initNorm = ((startAngle%(2*Math.PI))+2*Math.PI)%(2*Math.PI);

  selectedIdx = Math.floor(Math.random()*items.length);
  const mid = selectedIdx*arc + arc/2;
  const pAngle = 3*Math.PI/2; // seta pra baixo
  const want = ((pAngle-mid)%(2*Math.PI)+2*Math.PI)%(2*Math.PI);
  const delta = ((want - initNorm)%(2*Math.PI)+2*Math.PI)%(2*Math.PI);

  const spins = Math.floor(Math.random()*2)+6;
  const target = startAngle + spins*2*Math.PI + delta;
  const dur = 4000 + Math.random()*1000;
  const t0 = performance.now(), init = startAngle;

  playTick();

  function anim(now){
    const e = now - t0;
    let t = Math.min(e/dur,1);
    const ease = (--t)*t*t+1;
    startAngle = init + (target-init)*ease;
    drawWheel();
    if(e<dur) requestAnimationFrame(anim);
    else finish();
  }
  requestAnimationFrame(anim);
});

function finish(){
  currentIdx = selectedIdx;
  drawWheel();
  selectedItemP.textContent = items[currentIdx];
  modal.style.display = 'flex';
  playWin();
  const h = JSON.parse(localStorage.getItem('erroletaHistory')||'[]');
  h.push({item:items[currentIdx],time:Date.now()});
  localStorage.setItem('erroletaHistory',JSON.stringify(h));
}

removeBtn.addEventListener('click', ()=>{
  const sel = selectedItemP.textContent;
  items = items.filter(i=>i!==sel);
  itemsInput.value = items.join('\n');
  localStorage.setItem('erroletaItems',JSON.stringify(items));
  modal.style.display='none';
  updateWheel();
  if(items.length) spinBtn.click();
});

anotherBtn.addEventListener('click', ()=>{
  modal.style.display='none';
  currentIdx = null;
  drawWheel();
  spinBtn.click();
});

closeBtn.addEventListener('click', ()=>{
  modal.style.display='none';
});
