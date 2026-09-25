import { expirarSesion, getSession } from '../auth/session';
export async function apiRequest<T>(path:string, init?:RequestInit):Promise<T>{
  const session=getSession();
  const headers:Record<string,string>={'Content-Type':'application/json', ...(session?{Authorization:`Bearer ${session.token}`}:{}), ...(init?.headers as Record<string,string> ?? {})};
  const response=await fetch(`/api${path}`,{...init,headers});
  if(!response.ok){
    // El backend ya diferencia mensajes reales ("Credenciales inválidas", "La cuenta no ha sido
    // activada", etc.) en el cuerpo {error}. Antes se descartaban y se mostraba un genérico
    // "API error 400" -- M-01 necesita mostrarlos tal cual, así que se propagan aquí para toda
    // la app (cualquier catch existente que ignore err.message sigue funcionando igual).
    const cuerpo = await response.json().catch(() => undefined) as { error?: string; code?: string } | undefined;
    // El token guardado ya no sirve (vencido o inválido): sin esto la UI seguía mostrándose "con
    // sesión iniciada" y toda acción autenticada fallaba en silencio con un 401 -- se cierra la sesión
    // para que el resto de la app (header, RequireRole) refleje la realidad.
    if (response.status===401 && session && (cuerpo?.code==='SESION_EXPIRADA' || cuerpo?.code==='SESION_INVALIDA')) expirarSesion();
    throw new Error(cuerpo?.error || `API error ${response.status}`);
  }
  return response.status===204?undefined as T:response.json();
}
