import fs from 'node:fs';

const cssPath='learner-guide.css';
const indexPath='index.html';
let css=fs.readFileSync(cssPath,'utf8');
let index=fs.readFileSync(indexPath,'utf8');

const marker='/* Failure-seeking mobile containment */';
if(!css.includes(marker)) {
  css += `\n\n${marker}\n` +
`.cm-learner-guide-shell,.cm-learner-guide-nav,.cm-learner-guide-panels,.cm-learner-guide-panel,.cm-guide-workbook,.cm-guide-case-update,.cm-guide-role-card{min-width:0;max-width:100%}\n`+
`.cm-learner-guide-panel{overflow:hidden}\n`+
`.cm-learner-guide-nav button{min-width:0;grid-template-columns:38px minmax(0,1fr)}\n`+
`.cm-learner-guide-nav button div,.cm-learner-guide-nav button b,.cm-learner-guide-nav button small{min-width:0;overflow-wrap:anywhere}\n`+
`.cm-guide-career-picker,.cm-guide-career-picker select{min-width:0;max-width:100%;width:100%}\n`+
`.cm-guide-workbook{overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;overscroll-behavior-inline:contain}\n`+
`.cm-guide-workbook-title,.cm-guide-workbook-ribbon,.cm-guide-workbook-formula,.cm-guide-workbook-tabs{max-width:100%}\n`+
`.cm-guide-workbook-title>*{min-width:0;overflow-wrap:anywhere}\n`+
`@media(max-width:980px){\n`+
`  .cm-learner-guide-hero>.container,.cm-learner-guide-shell{grid-template-columns:minmax(0,1fr)}\n`+
`  .cm-learner-guide-nav{grid-template-columns:repeat(2,minmax(0,1fr))}\n`+
`}\n`+
`@media(max-width:640px){\n`+
`  .cm-learner-guide-nav{grid-template-columns:minmax(0,1fr)}\n`+
`  .cm-learner-guide-panel{padding:16px}\n`+
`  .cm-guide-workbook{width:100%}\n`+
`  .cm-guide-workbook table{min-width:520px}\n`+
`  .cm-guide-learning-loop>div,.cm-guide-case-update,.cm-guide-role-card{min-width:0}\n`+
`  .cm-guide-learning-loop b,.cm-guide-learning-loop small,.cm-guide-case-update *,.cm-guide-role-card *{overflow-wrap:anywhere}\n`+
`}\n`;
}

const oldVersions=['learner-guide.css?v=20260830-guided2','learner-guide.css?v=20260830-stability3'];
const newVersion='learner-guide.css?v=20260830-stability4';
let replaced=false;
for(const oldVersion of oldVersions){
  if(index.includes(oldVersion)) {
    index=index.replace(oldVersion,newVersion);
    replaced=true;
    break;
  }
}
if(!replaced && !index.includes(newVersion)) throw new Error('Learner guide stylesheet cache-bust target not found');

fs.writeFileSync(cssPath,css);
fs.writeFileSync(indexPath,index);
console.log('Learner Guide mobile grid containment applied.');
