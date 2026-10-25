import assert from 'node:assert/strict';
import test from 'node:test';
import {build} from 'esbuild';
import {Module} from 'node:module';
const built=await build({stdin:{contents:`import React from 'react'; import {renderToStaticMarkup} from 'react-dom/server'; import {RoundComparisonChart} from './app/dashboard/round-comparison-chart.tsx'; export {confirmationRate,confirmationRateLabel} from './app/data/confirmation-rate.ts'; export function render(rounds){return renderToStaticMarkup(React.createElement(RoundComparisonChart,{rounds,years:[2569]}));}`,resolveDir:process.cwd()},bundle:true,platform:'node',format:'cjs',write:false,plugins:[{name:'link',setup(p){p.onResolve({filter:/^next\/link$/},()=>({path:'link',namespace:'mock'}));p.onLoad({filter:/.*/,namespace:'mock'},()=>({resolveDir:process.cwd(),contents:"import React from 'react';export default function Link(props){return React.createElement('a',props)}"}));}}]});
const compiled=new Module(process.cwd()+'/tests/rate-render.cjs');compiled.paths=Module._nodeModulePaths(process.cwd());compiled._compile(built.outputFiles[0].text,compiled.filename=process.cwd()+'/tests/rate-render.cjs');
const {confirmationRate,confirmationRateLabel,render}=compiled.exports;
test('confirmation percentage uses eligible people and handles absent denominators',()=>{
 assert.equal(confirmationRateLabel(confirmationRate(63,107)),'58.88%');
 assert.equal(confirmationRateLabel(confirmationRate(283,318)),'88.99%');
 for(const eligible of [0,undefined])assert.equal(confirmationRateLabel(confirmationRate(1,eligible)),'ไม่มีฐานคำนวณ');
});
test('round tooltip adds eligible conversion without changing applicant totals',()=>{
 const row={year:2569,code:'TCAS3',name:'Admission',applicants:1620,eligible:318,confirmed:283,choices:2000,files:1,rate:17.47};
 const html=render([row]);
 assert.match(html,/ยืนยันสิทธิ์: 283 คน \(88\.99% ต่อผู้มีสิทธิ์\)/);
 assert.match(html,/ผู้สมัคร: 1,620 คน/);
 assert.match(html,/ผู้มีสิทธิ์: 318 คน/);
 assert.doesNotMatch(html,/17\.47% ต่อผู้มีสิทธิ์/);
 const empty=render([{...row,eligible:0}]);
 assert.match(empty,/ไม่มีฐานคำนวณ ต่อผู้มีสิทธิ์/);
 assert.doesNotMatch(empty,/NaN|Infinity/);
});
