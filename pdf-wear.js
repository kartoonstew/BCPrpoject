/** Seeded vector wear: no external images, and no marks over writing areas. */
export function randomSeed(){const seed=new Uint32Array(1);crypto.getRandomValues(seed);return seed[0];}
export function seededRandom(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
export function drawWear(page,PDFLib,random){
  const {width,height}=page.getSize();
  const {rgb,degrees}=PDFLib,brown=rgb(.29,.22,.13),blood=rgb(.32,.055,.035),ochre=rgb(.47,.35,.16);
  // Ragged washes follow the paper edge, without repeated circular silhouettes.
  for(let layer=0;layer<4;layer++){
    for(let side=0;side<4;side++){
      const length=side<2?height:width,points=[];
      for(let p=0;p<=length;p+=8){const depth=2+random()*(8+layer*3);points.push(side===0?[depth,p]:side===1?[width-depth,p]:side===2?[p,depth]:[p,height-depth]);}
      const first=side===0?[0,0]:side===1?[width,0]:side===2?[0,0]:[0,height];
      const last=side===0?[0,height]:side===1?[width,height]:side===2?[width,0]:[width,height];
      page.drawSvgPath('M '+first.join(' ')+' '+points.map(p=>'L '+p.join(' ')).join(' ')+' L '+last.join(' ')+' Z',{x:0,y:height,color:ochre,opacity:.055});
    }
  }
  // Dried droplets and grazed smears live only in the outer 24pt margins.
  for(let cluster=0;cluster<3;cluster++){
    const left=random()>.5,cx=left?9+random()*9:(width-18)+random()*9,cy=75+random()*(height-172);
    for(let j=0;j<15;j++){
      const radius=j<2?3+random()*5:.35+random()*1.8;
      page.drawEllipse({x:Math.max(2,Math.min((width-2),cx+(random()-.5)*15)),y:cy+(random()-.5)*48,xScale:radius,yScale:radius*(.4+random()*1.5),rotate:degrees(random()*180),color:blood,opacity:.22+random()*.28});
    }
  }
  for(let i=0;i<340;i++){
    const left=random()>.5,x=left?random()*26:(width-26)+random()*26,y=random()*height;
    page.drawCircle({x,y,size:.15+random()*.7,color:brown,opacity:.08+random()*.12});
  }
  for(let i=0;i<9;i++){
    const x=random()>.5?8+random()*12:(width-20)+random()*12,y=random()*height;
    page.drawLine({start:{x,y},end:{x:x+(random()-.5)*9,y:y+6+random()*24},color:brown,opacity:.15,thickness:.3+random()*.8});
  }
}
