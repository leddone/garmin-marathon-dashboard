'use strict';
const URL_SUPABASE = 'https://tigjhpjodvryosazwmqh.supabase.co';
const PUBLIC_KEY = 'sb_publishable_5adSCKzCszWzqCruDrk1Ow_yiIzmrFx';
const client = window.supabase.createClient(URL_SUPABASE, PUBLIC_KEY, {auth:{detectSessionInUrl:true, persistSession:true, autoRefreshToken:true}});
const login = document.getElementById('login');
const signedIn = document.getElementById('signedIn');
const status = document.getElementById('status');
const send = document.getElementById('send');
function display(session){const ok=Boolean(session?.user);login.hidden=ok;signedIn.hidden=!ok; if(ok) status.textContent='Accesso verificato.';}
client.auth.getSession().then(({data,error})=>{if(error)status.textContent='Errore nella verifica della sessione.';else display(data.session);});
client.auth.onAuthStateChange((_event,session)=>display(session));
document.getElementById('loginForm').addEventListener('submit',async(event)=>{
 event.preventDefault();send.disabled=true;status.textContent='Invio in corso…';
 const email=document.getElementById('email').value.trim();
 try{
 const {error}=await client.auth.signInWithOtp({email,options:{shouldCreateUser:false,emailRedirectTo:'https://leddone.github.io/garmin-marathon-dashboard/'}});
 status.textContent=error?'Invio non riuscito. Controlla l’indirizzo e riprova.':'Se l’indirizzo è autorizzato, riceverai un link di accesso.';
 }catch{status.textContent='Connessione non disponibile. Riprova.';}
 finally{send.disabled=false;}
});
document.getElementById('logout').addEventListener('click',async()=>{await client.auth.signOut();status.textContent='Sessione terminata.';});
