import { appendFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
export function validateLead(value){
 if(!value||typeof value!=='object')return {error:'Некорректная заявка.'};
 const name=String(value.name||'').trim();const phone=String(value.phone||'').replace(/\D/g,'');const topic=String(value.topic||'Консультация').trim();
 if(name.length<2||name.length>80||/[<>\x00-\x1f]/.test(name))return {error:'Введите имя от 2 до 80 символов.'};
 if(!/^[78]\d{10}$/.test(phone))return {error:'Укажите номер в формате +7 и 10 цифр.'};
 if(value.consent!==true)return {error:'Подтвердите согласие на локальное сохранение заявки.'};
 if(topic.length>600)return {error:'Слишком длинный запрос.'};
 return {value:{name,phone:'+7'+phone.slice(1),topic,consent:true,createdAt:new Date().toISOString()}};
}
export function leadMiddleware({file=resolve('.local/leads.ndjson'),rateLimit=20}={}){
 const limits=new Map();const received=new Map();
 return async function(req,res,next){
 if(req.url?.split('?')[0]!=='/api/leads')return next?.();
 res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');
 const reply=(code,body)=>{res.statusCode=code;res.end(JSON.stringify(body));};
 if(req.method!=='POST')return reply(405,{error:'Используйте POST.'});
 if(req.headers.origin){try{if(new URL(req.headers.origin).host!==req.headers.host)return reply(403,{error:'Недопустимый источник запроса.'});}catch{return reply(403,{error:'Недопустимый источник запроса.'});}}
 if(!req.headers['content-type']?.includes('application/json'))return reply(415,{error:'Требуется JSON.'});
 const now=Date.now();for(const[k,v]of limits)if(now-v.start>3600000)limits.delete(k);for(const[k,v]of received)if(now-v.time>3600000)received.delete(k);
 const ip=req.socket.remoteAddress||'local';const limit=limits.get(ip)||{start:now,count:0};if(limit.count>=rateLimit)return reply(429,{error:'Слишком много запросов. Попробуйте позднее.'});
 let raw='';try{for await(const chunk of req){raw+=chunk.toString();if(Buffer.byteLength(raw)>8192)return reply(413,{error:'Запрос слишком большой.'});}const body=JSON.parse(raw);if(!body||typeof body!=='object'||Array.isArray(body))return reply(400,{error:'Некорректная заявка.'});if(body.website)return reply(400,{error:'Некорректная заявка.'});const parsed=validateLead(body);if(parsed.error)return reply(400,{error:parsed.error});const key=String(body.requestId||'');if(key&&!/^[a-zA-Z0-9-]{8,80}$/.test(key))return reply(400,{error:'Некорректный идентификатор.'});if(key&&received.has(key))return reply(200,received.get(key).result);
 const lead={id:randomUUID(),...parsed.value};await mkdir(dirname(file),{recursive:true});await appendFile(file,JSON.stringify(lead)+'\n',{encoding:'utf8',mode:0o600});limits.set(ip,{...limit,count:limit.count+1});const result={id:lead.id,mode:'local',message:'Заявка сохранена на локальном сервере. В отдел продаж Sensata она не отправлена.'};if(key)received.set(key,{time:now,result});return reply(201,result);
 }catch(error){if(error instanceof SyntaxError)return reply(400,{error:'Некорректный JSON.'});return reply(500,{error:'Не удалось сохранить заявку. Попробуйте позже или позвоните 700.'});}
 };
}
