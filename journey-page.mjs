export function journeyPage(html){
html=html.replace('<button data-view="vehicle">01 Vehicle</button>','').replace('02 RF network','RF network').replace('03 World model','World model');
if(!html.includes('COSMIC / DISTRIBUTED PERCEPTION'))return html;
const start=html.indexOf('<section class="intro">'),end=html.indexOf('<section class="editorial"');
return html.slice(0,start)+`<section class="journey" id="journey"><div class="journey-sticky">
<div class="scene-shell"><canvas id="rf-scene" aria-label="Cosmic RF perception concept. Explore the vision."></canvas></div>
<div class="journey-copy"><span class="eyebrow" id="chapter-label">COSMIC / A NEW ERA</span><h1 id="chapter-title">Welcome to the future<br>of autonomous mobility.</h1><p id="chapter-copy">The hardest challenges in autonomy happen at the edge of perception. Cosmic builds intelligent roadside infrastructure that sees what vehicles cannot.</p></div>
<div class="scene-label" id="node-label">Cosmic perception node</div><div class="scene-label" id="car-label">Autonomous vehicle</div>
<div class="journey-bottom"><div><span id="scene-status" aria-live="polite">Loading the journey...</span><p><a href="#explore">Skip introduction ↗</a></p></div><button id="pause" type="button">Pause</button></div>
<div class="journey-progress"><span id="journey-fill"></span></div>
<span class="journey-disclaimer">Concept visualization • Illustrative RF coverage</span>
</div></section>`+html.slice(end);
}