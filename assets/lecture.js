(() => {
  'use strict';
  const sceneElement = document.getElementById('zuga-scene');
  const canvas = document.getElementById('network-canvas');
  const toggle = document.getElementById('glasses-toggle');
  const motion = document.getElementById('motion-toggle');
  const label = document.getElementById('glasses-label');
  const status = document.getElementById('scene-status');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let active = false, paused = reduced.matches, visible = true, frame = 0, last = 0, time = 0;
  let draw = () => {}, resize = () => {};
  const icons = () => window.lucide?.createIcons();
  icons();

  function fallback() {
    // Keep the same information paths usable on devices without WebGL.
    const replacement = canvas.cloneNode();
    canvas.replaceWith(replacement);
    const ctx = replacement.getContext('2d');
    sceneElement.dataset.renderer = '2d';
    resize = () => {
      const box = replacement.getBoundingClientRect();
      replacement.width = box.width * devicePixelRatio;
      replacement.height = box.height * devicePixelRatio;
      draw();
    };
    draw = () => {
      const w = replacement.width, h = replacement.height;
      ctx.clearRect(0, 0, w, h);
      if (!active) return;
      ctx.save(); ctx.scale(w / 780, h / 520);
      ctx.lineWidth = 1.1;
      function arrow(x,y,angle,color,size=5){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(size,0);ctx.lineTo(-size,-size*.6);ctx.lineTo(-size,size*.6);ctx.closePath();ctx.fill();ctx.restore();}
      for (const x of [265, 515]) {
        ctx.strokeStyle = '#13736585';
        for (let i = 0; i < 9; i++) {
          ctx.beginPath();ctx.ellipse(x,260,36+i*4,90-i*3,Math.sin(i*.4)*.3,0,Math.PI*2);ctx.stroke();
        }
        ctx.beginPath();ctx.moveTo(x,220);ctx.quadraticCurveTo(x,95,390,78);ctx.stroke();
        for(let i=0;i<12;i++) {
          const a=time*.7+i/12*Math.PI*2;
          arrow(x+50*Math.cos(a),260+76*Math.sin(a),Math.atan2(76*Math.cos(a),-50*Math.sin(a)),'#33b9a3',3.8);
        }
      }
      for(const direction of [1,-1]) {
        ctx.strokeStyle='#137365b0';ctx.lineWidth=1.7;ctx.beginPath();
        for(let j=0;j<=60;j++){const f=j/60,x=265+250*f,y=230-direction*Math.sin(Math.PI*f)*22;j?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();
        for(let i=0;i<5;i++) {
          const f=((time*.11*direction+i/5)%1+1)%1;
          arrow(265+250*f,230-direction*Math.sin(Math.PI*f)*22,Math.atan2(-direction*Math.PI*22*Math.cos(Math.PI*f),250)+(direction<0?Math.PI:0),'#137365');
        }
      }
      ctx.strokeStyle='#c6634d';ctx.lineWidth=1.4;ctx.beginPath();
      for(let j=0;j<=90;j++){const f=j/90,x=265+250*f,y=260+Math.sin(f*Math.PI)*Math.sin(f*Math.PI*10+time)*9;j?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();
      ctx.restore();
    };
  }

  try {
    if (!window.THREE) throw new Error('Three.js unavailable');
    const T = window.THREE;
    const renderer = new T.WebGLRenderer({canvas, alpha:true, antialias:true, powerPreference:'low-power'});
    renderer.setPixelRatio(Math.min(devicePixelRatio,2));
    renderer.setClearColor(0xffffff,0);
    const scene = new T.Scene();
    const camera = new T.OrthographicCamera(-7.5,7.5,5,-5,.1,100);
    camera.position.z = 20;
    const network = new T.Group();scene.add(network);
    const rings = [], flows = [], tensionMaterials = [];
    const up = new T.Vector3(0,1,0);
    function path(points,color,opacity=.65) {
      const curve = new T.CatmullRomCurve3(points);
      const material = new T.LineBasicMaterial({color,transparent:true,opacity,depthTest:false});
      const line = new T.Line(new T.BufferGeometry().setFromPoints(curve.getPoints(100)),material);
      network.add(line);
      return curve;
    }
    function particles(curve,color,count=6,direction=1,parent=network,arrows=false,speed=.065) {
      for (let i=0;i<count;i++) {
        const geometry=arrows?new T.ConeGeometry(.052,.15,4):new T.SphereGeometry(.036,8,6);
        const dot = new T.Mesh(geometry,new T.MeshBasicMaterial({color,depthTest:false}));
        dot.renderOrder=2;
        parent.add(dot);flows.push({dot,curve,offset:i/count,speed,direction,arrows});
      }
    }
    for (const [index,x] of [-2.2,2.3].entries()) {
      const torus = new T.Group();torus.position.set(x,-.1,0);torus.rotation.set(.18,index ? -.35:.35,0);network.add(torus);rings.push(torus);
      const material = new T.LineBasicMaterial({color:index ? 0x208c88:0x137365,transparent:true,opacity:.46,depthTest:false});
      // Longitudinal and meridional paths reveal the volume of the internal torus.
      for (let m=0;m<16;m++) {
        const a=m/16*Math.PI*2, points=[];
        for (let n=0;n<=96;n++) {
          const b=n/96*Math.PI*2,r=1.05+.38*Math.cos(b);
          points.push(new T.Vector3(r*Math.cos(a)*.75,r*Math.sin(a)*1.45,.38*Math.sin(b)));
        }
        torus.add(new T.Line(new T.BufferGeometry().setFromPoints(points),material));
      }
      for(let n=0;n<8;n++) {
        const b=n/8*Math.PI*2,points=[];
        for(let m=0;m<=100;m++){const a=m/100*Math.PI*2,r=1.05+.38*Math.cos(b);points.push(new T.Vector3(r*Math.cos(a)*.75,r*Math.sin(a)*1.45,.38*Math.sin(b)));}
        torus.add(new T.Line(new T.BufferGeometry().setFromPoints(points),material));
      }
      for(let k=0;k<3;k++) {
        const points=[];
        for(let i=0;i<128;i++) {
          const a=i/128*Math.PI*2,b=a*2+k*Math.PI*2/3,r=1.05+.38*Math.cos(b);
          points.push(new T.Vector3(r*Math.cos(a)*.75,r*Math.sin(a)*1.45,.38*Math.sin(b)));
        }
        const loop=new T.CatmullRomCurve3(points,true);
        particles(loop,0x37bda7,6,k%2?-1:1,torus,true,.05);
      }
      for(let j=0;j<5;j++) {
        const points=[new T.Vector3(x,.65+j*.12,0),new T.Vector3(x*(.95-j*.025),2.3,.1),new T.Vector3(x*.48,3.2+j*.1,0),new T.Vector3(0,3.55,0)];
        const curve=path(points,j%2 ? 0xdb765f:0x137365,.3+j*.07);particles(curve,0x137365,3,j%2?-1:1);
      }
    }
    // Separate opposite lanes make the information exchange legible in both directions.
    for(const direction of [1,-1]) {
      const curve=path([new T.Vector3(-2.2,.65,0),new T.Vector3(-.8,.65+direction*.42,.1),new T.Vector3(.8,.65+direction*.42,.1),new T.Vector3(2.3,.65,0)],0x137365,.8);
      const tube=new T.Mesh(new T.TubeGeometry(curve,80,.012,5,false),new T.MeshBasicMaterial({color:0x137365,transparent:true,opacity:.5,depthTest:false}));network.add(tube);
      particles(curve,0x137365,5,direction,network,true,.11);
    }
    for(let j=0;j<3;j++) {
      const points=[];
      for(let n=0;n<=96;n++) {
        const f=n/96;points.push(new T.Vector3(-2.2+4.5*f,-.28+Math.sin(Math.PI*f)*Math.sin(f*Math.PI*10+j*.6)*(.12+j*.06),0));
      }
      const material=new T.LineBasicMaterial({color:0xc6634d,transparent:true,opacity:.6,depthTest:false});
      network.add(new T.Line(new T.BufferGeometry().setFromPoints(points),material));tensionMaterials.push(material);
    }
    draw = () => {
      network.visible=active;
      rings.forEach((ring,i)=>{ring.rotation.y=Math.sin(time*.3+i)*.28;ring.rotation.z=Math.sin(time*.2+i)*.05;});
      for(const f of flows) {
        const progress=((time*f.speed*f.direction+f.offset)%1+1)%1;
        f.dot.position.copy(f.curve.getPointAt(progress));
        if(f.arrows) f.dot.quaternion.setFromUnitVectors(up,f.curve.getTangentAt(progress).multiplyScalar(f.direction));
      }
      tensionMaterials.forEach((m,i)=>{m.opacity=.4+.25*(.5+.5*Math.sin(time*1.6+i*.9));});
      renderer.render(scene,camera);
    };
    resize = () => {const box=canvas.getBoundingClientRect();renderer.setSize(box.width,box.height,false);draw();};
    canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();cancelAnimationFrame(frame);frame=0;fallback();resize();start();});
    sceneElement.dataset.renderer='webgl';
  } catch (_) { fallback(); }

  function tick(now) {
    frame=0;
    if(!active || paused || !visible || document.hidden){last=0;return;}
    if(last) time+=Math.min((now-last)/1000,.05);
    last=now;draw();frame=requestAnimationFrame(tick);
  }
  function start(){draw();if(!frame && active && !paused && visible && !document.hidden)frame=requestAnimationFrame(tick);}
  function updateMotion(){motion.innerHTML=`<i data-lucide="${paused?'play':'pause'}" aria-hidden="true"></i>`;motion.setAttribute('aria-label',paused?'הפעלת התנועה':'השהיית התנועה');motion.title=motion.getAttribute('aria-label');icons();}
  toggle.addEventListener('click',()=>{
    active=!active;sceneElement.classList.toggle('is-active',active);toggle.setAttribute('aria-pressed',String(active));
    label.textContent=active?'להסיר משקפי זוגא':'לשים משקפי זוגא';motion.hidden=!active;
    status.textContent=active?'משקפי זוגא: מידע זורם בשני הכיוונים בין הדמויות ובמעגלים פנימיים סביב כל אדם. המתח משתנה ביניהן והן מקושרות לזוגא.':'משקפי זוגא הוסרו.';
    start();
  });
  motion.addEventListener('click',()=>{paused=!paused;last=0;updateMotion();start();});
  reduced.addEventListener('change',event=>{paused=event.matches;updateMotion();start();});
  document.addEventListener('visibilitychange',()=>{last=0;start();});
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;last=0;start();},{threshold:.05}).observe(sceneElement);
  new ResizeObserver(resize).observe(sceneElement.querySelector('.scene-frame'));
  resize();updateMotion();toggle.disabled=false;
})();
