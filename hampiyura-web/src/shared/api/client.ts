import { getSession } from '../auth/session';
export async function apiRequest<T>(path:string, init?:RequestInit):Promise<T>{
  const session=getSession();
  const headers:Record<string,string>={'Content-Type':'application/json', ...(session?{Authorization:`Bearer ${session.token}`}:{}), ...(init?.headers as Record<string,string> ?? {})};
  const response=await fetch(`/api${path}`,{...init,headers});
  if(!response.ok){
    // El backend ya diferencia mensajes reales ("Credenciales inválidas", "La cuenta no ha sido
    // activada", etc.) en el cuerpo {error}. Antes se descartaban y se mostraba un genérico
    // "API error 400" -- M-01 necesita mostrarlos tal cual, así que se propagan aquí para toda
    // la app (cualquier catch existente que ignore err.message sigue funcionando igual).
    const mensaje = await response.json().then((cuerpo) => cuerpo?.error as string | undefined).catch(() => undefined);
    throw new Error(mensaje || `API error ${response.status}`);
  }
  return response.status===204?undefined as T:response.json();
}
