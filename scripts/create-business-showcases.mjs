// Original fictional gallery submissions. Run from the gallery root.
import {mkdir,writeFile} from 'node:fs/promises';
const root='submissions';
const n=(tag,attrs={},children=[])=>({tag,attrs,children});
const svg=body=>`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">${body}</svg>`;
const rect=(x,y,w,h,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
const circle=(x,y,r,c)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;
const plate=svg(rect(0,0,800,600,'#cb633b')+circle(400,300,247,'#edddbd')+circle(400,300,211,'#faf2dd')+[-1,0,1].map((v,i)=>`<ellipse cx="${310+i*90}" cy="${290+v*35}" rx="100" ry="35" transform="rotate(-28 ${310+i*90} ${290+v*35})" fill="#ac4c2e"/>`).join('')+Array.from({length:13},(_,i)=>circle(260+(i*67)%290,190+(i*41)%210,10,'#55704c')).join('')+circle(498,204,34,'#e4ae43'));
const room=svg(rect(0,0,800,600,'#292f2a')+rect(60,50,680,350,'#b3693f')+[80,310,540].map(x=>rect(x,70,170,280,'#efcd8d')+rect(x+79,70,12,280,'#292f2a')).join('')+rect(0,410,800,190,'#49382c')+[170,590].map(x=>`<ellipse cx="${x}" cy="420" rx="135" ry="40" fill="#dfc4a0"/>`+rect(x-10,420,20,150,'#c5986b')+circle(x,410,23,'#fff1cd')).join(''));
const houses=svg(rect(0,0,800,600,'#dce8de')+circle(670,110,55,'#e7bb70')+rect(0,440,800,160,'#63856d')+[40,290,540].map((x,i)=>rect(x,240-i*25,210,220+i*25,['#eed7b7','#faf1dc','#c49a79'][i])+`<path d="M${x-20} ${240-i*25} L${x+105} ${130-i*25} L${x+230} ${240-i*25}Z" fill="#35584c"/>`+rect(x+80,350,50,110,'#35584c')+rect(x+25,285,40,50,'#809d98')+rect(x+145,285,40,50,'#809d98')).join('')+rect(0,510,800,30,'#f2e9d6'));
const map=svg(rect(0,0,800,600,'#e9e2d1')+`<path d="M-20 450 Q220 260 370 400 T830 270" fill="none" stroke="#80ada8" stroke-width="80"/>`+[120,310,500,690].map(x=>rect(x,0,20,600,'#faf6eb')).join('')+[120,260,470].map(y=>rect(0,y,800,16,'#faf6eb')).join('')+rect(345,65,130,150,'#96b391')+[ [170,190],[565,205],[510,485] ].map(([x,y])=>circle(x,y,32,'#bf674a')+circle(x,y,11,'#fff8e9')).join(''));
const city=(mode)=>svg(rect(0,0,800,600,mode===0?'#26384b':'#111c31')+circle(640,90,40,'#ead99f')+[0,140,300,470,650].map((x,i)=>rect(x,130+i%2*65,125,390,'#263c51')+Array.from({length:9},(_,j)=>rect(x+18+(j%3)*34,170+Math.floor(j/3)*75+i%2*65,17,32,mode===0?'#738087':'#efc76c')).join('')).join('')+rect(0,510,800,90,'#101726')+`<path d="M80 510V260H150 M430 510V280H500" fill="none" stroke="${mode===0?'#c2aa6e':'#f5ce73'}" stroke-width="12"/>`+(mode===1?rect(305,325,125,54,'#df707e')+rect(315,335,105,34,'#642e60'):''));
const configs=[
 {id:'ember-and-salt',title:'Ember & Salt',sub:'A season at the table',category:'Pitch decks',accent:'#a4492d',bg:'#f5eddd',ink:'#302d25',art:[plate,room],alt:['Original illustration of roasted carrots, herbs and citrus on a ceramic plate','Original illustration of a warm dining room with shared tables'],slides:[
 ['Ember & Salt','A season at the table','A fictional restaurant built around fire, produce, and the pleasure of sharing.','cover'],
 ['Good evenings start simply','Our point of view','Buy with the season. Cook over embers. Leave room for conversation.','manifesto'],
 ['One dish, five decisions','Roasted carrots · our signature plate','Char for depth|Citrus for brightness|Yogurt for balance|Seeds for crunch|Herbs for freshness','annotate'],
 ['A menu with a rhythm','Start small. Stay curious. Share generously.','To begin|Warm flatbread · whipped beans\nFrom the fire|Roasted carrots · charred cabbage\nTo linger|Pear tart · cultured cream','menu'],
 ['Make the room your own','A gathering, thoughtfully paced','A long-table supper, a family celebration, or a quiet team evening. Begin with the occasion; shape the menu together.','image'],
 ['Your next evening starts here','Tell us what you are celebrating','01  Share your occasion|02  Shape the seasonal menu|03  Gather around the table','steps'] ]},
 {id:'common-ground-realty',title:'Common Ground Realty',sub:'Find your kind of everyday',category:'Pitch decks',accent:'#315e4e',bg:'#f1eee4',ink:'#263e35',art:[houses,map],alt:['Original architectural illustration of three neighborhood homes','Original schematic neighborhood map with river, park and three markers; not geographic data'],slides:[
 ['Common Ground Realty','Find your kind of everyday','A fictional real estate company helping buyers connect a home search to daily life.','cover'],
 ['Start with the life around it','Before the shortlist','What should an ordinary Tuesday feel like? Choose your must-haves before comparing homes.','manifesto'],
 ['Find your Saturday','Three fictional places. Three different rhythms.','Market Quarter · cafés and corner shops|River Walk · paths and open space|Garden Blocks · yards and quiet streets','annotate'],
 ['Compare the trade-offs','A useful shortlist makes choices visible','Market Quarter|Activity close by · less private outdoor space\nRiver Walk|Trail access · fewer shops nearby\nGarden Blocks|Room outdoors · more trips by car','menu'],
 ['Look beyond the listing','Walk the neighborhood at your own pace','Visit at different times. Try your real route. Notice sound, shade, sidewalks, and the places you would return to.','image'],
 ['From priorities to a plan','Our proposed buyer journey','01  Define your priorities|02  Tour and compare|03  Review next steps with your agent','steps'] ]},
 {id:'after-dark-city-in-light',title:'After Dark: A City in Light',sub:'An imagined exhibition',category:'Education',accent:'#f0c66b',bg:'#101b2c',ink:'#f4eddf',art:[city(0),city(1)],alt:['Original illustration of an imagined city street with subdued lamps','Original illustration of the same imagined street with bright windows and a pink sign'],slides:[
 ['After Dark','A City in Light','An imagined exhibition about how light changes the way we experience a street.','cover'],
 ['Who gets to feel welcome?','The exhibition’s central question','Light can invite, direct, dazzle, or overwhelm. Follow one imagined street and notice what each choice makes visible.','manifesto'],
 ['The same street, a new mood','An interpretive pair, not an archival record','A pool of light · attention stays close|A glowing sign · a destination appears|Bright windows · indoor life becomes visible','annotate'],
 ['Three lenses for looking','Read the city through its light','Street|Where does the light lead you?\nSign|What is asking for your attention?\nWindow|What can you see, and what stays private?','menu'],
 ['Step inside the night','A proposed visitor experience','Enter a dim street scene, explore a luminous sign wall, then compose a window of your own. Quiet viewing space sits beside the bright displays.','image'],
 ['What would you illuminate?','Leave with a question for your own street','01  Notice one overlooked detail|02  Sketch a different lighting choice|03  Explain who it might help','steps'] ]}
];
for(const c of configs){
 const dir=`${root}/${c.id}`;await mkdir(dir,{recursive:true});let slides=[],design={palette:[],slides:{}};
 const media={};await mkdir(`${dir}/assets`,{recursive:true});for(let j=0;j<c.art.length;j++)await writeFile(`${dir}/assets/art-${j+1}.svg`,c.art[j]);
 for(let i=0;i<c.slides.length;i++){
  const [title,kicker,body,layout]=c.slides[i],id=`${c.id}-slide-${i+1}`,objects={};let tree=[],count=0;
  function block(x,y,w,h,children,kind='text',color=c.ink,fill='transparent'){
   const key=`block-${c.id}-${i+1}-${++count}`;
   tree.push(n('div',{class:`db-block card db-${kind} ${key} db-template tp-display-block tp-pad-0`,style:`position:absolute;left:${x}%;top:${y}%;width:${w}%;height:${h}%;z-index:4`},children));
   objects[key]={name:children.map(v=>v.children?.map(q=>q.text||'').join('')).join(' ').slice(0,70),locked:false,hidden:false,style:{text:{hex:color,opacity:1},fill:fill==='transparent'?fill:{hex:fill,opacity:1},border:'transparent',borderWidth:0}};
  }
  const txt=(text,x,y,w,h,size=28,bold=false,color=c.ink)=>block(x,y,w,h,[n(bold?'h2':'p',{style:`font-size:${size}px;line-height:1.18;margin:0;letter-spacing:0px;font-weight:${bold?700:400}`},[{text}])],'text',color);
  const image=(which,x,y,w,h)=>{media[id]={kind:'image',src:`assets/art-${which+1}.svg`,name:c.alt[which],alt:c.alt[which],fit:'cover',frame:'none',layout:'inset',canvas:{placement:{x:x/100,y:y/100,w:w/100,h:h/100},z:3}};};
  txt(c.title.toUpperCase(),0,1,87,5,18,true,c.accent);
  txt(String(i+1).padStart(2,'0')+' / 06',89,1,11,5,18,false,c.accent);
  if(layout==='cover'){
   txt(title,0,18,48,31,68,true);txt(kicker,0,51,47,12,30,true,c.accent);txt(body,0,69,46,20,25);image(0,52,13,48,76);
  }else{
   txt(title,0,13,99,16,48,true);txt(kicker,0,30,98,9,25,false,c.accent);
   if(layout==='manifesto'){txt(body,0,47,76,34,46,true);txt('A considered experience, shaped around people.',0,85,90,7,23,false,c.accent);}
   if(layout==='annotate'){image(c.id==='after-dark-city-in-light'?1:0,0,44,51,45);body.split('|').forEach((t,j)=>txt(t,57,44+j*(c.id==='ember-and-salt'?9:15),42,12,c.id==='ember-and-salt'?25:28,true));}
   if(layout==='menu'){body.split('\n').forEach((s,j)=>{const [a,b]=s.split('|');txt(a,0,46+j*16,26,12,29,true,c.accent);txt(b,30,46+j*16,69,13,27);});}
   if(layout==='image'){image(1,0,44,53,46);txt(body,59,46,40,42,30);}
   if(layout==='steps'){body.split('|').forEach((s,j)=>{txt(s,0,47+j*14,95,12,34,true,j===1?c.ink:c.accent);});}
  }
  txt('FICTIONAL SHOWCASE · ORIGINAL ILLUSTRATIONS',0,96,96,4,14,false,c.accent);
  slides.push({id,title,group:`${c.id}-main`,template:'blank',classes:'wide',tree,templateBase:structuredClone(tree),templateClasses:'wide',duration:45,hidden:false,notes:`${body.replaceAll('|','; ')}\n\nOriginal fictional concept created for Presentation Studio Gallery. All brands, locations, menus and exhibit proposals are invented. Illustrations are original SVG compositions, not photographs or historical evidence. ${c.id==='common-ground-realty'?'Neighborhood descriptions are illustrative only; this deck contains no real listings, market claims or transaction advice.':''} ${c.id==='after-dark-city-in-light'?'No historical chronology or documented city is represented. Facilitation: ask visitors which detail first drew their attention and why.':''}`,topic:c.sub,commands:null,templateCommands:null,transition:'inherit',editLocked:false});design.slides[id]={objects};
 }
 const pack={schemaVersion:2,kind:'presentation-studio-project',meta:{id:`gallery-${c.id}-v1`,name:c.title,updatedAt:new Date().toISOString()},playbackOnly:false,state:{projectName:c.title,slides,trash:[],loops:{main:{name:c.title,slideIds:slides.map(s=>s.id)}},brand:{accent:c.accent,background:c.bg,ink:c.ink,font:'Arial',logo:'',family:'generic',headerTitle:'',headerSubtitle:'',edition:'',presentationTheme:c.id.startsWith('after-')?'dark':'light',logoLight:'',logoDark:'',logoSize:40,logoPlacement:'left',titleLogo:false,themeColors:{}},media,sections:[{id:`${c.id}-main`,name:c.title,kind:'slides',product:'generic',hidden:false,headerLabel:''}],sectionTrash:[],origin:'blank',presentation:{transition:'none',speed:'normal',sectionTransition:'inherit',disableMotion:true},editLocked:false,mediaObjects:{},design},checkpoints:[],history:{past:[],future:[]}};
 await writeFile(`${dir}/presentation.json`,JSON.stringify(pack,null,2)+'\n');
 await writeFile(`${dir}/metadata.json`,JSON.stringify({id:c.id,title:c.title,description:`${c.sub}. Six-slide fictional showcase with editable text and original embedded illustrations.`,category:c.category,tags:[c.id.startsWith('ember')?'restaurant':c.id.startsWith('common')?'real-estate':'museum','fictional','illustrated'],type:'showcase',author:{name:'Tre · created with Codex',url:'https://github.com/treisland'},license:'Apache-2.0',added:'2026-11-14',cover:'slide-01.png',deck:'presentation.json',previews:['slide-01.png','slide-03.png','slide-04.png']},null,2)+'\n');
 await writeFile(`${dir}/README.md`,`# ${c.title}\n\n${c.sub}. Six slides, intended for a short introduction. Fictional showcase; all text and SVG illustrations are original, created with Codex, licensed Apache-2.0. No external media or fonts are required.\n\nThe JSON is the editable native Studio project. Selected PNG previews are actual Studio slide renders. Submission only: maintainer acceptance is pending. See verification.json for actual checks.\n`);
}
console.log('Created three six-slide submissions.');
