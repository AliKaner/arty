import {existsSync,writeFileSync,chmodSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {spawnSync} from 'node:child_process';
// Never embed this key in VITE_* variables or browser bundles.
const file='.env.admin.local';
if(!existsSync(file)){writeFileSync(file,`ATELIER_ADMIN_KEY=${randomBytes(32).toString('base64url')}\n`,{mode:0o600});}
chmodSync(file,0o600);
for(const args of [[],['--prod']]){
 const result=spawnSync('npx',['convex','env','set','--from-file',file,...args],{encoding:'utf8'});
 if(result.status!==0){console.error('Admin yapılandırması başarısız. Mevcut anahtar farklı olabilir; üzerine yazılmadı.');process.exit(1)}
 console.log(`${args.length?'Production':'Development'} stüdyo anahtarı yapılandırıldı.`);
}
console.log('Anahtar .env.admin.local içinde saklanıyor (git dışında).');
