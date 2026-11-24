const API = "https://openrouter.ai/api/v1";
const $ = (id) => document.getElementById(id);
let models = [];
let chats = [];
let activeChat = [];
let currentView = "chat";

const savedKey = () => localStorage.getItem("orbit_openrouter_key") || "";
function toast(message){const el=$("toast");el.textContent=message;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2600)}
function openSettings(){$("apiKey").value=savedKey();$("settingsModal").hidden=false}
function closeSettings(){$("settingsModal").hidden=true}
$("settingsBtn").onclick=$("openSettings").onclick=openSettings;
$("closeSettings").onclick=closeSettings;
$("settingsModal").addEventListener("click",e=>{if(e.target===$("settingsModal"))closeSettings()});
$("saveKey").onclick=()=>{const key=$("apiKey").value.trim();if(key)localStorage.setItem("orbit_openrouter_key",key);else localStorage.removeItem("orbit_openrouter_key");closeSettings();$("keyHint").textContent=key?"API key saved in this browser.":"Add a free API key in settings to begin.";toast(key?"Key saved on this device.":"Key removed.");if(key)loadModels()};

function setView(view){
 currentView=view;document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
 $(view+"View").classList.add("active");
 document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
 $("pageTitle").innerHTML=({chat:"Chat",compare:"Compare models",models:"Explore models"})[view]+' <span>/</span> Orbit AI';
}
document.querySelectorAll(".nav-item").forEach(b=>b.onclick=()=>setView(b.dataset.view));
$("newChat").onclick=()=>{activeChat=[];$("messages").innerHTML="";$("welcome").style.display="block";$("pageTitle").innerHTML="Chat <span>/</span> New conversation";toast("New conversation")};
document.querySelectorAll(".suggestion").forEach(b=>b.onclick=()=>{$("promptInput").value=b.dataset.prompt;$("promptInput").focus()});

function addMessage(role,content,modelName){
 $("welcome").style.display="none";
 const wrap=document.createElement("div");wrap.className="message "+role;
 const avatar=document.createElement("div");avatar.className="avatar";avatar.textContent=role==="user"?"Y":"✳";
 const body=document.createElement("div");body.className="message-body";
 const head=document.createElement("div");head.className="message-head";head.textContent=role==="user"?"You":(modelName||"AI model");
 const text=document.createElement("div");text.className="message-content";text.textContent=content;
 body.append(head,text);
 if(role==="assistant"){const actions=document.createElement("div");actions.className="message-actions";const copy=document.createElement("button");copy.textContent="Copy answer";copy.onclick=()=>navigator.clipboard.writeText(content).then(()=>toast("Copied"));actions.append(copy);body.append(actions)}
 wrap.append(avatar,body);$("messages").append(wrap);wrap.scrollIntoView({behavior:"smooth",block:"end"});
 return text;
}
function selectedModel(){return $("modelSelect").value}
async function askModel(prompt,model){
 const key=savedKey();if(!key)throw new Error("Add your OpenRouter API key in Settings first.");
 if(!model)throw new Error("Choose a model first.");
 const response=await fetch(API+"/chat/completions",{method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json","HTTP-Referer":location.origin,"X-Title":"Orbit AI Hub"},body:JSON.stringify({model,messages:[{role:"user",content:prompt}]})});
 const data=await response.json();if(!response.ok)throw new Error(data.error?.message||"Request failed ("+response.status+")");
 return data.choices?.[0]?.message?.content||"No response returned.";
}
$("chatForm").onsubmit=async e=>{
 e.preventDefault();const prompt=$("promptInput").value.trim();if(!prompt)return;
 const model=selectedModel();$("promptInput").value="";addMessage("user",prompt);const pending=addMessage("assistant","Thinking…",model.split("/").pop()||"AI");
 try{const answer=await askModel(prompt,model);pending.textContent=answer;activeChat.push({prompt,answer,model})}
 catch(err){pending.textContent="Could not get a response: "+err.message;toast(err.message)}
};
$("promptInput").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();$("chatForm").requestSubmit()}});

async function loadModels(){
 const key=savedKey();if(!key){toast("Add your API key in Settings first.");return}
 $("modelSelect").innerHTML='<option value="">Loading free models…</option>';
 $("directoryGrid").innerHTML='<div class="loading-card">Loading models…</div>';
 try{
  const res=await fetch(API+"/models",{headers:{"Authorization":"Bearer "+key}});const data=await res.json();if(!res.ok)throw new Error(data.error?.message||"Could not load models");
  models=(data.data||[]).filter(m=>m.id.endsWith(":free")).sort((a,b)=>(a.name||a.id).localeCompare(b.name||b.id));
  const opts='<option value="">Choose a free model…</option>'+models.map(m=>`<option value="${escapeAttr(m.id)}">${escapeHtml(m.name||m.id)}</option>`).join("");
  $("modelSelect").innerHTML=opts;$("directoryGrid").innerHTML="";
  if(!models.length)$("directoryGrid").innerHTML='<div class="loading-card">No free models are listed right now. Try refreshing later.</div>';
  models.forEach(m=>{const card=document.createElement("article");card.className="model-card";const h=document.createElement("h3");h.textContent=m.name||m.id;const p=document.createElement("p");p.textContent=m.id;const btn=document.createElement("button");btn.textContent="Use this model";btn.onclick=()=>{$("modelSelect").value=m.id;setView("chat");toast("Model selected")};card.append(h,p,btn);$("directoryGrid").append(card)});
  $("keyHint").textContent=`${models.length} free models found. Limits vary by provider.`;
 }catch(err){$("modelSelect").innerHTML='<option value="">Could not load models</option>';$("directoryGrid").innerHTML="";const p=document.createElement("div");p.className="loading-card";p.textContent=err.message;$("directoryGrid").append(p);toast(err.message)}
}
$("refreshModels").onclick=$("reloadDirectory").onclick=loadModels;
$("runCompare").onclick=async()=>{
 const prompt=$("comparePrompt").value.trim();if(!prompt){toast("Enter a question to compare.");return}
 if(!savedKey()){openSettings();toast("Add your API key first.");return}
 const ids=[...new Set([selectedModel(),...models.slice(0,3).map(m=>m.id)].filter(Boolean))].slice(0,3);
 if(ids.length<2){toast("Choose a model and load the free model directory.");return}
 $("compareGrid").innerHTML="";
 ids.forEach(id=>{const c=document.createElement("article");c.className="compare-card";const h=document.createElement("h3");h.textContent=models.find(m=>m.id===id)?.name||id;const p=document.createElement("p");p.textContent="Thinking…";c.append(h,p);$("compareGrid").append(c);askModel(prompt,id).then(a=>p.textContent=a).catch(e=>p.textContent="Error: "+e.message)});
};
$("modelSearch").oninput=()=>{const q=$("modelSearch").value.toLowerCase();[...$("directoryGrid").children].forEach(c=>c.style.display=c.textContent.toLowerCase().includes(q)?"":"none")};
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function escapeAttr(s){return escapeHtml(s)}
if(savedKey()){$("keyHint").textContent="API key saved in this browser. Loading free models…";loadModels()}
