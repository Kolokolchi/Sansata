import {ExperienceConfig,fallbackConfig} from './experience';
const object=(v:unknown):v is Record<string,any>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const string=(v:unknown):v is string=>typeof v==='string'&&v.length>0;
const url=(v:unknown):v is string=>string(v)&&(/^\/(?!\/)/.test(v)||/^https:\/\//.test(v));
const positive=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v)&&v>0;
/** Reject malformed content as a unit; keep the public catalogue usable. */
export function parseExperience(value:unknown):ExperienceConfig {
 if(!object(value)||value.version!==1)throw Error('Unsupported experience configuration');
 const c:Record<string,any>={...fallbackConfig,...value};
 if(!object(c.model)||!(c.model.url===null||url(c.model.url))||!string(c.model.label)||!positive(c.model.scale))throw Error('Invalid model');
 for(const key of ['panoramas','constructionAlbums','cameras','documents','inventory'])if(!Array.isArray(c[key]))throw Error('Invalid '+key);
 if(!c.panoramas.every((p:any)=>object(p)&&string(p.id)&&string(p.title)&&url(p.src)&&(!p.poster||url(p.poster))&&(!p.links||Array.isArray(p.links)&&p.links.every((l:any)=>object(l)&&string(l.target)&&Number.isFinite(l.yaw)&&Number.isFinite(l.pitch)&&Math.abs(l.pitch)<=90))))throw Error('Invalid panorama');
 const ids=c.panoramas.map((p:any)=>p.id);
 if(new Set(ids).size!==ids.length||c.panoramas.some((p:any)=>p.links?.some((l:any)=>!ids.includes(l.target))))throw Error('Invalid panorama links');
 if(!c.constructionAlbums.every((a:any)=>object(a)&&string(a.id)&&string(a.title)&&string(a.date)&&Array.isArray(a.images)&&a.images.length>0&&a.images.every(url)))throw Error('Invalid album');
 if(!c.cameras.every((a:any)=>object(a)&&string(a.id)&&string(a.title)&&url(a.url)))throw Error('Invalid camera');
 if(!c.documents.every((a:any)=>object(a)&&string(a.id)&&string(a.title)&&string(a.category)&&url(a.url)))throw Error('Invalid document');
 c.inventory=c.inventory.map((p:any)=>{
  if(!object(p)||!string(p.id))throw Error('Invalid inventory id');
  const out:Record<string,unknown>={id:p.id};
  for(const key of ['area','price'])if(key in p){if(p[key]!==null&&!positive(p[key]))throw Error('Invalid '+key);out[key]=p[key];}
  if('status' in p){if(!['unknown','available','reserved','sold'].includes(p.status))throw Error('Invalid status');out.status=p.status;}
  if('areaKind' in p){if(!['official','calculated'].includes(p.areaKind))throw Error('Invalid areaKind');out.areaKind=p.areaKind;}
  return out;
 });
 if(!url(c.leadEndpoint)||!url(c.source))throw Error('Invalid endpoint');
 return c as ExperienceConfig;
}

