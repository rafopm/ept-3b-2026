const Api = (() => {
  function getIdToken(){
    return localStorage.getItem('ept_id_token') || '';
  }

  async function request(action, params = {}, method = 'GET'){
    let url = API_URL + "?action=" + encodeURIComponent(action);
    const idToken = getIdToken();
    if(idToken){
      params.id_token = idToken;
    }
    const options = { method };
    if(method === 'GET'){
      for(const k in params){
        if(params[k]==null) continue;
        url += "&" + encodeURIComponent(k) + "=" + encodeURIComponent(params[k]);
      }
      const res = await fetch(url);
      const text = await res.text();
      try{ 
        const data = JSON.parse(text);
        if(data.error) throw new Error(data.error);
        return data;
      }catch(e){ 
        if(text.includes('error') || text.includes('Error')) throw new Error(text.substring(0,300));
        try{ return JSON.parse(text); }catch(_){ throw e; }
      }
    } else {
      options.headers = {};
      options.body = JSON.stringify(params);
      const res = await fetch(url, options);
      const text = await res.text();
      const data = JSON.parse(text);
      if(data.error) throw new Error(data.error);
      return data;
    }
  }

  async function verifyToken(id_token){
    const res = await fetch(API_URL + "?action=verifyToken", {
      method: 'POST',
      body: JSON.stringify({ action:'verifyToken', id_token }),
      headers: { 'Content-Type': 'text/plain' }
    });
    const data = await res.json();
    if(data.error) throw new Error(data.error);
    return data;
  }

  async function legacyApi(fnName, ...args){
    switch(fnName){
      case 'getCurrentUser': return await request('getCurrentUser');
      case 'getLogoBase64': return await request('getLogoBase64');
      case 'getEntregasPendientesDocente': return await request('getEntregasPendientesDocente');
      case 'getFiltrosDocente': return await request('getFiltrosDocente');
      case 'getAlumnosByGradoSeccion': return await request('getAlumnosByGradoSeccion', { grado: args[0], seccion: args[1] });
      case 'guardarIncidencias': return await request('guardarIncidencias', { lista: args[0] }, 'POST');
      case 'calificarEntrega': return await request('calificarEntrega', { rowIndex: args[0], nota: args[1], comentario: args[2] }, 'POST');
      case 'getIncidenciasPorGradoSeccion': return await request('getIncidenciasPorGradoSeccion', { grado: args[0], seccion: args[1] });
      case 'getEntregasPorGradoSeccion': return await request('getEntregasPorGradoSeccion', { grado: args[0], seccion: args[1] });
      case 'getStudentDashboard': return await request('getStudentDashboard', { email: args[0] });
      case 'getRecursos': return await request('getRecursos');
      case 'uploadFileToDrive': return await request('uploadFileToDrive', { base64Data: args[0], fileName: args[1], mimeType: args[2] }, 'POST');
      case 'guardarEntrega': return await request('guardarEntrega', { form: args[0] }, 'POST');
      default: return await request(fnName, args[0]||{}, 'GET');
    }
  }

  return { request, legacyApi, verifyToken, getIdToken };
})();
