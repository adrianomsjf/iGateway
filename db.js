const sqlite3 = require('sqlite3')
const { open } = require('sqlite')

async function init() {
   const db = await open({
      filename: 'iGateway.db',
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
      //------------ MARCACOES ---------------------------
      await db.exec(/*sql*/`CREATE TABLE IF NOT EXISTS marcacoes (
         CPF TEXT,
         ID_APONTAMENTO TEXT,
         COD_PEDESTRE NUMERIC,
         MARCACAO NUMERIC,
         COD_HASH TEXT,
         IMEI TEXT,
         REGISTRADA NUMERIC
      )`)
      await db.exec(/*sql*/`CREATE UNIQUE INDEX IDX_ID_APONTAMENTO ON marcacoes (ID_APONTAMENTO);`)
      return `Conectado ## INICIALIZADO ## - Versão: ${config.VALOR}`                                    
   } else {
      return `Conectado - Versão: ${config.VALOR}`                                    
   }
}

async function getPedestrians() {
   return await db.all(/*sql*/`SELECT * FROM pedestres`)
}

async function findPedestrian(cpf) {
   return await db.get(/*sql*/`SELECT * FROM pedestres where CPF='${cpf}'`)
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

async function insertMark(mark) {
   await db.exec(/*sql*/`INSERT INTO marcacoes VALUES(
      '${mark.CPF}',
      '${mark.ID_APONTAMENTO}',
      '${mark.COD_PEDESTRE}',
      '${mark.MARCACAO}',
      '${mark.COD_HASH}',
      '${mark.IMEI}',
      '${mark.REGISTRADA}'
   )`) 
}

async function unregisteredMarks() {
   return await db.all(/*sql*/`SELECT * FROM marcacoes WHERE REGISTRADA='false'`)
}

async function registerMark(ID_APONTAMENTO) {
   await db.exec(/*sql*/`UPDATE marcacoes SET REGISTRADA = true WHERE ID_APONTAMENTO='${ID_APONTAMENTO}'`)
}


module.exports = { init, getPedestrians, replacePedestrians, insertMark, findPedestrian, unregisteredMarks, registerMark }