const axios = require('axios')
const { format } = require('date-fns')
const db = require('./db')
const {IPT_HOST, IPT_PATH, CHAVE_ACESSO, CODTERMINAL, VERSAO_AND, VERSAO_APP} = process.env

async function getCfg() {
   try {
      const ret = await axios.get(
         `${IPT_HOST}/${IPT_PATH}/mp_config.php?`+
         `chave_acesso=${CHAVE_ACESSO}&`+
         `codterminal=${CODTERMINAL}&`+
         `versao_and=${VERSAO_AND}`)
      if (ret.data.config==0) {
         console.log('Erro ao ler configurações do IPT[',ret.config.url ||'---',']')
         return null
      }
      return ret.data.config[0]
   } catch(err) {
      console.log('Erro ao acessar servidor IPT [',err.message,'-',err.config.url,']')
      return null
   }
}

async function getPedestrians() {
   try {
      const ret = await axios.get(
         `${IPT_HOST}/${IPT_PATH}/mp_pedestres.php?`+
         `chave_acesso=${CHAVE_ACESSO}&`+
         `codterminal=${CODTERMINAL}&`+
         `versao_and=${VERSAO_APP}&`+
         `ult_cod_ped=0&`+ // Nescessário o uso de pacote inicial for muito grande
         `data_ult_sinc=${global.ult_sinc_pedestres || '1900-01-01 00:00:00'}`
      )
      if (ret.data.qtd_total===0) {
         console.log('Erro ao ler pedestres do  IPT [',ret.config.url ||'---',']')
         return null
      }
      global.ult_sinc_pedestres = format(Date.now(), 'yyyy-MM-dd HH:mm:ss')
      if (ret.data.pedestres) {
         return ret.data.pedestres
      } else {
         return []
      }
   } catch(err) {
      console.log('Erro ao acessar servidor IPT [',err.message,'-',err.config.url,']')
      return null
   }
}

async function checkIpt() {
   const retIpt = await getCfg()
      if (retIpt) {
      global.IPT_ESTADO = 'ON-LINE'
   } else {
      global.IPT_ESTADO = 'OFF-LINE'
   }
   return global.IPT_ESTADO
}

async function syncPedestrians() {
   const pedestrians = await getPedestrians()
   if (pedestrians && pedestrians.length) {
      await db.replacePedestrians(pedestrians)
      global.NEED_SYNC_USERS=true
   }
   return pedestrians.length
}

module.exports = { getCfg, getPedestrians, checkIpt, syncPedestrians }