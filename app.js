'use strict';
const URL_SUPABASE = 'https://tigjhpjodvryosazwmqh.supabase.co';
const PUBLIC_KEY = 'sb_publishable_5adSCKzCszWzqCruDrk1Ow_yiIzmrFx';
const OWNER_UID = '0143f92f-95df-4edf-9909-3d48b2476ba4';
const client = window.supabase.createClient(URL_SUPABASE, PUBLIC_KEY, {auth:{detectSessionInUrl:true,persistSession:true,autoRefreshToken:true}});
const login = document.getElementById('login');
const signedIn = document.getElementById('signedIn');
const status = document.getElementById('status');
const send = document.getElementById('send');
const frame = document.getElementById('dashboard');
let loadId = 0;
let currentUser = null;
async function loadDashboard(){
 const requestId=++loadId;
 frame.hidden=true;
 frame.removeAttribute('srcdoc');
 status.textContent='Caricamento del cruscotto privato…';
 try{
   const {data:{user},error:userError}=await client.auth.getUser();
   if(requestId!==loadId)return;
   if(userError || !user || user.id!==OWNER_UID){
     status.textContent='Accesso al cruscotto non autorizzato.';
     return;
   }
   const {data,error}=await client.storage.from('preparation-dashboard').download('preparation_dashboard.html');
   if(requestId!==loadId)return;
   if(error || !data)throw new Error('download');
   const html=await data.text();
   if(requestId!==loadId)return;
   frame.srcdoc=html;
   frame.hidden=false;
   status.textContent='Cruscotto aggiornato. I dati sono protetti da Supabase Storage.';
 }catch{
   if(requestId===loadId)status.textContent='Impossibile caricare il cruscotto privato. Riprova con Aggiorna cruscotto.';
 }
}
function display(session){
 const userId=session?.user?.id || null;
 const ok=Boolean(userId);
 login.hidden=ok;
 signedIn.hidden=!ok;
 document.body.classList.toggle('logged-in',ok);
 if(!ok){
   currentUser=null; ++loadId;frame.hidden=true;frame.removeAttribute('srcdoc');
   return;
 }
 if(userId!==currentUser){currentUser=userId;loadDashboard();}
}
client.auth.onAuthStateChange((_event,session)=>{display(session);});
client.auth.getSession().then(({data,error})=>{
 if(error)status.textContent='Errore nella verifica della sessione.';
 else display(data.session);
});
document.getElementById('loginForm').addEventListener('submit',async(event)=>{
 event.preventDefault();send.disabled=true;status.textContent='Invio in corso…';
 const email=document.getElementById('email').value.trim();
 try{
   const {error}=await client.auth.signInWithOtp({email,options:{shouldCreateUser:false,emailRedirectTo:'https://leddone.github.io/garmin-marathon-dashboard/'}});
   status.textContent=error?('Invio non riuscito ('+(error.code || 'errore_auth')+', HTTP '+(error.status || 'n/d')+'). Riprova più tardi se è un limite temporaneo.'):'Se l’indirizzo è autorizzato, riceverai un link di accesso.';
 }catch{status.textContent='Connessione non disponibile. Riprova.';}
 finally{send.disabled=false;}
});
document.getElementById('reload').addEventListener('click',loadDashboard);
document.getElementById('logout').addEventListener('click',async()=>{
 ++loadId;frame.hidden=true;frame.removeAttribute('srcdoc');
 await client.auth.signOut();status.textContent='Sessione terminata.';
});

document.getElementById('passwordLogin').addEventListener('click',async()=>{
 const email=document.getElementById('email').value.trim();
 const password=document.getElementById('password').value;
 if(!email || !password){status.textContent='Inserisci email e password.';return;}
 const button=document.getElementById('passwordLogin');button.disabled=true;status.textContent='Verifica credenziali…';
 try{
   const {error}=await client.auth.signInWithPassword({email,password});
   document.getElementById('password').value='';
   if(error)status.textContent='Accesso non riuscito. Verifica le credenziali o imposta prima una password tramite accesso email.';
 }catch{status.textContent='Connessione non disponibile. Riprova.';}
 finally{button.disabled=false;}
});
document.getElementById('setPassword').addEventListener('click',async()=>{
 const passwordInput=document.getElementById('newPassword');
 const password=passwordInput.value;
 if(password.length<12){status.textContent='Usa una password di almeno 12 caratteri.';return;}
 const button=document.getElementById('setPassword');button.disabled=true;status.textContent='Salvataggio password…';
 try{
   const {data:{user},error:verifyError}=await client.auth.getUser();
   if(verifyError || !user || user.id!==OWNER_UID){status.textContent='Accesso non autorizzato.';return;}
   const {error}=await client.auth.updateUser({password});
   passwordInput.value='';
   status.textContent=error?('Impossibile salvare la password ('+(error.code||'errore_auth')+').'):'Password salvata. Ai prossimi accessi potrai usare email e password.';
 }catch{status.textContent='Connessione non disponibile. Riprova.';}
 finally{button.disabled=false;}
});
