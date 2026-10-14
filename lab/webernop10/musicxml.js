/* Webern Op.10 browser score adapter: quantized MusicXML preview, not bach.quantize. */
window.webernMusicXML=function(events,bpm){
 const names=['Flute','Clarinet','Trumpet','Trombone','Celesta','Harp','Glockenspiel','Violin','Viola','Violoncello'];
 const clefs=[['G',2],['G',2],['G',2],['F',4],['G',2],['F',4],['G',2],['G',2],['C',3],['F',4]];
 const divisions=480,bar=1920,unit=120,beatMs=60000/Math.max(24,bpm);
 const quant=ms=>Math.max(0,Math.round(ms/beatMs*divisions/unit)*unit);
 const maxEnd=Math.max(1920,...events.map(e=>quant(e.onsetMs)+Math.max(unit,quant(e.durationMs))));
 const bars=Math.min(200,Math.max(1,Math.ceil(maxEnd/bar)));
 const pnames=['C','C','D','E','E','F','F','G','A','A','B','B'];
 const alters=[0,1,0,-1,0,0,1,0,-1,0,-1,0];
 const escape=x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
 function pieces(n){const lens=[1920,960,480,240,120];let a=[];while(n>0){let d=lens.find(q=>q<=n)||120;a.push(d);n-=d}return a}
 function rhythm(d){return {1920:'whole',960:'half',480:'quarter',240:'eighth',120:'16th'}[d]||'16th'}
 function restXML(d){return '<note><rest/><duration>'+d+'</duration><type>'+rhythm(d)+'</type></note>'}
 function noteXML(d,midi,tieStart,tieStop){const pc=((midi%12)+12)%12;const oct=Math.floor(midi/12)-1;const alter=alters[pc];return '<note><pitch><step>'+pnames[pc]+'</step>'+(alter?'<alter>'+alter+'</alter>':'')+'<octave>'+oct+'</octave></pitch><duration>'+d+'</duration><type>'+rhythm(d)+'</type>'+(alter?'<accidental>'+(alter>0?'sharp':'flat')+'</accidental>':'')+(tieStop?'<tie type="stop"/>':'')+(tieStart?'<tie type="start"/>':'')+((tieStop||tieStart)?'<notations>'+(tieStop?'<tied type="stop"/>':'')+(tieStart?'<tied type="start"/>':'')+'</notations>':'')+'</note>'}
 let xml='<?xml version="1.0" encoding="utf-8"?><!DOCTYPE score-partwise  PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd"><score-partwise version="4.0"><work><work-title>Webern op.10 / generative study</work-title></work><movement-title>Webern op.10 / generative study</movement-title><identification><creator type="composer">Dmitrii Shchukin — computational model</creator></identification><defaults><scaling><millimeters>7</millimeters><tenths>40</tenths></scaling></defaults><part-list>';
 names.forEach((n,i)=>xml+='<score-part id="P'+(i+1)+'"><part-name>'+escape(n)+'</part-name><part-abbreviation>'+escape(n.slice(0,5))+'.</part-abbreviation><score-instrument id="I'+(i+1)+'"><instrument-name>'+escape(n)+'</instrument-name></score-instrument></score-part>');
 xml+='</part-list>';
 for(let voice=1;voice<=10;voice++){
 let ev=events.filter(e=>e.voice===voice).map(e=>({start:quant(e.onsetMs),length:Math.max(unit,quant(e.durationMs)),midi:Math.round(e.pitchCents/100)})).sort((a,b)=>a.start-b.start);
 // Single engraving voice per instrument for this first version.
 let safe=[];for(const e of ev){const prev=safe[safe.length-1];if(prev&&e.start<prev.start+prev.length){if(e.start===prev.start)continue;prev.length=e.start-prev.start}safe.push(e)}
 let items=[];let cursor=0;
 for(const e of safe){if(e.start>=bars*bar)break;if(e.start>cursor)items.push({kind:'rest',start:cursor,length:e.start-cursor});const length=Math.min(e.length,bars*bar-e.start);if(length>0)items.push({kind:'note',start:e.start,length,midi:e.midi});cursor=Math.max(cursor,e.start+length)}
 if(cursor<bars*bar)items.push({kind:'rest',start:cursor,length:bars*bar-cursor});
 const measures=Array.from({length:bars},()=>[]);
 for(const item of items){let remaining=item.length,pos=item.start,first=true;
 while(remaining>0){let b=Math.floor(pos/bar);if(b>=bars)break;let take=Math.min(remaining,bar-pos%bar);
 const chunks=pieces(take);for(let j=0;j<chunks.length;j++){const d=chunks[j];if(item.kind==='rest')measures[b].push(restXML(d));else measures[b].push(noteXML(d,item.midi,(remaining>d),(!first)));remaining-=d;pos+=d;first=false}
 }}
 xml+='<part id="P'+voice+'">';
 for(let b=0;b<bars;b++){xml+='<measure implicit="no" number="'+(b+1)+'">'+(b===0?'<attributes><divisions>'+divisions+'</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>'+clefs[voice-1][0]+'</sign><line>'+clefs[voice-1][1]+'</line></clef></attributes>':'')+measures[b].join('')+'</measure>'}
 xml+='</part>';
 }
 return xml+'</score-partwise>';
};