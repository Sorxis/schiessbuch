// Datenspeicher über Supabase, gleiche Schnittstelle wie die claude.ai-Datenbank.
// Letzter Stand wird im Browser zwischengespeichert, damit die App auch offline etwas anzeigt.
(function(){
  const cfg=window.SCHIESSBUCH_CONFIG||{};
  if(!window.supabase||!/^https:/.test(cfg.supabaseUrl||"")) return;
  const sb=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseKey,{auth:{persistSession:true,autoRefreshToken:true}});
  const CACHE="schiessbuch.cache";
  let docs={};
  try{ docs=JSON.parse(localStorage.getItem(CACHE))||{}; }catch(e){}
  const listeners=[];
  const snap=()=>({docs:Object.entries(docs).map(([id,d])=>({id,data:()=>({...d})}))});
  const notify=()=>listeners.forEach(f=>f(snap()));
  const keep=()=>{ try{ localStorage.setItem(CACHE,JSON.stringify(docs)); }catch(e){} };

  async function load(){
    const all={}; let from=0;
    for(;;){
      const {data,error}=await sb.from("ergebnisse").select("id,data").order("id").range(from,from+999);
      if(error) throw error;
      for(const r of data) all[r.id]=r.data;
      if(data.length<1000) break;
      from+=1000;
    }
    docs=all; keep(); notify();
  }
  document.addEventListener("visibilitychange",()=>{ if(!document.hidden&&navigator.onLine) load().catch(()=>{}); });

  window.SupaDB={
    async session(){ const {data}=await sb.auth.getSession(); return data.session; },
    async login(email,password){ const {error}=await sb.auth.signInWithPassword({email,password}); if(error) throw error; },
    async logout(){ await sb.auth.signOut(); docs={}; try{ localStorage.removeItem(CACHE); }catch(e){} notify(); },
    load,
    collection(){ return {
      onSnapshot(f,onErr){ listeners.push(f); f(snap()); load().catch(e=>onErr&&onErr(e)); return ()=>{}; },
      doc(id){ return {
        async set(d){ const {error}=await sb.from("ergebnisse").upsert({id,data:d,updated_at:new Date().toISOString()}); if(error) throw error; docs[id]={...d}; keep(); notify(); },
        async delete(){ const {error}=await sb.from("ergebnisse").delete().eq("id",id); if(error) throw error; delete docs[id]; keep(); notify(); }
      }; }
    }; }
  };
})();
