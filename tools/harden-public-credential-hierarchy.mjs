import fs from 'node:fs';

const path='public-certificate-verify.js';
let text=fs.readFileSync(path,'utf8');
function once(from,to,label){const i=text.indexOf(from);if(i<0)throw new Error(`Missing patch target: ${label}`);if(text.indexOf(from,i+from.length)>=0)throw new Error(`Ambiguous patch target: ${label}`);text=text.slice(0,i)+to+text.slice(i+from.length);}
function regexOnce(re,to,label){const flags=re.flags.includes('g')?re.flags:re.flags+'g';const matches=[...text.matchAll(new RegExp(re.source,flags))];if(matches.length!==1)throw new Error(`${label}: expected one match, found ${matches.length}`);text=text.replace(re,to);}

regexOnce(/  function levelInfo\(level\) \{[\s\S]*?\n  \}/,`  function levelInfo(level) {
    const key = String(level || '').toLowerCase();
    const levels = {
      foundations: {
        className: 'simple',
        label: 'Foundations Credential',
        description: 'for demonstrating the required career foundations, role context and technical core under the Capital Mastery Standard.'
      },
      essentials: {
        className: 'simple',
        label: 'Essentials Credential',
        description: 'for applying the taught foundations in the required secure mini case and meeting the Capital Mastery mastery standard.'
      },
      applied: {
        className: 'applied',
        label: 'Applied Skills Credential',
        description: 'for completing the required professional toolkit, guided practice and independent applied work under the Capital Mastery Standard.'
      },
      career: {
        className: 'career-skills',
        label: 'Career Skills Certificate',
        description: 'for completing the shorter practical Career Skills program, including Foundations, Essentials, Applied Skills and the required role-specific capstone simulation.'
      },
      role_lab: {
        className: 'applied',
        label: 'Role Lab Credential',
        description: 'for completing the advanced role-specific professional simulation, required work products and review/revision cycle under the Capital Mastery Standard 2.0.'
      },
      professional_readiness: {
        className: 'professional-readiness',
        label: 'Professional Readiness Credential',
        description: 'for demonstrating the full required technical, applied, Role Lab and professional-final evidence for the career under the Capital Mastery Standard 2.0.'
      }
    };
    return levels[key] || {
      className: '',
      label: 'Capital Mastery Credential',
      description: 'for completing the evidence requirements associated with this verified Capital Mastery credential.'
    };
  }`,'credential level map');
once("    const isCareer = String(c.level || '').toLowerCase() === 'career';","    const levelKey = String(c.level || '').toLowerCase();\n    const isCareer = levelKey === 'career';\n    const isProfessional = levelKey === 'professional_readiness';\n    const isFlagship = isCareer || isProfessional;",'flagship credential detection');
once("${isCareer ? '<img class=\"cert-seal\" src=\"assets/seal.svg\" alt=\"Capital Mastery seal\">' : ''}","${isFlagship ? '<img class=\"cert-seal\" src=\"assets/seal.svg\" alt=\"Capital Mastery seal\">' : ''}",'flagship seal');
once("This certificate is ${isCareer ? 'proudly ' : ''}awarded to","This certificate is ${isFlagship ? 'proudly ' : ''}awarded to",'flagship awarded copy');
once("${esc(c.title.replace(/ Certificate$/i, '').replace(/ Career Certificate$/i, ''))}","${esc(String(c.title||'').replace(/ Career Skills Certificate$/i,'').replace(/ Professional Readiness Credential$/i,'').replace(/ Role Lab Credential$/i,'').replace(/ (Foundations|Essentials|Applied Skills) (Credential|Certificate)$/i,'').replace(/ Certificate$/i,''))}",'certificate subject title');

fs.writeFileSync(path,text);
console.log('Public credential hierarchy hardening applied.');
