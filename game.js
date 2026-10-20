'use strict';
(() => {
 const $ = (id) => document.getElementById(id);
 const stage=$('stage'), layer=$('acheLayer'), canvas=$('effects'), ctx=canvas.getContext('2d');
 const scrim=$('scrim'), title=$('dialogTitle'), body=$('dialogBody'), emblem=$('dialogEmblem'), kicker=$('dialogKicker'), ruleChips=$('ruleChips'), resultStats=$('resultStats'), mainButton=$('mainButton'), foot=$('dialogFoot');
 const painNum=$('painNum'), painFill=$('painFill'), painTrack=$('painTrack'), timeNum=$('timeNum'), scoreNum=$('scoreNum'), bestNum=$('bestNum'), speechText=$('speechText'), instructionTitle=$('instructionTitle'), instructionDetail=$('instructionDetail'), photoWarmth=$('photoWarmth'), comboEl=$('combo'), stageHint=$('stageHint'), floatingMessage=$('floatingMessage'), pauseButton=$('pauseButton'), soundButton=$('soundButton');
 const DURATION=60;
 const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
 const random=(lo,hi)=>lo+Math.random()*(hi-lo);
 let state='ready',pain=72,seconds=DURATION,score=0,best=0,mute=false,combo=0,roughs=0,totalRub=0,spots=[],particles=[],rings=[];
 let elapsed=0,lastFrame=0,lastCare=0,lastSpeech=0,lastWarning=-10,lastSpawn=0,drag=null,frameId=0,clockStamp=0,firstMove=false,badTimer=0;
 let audio=null;
 try{best=Number(localStorage.getItem('captainBellyBest')||0)||0;mute=localStorage.getItem('captainBellyMuted')==='1'}catch{}
 soundButton.setAttribute('aria-pressed',String(!mute));bestNum.textContent=String(best).padStart(4,'0');
 const speechLines={start:['安心しろ。わしがついている。','痛むところを、そっとな。'],care:['その調子じゃ。ゆっくり、ゆっくり。','よし……ほぐれてきたぞ。','船の揺れと同じじゃ。焦らずにな。','うむ、上手だ。ありがたいぞ。'],warning:['こらこら！ もう少し優しくじゃ！','急いではいかん、痛みが戻るぞ。'],close:['あと少しじゃ！ 痛みを追い払うぞ！','もうひと息……その調子じゃ！'],win:['ふう……助かったぞ！ 見事な手当てじゃ！'],lose:['くっ、いかん……もう一度頼めるか。']};
 const activeTalk=(type)=>{const a=speechLines[type];speechText.textContent=a[Math.floor(Math.random()*a.length)];lastSpeech=elapsed;};
 const point=(e)=>{const r=stage.getBoundingClientRect();return {x:clamp((e.clientX-r.left)/r.width,0,1),y:clamp((e.clientY-r.top)/r.height,0,1),w:r.width}};
 const inBelly=(x,y)=>{const dx=(x-.795)/.337,dy=(y-.50)/.48;return dx*dx+dy*dy<1.02 && x>.53 && y>.11 && y<.89;};
 const positions=[{x:.79,y:.32},{x:.87,y:.68},{x:.66,y:.29},{x:.88,y:.42},{x:.76,y:.76},{x:.72,y:.19},{x:.91,y:.55},{x:.68,y:.57}];
 function createSpot(index){
   const used=spots.map(s=>s.pos);
   const opts=positions.map((p,i)=>({p,i,dist:used.reduce((min,up)=>Math.min(min,Math.hypot(p.x-up.x,p.y-up.y)),10)})).filter(o=>o.dist>.20);
   const chosen=(Number.isInteger(index)&&positions[index])?{p:positions[index],i:index}:opts.length?opts[Math.floor(Math.random()*opts.length)]:positions.map((p,i)=>({p,i,dist:Math.min(...used.map(up=>Math.hypot(p.x-up.x,p.y-up.y)),9)})).sort((a,b)=>b.dist-a.dist)[0];
   const el=document.createElement('div');el.className='ache';el.innerHTML='<span class="flare"></span><span class="achelabel">いたた…</span>';
   const s={x:chosen.p.x,y:chosen.p.y,pos:chosen.p,element:el,health:100,rad:.088,age:0,id:Math.random(),label:'いたた…'};
   el.style.left=(s.x*100)+'%';el.style.top=(s.y*100)+'%';layer.append(el);spots.push(s);updateSpotSize(s);return s;
 }
 function updateSpotSize(s){s.element.style.setProperty('--r',Math.round(stage.clientWidth*s.rad)+'px');}
 const nearest=(x,y)=>{
   let picked=null,dist=1e9;
   spots.forEach(s=>{const d=Math.hypot((x-s.x)*1.05,y-s.y);if(d<dist){dist=d;picked=s;}});
   return picked&&dist<picked.rad*1.3?picked:null;
 };
 const hud=()=>{
  const p=Math.round(clamp(pain,0,100));painNum.innerHTML=p+'<span>%</span>';painFill.style.width=p+'%';painTrack.setAttribute('aria-valuenow',String(p));painTrack.classList.toggle('full',p>=92);
  timeNum.textContent=String(Math.ceil(seconds)).padStart(2,'0');scoreNum.textContent=String(Math.round(score)).padStart(4,'0');comboEl.textContent=combo>=2?'SOFT COMBO  ×'+combo:'';comboEl.classList.toggle('active',combo>=2);
  photoWarmth.style.opacity=String(clamp(1-pain/88,0,.65));
 };
 function unlockSound(){if(mute)return;try{const A=window.AudioContext||window.webkitAudioContext;if(A&&!audio){audio=new A();}if(audio&&audio.state==='suspended')audio.resume().catch(()=>{});}catch{}}
 function sound(type){if(mute)return;unlockSound();if(!audio)return;try{
   const now=audio.currentTime;
   const notes=type==='heal'?[[520,.04,.13],[720,.12,.18]]:type==='win'?[[520,0,.18],[660,.15,.2],[800,.3,.29],[1050,.52,.48]]:type==='rough'?[[150,0,.16],[113,.11,.2]]:[[370,0,.09]];
   notes.forEach(([f,offset,dur])=>{const o=audio.createOscillator(),g=audio.createGain();o.type=type==='rough'?'triangle':'sine';o.frequency.setValueAtTime(f,now+offset);if(type==='heal')o.frequency.exponentialRampToValueAtTime(f*1.08,now+offset+dur);g.gain.setValueAtTime(.0001,now+offset);g.gain.exponentialRampToValueAtTime(type==='rough'?.12:.06,now+offset+.015);g.gain.exponentialRampToValueAtTime(.0001,now+offset+dur);o.connect(g);g.connect(audio.destination);o.start(now+offset);o.stop(now+offset+dur+.025);});
 }catch{}}
 function vibration(pattern){try{if('vibrate'in navigator)navigator.vibrate(pattern)}catch{}}
 function splash(x,y,good=true,amount=3){
   const count=Math.min(amount,12);for(let i=0;i<count;i++){const a=random(0,Math.PI*2),v=random(.022,.062);particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-.035,life:random(.4,.75),max:.75,r:random(1.6,3.8),good});}
   if(particles.length>110)particles.splice(0,particles.length-110);
 }
 function ring(x,y,good=true){rings.push({x,y,r:0,life:.65,max:.65,good});if(rings.length>16)rings.shift()}
 let msgTimer=0;
 function floatMessage(s,warning=false,x=.78,y=.28){floatingMessage.style.left=x*100+'%';floatingMessage.style.top=y*100+'%';floatingMessage.textContent=s;floatingMessage.classList.remove('show','warning');void floatingMessage.offsetHeight;floatingMessage.classList.add('show');if(warning)floatingMessage.classList.add('warning');clearTimeout(msgTimer);msgTimer=setTimeout(()=>floatingMessage.classList.remove('show'),970);}
 function finish(won){if(state!=='playing')return;state=won?'won':'lost';pauseButton.disabled=true;drag=null;canvas.style.opacity='1';
   if(won){score+=Math.ceil(seconds)*15;activeTalk('win');sound('win');vibration([35,45,35,45,90]);pain=0;} else{activeTalk('lose');sound('rough');}
   hud();const oldBest=best;if(score>best){best=Math.round(score);try{localStorage.setItem('captainBellyBest',String(best))}catch{}}bestNum.textContent=String(best).padStart(4,'0');
   openDialog(won?'win':'lost',oldBest);
 }
 function openDialog(kind,oldBest){
    if(kind==='pause'){emblem.textContent='⚓';kicker.textContent='ANCHORED FOR A MOMENT';title.innerHTML='ちょっと休憩';body.innerHTML='艦長はここで待っているぞ。<br>準備ができたら再開しよう。';mainButton.innerHTML='救助を再開する <span>→</span>';foot.textContent='時間は一時停止しています。';ruleChips.hidden=true;resultStats.hidden=true;}
    else if(kind==='win'){
      emblem.textContent='✦';kicker.textContent='MISSION COMPLETE';title.innerHTML='腹痛、無事に回復！';body.innerHTML='「ありがとう、助かったぞ！」<br>艦長もほっと一安心。見事な救助じゃ！';mainButton.innerHTML='もう一度、助ける <span>→</span>';foot.textContent='やさしさこそ、最高の救命術。';ruleChips.hidden=true;resultStats.hidden=false;resultStats.innerHTML='<div><small>今回のスコア</small><strong>'+Math.round(score)+'</strong></div><div><small>'+(score>oldBest?'NEW BEST!':'BEST SCORE')+'</small><strong class="newbest">'+best+'</strong></div>';}
    else if(kind==='lost'){
      emblem.textContent='⚓';kicker.textContent='MISSION RETRY';title.innerHTML=seconds<=0?'時間切れじゃ…':'腹痛が強くなった…';body.innerHTML='「心配はいらん。今度こそ頼むぞ！」<br>赤いモヤをゆっくり、一定の速さでなでよう。';mainButton.innerHTML='もう一度チャレンジ <span>→</span>';foot.textContent='強くこすりすぎないのがコツ。';ruleChips.hidden=true;resultStats.hidden=false;resultStats.innerHTML='<div><small>今回のスコア</small><strong>'+Math.round(score)+'</strong></div><div><small>BEST SCORE</small><strong>'+best+'</strong></div>';}
    scrim.hidden=false;
    mainButton.focus({preventScroll:true});
 }
 function reset(){
   state='playing';pain=72;seconds=DURATION;score=0;combo=0;roughs=0;totalRub=0;elapsed=0;lastFrame=0;clockStamp=0;lastCare=0;lastSpeech=0;lastWarning=-10;lastSpawn=0;drag=null;firstMove=false;badTimer=0;
   spots.forEach(s=>s.element.remove());spots=[];particles=[];rings=[];
   createSpot(0);createSpot(1);createSpot(2);
   stageHint.hidden=false;stageHint.innerHTML='<span class="finger">◌</span> 赤いモヤをゆっくりなでよう';
   instructionTitle.textContent='指を離さず、やさしく動かそう';instructionDetail.textContent='赤いモヤに沿って円を描くと、どんどん回復！';
   pauseButton.disabled=false;pauseButton.querySelector('span').textContent='停止';
   scrim.hidden=true;activeTalk('start');hud();
   cancelAnimationFrame(frameId);frameId=requestAnimationFrame(loop);
 }
 function clearSpot(s){
   if(!spots.includes(s))return;
   spots.splice(spots.indexOf(s),1);s.element.classList.add('shrink');setTimeout(()=>s.element.remove(),420);
   pain=clamp(pain-7.5,0,100);score+=150+Math.floor(combo*15);combo=Math.min(8,combo+1);
   splash(s.x,s.y,true,12);ring(s.x,s.y,true);floatMessage('痛みがほぐれた！',false,s.x,s.y-.075);sound('heal');vibration(22);
   if(pain<=.8){finish(true);return;}setTimeout(()=>{if(state==='playing'&&spots.length<3)createSpot()},420);
 }
 function rub(prev,p,dt){
   if(state!=='playing')return;
   let dx=(p.x-prev.x)*1.25,dy=(p.y-prev.y)*1.25;
   const d=Math.hypot(dx,dy),world=d*640;
   if(!Number.isFinite(world)||dt<=0||world<1.3||world>360)return;
   const speed=world/dt;
   if(!inBelly(p.x,p.y)){
      if(elapsed-lastCare>3)stageHint.innerHTML='おなかをなでてね';return;
   }
   if(speed>1500){
      if(elapsed-lastWarning>.76){lastWarning=elapsed;badTimer=.34;roughs++;pain=clamp(pain+3.8,0,100);combo=0;splash(p.x,p.y,false,6);ring(p.x,p.y,false);floatMessage('つよすぎ！',true,p.x,p.y-.08);stage.classList.remove('is-rough');void stage.offsetWidth;stage.classList.add('is-rough');sound('rough');vibration(40);activeTalk('warning');if(pain>=99.9)finish(false);}
      return;
   }
   const s=nearest(p.x,p.y),gentle=speed<940?1:clamp(1-(speed-940)/1000,.45,1);
   let relief=world*(s?.075:.027)*gentle;
   if(s){s.health-=world*.21*gentle;s.element.style.setProperty('--strength',String(clamp(s.health/100,.17,1)));s.element.querySelector('.achelabel').textContent=s.health<36?'ほぐれてる！':'いたた…';}
   pain=clamp(pain-relief,0,100);score+=world*(s?2.4:1.05)*gentle;totalRub+=world;lastCare=elapsed;
   if(!firstMove){firstMove=true;stageHint.hidden=true;instructionTitle.textContent='その調子！ 円を描くように';instructionDetail.textContent='痛い場所ほど、回復スピードUP';}
   const density=s?2:1;
   if(Math.random()<Math.min(.83,.23+world*.014))splash(p.x,p.y,true,density);
   if(Math.random()<.075&&s)ring(p.x,p.y,true);
   if(s&&s.health<=0)clearSpot(s);
   if(pain<=.8){finish(true);return;}
 }
 function pointerDown(e){if(state!=='playing')return;if(e.button!==undefined&&e.button!==0)return;unlockSound();e.preventDefault();try{stage.setPointerCapture(e.pointerId)}catch{}
   drag={id:e.pointerId,p:point(e),t:performance.now(),started:false};
 }
 function pointerMove(e){if(state!=='playing'||!drag||e.pointerId!==drag.id)return;e.preventDefault();const p=point(e),now=performance.now(),dt=clamp((now-drag.t)/1000,.008,.15);if(!drag.started){drag.started=true;drag.p=p;drag.t=now;return;}rub(drag.p,p,dt);if(drag&&drag.id===e.pointerId){drag.p=p;drag.t=now;}}
 function pointerUp(e){if(!drag||e.pointerId!==drag.id)return;drag=null;}
 stage.addEventListener('pointerdown',pointerDown,{passive:false});stage.addEventListener('pointermove',pointerMove,{passive:false});stage.addEventListener('pointerup',pointerUp);stage.addEventListener('pointercancel',pointerUp);stage.addEventListener('lostpointercapture',()=>drag=null);
 stage.addEventListener('contextmenu',e=>e.preventDefault());
 function resize(){const r=stage.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);spots.forEach(updateSpotSize);}
 if(typeof ResizeObserver!=='undefined'){new ResizeObserver(resize).observe(stage)}else window.addEventListener('resize',resize);resize();
 function draw(dt){const w=stage.clientWidth,h=stage.clientHeight;ctx.clearRect(0,0,w,h);
   particles=particles.filter(p=>{p.life-=dt;if(p.life<=0)return false;p.x+=p.vx*dt;p.y+=p.vy*dt;const alpha=clamp(p.life/p.max,0,1);ctx.fillStyle=p.good?'rgba(211,255,224,'+(alpha*.87)+')':'rgba(255,125,144,'+(alpha*.85)+')';ctx.beginPath();ctx.arc(p.x*w,p.y*h,p.r*alpha,0,2*Math.PI);ctx.fill();return true;});
   rings=rings.filter(p=>{p.life-=dt;if(p.life<=0)return false;const progress=1-p.life/p.max;ctx.beginPath();ctx.arc(p.x*w,p.y*h,(8+progress*55)*(w/750),0,2*Math.PI);ctx.strokeStyle=p.good?'rgba(180,247,221,'+(p.life/p.max*.6)+')':'rgba(255,120,130,'+(p.life/p.max*.65)+')';ctx.lineWidth=2;ctx.stroke();return true;});
 }
 function loop(ts){if(state!=='playing')return;let dt=lastFrame?clamp((ts-lastFrame)/1000,0,.067):0;lastFrame=ts;
   elapsed+=dt;seconds=Math.max(0,DURATION-elapsed);
   if(seconds<=0){finish(false);return;}
   pain=clamp(pain+dt*(.49+elapsed/DURATION*.1),0,100);
   if(elapsed-lastCare>7&&elapsed-lastSpawn>7){lastSpawn=elapsed;pain=clamp(pain+3.0,0,100);if(spots.length<3)createSpot();if(elapsed-lastWarning>2){activeTalk('warning');floatMessage('おなかが痛む…',true,.82,.29)}}
   spots.forEach(s=>{s.age+=dt;s.health=clamp(s.health+dt*.45,0,100);s.element.style.setProperty('--strength',String(clamp(s.health/100,.35,1)))});
   if(pain>=99.9){finish(false);return;}
   if(elapsed-lastSpeech>7){if(pain<26)activeTalk('close');else if(lastCare>elapsed-4)activeTalk('care');else activeTalk('start');}
   if(combo>0&&elapsed-lastCare>3.5)combo=0;
   if(badTimer>0){badTimer-=dt;if(badTimer<=0)stage.classList.remove('is-rough');}
   hud();draw(dt);frameId=requestAnimationFrame(loop);
 }
 function pause(){if(state!=='playing')return;state='paused';drag=null;pauseButton.disabled=true;cancelAnimationFrame(frameId);openDialog('pause');}
 function resume(){if(state!=='paused')return;state='playing';scrim.hidden=true;pauseButton.disabled=false;lastFrame=0;frameId=requestAnimationFrame(loop)}
 pauseButton.addEventListener('click',pause);
 mainButton.addEventListener('click',()=>{unlockSound();if(state==='paused')resume();else reset()});
 soundButton.addEventListener('click',()=>{mute=!mute;soundButton.setAttribute('aria-pressed',String(!mute));try{localStorage.setItem('captainBellyMuted',mute?'1':'0')}catch{}if(!mute){unlockSound();sound('heal')}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing')pause()});
 document.addEventListener('keydown',e=>{if((e.code==='Space'||e.code==='Escape')&&state==='playing'){e.preventDefault();pause()}else if((e.code==='Space'||e.code==='Enter')&&state==='paused'){e.preventDefault();resume()}});
 document.addEventListener('dragstart',e=>e.preventDefault());
 hud();
})();
