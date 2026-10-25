import assert from 'node:assert/strict';
import test from 'node:test';
import { build } from 'esbuild';
import { Module } from 'node:module';
const built=await build({stdin:{contents:`import React from 'react'; import {renderToStaticMarkup} from 'react-dom/server'; import {RightsOutcomesChart,rightsStatusTotal} from './app/dashboard/rights-outcomes-chart.tsx'; import {MajorRightsChart} from './app/major-rights-chart.tsx'; import {RoundRightsDonuts} from './app/round-rights-donuts.tsx'; export {rightsStatusTotal}; export function render(kind,props){return renderToStaticMarkup(React.createElement({history:RightsOutcomesChart,major:MajorRightsChart,round:RoundRightsDonuts}[kind],props));}`,resolveDir:process.cwd()},bundle:true,platform:'node',format:'cjs',write:false});
const compiled=new Module(process.cwd()+'/tests/rights-render.cjs');
compiled.paths=Module._nodeModulePaths(process.cwd());
compiled._compile(built.outputFiles[0].text,compiled.filename=process.cwd()+'/tests/rights-render.cjs');
const {render,rightsStatusTotal}=compiled.exports;
const row={year:2569,code:'1',eligible:79,confirmed:51,resigned:1,unused:3,inactive:2,elsewhere:23,other:0,multiple:1};
const major={majorKey:'1',year:2569,name:'วิศวกรรมเครื่องกล',type:'ภาคปกติ',code:'ME',applicants:521,confirmed:51,eligible:79,choices:600,rate:0,avgScore:0};
test('stack total counts overlapping status memberships, while eligible remains distinct',()=>{
 assert.equal(rightsStatusTotal(row),80);
 const html=render('history',{rows:[row],rounds:[{code:'1',name:'เครื่องกล'}],years:[2569],majorName:'เครื่องกล'});
 assert.match(html,/ผู้มีสิทธิ์ไม่ซ้ำ 79 คน/);
 assert.match(html,/ผลรวมแยกสถานะ 80/);
 assert.match(html,/ยืนยันสิทธิ์: 51 คน/);
 assert.match(html,/ไม่ใช้สิทธิ์: 3 คน/);
 assert.match(html,/นับซ้ำข้ามสถานะ/);
 assert.match(html,/<svg/);
});
test('stack shares use the status sum, not the distinct eligible denominator',()=>{
 const html=render('history',{rows:[row],rounds:[{code:'1',name:'เครื่องกล'}],years:[2569],majorName:'เครื่องกล'});
 assert.match(html,/63\.8% ของผลรวมสถานะ/);
 assert.doesNotMatch(html,/64\.6%/);
 const empty={...row,eligible:0,confirmed:0,resigned:0,unused:0,inactive:0,elsewhere:0,other:0,multiple:0};
 assert.equal(rightsStatusTotal(empty),0);
 assert.doesNotMatch(render('history',{rows:[empty],rounds:[{code:'1',name:'เครื่องกล'}],years:[2569],majorName:'เครื่องกล'}),/NaN|Infinity/);
});
test('annual major and round views distinguish status sums from actual people',()=>{
 const html=render('major',{rows:[row],majors:[major],year:2569});
 assert.match(html,/ผลรวมแยกสถานะ 80/);
 assert.match(html,/ผู้มีสิทธิ์ไม่ซ้ำ 79 คน/);
 assert.match(html,/ของผลรวมสถานะ/);
 const round=render('round',{rows:[{...row,code:'TCAS1'}],rounds:[{year:2569,code:'TCAS1',name:'Portfolio'}],year:2569});
 assert.match(round,/ผู้มีสิทธิ์ไม่ซ้ำ 79 คน/);
 assert.match(round,/ผลรวมแยกสถานะ 80/);
 assert.match(round,/นับซ้ำข้ามสถานะ/);
});
