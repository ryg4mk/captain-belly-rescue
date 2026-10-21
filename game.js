'use strict';
(() => {
 const $=id=>document.getElementById(id), clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const stage=$('stage'), arm=$('captainArm'), joy=$('joystick'), knob=$('joyKnob'), scrim=$('scrim'), canvas=$('effects'),ctx=canvas.getContext('2d');
 const painNum=$('painNum'), painFill=$('painFill'),painTrack=$('painTrack'),timeNum=$('timeNum'),scoreNum=$('scoreNum'),bestNum=$('bestNum');
 const title=$('dialogTitle'),body=$('dialogBody'),emblem=$('dialogEmblem'),kicker=$('dialogKicker'),ruleChips=$('ruleChips'),resultStats=$('resultStats'),mainButton=$('mainButton'),foot=$('dialogFoot');
 const soundButton=$('soundButton'),pauseButton=$('pauseButton'),speechText=$('speechText'),photoWarmth=$('photoWarmth'),comboEl=$('combo'),floatingMessage=$('floatingMessage'),instructionDetail=$('instructionDetail');
 const DURATION=60,STORAGE='captainBellyArmBestV2';
 let state='ready',pain=72,seconds=DURATION,score=0,best=0,mute=false,combo=0,elapsed=0,still=0,healProgress=0,lastSpeech=0,lastFrame=0,frame=0,audio=null;
 let hand={x:.795,y:.58},prev={x:.795,y:.58},input={x:0,y:0},joyTouch=null,keys=new Set(),goodTime=0,particles=[],notificationTime=0;
 const talk={start:['fpandaさん、わしがついておる！','落ち着け、ゆっくりさすろう。'],care:['うむ、やさしい動きじゃ！','おお、痛みが引いてきたぞ。','いいぞ、その調子じゃ！'],idle:['手を止めず、やさしくじゃ！','痛みが戻る前に、さすろう。'],win:['よかった！ fpandaさんは助かったぞ！'],lose:['もう一度、わしと救助に挑もう。']};
 try{best=Number(localStorage.getItem(STORAGE)||0)||0;mute=localStorage.getItem('captainBellyMuted')==='1'}catch{}
 soundButton.setAttribute('aria-pressed',String(!mute));bestNum.textContent=String(best).padStart(4,'0');
 function say(group){const a=talk[group];speechText.textContent=a[Math.floor(Math.random()*a.length)];lastSpeech=elapsed;}
 function sound(kind){if(mute)return;try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;if(!audio)audio=new C();if(audio.state==='suspended')audio.resume().catch(()=>{});
   const notes=kind==='heal'?[[450,0,.09],[650,.1,.16]]:kind==='win'?[[420,0,.2],[580,.16,.2],[760,.3,.24],[990,.49,.35]]:[[220,0,.14]];
   notes.forEach(([f,offset,d])=>{let o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime+offset;o.type=kind==='fail'?'triangle':'sine';o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.06,t+.018);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+d+.02)});
  }catch{}}
 const buzz=ms=>{try{navigator.vibrate?.(ms)}catch{}};
 function display(){const p=Math.round(clamp(pain,0,100));painNum.innerHTML=p+'<span>%</span>';painFill.style.width=p+'%';painTrack.setAttribute('aria-valuenow',String(p));timeNum.textContent=String(Math.ceil(seconds)).padStart(2,'0');scoreNum.textContent=String(Math.round(score)).padStart(4,'0');photoWarmth.style.opacity=String(clamp((72-pain)/120,0,.6));comboEl.textContent=combo>=2?'やさしさ COMBO ×'+combo:'';comboEl.classList.toggle('active',combo>=2)}
 function showMessage(message,x=.80,y=.32){floatingMessage.style.left=x*100+'%';floatingMessage.style.top=y*100+'%';floatingMessage.textContent=message;floatingMessage.classList.remove('show');void floatingMessage.offsetHeight;floatingMessage.classList.add('show');notificationTime=elapsed}
 // Isolated sprite has no visible pixels to the left or right of the viewport when moved.
 // Target anchor is the middle of the hand, near its palm rather than fingertips.
 function placeHand(){const w=1.04,h=w*stage.clientWidth/2/stage.clientHeight;
   const left=hand.x-w*.755,top=hand.y-h*.495;
   arm.style.left=(left*100)+'%';arm.style.top=(top*100)+'%';
   const swing=clamp((hand.y-.58)*17,-4,5);
   arm.style.transform=`rotate(${swing}deg)`;
 }
 function inBelly(x,y){const dx=(x-.765)/.31,dy=(y-.52)/.38;return dx*dx+dy*dy<=1.03 && x>.59 && y>.12 && y<.85}
 function sparkle(x,y){for(let i=0;i<3;i++){let a=Math.random()*Math.PI*2,spd=.04+Math.random()*.035;particles.push({x,y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd-.02,life:.65,max:.65});}if(particles.length>85)particles.splice(0,particles.length-85)}
 function effects(dt){const w=stage.clientWidth,h=stage.clientHeight;ctx.clearRect(0,0,w,h);particles=particles.filter(p=>{p.life-=dt;if(p.life<=0)return false;p.x+=p.vx*dt;p.y+=p.vy*dt;ctx.beginPath();ctx.fillStyle=`rgba(217,251,207,${p.life/p.max*.78})`;ctx.arc(p.x*w,p.y*h,2.5*p.life/p.max+1,0,Math.PI*2);ctx.fill();return true})}
 function setDialog(which,oldBest=0){if(which==='pause'){emblem.textContent='⚓';kicker.textContent='PAUSED';title.textContent='救助を一時停止中';body.innerHTML='艦長はここで待っておるぞ。<br>準備ができたら再開しよう。';foot.textContent='時間は止まっています。';mainButton.innerHTML='救助を再開 <span>→</span>';ruleChips.hidden=true;resultStats.hidden=true;}
 else{const win=which==='win';emblem.textContent=win?'✦':'⚓';kicker.textContent=win?'MISSION COMPLETE':'MISSION RETRY';title.textContent=win?'fpandaさん、回復成功！':'fpandaさんの腹痛が…';body.innerHTML=win?'「よくやった！ おぬしのおかげじゃ！」<br>艦長もほっとひと安心。':'「すまん、もう一度頼む！」<br>スティックを往復させて、優しくさすろう。';foot.textContent=win?'見事な救助じゃ！':'スティックを動かし続けると回復するぞ。';ruleChips.hidden=true;resultStats.hidden=false;resultStats.innerHTML=`<div><small>今回のスコア</small><strong>${Math.round(score)}</strong></div><div><small>${score>oldBest?'NEW BEST!':'BEST SCORE'}</small><strong class="newbest">${best}</strong></div>`;mainButton.innerHTML='もう一度助ける <span>→</span>';}
 scrim.hidden=false;mainButton.focus({preventScroll:true});}
 function finish(win){if(state!=='playing')return;state=win?'won':'lost';cancelAnimationFrame(frame);pauseButton.disabled=true;joyTouch=null;setJoy(0,0);if(win){pain=0;score+=Math.ceil(seconds)*18;say('win');sound('win');buzz([25,50,50])}else{say('lose');sound('fail')}let oldBest=best;if(score>best){best=Math.round(score);try{localStorage.setItem(STORAGE,String(best))}catch{}}bestNum.textContent=String(best).padStart(4,'0');display();setDialog(win?'win':'lost',oldBest)}
 function reset(){state='playing';pain=72;seconds=DURATION;score=0;combo=0;elapsed=0;still=0;healProgress=0;lastSpeech=0;lastFrame=0;goodTime=0;particles=[];notificationTime=0;hand={x:.795,y:.58};prev={...hand};keys.clear();joyTouch=null;setJoy(0,0);placeHand();instructionDetail.textContent='スティックを往復させて、やさしくさすろう';pauseButton.disabled=false;scrim.hidden=true;say('start');display();cancelAnimationFrame(frame);frame=requestAnimationFrame(loop)}
 function pause(){if(state!=='playing')return;state='paused';joyTouch=null;setJoy(0,0);pauseButton.disabled=true;cancelAnimationFrame(frame);setDialog('pause')}
 function resume(){if(state!=='paused')return;state='playing';scrim.hidden=true;pauseButton.disabled=false;lastFrame=0;frame=requestAnimationFrame(loop)}
 // Virtual analog joystick: actual cursor/thumb displacement determines movement velocity.
 function setJoy(x,y){input.x=clamp(x,-1,1);input.y=clamp(y,-1,1);knob.style.setProperty('--joy-x',`${input.x*24}px`);knob.style.setProperty('--joy-y',`${input.y*24}px`)}
 function joyPos(e){const r=joy.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let x=(e.clientX-cx)/(r.width*.34),y=(e.clientY-cy)/(r.height*.34),m=Math.hypot(x,y);if(m>1){x/=m;y/=m}setJoy(x,y)}
 joy.addEventListener('pointerdown',e=>{if(state!=='playing'||joyTouch!==null)return;e.preventDefault();joyTouch=e.pointerId;try{joy.setPointerCapture(e.pointerId)}catch{}joyPos(e)});
 joy.addEventListener('pointermove',e=>{if(e.pointerId!==joyTouch)return;e.preventDefault();joyPos(e)});
 function upJoy(e){if(e.pointerId!==joyTouch)return;joyTouch=null;setJoy(0,0)}
 joy.addEventListener('pointerup',upJoy);joy.addEventListener('pointercancel',upJoy);joy.addEventListener('lostpointercapture',()=>{joyTouch=null;setJoy(0,0)});
 joy.addEventListener('contextmenu',e=>e.preventDefault());
 const moveKeys=new Set(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD']);
 document.addEventListener('keydown',e=>{if(moveKeys.has(e.code)){if(state==='playing'){e.preventDefault();keys.add(e.code)}return}if((e.code==='Escape'||e.code==='Space')&&state==='playing'){e.preventDefault();pause()}else if((e.code==='Enter'||e.code==='Space')&&state==='paused'){e.preventDefault();resume()}else if((e.code==='Enter'||e.code==='Space')&&(state==='ready'||state==='won'||state==='lost')){if(e.target!==mainButton){e.preventDefault();reset()}}});
 document.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>keys.clear());
 function controls(){let x=input.x,y=input.y;if(keys.has('ArrowLeft')||keys.has('KeyA'))x-=1;if(keys.has('ArrowRight')||keys.has('KeyD'))x+=1;if(keys.has('ArrowUp')||keys.has('KeyW'))y-=1;if(keys.has('ArrowDown')||keys.has('KeyS'))y+=1;
 try{const pads=navigator.getGamepads?.();const pad=pads&&Array.from(pads).find(Boolean);if(pad){const dead=a=>Math.abs(a)>.16?a:0;x+=dead(pad.axes[0]||0);y+=dead(pad.axes[1]||0);if(pad.buttons[14]?.pressed)x-=1;if(pad.buttons[15]?.pressed)x+=1;if(pad.buttons[12]?.pressed)y-=1;if(pad.buttons[13]?.pressed)y+=1;}}catch{}
 const m=Math.hypot(x,y);if(m>1){x/=m;y/=m}return {x,y,m:Math.min(1,m)};}
 function loop(t){if(state!=='playing')return;let dt=lastFrame?clamp((t-lastFrame)/1000,0,.05):0;lastFrame=t;elapsed+=dt;seconds=Math.max(0,DURATION-elapsed);if(!seconds){finish(false);return}
   const v=controls();prev={...hand};const speed=.235;hand.x=clamp(hand.x+v.x*speed*dt,.61,.925);hand.y=clamp(hand.y+v.y*speed*dt,.20,.80);const dist=Math.hypot((hand.x-prev.x)*1.2,hand.y-prev.y);const active=dist>.00015&&inBelly(hand.x,hand.y);
   if(active){still=0;healProgress+=dt;goodTime+=dt;pain=clamp(pain-(3.2+Math.min(combo,.7))*(.6+.4*v.m)*dt,0,100);score+=Math.round(24*dt+dist*550);if(Math.random()<dt*13)sparkle(hand.x+.015,hand.y+.08);
     if(healProgress>2.6){healProgress=0;combo=Math.min(8,combo+1);if(combo%2===0){showMessage('いいぞ！',hand.x,hand.y-.10);sound('heal');buzz(12);say('care')}}
   }else{still+=dt;healProgress=Math.max(0,healProgress-dt*.1);pain=clamp(pain+dt*(still>3?.52:.23),0,100);if(still>5&&elapsed-lastSpeech>8)say('idle')}
   if(pain<=0){finish(true);return}if(pain>=100){finish(false);return}
   if(elapsed-lastSpeech>10)say(active?'care':'idle');if(elapsed-notificationTime>1.2)floatingMessage.classList.remove('show');placeHand();effects(dt);display();frame=requestAnimationFrame(loop)
 }
 function resize(){let r=stage.getBoundingClientRect(),d=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(r.width*d);canvas.height=Math.round(r.height*d);ctx.setTransform(d,0,0,d,0,0);placeHand()}
 if('ResizeObserver'in window)new ResizeObserver(resize).observe(stage);else window.addEventListener('resize',resize);
 pauseButton.addEventListener('click',pause);mainButton.addEventListener('click',()=>{if(state==='paused')resume();else reset()});
 soundButton.addEventListener('click',()=>{mute=!mute;soundButton.setAttribute('aria-pressed',String(!mute));try{localStorage.setItem('captainBellyMuted',mute?'1':'0')}catch{}if(!mute)sound('heal')});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing')pause()});document.addEventListener('dragstart',e=>e.preventDefault());
 resize();display();
})();