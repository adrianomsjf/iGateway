const db = require('./db')
const { format } = require('date-fns')
const { v4: uuidv4 } = require('uuid')
const { scpf, calcHash } = require('./lib')
const ipt = require('./ipt')

async function recMarks(req,res) {
   const cpf = req.body.user_id
   const cpfStr = scpf(cpf)
   const pedestrian = await db.findPedestrian(cpfStr)
   if (pedestrian) {
      const marcacao = Date.now()
      const codHash = calcHash(cpf,marcacao)
      const regMark = {
         CPF : cpfStr,
         ID_APONTAMENTO: uuidv4(),
         COD_PEDESTRE: pedestrian.CODIGO,
         MARCACAO : format(marcacao, 'yyyy-MM-dd HH:mm:ss OOOO'),
         COD_HASH : codHash,
         IMEI : global.TERMINAL_NS,
         REGISTRADA : false
      }
      regMark.REGISTRADA = await ipt.postMark(regMark)
      console.log('Apontamento:',regMark.CPF,regMark.MARCACAO,regMark.REGISTRADA ? 'REG' : 'NREG')
      await db.insertMark(regMark)
      res.json({
         result: {
            event: 7, 
            user_name: req.body.user_name,
            user_id: Number(req.body.user_id),
            user_image: false, 
            portal_id: 1,
            message:"Ponto Registrado"
         }
      })
   } else {
      console.log('Pedestre não Cadastrado!')
      res.json({
         result: {
            event: 6, 
            user_name: req.body.user_name,
            user_id: Number(req.body.user_id),
            user_image: false, 
            portal_id: 1,
            message:"Pedestre não Cadastrado!"
         }
      })
   }
}

async function syncMarks() {
   const unregisteredMarks = await db.unregisteredMarks()
   let registered = 0
   for (const regMark of unregisteredMarks) {
      const REGISTRADA = await ipt.postMark(regMark)
      if (REGISTRADA) {
         await db.registerMark(regMark.ID_APONTAMENTO)
         registered++
      }
   }
   return 'Registradas: '+registered+' de '+unregisteredMarks.length
}

module.exports = { recMarks, syncMarks }