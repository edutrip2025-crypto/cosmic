const body=document.body;
const root=document.documentElement;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const progress=document.createElement('div');
progress.className='page-progress';progress.setAttribute('aria-hidden','true');
const wash=document.createElement('div');wash.className='page-wash';wash.setAttribute('aria-hidden','true');
body.prepend(progress,wash);
let ticking=false;
function update(){root.style.setProperty('--page-progress',Math.min(1,scrollY/Math.max(1,root.scrollHeight-innerHeight)));ticking=false}
addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(update)}},{passive:true});update();
const sections=document.querySelectorAll('.content-reveal');
if(!reduced&&'IntersectionObserver' in window){
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('in-view');observer.unobserve(entry.target)}}),{threshold:.06});
 sections.forEach(section=>observer.observe(section));body.classList.add('motion-ready');
}else sections.forEach(section=>section.classList.add('in-view'));
document.querySelectorAll('a[href]').forEach(link=>link.addEventListener('click',event=>{
 if(reduced||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.altKey||event.shiftKey||link.target||link.hasAttribute('download'))return;
 const url=new URL(link.href,location.href);
 if(!['http:','https:'].includes(url.protocol)||url.origin!==location.origin||url.pathname===location.pathname)return;
 event.preventDefault();body.classList.add('is-leaving');setTimeout(()=>location.assign(url.href),280);
}));
addEventListener('pageshow',()=>body.classList.remove('is-leaving'));
