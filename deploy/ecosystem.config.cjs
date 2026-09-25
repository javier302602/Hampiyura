// Alternativa a systemd: gestor de procesos pm2 para el backend de HampiYura.
//
//   sudo npm install -g pm2
//   cd /opt/hampiyura && pm2 start deploy/ecosystem.config.cjs
//   pm2 save                                   # guarda la lista de procesos
//   pm2 startup systemd -u hampiyura --hp /opt/hampiyura   # imprime UN comando: ejecútalo como root
//
// (Usa systemd O pm2, no ambos a la vez: los dos intentarían levantar el backend en el mismo puerto.)
// El frontend no necesita gestor de procesos: es estático y lo sirve nginx (ver nginx.conf.example).
const path = require('path');

module.exports = {
  apps: [
    {
      name: 'hampiyura-api',
      // Debe correr desde hampiyura-api/: ahí está el .env (dotenv) y ahí se guardan las ./uploads.
      cwd: path.resolve(__dirname, '../hampiyura-api'),
      script: 'dist/main.js',
      env: { NODE_ENV: 'production' },
      autorestart: true,
      restart_delay: 3000,
      max_memory_restart: '500M',
      time: true, // marca de tiempo en cada línea de log
    },
  ],
};
