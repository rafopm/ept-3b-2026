const Api = (() => {
  function getIdToken(){ return localStorage.getItem('ept_id_token') || ''; }
  function isTokenExpired(token){
    try{ const payload = JSON.parse(atob(token.split('.')[1])); return (payload.exp * 1000) < Date.now() + 60000; }catch(e){ return true; }
  }
  async function request(action, params = {}, method = 'GET'){
    let url = API_URL + "?action=" + encodeURIComponent(action);
    const idToken = getIdToken();
    if(idToken) params.id_token = idToken;
    const options = { method };
    if(method === 'GET'){
      for(const k in params){ if(params[k]!=null) url += "&" + encodeURIComponent(k) + "=" + encodeURIComponent(params[k]); }
      const res = await fetch(url);
      const text = await res.text();
      try{ const data=JSON.parse(text); if(data.error) throw new Error(data.error); return data; }catch(e){ if(text.trim().startsWith('<')) throw new Error('Apps Script devolvió HTML (revisa deploy Cualquier persona). '+text.substring(0,200)); throw e; }
    } else {
      options.headers = {}; options.body = JSON.stringify(params);
      const res = await fetch(url, options);
      const text = await res.text();
      try{ const data=JSON.parse(text); if(data.error) throw new Error(data.error); return data; }catch(e){ if(text.trim().startsWith('<')) throw new Error('Apps Script devolvió HTML. '+text.substring(0,200)); throw e; }
    }
  }
  async function verifyToken(id_token){
    const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action:'verifyToken', id_token }), headers: { 'Content-Type': 'text/plain' } });
    const text = await res.text();
    try{ const data=JSON.parse(text); if(data.error) throw new Error(data.error); return data; }catch(e){ if(text.trim().startsWith('<')) throw new Error('Deploy no es Cualquier persona, devuelve HTML. '+text.substring(0,300)); throw new Error('Respuesta no JSON: '+text.substring(0,300)); }
  }
  return { request, verifyToken, getIdToken, isTokenExpired, legacyApi: (fn,...args)=>{
    const map = {
      getCurrentUser: ()=>request('getCurrentUser'),
      getLogoBase64: ()=>request('getLogoBase64'),
      getEntregasPendientesDocente: ()=>request('getEntregasPendientesDocente'),
      getFiltrosDocente: ()=>request('getFiltrosDocente'),
      getAlumnosByGradoSeccion: ()=>request('getAlumnosByGradoSeccion',{grado:args[0],seccion:args[1]}),
      guardarIncidencias: ()=>request('guardarIncidencias',{lista:args[0]},'POST'),
      calificarEntrega: ()=>request('calificarEntrega',{rowIndex:args[0],nota:args[1],comentario:args[2]},'POST'),
      getIncidenciasPorGradoSeccion: ()=>request('getIncidenciasPorGradoSeccion',{grado:args[0],seccion:args[1]}),
      getEntregasPorGradoSeccion: ()=>request('getEntregasPorGradoSeccion',{grado:args[0],seccion:args[1]}),
      getLeccionesPorGrado: ()=>request('getLeccionesPorGrado',{grado:args[0]}),
      getStudentDashboard: ()=>request('getStudentDashboard',{email:args[0]}),
      getRecursos: ()=>request('getRecursos'),
      uploadFileToDrive: ()=>request('uploadFileToDrive',{base64Data:args[0],fileName:args[1],mimeType:args[2]},'POST'),
      guardarEntrega: ()=>request('guardarEntrega',{form:args[0]},'POST')
    };
    return map[fn] ? map[fn]() : request(fn, args[0]||{});
  }};
})();
