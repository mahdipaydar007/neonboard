import { useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { FileText, Plus, Search, Trash2, Eye, PenLine } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

function inlineMarkdown(text:string):ReactNode[]{
 const pattern=/(`[^`]+`|\*\*[^*]+\*\*|~~[^~]+~~|\*[^*]+\*|https?:\/\/[^\s]+)/g;
 return text.split(pattern).filter(Boolean).map((part,i)=>{
  if(part.startsWith('**')&&part.endsWith('**'))return <strong key={i}>{part.slice(2,-2)}</strong>;
  if(part.startsWith('~~')&&part.endsWith('~~'))return <del key={i}>{part.slice(2,-2)}</del>;
  if(part.startsWith('*')&&part.endsWith('*'))return <em key={i}>{part.slice(1,-1)}</em>;
  if(part.startsWith('`')&&part.endsWith('`'))return <code key={i}>{part.slice(1,-1)}</code>;
  if(part.startsWith('http://')||part.startsWith('https://'))return <a key={i} href={part} target="_blank" rel="noreferrer">{part}</a>;
  return part;
 });
}
function MarkdownPreview({source}:{source:string}){
 const lines=source.split('\n');const blocks:ReactNode[]=[];let list:string[]=[];let listKind:'ul'|'ol'='ul';let inCode=false;let code:string[]=[];
 const flushList=()=>{if(list.length){const Tag=listKind;blocks.push(<Tag key={`list-${blocks.length}`}>{list.map((item,i)=><li key={i}>{inlineMarkdown(item)}</li>)}</Tag>);list=[];}};
 lines.forEach((line,index)=>{
  if(line.trim().startsWith('```')){flushList();if(inCode){blocks.push(<pre key={`code-${index}`}><code>{code.join('\n')}</code></pre>);code=[];inCode=false;}else inCode=true;return;}
  if(inCode){code.push(line);return;}
  if(/^\s*[-*+]\s+/.test(line)){if(list.length&&listKind!=='ul')flushList();listKind='ul';list.push(line.replace(/^\s*[-*+]\s+/,''));return;}
  if(/^\s*\d+\.\s+/.test(line)){if(list.length&&listKind!=='ol')flushList();listKind='ol';list.push(line.replace(/^\s*\d+\.\s+/,''));return;}
  flushList();
  if(/^\s*(---|\*\*\*)\s*$/.test(line)){blocks.push(<hr key={index}/>);return;}
  if(!line.trim()){blocks.push(<div className="markdown-gap" key={`gap-${index}`}/>);return;}
  const heading=line.match(/^(#{1,3})\s+(.*)$/);if(heading){const content=inlineMarkdown(heading[2]);const Tag=heading[1].length===1?'h1':heading[1].length===2?'h2':'h3';blocks.push(<Tag key={index}>{content}</Tag>);return;}
  if(line.startsWith('> ')){blocks.push(<blockquote key={index}>{inlineMarkdown(line.slice(2))}</blockquote>);return;}
  blocks.push(<p key={index}>{inlineMarkdown(line)}</p>);
 });
 flushList();if(inCode)blocks.push(<pre key="unclosed-code"><code>{code.join('\n')}</code></pre>);
 return <div className="markdown-preview">{blocks.length?blocks:<p className="markdown-placeholder">Nothing to preview yet. Start writing in Markdown.</p>}</div>;
}
export function Notes(){
 const notes=useAppStore(s=>s.notes),addNote=useAppStore(s=>s.addNote),updateNote=useAppStore(s=>s.updateNote),deleteNote=useAppStore(s=>s.deleteNote);
 const [active,setActive]=useState<string|null>(notes[0]?.id??null),[search,setSearch]=useState(''),[preview,setPreview]=useState(false);
 const current=notes.find(n=>n.id===active);
 function create(){addNote({title:'Untitled note',body:''});const latest=useAppStore.getState().notes[0];setActive(latest.id);setPreview(false);}
 const visible=notes.filter(n=>(n.title+n.body).toLowerCase().includes(search.toLowerCase()));
 return <motion.div className="page-stack" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}><div className="page-heading"><div><p className="eyebrow">THINK IT THROUGH, KEEP IT CLOSE</p><h1>Notes<span className="heading-period">.</span></h1><p className="page-subtitle">A quiet place for ideas, plans and everything worth remembering. Markdown is supported.</p></div><button className="button button-primary" onClick={create}><Plus size={16}/>New note</button></div>
  <section className="notes-workspace surface-card"><aside className="notes-list"><label className="inline-search"><Search size={15}/><input placeholder="Find a note" value={search} onChange={e=>setSearch(e.target.value)}/></label>{visible.map(n=><button key={n.id} className={`note-list-item ${active===n.id?'active':''}`} onClick={()=>{setActive(n.id);setPreview(false);}}><FileText size={16}/><span><strong data-user-content>{n.title||'Untitled note'}</strong><small data-user-content>{n.body.slice(0,66)||'No additional text'}</small></span></button>)}{!visible.length&&<p className="notes-empty">No notes yet. Create one to get started.</p>}</aside>
  <div className="note-editor">{current?<><div className="note-editor-actions"><span>Saved automatically on this device</span><div><div className="segmented"><button type="button" className={!preview?'selected':''} onClick={()=>setPreview(false)}><PenLine size={14}/> Write</button><button type="button" className={preview?'selected':''} onClick={()=>setPreview(true)}><Eye size={14}/> Preview</button></div><button className="icon-button danger-hover" onClick={()=>{if(window.confirm('Delete this note?')){deleteNote(current.id);setActive(notes.find(n=>n.id!==current.id)?.id??null);}}} aria-label="Delete note"><Trash2 size={15}/></button></div></div><input className="note-title-input" value={current.title} onChange={e=>updateNote(current.id,{title:e.target.value})} placeholder="Note title"/>{preview?<MarkdownPreview source={current.body}/>:<textarea className="note-body-input" value={current.body} onChange={e=>updateNote(current.id,{body:e.target.value})} placeholder={'Start writing in Markdown…\n\n# Heading\n- List item\n**Bold text** · *Italic text* · `code`'} />}</>:<div className="empty-state"><FileText size={24}/><strong>Select a note</strong><p>Choose a note from the list or create a new one.</p></div>}</div></section>
 </motion.div>;
}
