(() => {
  'use strict';

  const gs = window.gsap;
  if (gs && window.MotionPathPlugin) gs.registerPlugin(MotionPathPlugin);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isFinePointer = window.matchMedia('(pointer:fine)').matches;
  const scenes = [...document.querySelectorAll('.scene')];
  const progress = document.getElementById('storyProgress');
  const chapterLabel = document.getElementById('chapterLabel');
  const chapterCount = document.getElementById('chapterCount');
  const soundToggle = document.getElementById('soundToggle');
  const cursor = document.querySelector('.cursor-rose');
  const storyGuide = document.getElementById('storyGuide');
  const transitionBloom = document.getElementById('transitionBloom');
  let current = 0;
  let audioOn = false;
  let audioCtx = null;
  let ambientMaster = null;
  let heartbeatTimer = null;
  let detailsOpened = 0;
  let easterClicks = 0;
  let easterFound = false;
  let galleryTapped = false;
  let eyeUnlocked = false;
  const startedAt = Date.now();

  const details = {
    personality: {
      overline: '01 — personalidade',
      title: 'A sua personalidade.',
      text: 'Você tem opinião, presença e uma inteligência que aparece sem precisar anunciar que está ali. Isso me chama atenção de verdade — talvez até mais do que eu deveria admitir tão cedo.'
    },
    smile: {
      overline: '02 — sorriso',
      title: 'O seu sorriso.',
      text: 'Ele tem um defeito técnico considerável: rouba a cena. Quando aparece, fica meio impossível fingir que eu não reparei. Reclamações serão encaminhadas ao setor responsável.'
    },
    voice: {
      overline: '03 — voz',
      title: 'A sua voz.',
      text: 'Ela também ficou na memória. E junto com os seus traços tão marcantes, dá aquela sensação de que alguém gastou tempo demais cuidando dos detalhes.'
    }
  };

  function sceneProgress(index){ return (index / (scenes.length - 1)) * 100; }
  function updateChrome(index){
    const s = scenes[index];
    chapterLabel.textContent = s.dataset.label || '';
    chapterCount.textContent = `${String(index + 1).padStart(2,'0')} / ${String(scenes.length).padStart(2,'0')}`;
    document.body.dataset.scene = String(index);
    if(gs && !reduceMotion) gs.to(progress,{width:`${sceneProgress(index)}%`,duration:.8,ease:'power3.out'});
    else progress.style.width = `${sceneProgress(index)}%`;
    updateGuide(index);
  }

  function updateGuide(index){
    if(!storyGuide) return;
    if(index < 2 || index > 7){
      if(gs) gs.to(storyGuide,{autoAlpha:0,duration:.35}); else storyGuide.style.opacity=0;
      return;
    }
    const pos = [50,50,46,54,43,58,50,50,50][index] || 50;
    const tint = index === 5 ? '#e6bf74' : '#ff507d';
    if(gs && !reduceMotion){
      gs.to(storyGuide,{autoAlpha:.72,top:`${pos}%`,duration:.9,ease:'power3.inOut'});
      gs.to('.guide-heart',{color:tint,duration:.6});
    } else storyGuide.style.opacity=.72;
  }

  function splitChars(el){
    if(!el || el.dataset.split) return [...(el?.querySelectorAll('.char') || [])];
    const nodes = [...el.childNodes]; el.innerHTML='';
    nodes.forEach(node=>{
      if(node.nodeType===Node.TEXT_NODE){
        [...node.textContent].forEach(ch=>{const span=document.createElement('span');span.className='char';span.textContent=ch===' '?'\u00A0':ch;span.style.display='inline-block';el.appendChild(span)});
      } else { const clone=node.cloneNode(true); clone.classList.add('inline-clone'); el.appendChild(clone); }
    });
    el.dataset.split='1'; return [...el.querySelectorAll('.char')];
  }

  function next(){ goTo(current + 1); }
  document.querySelectorAll('[data-next]').forEach(btn=>btn.addEventListener('click',next));

  function bloomTransition(done, direction=1){
    if(!gs || reduceMotion){ done(); return; }
    const origin = direction > 0 ? {x:'50%',y:'55%'} : {x:'50%',y:'45%'};
    gs.set(transitionBloom,{left:origin.x,top:origin.y,scale:0,autoAlpha:0});
    whoosh();
    const coverScale = Math.max(90, Math.ceil(Math.hypot(innerWidth, innerHeight) / 10));
    gs.timeline({onComplete:done})
      .to(transitionBloom,{autoAlpha:1,scale:coverScale*.72,duration:.58,ease:'power3.in'})
      .to(transitionBloom,{scale:coverScale,duration:.2,ease:'power1.in'});
  }

  function finishBloom(){
    if(!gs || reduceMotion) return;
    const exitScale = Math.max(105, Math.ceil(Math.hypot(innerWidth, innerHeight) / 8));
    gs.to(transitionBloom,{scale:exitScale,autoAlpha:0,duration:.7,ease:'power3.out',onComplete:()=>gs.set(transitionBloom,{scale:0})});
  }

  function goTo(index){
    if(index < 0 || index >= scenes.length || index === current) return;
    const old = scenes[current], nextScene = scenes[index], dir=index>current?1:-1;
    bloomTransition(()=>{
      old.classList.remove('is-active'); old.style.opacity=''; old.style.transform='';
      current=index; nextScene.classList.add('is-active'); updateChrome(index); animateScene(index); finishBloom(); softChime(index%3);
    },dir);
  }

  function animateScene(index){
    const s=scenes[index]; if(!gs || reduceMotion){s.style.opacity=1; if(index===7) revealPrefinalStatic(); if(index===8) openCurtains(); return;}
    gs.set(s,{opacity:1});
    if(index===1){gs.timeline().fromTo('.glass-letter',{y:40,opacity:0,scale:.96,filter:'blur(12px)'},{y:0,opacity:1,scale:1,filter:'blur(0)',duration:1,ease:'power4.out'}).fromTo('.wax-seal',{scale:0,rotation:-28,opacity:0},{scale:1,rotation:-7,opacity:1,duration:.75,ease:'back.out(1.9)'},'-.45').fromTo('.risk-lines p',{x:-18,opacity:0},{x:0,opacity:1,duration:.5,stagger:.11,ease:'power2.out'},'-.3')}
    if(index===2) animateHeartScene();
    if(index===3) animateEyesScene();
    if(index===4) animateOrbitScene();
    if(index===5) animateGallery();
    if(index===6){gs.timeline().fromTo('.honest-copy>*',{y:24,opacity:0,filter:'blur(7px)'},{y:0,opacity:1,filter:'blur(0)',duration:.75,stagger:.12,ease:'power3.out'}).fromTo('.honest-lines i',{scaleX:0},{scaleX:1,duration:1.2,stagger:.12,ease:'power3.inOut'},'<')}
    if(index===7) animatePrefinal();
    if(index===8) openCurtains();
  }

  function intro(){
    updateChrome(0); if(!gs || reduceMotion) return;
    const first=[...document.querySelectorAll('[data-kinetic]')]; const mobile=window.matchMedia('(max-width:820px)').matches;
    gs.set(first,{opacity:0}); gs.set('#openExperience',{opacity:0,y:14,scale:.96}); gs.set('.spark-core',{opacity:0,scale:.35});
    gs.to('.spark-core',{rotation:360,duration:10,ease:'none',repeat:-1}); gs.to('.intro-glow',{scale:1.16,opacity:.76,duration:4.4,yoyo:true,repeat:-1,ease:'sine.inOut'});
    const tl=gs.timeline({delay:mobile?.08:.18}); tl.to('.spark-core',{scale:1,opacity:1,duration:mobile?.55:.9,ease:'power3.out'});
    if(mobile){tl.fromTo(first[0],{y:22,opacity:0,filter:'blur(7px)',scale:.985},{y:0,opacity:1,filter:'blur(0)',scale:1,duration:.62,ease:'power3.out'},'-=.28').fromTo(first[1],{y:16,opacity:0,filter:'blur(5px)'},{y:0,opacity:1,filter:'blur(0)',duration:.52,ease:'power3.out'},'-=.18').fromTo(first[2],{y:12,opacity:0,filter:'blur(4px)'},{y:0,opacity:1,filter:'blur(0)',duration:.46,ease:'power3.out'},'-=.12')}
    else{tl.to(first[0],{opacity:1,duration:.01},'-=.38').fromTo(splitChars(first[0]),{y:28,opacity:0,filter:'blur(6px)'},{y:0,opacity:1,filter:'blur(0)',duration:.62,stagger:.011,ease:'power3.out'},'<').fromTo(first[1],{y:20,opacity:0,filter:'blur(7px)'},{y:0,opacity:1,filter:'blur(0)',duration:.72,ease:'power3.out'},'-=.08').fromTo(first[2],{y:15,opacity:0,filter:'blur(5px)'},{y:0,opacity:1,filter:'blur(0)',duration:.6,ease:'power3.out'},'-=.04')}
    tl.to('#openExperience',{y:0,opacity:1,scale:1,duration:.52,ease:'back.out(1.45)'},'-=.12');
    setTimeout(()=>{if(current!==0)return;gs.set(first,{opacity:1,filter:'none',y:0,scale:1});gs.set('#openExperience',{opacity:1,y:0,scale:1})},2600);
  }

  document.getElementById('openExperience').addEventListener('click',()=>{enableAudio();goTo(1)});

  function animateHeartScene(){
    const path=document.getElementById('heartPath'); if(!path)return; const len=path.getTotalLength(); gs.set(path,{strokeDasharray:len,strokeDashoffset:len});
    gs.timeline().fromTo('.heart-halo',{scale:.5,opacity:0},{scale:1,opacity:1,duration:1.4,ease:'power2.out'}).to(path,{strokeDashoffset:0,duration:2,ease:'power2.inOut'},'<').fromTo('.heart-copy>*',{y:22,opacity:0,filter:'blur(6px)'},{y:0,opacity:1,filter:'blur(0)',duration:.7,stagger:.14,ease:'power3.out'},'-=.95');
    gs.to('.heartbeat-dot',{scale:2.8,opacity:0,duration:1.4,repeat:-1,ease:'power1.out'}); gs.to('.big-heart',{scale:1.035,duration:.82,yoyo:true,repeat:-1,ease:'sine.inOut'});
  }

  function animateEyesScene(){
    gs.timeline().fromTo('.eyes-copy>*',{y:18,opacity:0,filter:'blur(8px)'},{y:0,opacity:1,filter:'blur(0)',duration:.7,stagger:.13,ease:'power3.out'}).fromTo('.iris',{scale:.55,opacity:0,filter:'blur(16px)'},{scale:1,opacity:1,filter:'blur(0)',duration:1.15,stagger:.12,ease:'power4.out'},'-.25').fromTo('.eye-interaction',{y:18,opacity:0},{y:0,opacity:1,duration:.65,ease:'power3.out'},'-.35');
    gs.to('.iris i',{x:8,y:-5,duration:2.4,yoyo:true,repeat:-1,ease:'sine.inOut'});
  }

  const eyeInteraction=document.getElementById('eyeInteraction'); const eyeSpark=document.getElementById('eyeSpark'); const eyeTrack=document.getElementById('eyeTrack'); const eyeFill=document.getElementById('eyeTrackFill'); const eyeFallback=document.getElementById('eyeFallback');
  let dragging=false,startX=0,startLeft=0;
  function sparkMax(){return Math.max(0,eyeTrack.clientWidth-eyeSpark.offsetWidth-14)}
  function moveSpark(px){const max=sparkMax();const x=Math.max(7,Math.min(max+7,px));eyeSpark.style.left=`${x}px`;const pct=Math.max(0,Math.min(1,(x-7)/max));eyeFill.style.width=`${pct*100}%`;if(pct>.84)unlockEyes()}
  eyeSpark.addEventListener('pointerdown',e=>{if(eyeUnlocked)return;dragging=true;eyeSpark.setPointerCapture?.(e.pointerId);startX=e.clientX;startLeft=parseFloat(getComputedStyle(eyeSpark).left)||7;navigator.vibrate?.(8)});
  eyeSpark.addEventListener('pointermove',e=>{if(!dragging||eyeUnlocked)return;moveSpark(startLeft+(e.clientX-startX))});
  ['pointerup','pointercancel'].forEach(evt=>eyeSpark.addEventListener(evt,e=>{if(!dragging)return;dragging=false;eyeSpark.releasePointerCapture?.(e.pointerId);if(!eyeUnlocked&&gs)gs.to(eyeSpark,{left:7,duration:.45,ease:'power3.out',onUpdate:()=>{const x=parseFloat(getComputedStyle(eyeSpark).left)||7;eyeFill.style.width=`${Math.max(0,(x-7)/sparkMax())*100}%`}})}));
  eyeFallback.addEventListener('click',unlockEyes);
  function unlockEyes(){
    if(eyeUnlocked)return; eyeUnlocked=true; document.querySelector('.scene-eyes').classList.add('is-revealed'); softChime(2); crystal();
    if(gs&&!reduceMotion){gs.to(eyeSpark,{left:sparkMax()+7,duration:.3,ease:'power2.out'});gs.to(eyeFill,{width:'100%',duration:.3});gs.timeline().to(eyeInteraction,{autoAlpha:0,y:10,duration:.38}).to('.iris-pair',{top:window.matchMedia('(max-width:820px)').matches?'33%':'38%',scale:.74,opacity:.5,duration:.75,ease:'power3.inOut'},'<').fromTo('#eyesReveal',{autoAlpha:0,y:22,filter:'blur(8px)'},{autoAlpha:1,y:0,filter:'blur(0)',duration:.75,ease:'power3.out'},'-.2')} else {document.getElementById('eyesReveal').style.opacity=1;document.getElementById('eyesReveal').style.visibility='visible'}
  }

  function animateOrbitScene(){
    gs.timeline().fromTo('.orbit-title>*',{y:20,opacity:0},{y:0,opacity:1,duration:.65,stagger:.1,ease:'power3.out'}).fromTo('.orbit-ring',{scale:.6,opacity:0},{scale:1,opacity:1,duration:1.2,stagger:.14,ease:'power3.out'},'-.4').fromTo('.orbit-center',{scale:.4,opacity:0},{scale:1,opacity:1,duration:.85,ease:'back.out(1.8)'},'-.7').fromTo('.orbit-node',{scale:.45,opacity:0},{scale:1,opacity:1,duration:.65,stagger:.1,ease:'back.out(1.7)'},'-.5');
    gs.to('.ring-a',{rotation:360,duration:42,repeat:-1,ease:'none'});gs.to('.ring-b',{rotation:-360,duration:65,repeat:-1,ease:'none'});gs.to('.orbit-node',{y:'-=8',duration:2.2,stagger:{each:.3,yoyo:true,repeat:-1},ease:'sine.inOut'});
  }

  const detailFloat=document.getElementById('detailFloat'),detailOverline=document.getElementById('detailOverline'),detailTitle=document.getElementById('detailTitle'),detailText=document.getElementById('detailText'); const detailNodes=[...document.querySelectorAll('[data-detail]')]; const seen=new Set();
  detailNodes.forEach(node=>node.addEventListener('click',()=>{const key=node.dataset.detail,data=details[key];detailOverline.textContent=data.overline;detailTitle.textContent=data.title;detailText.textContent=data.text;if(!seen.has(key))detailsOpened++;seen.add(key);node.classList.add('is-seen');if(gs&&!reduceMotion)gs.fromTo(detailFloat,{autoAlpha:0,y:25,scale:.97},{autoAlpha:1,y:0,scale:1,duration:.5,ease:'power3.out'});else{detailFloat.style.opacity=1;detailFloat.style.visibility='visible'}softChime((seen.size+1)%3);if(seen.size===3){const complete=document.getElementById('orbitComplete');if(gs&&!reduceMotion)gs.to(complete,{autoAlpha:1,y:0,duration:.65,delay:.25,ease:'power3.out'});else{complete.style.opacity=1;complete.style.visibility='visible'}}}));
  document.getElementById('detailClose').addEventListener('click',()=>{if(gs&&!reduceMotion)gs.to(detailFloat,{autoAlpha:0,y:20,scale:.98,duration:.35,ease:'power2.in'});else{detailFloat.style.opacity=0;detailFloat.style.visibility='hidden'}});

  const easterHeart=document.getElementById('easterHeart'),easterNote=document.getElementById('easterNote');
  easterHeart.addEventListener('click',()=>{easterClicks++;if(gs&&!reduceMotion)gs.fromTo('.mini-heart',{scale:.72},{scale:1.25,duration:.18,yoyo:true,repeat:1,ease:'power2.out'});if(easterClicks>=5&&!easterFound){easterFound=true;softChime(1);if(gs&&!reduceMotion){gs.to(easterNote,{autoAlpha:1,scale:1,duration:.55,ease:'back.out(1.5)'});gs.to(easterNote,{autoAlpha:0,scale:.96,duration:.5,delay:3.1,ease:'power2.in'})}else{easterNote.style.opacity=1;easterNote.style.visibility='visible';setTimeout(()=>{easterNote.style.opacity=0;easterNote.style.visibility='hidden'},3000)}}});

  function animateGallery(){
    gs.timeline().fromTo('.gallery-copy>*',{y:20,opacity:0},{y:0,opacity:1,duration:.75,stagger:.12,ease:'power3.out'}).fromTo('.gold-frame',{y:70,rotationX:8,scale:.86,opacity:0},{y:0,rotationX:0,scale:1,opacity:1,duration:1.35,ease:'power4.out'},'-.5').fromTo('.museum-card',{x:28,opacity:0,rotation:-4},{x:0,opacity:1,rotation:-1.5,duration:.9,ease:'power3.out'},'-.5').to('.portrait-light',{x:'220%',duration:1.45,ease:'power2.inOut'},'-.7').fromTo('.renaissance-line',{y:20,opacity:0},{y:0,opacity:1,duration:.8,ease:'power3.out'},'-.3').fromTo('.gallery-next',{y:14,opacity:0},{y:0,opacity:1,duration:.65,ease:'power3.out'},'-.35');
    gs.to('.gallery-lights i',{x:'10vw',duration:7,yoyo:true,repeat:-1,ease:'sine.inOut',stagger:.8});gs.to('.frame-bevel img',{scale:1.09,duration:10,yoyo:true,repeat:-1,ease:'sine.inOut'});
  }
  const portraitStage=document.getElementById('portraitStage');
  if(portraitStage&&isFinePointer){portraitStage.addEventListener('pointermove',e=>{if(!gs||reduceMotion)return;const r=portraitStage.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;gs.to('.gold-frame',{rotationY:x*7,rotationX:-y*6,duration:.5,ease:'power3.out',transformPerspective:1200})});portraitStage.addEventListener('pointerleave',()=>gs?.to('.gold-frame',{rotationY:0,rotationX:0,duration:.8,ease:'power3.out'}))}
  portraitStage.addEventListener('click',()=>{galleryTapped=true;crystal();const w=document.getElementById('galleryWhisper');if(gs&&!reduceMotion){gs.fromTo(w,{autoAlpha:0,y:16,filter:'blur(8px)'},{autoAlpha:1,y:0,filter:'blur(0)',duration:.65,ease:'power3.out'});gs.fromTo('.gold-frame',{scale:1},{scale:1.035,duration:.28,yoyo:true,repeat:1,ease:'power2.out'})}else{w.style.opacity=1;w.style.visibility='visible'}});

  function animatePrefinal(){
    gs.set('.prefinal-button',{autoAlpha:0,y:12}); const tl=gs.timeline();tl.fromTo('.prefinal-one',{y:20,opacity:0,filter:'blur(10px)'},{y:0,opacity:1,filter:'blur(0)',duration:.9,ease:'power3.out'}).fromTo('.prefinal-two',{y:24,opacity:0,filter:'blur(12px)'},{y:0,opacity:1,filter:'blur(0)',duration:1.05,ease:'power3.out'},'+=.45').to('.prefinal-button',{autoAlpha:1,y:0,duration:.65,ease:'power3.out'},'+=.55');
  }
  function revealPrefinalStatic(){document.querySelector('.prefinal-button').style.opacity=1;document.querySelector('.prefinal-button').style.visibility='visible'}
  document.getElementById('openInvitation').addEventListener('click',()=>goTo(8));

  function adaptiveText(){
    const elapsed=(Date.now()-startedAt)/1000; const explored=(eyeUnlocked?1:0)+detailsOpened+(easterFound?2:0)+(galleryTapped?1:0);
    if(explored>=6)return 'Você explorou praticamente tudo. Eu já imaginava 😌';
    if(easterFound)return 'Você ainda achou o detalhe escondido. Ponto extra por curiosidade.';
    if(elapsed<65)return 'Direta ao ponto. Respeito.';
    return 'Ok. Você chegou até aqui — então acho que o exagero valeu a pena.';
  }

  function openCurtains(){
    const reveal=document.getElementById('inviteReveal');document.getElementById('adaptiveLine').textContent=adaptiveText();
    if(!gs||reduceMotion){reveal.style.opacity=1;document.querySelectorAll('.curtain,.curtain-top').forEach(el=>el.style.display='none');return}
    gs.set(reveal,{opacity:1}); curtainChord(); const tl=gs.timeline({delay:.18});
    tl.fromTo('.invite-aura',{scale:.5,opacity:0},{scale:1,opacity:1,duration:1.2,ease:'power3.out'}).to('.curtain-left',{xPercent:-93,rotationY:7,duration:1.8,ease:'power4.inOut'},.25).to('.curtain-right',{xPercent:93,rotationY:-7,duration:1.8,ease:'power4.inOut'},.25).to('.curtain-top',{yPercent:-120,duration:1.4,ease:'power3.inOut'},.45).fromTo('.invite-card',{scale:.76,y:40,opacity:0,filter:'blur(14px)'},{scale:1,y:0,opacity:1,filter:'blur(0)',duration:1.25,ease:'power4.out'},.75).fromTo('.invite-card > *:not(.invite-border):not(.corner)',{y:18,opacity:0},{y:0,opacity:1,duration:.54,stagger:.055,ease:'power3.out'},1.35)
      .fromTo('.route-line i',{scaleX:0,transformOrigin:'left center'},{scaleX:1,duration:.9,ease:'power3.inOut'},1.95);
    startInviteSparkles();
  }

  const responseLayer=document.getElementById('responseLayer'),yesResponse=document.getElementById('yesResponse'),maybeResponse=document.getElementById('maybeResponse'),yesButton=document.getElementById('yesButton'),maybeButton=document.getElementById('maybeButton');
  const yesText='Ok, confesso que esse convite funcionou 😌 Sexta, 21h, eu topo.';const maybeText='Tenho algumas perguntas sobre essa proposta extremamente elaborada 😌';const yesWhatsApp=document.getElementById('yesWhatsApp'),maybeWhatsApp=document.getElementById('maybeWhatsApp');yesWhatsApp.href=`https://wa.me/?text=${encodeURIComponent(yesText)}`;maybeWhatsApp.href=`https://wa.me/?text=${encodeURIComponent(maybeText)}`;
  function showResponse(which){yesResponse.classList.toggle('is-active',which==='yes');maybeResponse.classList.toggle('is-active',which==='maybe');responseLayer.setAttribute('aria-hidden','false');if(gs&&!reduceMotion){gs.to(responseLayer,{autoAlpha:1,duration:.55,ease:'power3.out'});gs.fromTo('.response-card.is-active',{y:30,scale:.94,opacity:0,filter:'blur(9px)'},{y:0,scale:1,opacity:1,filter:'blur(0)',duration:.8,ease:'back.out(1.3)'})}else{responseLayer.style.opacity=1;responseLayer.style.visibility='visible'}}
  yesButton.addEventListener('click',()=>{showResponse('yes');celebrate();heartbeatBurst();confirmedAnimation();successChord()}); maybeButton.addEventListener('click',()=>showResponse('maybe'));
  function confirmedAnimation(){if(!gs||reduceMotion){document.getElementById('confirmedStamp').style.opacity=1;return}gs.timeline({delay:.45}).fromTo('#confirmedStamp',{scale:1.8,rotation:-15,opacity:0},{scale:1,rotation:-8,opacity:1,duration:.55,ease:'back.out(1.7)'}).fromTo('.confirmed-route i b',{x:0},{x:()=>Math.max(40,document.querySelector('.confirmed-route i').offsetWidth-9),duration:1.15,ease:'power2.inOut'},'-=.1')}

  const canvas=document.getElementById('ambientCanvas'),ctx=canvas.getContext('2d');let particles=[];
  function resizeAmbient(){const dpr=Math.min(devicePixelRatio||1,2);canvas.width=innerWidth*dpr;canvas.height=innerHeight*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);const mobile=innerWidth<821;particles=Array.from({length:mobile?Math.min(24,Math.floor(innerWidth/18)):Math.min(46,Math.floor(innerWidth/22))},makeParticle)}
  function makeParticle(){return{x:Math.random()*innerWidth,y:Math.random()*innerHeight,s:.35+Math.random()*1.4,v:.08+Math.random()*.22,drift:(Math.random()-.5)*.12,a:.1+Math.random()*.28,t:Math.random()>.76?'heart':'dot',r:Math.random()*Math.PI*2}}
  function drawHeart(x,y,size,alpha,rot){ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.scale(size/20,size/20);ctx.beginPath();ctx.moveTo(0,5);ctx.bezierCurveTo(-10,-5,-18,6,0,20);ctx.bezierCurveTo(18,6,10,-5,0,5);ctx.fillStyle=`rgba(255,83,128,${alpha})`;ctx.fill();ctx.restore()}
  function ambientTick(){ctx.clearRect(0,0,innerWidth,innerHeight);particles.forEach(p=>{p.y-=p.v;p.x+=p.drift;p.r+=.002;if(p.y<-30){Object.assign(p,makeParticle());p.y=innerHeight+20}if(p.t==='heart')drawHeart(p.x,p.y,p.s*3,p.a,p.r);else{ctx.beginPath();ctx.fillStyle=`rgba(255,205,218,${p.a})`;ctx.arc(p.x,p.y,p.s,0,Math.PI*2);ctx.fill()}});requestAnimationFrame(ambientTick)}resizeAmbient();window.addEventListener('resize',resizeAmbient,{passive:true});if(!reduceMotion)ambientTick();

  function startInviteSparkles(){const c=document.getElementById('celebrationCanvas'),x=c.getContext('2d');let pts=[];const resize=()=>{const dpr=Math.min(devicePixelRatio||1,2);c.width=innerWidth*dpr;c.height=innerHeight*dpr;x.setTransform(dpr,0,0,dpr,0,0);pts=Array.from({length:innerWidth<821?44:82},()=>({x:Math.random()*innerWidth,y:Math.random()*innerHeight,r:.4+Math.random()*1.5,v:.12+Math.random()*.4,a:.15+Math.random()*.55,w:Math.random()*10}))};resize();function tick(){if(current!==8)return;x.clearRect(0,0,innerWidth,innerHeight);pts.forEach(p=>{p.y-=p.v;p.x+=Math.sin((p.y+p.w)*.012)*.12;if(p.y<-10){p.y=innerHeight+10;p.x=Math.random()*innerWidth}x.beginPath();x.fillStyle=`rgba(242,205,137,${p.a})`;x.arc(p.x,p.y,p.r,0,Math.PI*2);x.fill()});requestAnimationFrame(tick)}tick()}
  function celebrate(){if(typeof window.confetti!=='function'||reduceMotion)return;const palette=['#ff174d','#ff6f97','#f3cf88','#fff6ef'];const end=Date.now()+2100;(function frame(){confetti({particleCount:4,angle:60,spread:65,startVelocity:45,origin:{x:0,y:.72},colors:palette,shapes:['circle']});confetti({particleCount:4,angle:120,spread:65,startVelocity:45,origin:{x:1,y:.72},colors:palette,shapes:['circle']});if(Date.now()<end)requestAnimationFrame(frame)})()}
  function heartbeatBurst(){if(!gs||reduceMotion)return;gs.fromTo('.response-heart',{scale:.5,opacity:0},{scale:1,opacity:1,duration:.5,ease:'back.out(2)'});gs.to('.response-heart',{scale:1.14,duration:.34,yoyo:true,repeat:3,ease:'sine.inOut'})}

  if(isFinePointer){window.addEventListener('pointermove',e=>{if(!gs)return;gs.to(cursor,{x:e.clientX,y:e.clientY,autoAlpha:.72,duration:.45,ease:'power3.out'})});document.querySelectorAll('button,a').forEach(el=>{el.addEventListener('mouseenter',()=>gs?.to(cursor,{scale:1.9,autoAlpha:1,duration:.22}));el.addEventListener('mouseleave',()=>gs?.to(cursor,{scale:1,autoAlpha:.72,duration:.22}))})}

  function enableAudio(){if(audioCtx)return;try{audioCtx=new(window.AudioContext||window.webkitAudioContext)();ambientMaster=audioCtx.createGain();ambientMaster.gain.value=.033;ambientMaster.connect(audioCtx.destination);audioOn=true;soundToggle.classList.add('is-on');soundToggle.querySelector('.sound-label').textContent='som on';heartbeatLoop()}catch(e){audioOn=false}}
  function heartbeatLoop(){clearTimeout(heartbeatTimer);if(!audioCtx||!audioOn)return;const now=audioCtx.currentTime;[0,.22].forEach((offset,i)=>{const osc=audioCtx.createOscillator(),gain=audioCtx.createGain();osc.type='sine';osc.frequency.setValueAtTime(i?46:52,now+offset);gain.gain.setValueAtTime(.0001,now+offset);gain.gain.exponentialRampToValueAtTime(i?.11:.17,now+offset+.02);gain.gain.exponentialRampToValueAtTime(.0001,now+offset+.17);osc.connect(gain);gain.connect(ambientMaster);osc.start(now+offset);osc.stop(now+offset+.2)});heartbeatTimer=setTimeout(heartbeatLoop,1540)}
  function softChime(kind=0){if(!audioCtx||!audioOn)return;const frequencies=[[523.25,659.25],[587.33,739.99],[659.25,783.99]][kind%3];frequencies.forEach((f,i)=>{const osc=audioCtx.createOscillator(),gain=audioCtx.createGain(),t=audioCtx.currentTime+i*.06;osc.type='sine';osc.frequency.value=f;gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(.045,t+.02);gain.gain.exponentialRampToValueAtTime(.0001,t+.48);osc.connect(gain);gain.connect(ambientMaster);osc.start(t);osc.stop(t+.52)})}
  function crystal(){if(!audioCtx||!audioOn)return;[1046.5,1318.5,1568].forEach((f,i)=>{const o=audioCtx.createOscillator(),g=audioCtx.createGain(),t=audioCtx.currentTime+i*.055;o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.028,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+.72);o.connect(g);g.connect(ambientMaster);o.start(t);o.stop(t+.76)})}
  function whoosh(){if(!audioCtx||!audioOn)return;const dur=.38,buffer=audioCtx.createBuffer(1,audioCtx.sampleRate*dur,audioCtx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length);const src=audioCtx.createBufferSource(),filter=audioCtx.createBiquadFilter(),g=audioCtx.createGain(),t=audioCtx.currentTime;src.buffer=buffer;filter.type='bandpass';filter.frequency.setValueAtTime(430,t);filter.frequency.exponentialRampToValueAtTime(1600,t+dur);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.045,t+.08);g.gain.exponentialRampToValueAtTime(.0001,t+dur);src.connect(filter);filter.connect(g);g.connect(ambientMaster);src.start(t)}
  function curtainChord(){if(!audioCtx||!audioOn)return;[196,246.94,293.66,392].forEach((f,i)=>{const o=audioCtx.createOscillator(),g=audioCtx.createGain(),t=audioCtx.currentTime+i*.035;o.type=i<2?'triangle':'sine';o.frequency.value=f;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.028,t+.06);g.gain.exponentialRampToValueAtTime(.0001,t+1.3);o.connect(g);g.connect(ambientMaster);o.start(t);o.stop(t+1.35)})}
  function successChord(){if(!audioCtx||!audioOn)return;[261.63,329.63,392,523.25].forEach((f,i)=>{const o=audioCtx.createOscillator(),g=audioCtx.createGain(),t=audioCtx.currentTime+i*.08;o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.045,t+.03);g.gain.exponentialRampToValueAtTime(.0001,t+.85);o.connect(g);g.connect(ambientMaster);o.start(t);o.stop(t+.9)})}
  soundToggle.addEventListener('click',()=>{if(!audioCtx){enableAudio();return}audioOn=!audioOn;ambientMaster.gain.value=audioOn?.033:0;soundToggle.classList.toggle('is-on',audioOn);soundToggle.querySelector('.sound-label').textContent=audioOn?'som on':'som';if(audioOn)heartbeatLoop();else clearTimeout(heartbeatTimer)});

  document.querySelectorAll('button,a').forEach(el=>el.addEventListener('pointerdown',()=>navigator.vibrate?.(7)));document.querySelectorAll('img').forEach(img=>img.addEventListener('dragstart',e=>e.preventDefault()));
  intro();
})();
