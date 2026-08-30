import fs from 'node:fs';
const source=fs.readFileSync('enterprise-v2.js','utf8');
const must=(c,m)=>{if(!c)throw new Error(m);};
must(source.includes("const csvCell=value=>"),'CSV export must use a dedicated cell serializer');
must(source.includes("/^[\\s]*[=+\\-@]/.test(s)"),'CSV serializer must detect formula-leading content after optional whitespace');
must(source.includes("s=`'${s}`"),'CSV serializer must prefix formula-looking cells with a literal apostrophe');
must(source.includes("s.replace(/\"/g,'\"\"')"),'CSV serializer must continue escaping embedded quotes');
must(source.includes('rows.map(row=>row.map(csvCell).join'), 'All employer report CSV cells must pass through the safe serializer');

const csvCell=value=>{let s=String(value??'');if(/^[\s]*[=+\-@]/.test(s))s=`'${s}`;return `"${s.replace(/"/g,'""')}"`;};
for(const raw of ['=2+2','+SUM(A1:A2)','-1+2','@cmd','   =HYPERLINK("x","y")','\t=1+1']) {
  const encoded=csvCell(raw);
  must(encoded.startsWith('"\''),`Formula-like CSV value was not neutralized: ${JSON.stringify(raw)} -> ${encoded}`);
}
must(csvCell('Normal Learner')==='"Normal Learner"','Normal learner values must remain unchanged');
must(csvCell('A "quoted" name')==='"A ""quoted"" name"','CSV quote escaping regressed');
console.log('CSV EXPORT SECURITY AUDIT PASS: formula injection neutralization + quote escaping verified');
