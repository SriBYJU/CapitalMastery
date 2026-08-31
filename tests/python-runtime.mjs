import { spawnSync } from 'node:child_process';

function available(command,args=[]) {
  const probe=spawnSync(command,[...args,'-c','import sys;print(sys.executable)'],{encoding:'utf8'});
  return probe.status===0;
}

export function spawnPython(args,options={}) {
  const configured=process.env.CM_PYTHON;
  const candidates=configured
    ? [[configured,[]]]
    : process.platform==='win32'
      ? [['python',[]],['py',['-3']],['python3',[]]]
      : [['python3',[]],['python',[]]];
  for(const [command,prefix] of candidates) {
    if(!available(command,prefix)) continue;
    return spawnSync(command,[...prefix,...args],options);
  }
  return {status:127,stdout:'',stderr:'No Python 3 runtime found. Set CM_PYTHON to an absolute Python 3 executable path.'};
}
