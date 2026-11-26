'use strict';
const app=document.getElementById('app'),modal=document.getElementById('modal');
const KEY='lantian-phase2-v1';
let saved={};try{saved=JSON.parse(localStorage.getItem(KEY)||'{}')}catch{}
let state={page:'home',goods:saved.goods||'原料',mode:saved.mode||'seq',step:saved.step||0,checks:saved.checks||{},visited:saved.visited||[],last:!!saved.last,role:'送货司机'};
const likedSteps=new Set();
let feedbackReasons=new Set();
let returnPage='home',samplePage=1,locationOrigin=0;
const nodes=window.DELIVERY_NODES;
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function persist(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}}
function button(text,action,cls='button secondary'){return '<button class="'+cls+'" data-action="'+action+'">'+text+'</button>'}
function go(page){state.page=page;render()}
function title(name,sub='中化蓝天陕西基地'){return '<header><div class="top">'+button('‹ 返回','back','text-button')+'<strong>'+name+'</strong>'+button('首页','home','text-button')+'</div><div class="eyebrow">'+sub+'</div></header>'}
function stepData(){
 if(state.goods==='原料')return nodes[state.step];
 const packaging=state.goods==='包装物';
 return {...nodes[state.step],warn:['装车前确认送货资料、包装及车辆状态。','请向物资对接人确认本次送货预约方式。','按对接人要求确认到厂时间与卸货地点。','服从门岗登记和现场通行管理。','按指定位置等待，服从现场人员指挥。','确认签收单据，按指定路线离厂。'][state.step],
 list:[
 [packaging?'核对瓶子、盖子或回收空罐清单':'核对设备、安装材料等送货清单','备齐送货单和对接人联系方式','确认车辆与物资包装状态'],
 ['确认是否需要关卡预约','与物资对接人确认入园要求'],
 ['确认到厂时间','向对接人确认卸货区域和排队安排'],
 ['准备送货单与人员车辆信息','按门岗要求登记'],
 ['确认物资接收人与卸货地点','按现场要求配合装卸'],
 ['确认签收和单据交接','按现场要求完成离厂检查']
 ][state.step].map(t=>({t})),
 req:['按客户正式送货要求执行','专项要求待客户补充'],posTodo:'该类物资的实际办理地点待客户补充',book:null,faq:[],reqSample:null};
}
function openStep(i){if(!navigator.onLine&&!state.visited.includes(state.goods+':'+i)){show('<h2>本环节尚未缓存</h2><p>请联网查看后再离线使用。</p>');return}state.step=i;state.last=true;const k=state.goods+':'+i;if(!state.visited.includes(k))state.visited.push(k);persist();go('step')}
function progress(){
 return '<nav class="progress ordered-progress" aria-label="送货流程步骤">'+nodes.map((n,i)=>{
 const status=i===state.step?'active':i<state.step?'completed':'upcoming';
 return '<button data-action="jump" data-index="'+i+'" aria-label="第'+(i+1)+'步 '+escape(n.name)+'" aria-current="'+(i===state.step?'step':'false')+'" class="'+status+'"><span class="step-dot">'+n.n+'</span><span class="step-caption">'+escape(n.short)+'</span></button>';
 }).join('')+'</nav>';
}

function shell(header,body,footer=''){app.innerHTML=(!navigator.onLine?'<div class="offline">当前离线 · 已浏览的固定内容可查看，文字问答需联网</div>':'')+header+'<section class="scroll">'+body+'</section>'+footer}
function windowIcon(name){return window.UI_ICONS[name]||window.UI_ICONS.info}
function artwork(name,cls=''){return '<img class="artwork '+cls+'" src="素材/视觉/'+name+'.png" alt="" draggable="false">'}
function intro(heading,description,asset='assistant'){return '<div class="page-intro"><div><h1>'+heading+'</h1><p>'+description+'</p></div>'+artwork(asset)+'</div>'}
function ahfPreparation(){
 const d=window.AHF_PREPARATION;
 const sampleButton=key=>'<button class="requirement-link" data-action="page1-sample" data-sample="'+key+'" aria-label="查看对应要求样图">'+windowIcon('info')+'样图<span class="requirement-chevron">›</span></button>';
 const requirementRow=(number,text,action)=>'<div class="preparation-row"><span class="check-number">'+number+'</span><div class="preparation-content"><p>'+escape(text)+'</p></div>'+action+'</div>';
 const mapUrl='https://uri.amap.com/search?keyword='+encodeURIComponent(d.address)+'&callnative=1';
 return '<div class="page1-utilities">'+button('切换物资','change-goods','text-button')+button(windowIcon('shield')+'入厂必看','safety','text-button')+'</div>'+
 '<div class="preparation-heading"><h2>出发前，逐项核对</h2><p>穿戴、车辆和单据，准备齐全再出发</p></div>'+
 '<section class="card preparation-group"><h3>'+windowIcon('shield')+'PPE（穿戴）</h3>'+requirementRow(1,d.ppe,sampleButton('ppe'))+'</section>'+
 '<section class="card preparation-group"><h3>'+windowIcon('truck')+'车辆 / 驾驶员</h3>'+
 requirementRow(2,'随车配备灭火器且在有效期内',sampleButton('extinguisher'))+
 requirementRow(3,'配备阻火器并正确安装',sampleButton('fire'))+
 requirementRow(4,d.vehicle[1],sampleButton('identity'))+'</section>'+
 '<section class="card preparation-group"><h3>'+windowIcon('box')+'随车资料</h3>'+requirementRow(5,'合格证',sampleButton('certificate'))+requirementRow(6,'检测报告',sampleButton('report'))+requirementRow(7,'危险货物道路运输单',sampleButton('transport'))+'</section>'+
 '<section class="card preparation-group"><h3>'+windowIcon('pin')+'位置</h3>'+
 requirementRow(8,d.vehicle[2],'<a class="requirement-link" href="'+mapUrl+'" target="_blank" rel="noopener">'+windowIcon('pin')+'导航<span class="requirement-chevron">›</span></a>')+
 '<div class="delivery-address"><span>送货地址</span><p>'+escape(d.address)+'</p></div></section>'+
 '<section class="page1-reminder">'+windowIcon('info')+'<div><h3>高频易错问题提醒</h3><p>'+escape(d.reminder)+'</p></div></section>'+
 '<section class="card"><h3>高频问题</h3>'+d.faq.map(x=>'<details><summary><span class="faq-code">'+x.id+'</span>'+escape(x.q)+'</summary><p>'+escape(x.a)+'</p></details>').join('')+'</section>'+
 '<p class="page1-help">没找到答案？点击底部「未解决，联系负责人」。</p>';
}
function page1Sample(key){
 const samples={
 certificate:{title:'合格证',file:'合格证示意完整版.png'},
 report:{title:'检测报告',file:'检测报告示意完整版.png'},
 transport:{title:'危险货物道路运输单',file:'危险货物道路运输单示意完整版.png'},
 extinguisher:{title:'随车配备灭火器且在有效期内',file:'随车灭火器检查示意.png',note:''},
 fire:{title:'配备阻火器并正确安装',file:'阻火器规范安装示意.png',note:'客户提供的阻火器规范安装样图。灭火器及有效期核验样图待补充。'},
 identity:{title:'车辆标识与实物一致',file:'车辆标识与实物一致.png',note:''},
 documents:{title:'合格证 / 检测报告',file:'合格证.png',note:'客户提供的合格证样图。SCM发货单样图待补充。'},
 ppe:{title:'安全帽、长衣长袖、包面鞋',file:'PPE规范穿戴示意.png',note:'客户提供的 PPE 穿戴样图。'}
 };
 const item=samples[key];if(!item)return;
 const url='素材/页面1/'+item.file;
 show('<h2>'+escape(item.title)+'</h2><a href="'+url+'" target="_blank" rel="noopener" aria-label="打开原图"><img class="doc-img page1-sample-image" src="'+url+'" alt="'+escape(item.title)+'"></a>');
 modal.dataset.kind='sample';
}
let ahfTutorialState={page:2,index:0};
const ahfTutorialPages={2:[1],3:[6,7,8,9,10,11,12,13],4:[3],5:[4,5],6:[5]};
function ahfFlowPage(){
 const page=state.step+1,d=window.AHF_FLOW_PAGES[page];
 const primaryLabels={2:'关卡预约',3:'卸车预约 / 排队叫号',4:'入厂登记指引',5:'卸车区 / 休息室导航',6:'离厂交卡指引'};
 const primaryAction=page===2||page===3?'booking':page===5?'ahf-primary-location':'ahf-guide';
 const numbered=items=>items.map((text,i)=>'<div class="check numbered-item"><span class="check-number">'+(i+1)+'</span><span>'+escape(text)+'</span></div>').join('');
 const req=d.requirements.map((text,i)=>{
  if(page===2){
   const content=[
    '<strong>两个预约，缺一不可</strong><div class="gate-flow-chips"><span>园区预约</span><b>＋</b><span>过磅预约</span></div>',
    '<strong>填报信息真实准确</strong><p>请核对信息后提交，填写不实或不准确将被驳回。</p>',
    '<strong>二级审核通过后入园</strong><div class="gate-flow-chips"><span>企业审核</span><b>→</b><span>园区审核</span></div>'
   ];
   return '<div class="gate-rule"><span class="gate-rule-index">'+(i+1)+'</span><div class="gate-rule-content">'+content[i]+'</div></div>';
  }

  if(page===3&&i===1)return '<div class="ahf-time-grid"><div><span>上午 · 约2车</span><strong>9:00–9:30</strong></div><div><span>下午 · 约2车</span><strong>12:00–12:30</strong></div></div>';
  return '<div class="check numbered-item"><span class="check-number">'+(i+1)+'</span><span>'+escape(text)+'</span></div>';
 }).join('');
 return '<div class="ahf-primary-action">'+button(windowIcon(page===5?'pin':page===2||page===3?'route':'info')+'<span>'+primaryLabels[page]+'</span>'+windowIcon('arrow'),primaryAction,'button wide')+'</div>'+
 '<div class="ahf-support-actions">'+button(windowIcon('info')+'<span>'+escape(d.tutorial)+'</span>','ahf-tutorial','button secondary')+button(windowIcon('pin')+'<span>'+escape(d.location)+'</span>','ahf-location','button secondary')+'</div>'+
 '<section class="card"><h3>'+escape(d.requirementsTitle)+'</h3>'+req+'</section>'+
 '<section class="card"><h3>准备资料</h3>'+numbered(d.materials)+'</section>'+
 '<section class="page1-reminder">'+windowIcon('info')+'<div><h3>高频易错提醒</h3><p>'+escape(d.reminder)+'</p></div></section>'+
 '<section class="card ahf-faq"><h3>高频问题</h3>'+d.faq.map(x=>'<details><summary><span class="faq-code">'+escape(x.id)+'</span>'+escape(x.q)+'</summary><p>'+escape(x.a||'请联系本环节负责人确认。')+'</p></details>').join('')+'</section>';
}
function ahfTutorial(reset=true){
 const page=state.step+1;
 if(reset)ahfTutorialState={page,index:0};
 const pages=ahfTutorialPages[page],index=ahfTutorialState.index,d=window.AHF_FLOW_PAGES[page];
 const image='素材/ahf/page-'+String(pages[index]).padStart(2,'0')+'.png';
 show('<h2>'+escape(d.tutorial)+'</h2><a href="'+image+'" target="_blank" rel="noopener"><img class="doc-img" src="'+image+'" alt="'+escape(d.tutorial)+' 第'+(index+1)+'张"></a>'+
 (pages.length>1?'<div class="ahf-tutorial-nav"><button class="button secondary" data-action="ahf-tutorial-prev" '+(index===0?'disabled':'')+'>上一张</button><span>'+(index+1)+' / '+pages.length+'</span><button class="button secondary" data-action="ahf-tutorial-next" '+(index===pages.length-1?'disabled':'')+'>下一张</button></div>':''));
 modal.dataset.kind='sample';
}
function ahfGuide(){
 const page=state.step+1,d=window.AHF_FLOW_PAGES[page];
 const heading=page===4?'入厂登记 · 制卡过磅':'离厂交卡指引';
 show('<h2>'+heading+'</h2><div class="ahf-guide-list">'+d.requirements.concat(d.materials).map((text,i)=>'<div class="check numbered-item"><span class="check-number">'+(i+1)+'</span><span>'+escape(text)+'</span></div>').join('')+'</div>'+button('查看完整流程说明','ahf-tutorial','button wide'));
}
function ahfLocation(primary=false){
 const d=window.AHF_FLOW_PAGES[state.step+1];
 const place=primary?'卸车区 / 休息室':d.location.replace(/位置/g,'');
 const address=window.AHF_PREPARATION.address;
 const url='https://uri.amap.com/search?keyword='+encodeURIComponent(address)+'&callnative=1';
 show('<h2>'+escape(place)+'</h2><p class="muted">具体点位坐标待客户补充。可先导航至基地，到厂后按现场指引或联系负责人确认。</p><div class="delivery-address"><span>基地地址</span><p>'+escape(address)+'</p></div><a class="button wide" href="'+url+'" target="_blank" rel="noopener">导航至基地</a>'+button('联系本环节负责人','contact','button secondary wide'));
}
const safetyGroups=[{"title": "保命规则", "label": "必须遵守", "items": ["危险作业必须办理作业许可证。", "高处作业必须系挂好安全带。", "严禁置身于吊起的重物下面。", "进入受限空间必须进行能量隔离和气体检测。", "动火作业必须清除或移除设备内及区域的易燃可燃物。", "检维修作业必须进行能量隔离并上锁挂签。", "严禁私自关闭或拆除安全保护装置。", "特种作业必须由持有相应有效证书的人员实施。"]}, {"title": "安全红线", "label": "严格执行", "items": ["高处、临边作业无条件系五点式安全带。", "PSSR列出的必改项，必须落实整改，并经验收合格后方可开车。", "受限空间存在未知风险，未经许可严禁入内。", "电器设备检维修前必须断电并上锁挂签。"]}, {"title": "五项清退令", "label": "违反即清退", "items": ["不按要求佩戴安全帽的直接予以清退。", "高处或临边作业不正确佩挂安全带的直接予以清退。", "有毒有害、易燃易爆岗位操作不正确佩戴PPE的直接予以清退。", "严重“三违”的直接予以清退。", "违反企业保命条款的直接予以清退。"]}];
let safetyGroup=0;
function renderSafety(){
 const g=safetyGroups[safetyGroup];
 show('<div class="safety-dialog-header"><span>入厂必看</span><h2>安全管理要求</h2><p>遵守保命规则，守住安全底线</p></div><div class="safety-tabs" role="tablist" aria-label="安全要求分组">'+safetyGroups.map((x,i)=>'<button role="tab" aria-selected="'+(i===safetyGroup)+'" data-action="safety-tab" data-index="'+i+'"><strong>'+x.title+'</strong><span>'+x.items.length+'项</span></button>').join('')+'</div><div class="safety-group-title"><h3>'+g.title+'</h3><span>'+g.label+'</span></div><ol class="safety-rules">'+g.items.map((text,i)=>'<li><span>'+(i+1)+'</span><p>'+escape(text)+'</p></li>').join('')+'</ol><a class="safety-original" href="素材/安全管理原图.jpg" target="_blank" rel="noopener">查看现场公示原图 ↗</a>');
 modal.dataset.kind='safety';
}
function miniProgramHome(target=app){
 const items=[['chemical','危化/危废申报'],['truck','普货/工程车申报'],['vehicle','访客车辆申报'],['visitor','访客人员申报'],['alarm','一键报警']];
 target.innerHTML='<div class="mini-header"><strong>首页</strong><div class="mini-capsule">'+button('•••','mini-menu','mini-menu')+'<span></span>'+button('◉','mini-close','mini-close')+'</div></div><div class="mini-scroll"><img class="mini-banner" src="素材/关卡小程序/banner.png" alt="申报系统，申报、在线、快捷"><h2>导航栏</h2><div class="mini-services">'+items.map(([key,label])=>'<button data-action="mini-service" data-label="'+label+'"><img src="素材/关卡小程序/'+key+'.png" alt=""><span>'+label+'</span></button>').join('')+'</div></div><nav class="mini-tabs">'+[['home','首页'],['tool','记录'],['box','开票'],['user','我的']].map(([icon,label],i)=>'<button data-action="mini-tab" data-label="'+label+'" class="'+(i===0?'selected':'')+'">'+windowIcon(icon)+'<span>'+label+'</span></button>').join('')+'</nav>';
}
function logisticsReservation(target=app){
 target.innerHTML='<div class="logistics-header">'+button(windowIcon('back'),'mini-close','logistics-back')+'<strong>中化蓝天物流预约</strong>'+button(windowIcon('user'),'logistics-profile','logistics-profile')+'</div><div class="logistics-body"></div><nav class="logistics-bottom">'+button(windowIcon('box'),'logistics-menu','logistics-menu')+button('陕西 <span class="logistics-link">↗</span>','logistics-region','logistics-region')+button('太仓上虞 <span class="logistics-link">↗</span>','logistics-region','logistics-region')+'</nav>';
}
function render(){
 app.dataset.page=state.page;
 if(state.page==='mini-program'){miniProgramHome();return}
 if(state.page==='logistics-reservation'){logisticsReservation();return}
 if(state.page==='home'){
 shell('<header class="home-header"><div class="home-wordmark">厂区通<span>AI小蓝</span></div></header>',
 '<div class="hero"><div class="hero-copy"><p class="base-name">中化蓝天陕西基地</p><h1>送货入厂，小蓝来帮你</h1><p>入厂须知、送货流程，一步步为你指引</p></div>'+artwork('assistant','hero-art')+'</div>'+
 button(windowIcon('shield')+'<span>入厂必看 · 安全管理要求</span><span class="arrow">›</span>','safety','safety')+
 '<div class="section-label"><h2>请选择您的到厂身份</h2></div>'+
 '<button class="card role primary-role" data-action="delivery"><div class="role-copy"><h2>送货司机</h2><p>原料 / 包装物 / 设备物资等</p><span class="circle-arrow">'+windowIcon('arrow')+'</span></div>'+artwork('truck','truck-art')+'</button>'+
 '<div class="role-grid"><button class="card role" data-action="pending" data-role="售后服务人员">'+artwork('service-v4')+'<h2>售后服务人员</h2><p class="muted">设备维修、调试</p><div class="role-bottom"><span class="circle-arrow">'+windowIcon('arrow')+'</span></div></button>'+
 '<button class="card role" data-action="pending" data-role="访客业务交流">'+artwork('visitor-v4')+'<h2>访客业务交流</h2><p class="muted">参观、业务沟通</p><div class="role-bottom"><span class="circle-arrow">'+windowIcon('arrow')+'</span></div></button></div>',
 '');
 }else if(state.page==='goods'){
 shell(title('选择送货物资'),intro('您送的是哪一类物资？','选择物资，查看专属送货指引','truck')+[['原料','🛢','AHF、TCE 等'],['包装物','📦','瓶子、盖子，含空罐、空瓶回收'],['其他','🔩','设备、安装材料、油品、办公等']].map(([name,icon,sub])=>'<button class="card step-card" data-action="goods" data-goods="'+name+'"><span class="number">'+windowIcon(name==='原料'?'raw':name==='包装物'?'packaging':'equipment')+'</span><div><h2 style="margin:0">'+name+'</h2><div class="muted">'+sub+'</div></div><span class="arrow">→</span></button>').join('')+'<p class="muted">拿不准？可以选择「其他」，进入流程后可切换。</p>');
 }else if(state.page==='overview'){
 const summaries=['车辆、随车单据与防护穿戴','双预约要求、填报资料与审核','预约时段、北门排队与签到','短信制卡、过磅与入厂要求','卸车位确认、交单与休息等待','再次签字、过磅与物品归还'];
 const stages=['出发前','到园前','到厂前','入厂时','卸车时','离厂前'];
 shell(title('送货流程总览',state.goods+' · 六步送货指引'),
 '<div class="overview-intro"><div class="overview-eyebrow">从出发到离厂</div><h1>送货每一步，<br>提前有准备</h1><p>选择一个环节，查看要求与办理指引</p>'+artwork('truck')+'</div>'+
 button(windowIcon('shield')+'<span>入厂必看 · 安全管理要求</span><span class="arrow">›</span>','safety','safety')+
 '<div class="overview-section"><h2>送货全流程</h2><span>按实际进度选择</span></div>'+
 '<nav class="flow-timeline" aria-label="六步送货流程">'+nodes.map((n,i)=>'<button class="flow-stop" data-action="jump" data-index="'+i+'"><span class="flow-track"><span class="flow-index">'+(i+1)+'</span></span><span class="flow-stop-content"><span class="flow-stop-heading"><strong>'+escape(n.name)+'</strong><span class="flow-stage">'+stages[i]+'</span></span><span class="flow-description">'+summaries[i]+'</span></span><span class="flow-arrow">'+windowIcon('arrow')+'</span></button>').join('')+'</nav>',
 '<footer class="footer overview-footer">'+button(windowIcon('box')+'<span>当前物资：'+escape(state.goods)+'</span><span class="overview-switch">切换物资 ›</span>','change-goods','button secondary wide')+'</footer>');

 }else if(state.page==='step'){
 const n=stepData(),seen=state.visited.includes(state.goods+':'+state.step);
 if(!navigator.onLine&&!seen){shell(title('内容尚未缓存'),'<p>联网浏览本环节后，可在离线时重新查看。</p>');return}
 shell(title('第 '+n.n+' / 6 步 · '+n.name,state.goods+' · 送货流程') .replace('</header>',progress()+'</header>'),
 state.goods==='原料'?(state.step===0?ahfPreparation():ahfFlowPage()):
 '<div class="warning">'+windowIcon('shield')+'<span>'+escape(n.warn)+'</span>'+'</div><div class="card"><div class="section-head"><h3>本环节必须准备</h3>'+button('查看资料样图','sample','text-button')+'</div>'+n.list.map((x,i)=>'<div class="check numbered-item"><span class="check-number">'+(i+1)+'</span><span>'+escape(x.t)+'</span></div>').join('')+'</div>'+
 '<div class="step-actions">'+(n.book?button('点击预约','booking','button'):'')+button(windowIcon('pin')+'导航','location','button secondary')+'</div>'+
 (n.book?'<p class="muted booking-note">同时确认另一项预约是否完成。</p>':'')+
 '<div class="card"><h3>本环节操作要求</h3><ul class="requirements">'+n.req.map(x=>'<li>'+escape(x.replace(/^[^\u4e00-\u9fffA-Za-z0-9]+/u,''))+'</li>').join('')+'</ul></div>'+
 
 '<div class="card"><h3>高频问题</h3>'+(n.faq.length?n.faq.map(x=>'<details><summary>'+escape(x.q)+'</summary><p>'+faqAnswer(x.q,n)+'</p></details>').join(''):'<p class="muted">该类物资的专项问答待客户补充，可联系物资对接人确认。</p>')+'</div>'+
 '<div class="row">'+button('切换物资','change-goods','text-button')+button('其他问题，问小蓝','qa','text-button')+'</div><p class="source">流程文案来自客户 V2.0 方案，正式安全与作业要求以客户核准资料及现场管理为准。</p>',
 '<footer class="footer step-footer"><div class="feedback-question">本环节解决您的问题了吗？</div><div class="feedback-actions">'+button(windowIcon('like')+'<span>'+(likedSteps.has(state.goods+':'+state.step)?'已点赞':'已解决')+'</span>','like','button secondary '+(likedSteps.has(state.goods+':'+state.step)?'is-liked':''))+button(windowIcon('help')+'<span>未解决，联系负责人</span><span class="feedback-chevron">›</span>','feedback','button secondary feedback-help')+'</div></footer>');
 }else if(state.page==='pending'){
 shell(title(state.role),'<div class="empty">'+artwork(state.role==='售后服务人员'?'service':'visitor')+'<h1>服务流程待确认</h1><p class="muted">客户正在完善'+state.role+'的办理步骤。</p><p>您可以先向小蓝咨询已有资料，或联系您的业务对接人。</p>'+button('向小蓝提问','qa','button wide')+'</div>'+button('返回首页','home','button secondary wide'));
 }else if(state.page==='location'){
 const n=stepData();shell(title('位置指引',state.goods+' · '+n.name),intro('本环节去哪办理？','按步骤查看地点，按现场指引通行','truck')+'<div class="card"><h2>'+n.posPlace+'</h2><p>'+n.posDetail+'</p><p class="muted">'+n.posTodo+'</p></div><div class="map-list">'+nodes.map((x,i)=>'<button class="card step-card" data-action="loc-step" data-index="'+i+'"><div><h3>'+x.n+' · '+x.posPlace+'</h3><div class="muted">'+x.name+'</div></div></button>').join('')+'</div><div class="card"><h3>导航信息待补充</h3><p class="muted">厂内坐标及路线尚未提供，请按现场标识行驶，或联系负责人确认。</p>'+button('联系负责人','contact','button secondary wide')+'</div>','<footer class="footer">'+button('返回原流程','step','button wide')+'</footer>');
 }else if(state.page==='qa'){
 app.innerHTML=title('问小蓝',state.role+(state.role==='送货司机'?' · '+state.goods+' · '+nodes[state.step].name:''))+
 (!navigator.onLine?'<div class="scroll"><h2>文字问答需要联网</h2><p>请恢复网络后重试，可返回查看固定流程。</p>'+button('重试','qa')+'</div>':'<iframe class="qa-frame" title="一期文字知识问答" src="一期文字问答.html?v=d9f274b26fd0&role='+encodeURIComponent(state.role)+'&goods='+encodeURIComponent(state.goods)+'&step='+state.step+'"></iframe>');
 }
}
function faqAnswer(q,n){
 const pairs=[['提前预约','AHF 送货需完成关卡预约与卸车预约，两项缺一不可。'],['哪个门','客户 AHF 示例从北门办理登记，实际通行按现场管理要求。'],['静电','罐车卸料须做好静电接地，连接及检查由现场人员指导。'],['监护','卸货期间司机须在场监护，服从现场人员指挥。'],['夜间','客户 AHF 示例规定危化车辆禁止在厂区过夜，请提前确认到厂与卸车时间。'],['过磅','按客户流程前往地磅房办理，具体路线请联系负责人确认。'],['盖章','客户流程提示在离厂前完成中控室第二次签字，并办理回单和磅单盖章。']];
 const found=pairs.find(([key])=>q.includes(key));return found?found[1]:'本问题的正式答案待客户补充。请结合本环节操作要求查看，或联系负责人确认。';
}
function show(html){modal.dataset.kind=html.includes('须知')?'sample':html.includes('预约入口')?'booking':html.includes('联系本环节')?'contact':html.includes('安全管理')||html.includes('重要提示')?'safety':'message';document.getElementById('dialog-content').innerHTML=html;if(!modal.open)modal.showModal()}
function feedback(){
 feedbackReasons=new Set();
 show('<h2>本环节哪里需要改进？</h2><p class="muted">'+escape(state.goods)+' · '+nodes[state.step].name+'</p><div class="feedback-contact"><div><h3>需要进一步帮助？</h3><p>联系本环节负责人确认处理。</p></div>'+button('联系负责人','contact','button')+'</div><p class="feedback-label">选择原因或填写留言，帮助我们改进</p><div class="feedback-reasons">'+['回答不准确','没有解决我的问题','内容不够完整','来源不匹配'].map(t=>'<button class="reason-chip" data-action="reason" aria-pressed="false">'+t+'</button>').join('')+'</div><label class="sr-only" for="feedback-message">补充说明</label><textarea id="feedback-message" maxlength="500" placeholder="补充说明（也可以只选择上方快捷原因）"></textarea><p class="feedback-count"><span id="feedback-length">0</span> / 500</p><button class="button wide" id="submit-feedback" data-action="submit-feedback" disabled>提交反馈</button>');
 modal.dataset.kind='feedback';
}
function updateFeedbackSubmit(){
 const input=document.getElementById('feedback-message');
 if(!input)return;
 document.getElementById('submit-feedback').disabled=!feedbackReasons.size&&!input.value.trim();
 document.getElementById('feedback-length').textContent=input.value.length;
}
document.addEventListener('input',event=>{if(event.target.id==='feedback-message')updateFeedbackSubmit()});
function contact(){
 const fromFeedback=modal.dataset.kind==='feedback';
 const list=state.goods==='原料'?[['崔帅','原料送货对接','17392155092']]:state.goods==='包装物'?[['高迎春','包装物对接','19991265676']]:[['何嘉栋','设备及其他物资','18391342309']];
 if(state.goods==='原料'&&state.step===3)list.push(['赵世凯','过磅异常','17791932244'],['王珊珊','过磅异常','18629689589']);
 show('<h2>联系本环节负责人</h2><p class="muted">'+escape(state.goods)+' · '+nodes[state.step].name+'</p>'+list.map(([name,role,phone])=>'<div class="contact"><h3>'+name+' · '+role+'</h3><p>'+phone+'</p><a class="button secondary wide" href="tel:'+phone+'">拨打电话</a></div>').join('')+'<p class="muted">联系方式沿用已有项目资料，正式发布前需客户复核。</p>'+(fromFeedback?button('返回留言反馈','feedback','button secondary wide'):''));
}
function sample(){
 show('<h2>AHF 入司须知</h2><p class="muted">现有项目资料 · 第 '+samplePage+' / 13 页</p><img class="doc-img" alt="AHF 入司须知第 '+samplePage+' 页" src="素材/ahf/page-'+String(samplePage).padStart(2,'0')+'.png"><div class="sample-nav">'+button('上一页','sample-prev')+button('下一页','sample-next')+'</div><p class="muted">本资料供查阅；逐项证件、车辆和预约填写样图待客户补齐。</p>');
}
app.addEventListener('change',e=>{if(e.target.dataset.check){state.checks[e.target.dataset.check]=e.target.checked;persist()}});
document.addEventListener('click',e=>{
 const el=e.target.closest('[data-action]');if(!el)return;const a=el.dataset.action;
 if(a==='home'){go('home')}else if(a==='delivery'){state.role='送货司机';returnPage='home';go('qa')}
 else if(a==='pending'){state.role=el.dataset.role;returnPage='home';go('qa')}
 else if(a==='goods'){state.goods=el.dataset.goods;state.mode='direct';persist();go('overview')}
 else if(a==='jump'){openStep(Number(el.dataset.index))}
 else if(a==='resume'){state.role='送货司机';openStep(state.step)}
 else if(a==='next')openStep(Math.min(5,state.step+1));
 else if(a==='prev')openStep(Math.max(0,state.step-1));
 else if(a==='finish'){state.last=false;persist();go('home')}
 else if(a==='change-goods')go('goods');
 else if(a==='step'){state.step=locationOrigin;go('step');}
 else if(a==='qa'){if(state.page!=='qa')returnPage=state.page;go('qa')}
 else if(a==='location'){locationOrigin=state.step;go('location');}
 else if(a==='loc-step'){state.step=Number(el.dataset.index);render()}
 else if(a==='ahf-tutorial')ahfTutorial();
 else if(a==='ahf-tutorial-prev'){ahfTutorialState.index=Math.max(0,ahfTutorialState.index-1);ahfTutorial(false)}
 else if(a==='ahf-tutorial-next'){ahfTutorialState.index=Math.min(ahfTutorialPages[state.step+1].length-1,ahfTutorialState.index+1);ahfTutorial(false)}
 else if(a==='ahf-guide')ahfGuide();
 else if(a==='ahf-location')ahfLocation();
 else if(a==='ahf-primary-location')ahfLocation(true);
 else if(a==='page1-sample')page1Sample(el.dataset.sample);
 else if(a==='contact')contact();
 else if(a==='like'){likedSteps.add(state.goods+':'+state.step);el.innerHTML=windowIcon('like')+'<span>已点赞</span>';el.classList.add('is-liked');el.setAttribute('aria-pressed','true')}
 else if(a==='feedback')feedback();
 else if(a==='reason'){const reason=el.textContent;if(feedbackReasons.has(reason))feedbackReasons.delete(reason);else feedbackReasons.add(reason);el.setAttribute('aria-pressed',String(feedbackReasons.has(reason)));updateFeedbackSubmit()}
 else if(a==='submit-feedback'){const message=document.getElementById('feedback-message').value.trim();if(!feedbackReasons.size&&!message)return;show('<div class="feedback-success"><h2>感谢反馈</h2><p>反馈已保存。</p><p class="muted">'+escape(state.goods)+' · '+nodes[state.step].name+'</p>'+(feedbackReasons.size?'<p>'+[...feedbackReasons].map(escape).join('、')+'</p>':'')+(message?'<blockquote>'+escape(message)+'</blockquote>':'')+button('联系负责人','contact','button wide')+'</div>');modal.dataset.kind='feedback-success'}
 else if(a==='sample'){samplePage=1;if(state.goods==='原料')sample();else show('<h2>样图待补充</h2><p>该类物资的准备资料及操作样图尚未提供，可联系对接人确认。</p>')}
 else if(a==='sample-prev'){samplePage=Math.max(1,samplePage-1);sample()}
 else if(a==='sample-next'){samplePage=Math.min(13,samplePage+1);sample()}
 else if(a==='booking'){go(state.step===1?'mini-program':'logistics-reservation')}

 else if(a==='safety-tab'){safetyGroup=Number(el.dataset.index);renderSafety()}
 else if(a==='safety'){safetyGroup=0;renderSafety();const close=document.getElementById('close-modal');close.textContent='已阅读，返回';close.disabled=false}

 else if(a==='logistics-profile'||a==='logistics-menu'||a==='logistics-region'){show('<h2>中化蓝天物流预约</h2><p class="muted">请选择办理区域。</p>')}
 else if(a==='mini-close'){if(modal.open)modal.close();if(state.caseReturn){state.caseReturn=false;app.querySelector('.case-booking-surface')?.remove();for(const el of app.children){if(el.hasAttribute('data-case-style')){const style=el.getAttribute('data-case-style');if(style)el.setAttribute('style',style);else el.removeAttribute('style');el.removeAttribute('data-case-style')}}state.page='qa';app.dataset.page='qa'}else go('step')}
 else if(a==='mini-menu'){show('<h2>智慧中心申报系统</h2>'+button('返回厂区通送货流程','mini-close','button wide'))}
 else if(a==='mini-service'||a==='mini-tab'){if(el.dataset.label==='首页'){miniProgramHome();return}show('<h2>'+escape(el.dataset.label)+'</h2><p class="muted">请选择需要办理的服务。</p>')}
 else if(a==='back'){if(state.page==='qa')go(returnPage);else if(state.page==='location'){state.step=locationOrigin;go('step');}else if(state.page==='step')go('overview');else if(state.page==='overview')go('goods');else go('home')}
});
document.getElementById('close-modal').onclick=()=>modal.close();
modal.addEventListener('cancel',e=>{if(document.getElementById('close-modal').disabled)e.preventDefault()});
window.addEventListener('online',render);window.addEventListener('offline',render);
render();
window.addEventListener('message',event=>{
 const frame=app.querySelector('.qa-frame');
 if(!frame||event.source!==frame.contentWindow)return;
 if(event.data&&event.data.type==='ahf-demo-action'){
  const action=event.data.action;
  if(action==='guide'){state.role='送货司机';go('goods')}
  else if(action==='safety'){safetyGroup=0;renderSafety()}
  else if(action==='location'){show('<h2>陕西新材料北门</h2><p>陕西中化蓝天化工新材料有限公司</p><p>陕西省渭南市蒲城县孙镇庙前村</p><p class="muted">预约厂门请选择「陕西新材料北门」。当前导航按厂区地址检索，请核对北门入口后行驶。</p><a class="button wide" target="_blank" rel="noopener" href="https://uri.amap.com/search?keyword='+encodeURIComponent('陕西中化蓝天化工新材料有限公司')+'&callnative=1">打开地图导航</a>')}
  else if(action==='gate'||action==='unload'){state.caseReturn=true;for(const el of app.children){el.setAttribute('data-case-style',el.getAttribute('style')||'');el.style.setProperty('display','none','important')}const surface=document.createElement('div');surface.className='case-booking-surface';surface.style.display='contents';app.append(surface);state.page=action==='gate'?'mini-program':'logistics-reservation';app.dataset.page=state.page;if(action==='gate')miniProgramHome(surface);else logisticsReservation(surface)}
  return;
 }
 if(event.data&&event.data.type==='open-material-guide'){
  state.role='送货司机';
  go('goods');
 }
});
