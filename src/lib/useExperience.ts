import {siteUrl} from './site';
import {useEffect,useState} from 'react';
import {ExperienceConfig,fallbackConfig,flats,Flat} from './experience';
import {parseExperience} from './config';
export function useExperience(){const [config,setConfig]=useState(fallbackConfig);const [warning,setWarning]=useState('');useEffect(()=>{const controller=new AbortController();fetch(siteUrl('/experience.json'),{signal:controller.signal}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(v=>{setConfig(parseExperience(v));}).catch(e=>{if(e.name!=='AbortError')setWarning('Дополнительные материалы временно недоступны. Основной каталог работает.');});return()=>controller.abort();},[]);const inventory=flats.map(f=>{const patch=config.inventory.find(p=>p.id===f.id);return patch?{...f,...patch}:f;}) as Flat[];return{config,inventory,warning};}

