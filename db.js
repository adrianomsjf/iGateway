const sqlite3 = require('sqlite3')
const { open } = require('sqlite')

async function init() {
   const db = await open({
      filename: 'database.db',
      driver: sqlite3.Database
   })
   global.db = db
   await db.exec(/*sql*/`CREATE TABLE IF NOT EXISTS config (
                           CHAVE TEXT,
                           VALOR TEXT)`);
   let config = await db.get(/*sql*/`SELECT * FROM config WHERE CHAVE='Versão'`)
   if (!config) {
      await db.exec(/*sql*/`INSERT INTO config VALUES('Versão','1.0.00')`)                                    
      config = await db.get(/*sql*/`SELECT * FROM config WHERE CHAVE='Versão'`)
      //------------ PEDESTRES ---------------------------
      await db.exec(/*sql*/`CREATE TABLE IF NOT EXISTS pedestres (
         CPF TEXT,
         CODIGO INTEGER,
         NOME TEXT,
         CRACHA TEXT,
         SENHA TEXT,
         AFASTAMENTO_DE NUMERIC,
         AFASTAMENTO_ATE NUMERIC,
         DTRESCISAO NUMERIC,
         HABILITADO TEXT,
         HAB_TECLADO TEXT,
         FACE1 NUMERIC,
         FACE2 NUMERIC,
         FACE1_OUTRO_DISP NUMERIC,
         FACE2_OUTRO_DISP NUMERIC,
         PRIMARY KEY (CPF)
      )`)
      return `Conectado ## INICIALIZADO ## - Versão: ${config.VALOR}`                                    
   } else {
      return `Conectado - Versão: ${config.VALOR}`                                    
   }
}

async function getPedestrians() {
   return await db.all(/*sql*/`SELECT * FROM pedestres`)
}

async function replacePedestrians(pedestrians) {
   for (const pedestrian of pedestrians) {
      await db.exec(/*sql*/`REPLACE INTO pedestres VALUES(
         '${pedestrian.CPF}',
         '${pedestrian.CODIGO}',
         '${pedestrian.NOME}',
         '${pedestrian.CRACHA}',
         '${pedestrian.SENHA}',
         '${pedestrian.AFASTAMENTO_DE}',
         '${pedestrian.AFASTAMENTO_ATE}',
         '${pedestrian.DTRESCISAO}',
         '${pedestrian.HABILITADO}',
         '${pedestrian.HAB_TECLADO}',
         '${pedestrian.FACE1}',
         '${pedestrian.FACE2}',
         '${pedestrian.FACE1_OUTRO_DISP}',
         '${pedestrian.FACE2_OUTRO_DISP}'
      )`) 
   }
}

module.exports = { init, getPedestrians, replacePedestrians }